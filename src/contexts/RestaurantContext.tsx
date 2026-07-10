import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Table, Order, MenuItem } from '../types';
import { calculateElapsedMinutes } from '../utils/time';
import { X } from 'lucide-react';
import { playNewOrderSound, playItemTapSound, playBilledSound, playKOTReadySound } from '../utils/audioAlerts';

interface RestaurantContextType {
  tables: Table[];
  orders: Order[];
  menuItems: MenuItem[];
  addOrder: (tableId: string, items: { menuItem: MenuItem; quantity: number; notes?: string }[]) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  toggleItemCompleteInOrder: (orderId: string, itemIndex: number) => void;
  setTableStatus: (tableId: string, status: Table['status'], amount?: number) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<boolean>;
  toggleMenuItemAvailability: (itemId: string) => Promise<boolean>;
  deleteMenuItem: (itemId: string) => Promise<boolean>;
  updateMenuItem: (item: MenuItem) => Promise<boolean>;
  settleBill: (tableId: string, method?: string) => void;
  addTable: (name: string, seats: number) => void;
  showGlobalNotification: (message: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const rawApiUrl = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api').trim().replace(/\/$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
const WS_URL = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '/ws');

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showGlobalNotification = (message: string) => {
    setGlobalToast(message);
    setTimeout(() => setGlobalToast(null), 4500);
  };

  const refreshData = async () => {
    try {
      const [resTables, resMenu, resOrders] = await Promise.all([
        fetch(`${API_BASE_URL}/tables`),
        fetch(`${API_BASE_URL}/menu`),
        fetch(`${API_BASE_URL}/orders`)
      ]);
      
      if (resTables.ok) {
        const data: Table[] = await resTables.json();
        setTables(data.map(t => ({
          ...t,
          elapsedMinutes: t.seatedTime ? calculateElapsedMinutes(t.seatedTime, t.elapsedMinutes || 0) : t.elapsedMinutes
        })));
      }
      if (resMenu.ok) {
        const data = await resMenu.json();
        setMenuItems(data);
      }
      if (resOrders.ok) {
        const data: Order[] = await resOrders.json();
        setOrders(data.map(o => ({
          ...o,
          elapsedMinutes: o.status === 'COMPLETED' || o.status === 'CANCELLED'
            ? o.elapsedMinutes
            : calculateElapsedMinutes(o.time, o.elapsedMinutes)
        })));
      }
    } catch (e) {
      console.error("Failed to fetch data from backend:", e);
    }
  };

  useEffect(() => {
    refreshData();

    // Live ticker: recalculate elapsed timing every 10 seconds
    const timer = setInterval(() => {
      setOrders(prev => prev.map(o => {
        if (o.status === 'COMPLETED' || o.status === 'CANCELLED') return o;
        const calc = calculateElapsedMinutes(o.time, o.elapsedMinutes);
        return calc !== o.elapsedMinutes ? { ...o, elapsedMinutes: calc } : o;
      }));
      setTables(prev => prev.map(t => {
        if (t.status !== 'OCCUPIED' && t.status !== 'PAYMENT_PENDING' || !t.seatedTime) return t;
        const calc = calculateElapsedMinutes(t.seatedTime, t.elapsedMinutes || 0);
        return calc !== t.elapsedMinutes ? { ...t, elapsedMinutes: calc } : t;
      }));
    }, 10000);

    let ws: WebSocket | null = null;
    let reconnectTimeout: number;

    const connectWS = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('Connected to real-time WebSocket server');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'REFRESH') {
            refreshData();
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = window.setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        if (ws) {
          ws.close();
        }
      };
    };

    connectWS();

    return () => {
      clearInterval(timer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      window.clearTimeout(reconnectTimeout);
    };
  }, []);

  const addOrder = async (tableId: string, items: { menuItem: MenuItem; quantity: number; notes?: string }[]): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          items: items.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            notes: item.notes
          }))
        })
      });
      if (response.ok) {
        await refreshData();
        playNewOrderSound();
        showGlobalNotification('New order placed & KOT sent to Kitchen!');
        return true;
      } else {
        const err = await response.json().catch(() => ({ detail: response.statusText }));
        alert(`Could not place order: ${err.detail || 'Server rejected order.'}`);
        return false;
      }
    } catch (e: any) {
      console.error(e);
      alert(`Network error placing order: ${e.message || 'Please check your internet connection.'}`);
      return false;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (status === 'READY') {
      playKOTReadySound();
    } else if (status === 'COMPLETED') {
      playBilledSound();
    } else {
      playItemTapSound();
    }
    showGlobalNotification('KOT status updated from KDS');
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        refreshData();
      }
    } catch (e) {
      console.error(e);
      refreshData();
    }
  };

  const toggleItemCompleteInOrder = async (orderId: string, itemIndex: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.map((item, idx) => idx === itemIndex ? { ...item, completed: !item.completed } : item);
      return { ...o, items: updatedItems };
    }));
    playItemTapSound();
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemIndex}/toggle`, {
        method: 'PUT'
      });
      if (response.ok) {
        refreshData();
      }
    } catch (e) {
      console.error(e);
      refreshData();
    }
  };

  const setTableStatus = async (tableId: string, status: Table['status'], amount?: number) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status, amount: amount !== undefined ? amount : t.amount } : t));
    playItemTapSound();
    showGlobalNotification(`Table status updated to ${status.replace(/_/g, ' ')}`);
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, amount })
      });
      if (response.ok) {
        refreshData();
      }
    } catch (e) {
      console.error(e);
      refreshData();
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (response.ok) {
        await refreshData();
        return true;
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Failed to save dish: ${err.detail || response.statusText || 'Server Error'}`);
        return false;
      }
    } catch (e: any) {
      console.error(e);
      alert(`Network/Connection error when saving dish: ${e.message || 'Check your API connection or VITE_API_BASE_URL.'}`);
      return false;
    }
  };

  const toggleMenuItemAvailability = async (itemId: string): Promise<boolean> => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available })
      });
      if (response.ok) {
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteMenuItem = async (itemId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateMenuItem = async (updatedItem: MenuItem): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      if (response.ok) {
        await refreshData();
        return true;
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Failed to update dish: ${err.detail || response.statusText || 'Server Error'}`);
        return false;
      }
    } catch (e: any) {
      console.error(e);
      alert(`Network/Connection error when updating dish: ${e.message || 'Check your API connection.'}`);
      return false;
    }
  };

  const settleBill = async (tableId: string, method: string = 'Cash') => {
    const tableOrders = orders.filter(o => o.tableId === tableId && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    const subtotal = tableOrders.reduce((sum, o) => sum + o.amount, 0);
    const gst = Math.round((subtotal * 0.05) * 100) / 100;
    const serviceCharge = Math.round((subtotal * 0.10) * 100) / 100;
    const total = Math.round((subtotal + gst + serviceCharge) * 100) / 100;

    playBilledSound();
    showGlobalNotification(`Bill settled (${method}) • ₹${total.toFixed(2)}`);

    try {
      const response = await fetch(`${API_BASE_URL}/payments/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          method,
          subtotal,
          gst,
          serviceCharge,
          discount: 0.0,
          total
        })
      });
      if (response.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addTable = async (name: string, seats: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, seats })
      });
      if (response.ok) {
        await refreshData();
        playItemTapSound();
        showGlobalNotification(`Table "${name}" added with ${seats} seats`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        tables,
        orders,
        menuItems,
        addOrder,
        updateOrderStatus,
        toggleItemCompleteInOrder,
        setTableStatus,
        addMenuItem,
        toggleMenuItemAvailability,
        deleteMenuItem,
        updateMenuItem,
        settleBill,
        addTable,
        showGlobalNotification
      }}
    >
      {children}
      {globalToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-5 py-3.5 flex items-center justify-between min-w-[320px] max-w-md gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-serif italic font-black text-sm shrink-0 shadow-sm">
                i
              </div>
              <span className="font-extrabold text-gray-800 text-sm leading-tight">{globalToast}</span>
            </div>
            <button 
              onClick={() => setGlobalToast(null)} 
              className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
