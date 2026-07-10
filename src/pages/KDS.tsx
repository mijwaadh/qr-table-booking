import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../contexts/RestaurantContext';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import type { Order } from '../types';
import { 
  ChefHat, 
  Clock, 
  Search, 
  Maximize, 
  Bell, 
  Settings, 
  CheckCircle,
  ChevronLeft,
  XCircle,
  AlertTriangle
} from 'lucide-react';


export const KDS: React.FC = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeKdsOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'READY');


  const filteredOrders = activeKdsOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(i => i.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-[#f9f9ff] text-on-background font-body-md min-h-screen selection:bg-primary-fixed-dim flex flex-col w-full overflow-y-auto pb-20">
      
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center h-20 px-xl bg-white border-b border-outline-variant sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-md">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-xs px-md py-2 border border-outline-variant hover:bg-surface-container-low rounded-xl transition-colors font-semibold text-xs text-on-surface mr-sm shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Console</span>
          </button>
          <h1 className="font-headline-lg text-headline-lg font-extrabold text-primary flex items-center gap-sm">
            <ChefHat className="w-8 h-8 text-primary" />
            <span>ServeFlow KDS</span>
          </h1>
          <div className="h-8 w-px bg-outline-variant mx-sm"></div>
          <div className="flex items-center gap-md">
            <span className="flex items-center gap-xs px-md py-sm bg-surface-container-high rounded-lg font-label-md text-sm font-semibold">
              <Clock className="w-4 h-4 text-primary" />
              <span>Avg Prep: 14m</span>
            </span>
            <span className="flex items-center gap-xs px-md py-sm bg-surface-container-high rounded-lg font-label-md text-sm font-semibold">
              <ChefHat className="w-4 h-4 text-secondary" />
              <span>Active: {activeKdsOrders.length}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-lg">
          <div className="relative group">
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container-low border-outline-variant focus:ring-primary-container focus:border-primary rounded-xl px-12 py-3 text-body-md w-64 transition-all outline-none border text-on-surface" 
              placeholder="Search orders..." 
              type="text"
            />
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          </div>
          <div className="flex gap-sm">
            <button className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface">
              <Maximize className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => alert('KDS Settings Opened')}
              className="flex items-center gap-sm px-lg py-3 rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary/90 transition-colors shadow-sm font-semibold"
            >
              <Settings className="w-5 h-5" />
              <span>KDS Config</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main KDS Grid */}
      <main className="p-xl container mx-auto max-w-[1920px] flex-1">
        <div className="kds-grid">
          
          {/* Active Orders List */}
          {filteredOrders.map((order) => {
            const isLate = order.elapsedMinutes >= 20;
            const isNew = order.elapsedMinutes < 2;

            return (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-2xl border-2 flex flex-col shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
                  isLate ? 'border-error bg-error/10 animate-pulse shadow-error/20' : isNew ? 'order-glow-new border-primary/50' : 'border-outline-variant/60 hover:border-primary/50'
                }`}
              >
                {isLate && (
                  <div className="bg-error text-white font-label-md text-xs font-black py-1 px-3 flex items-center justify-center gap-1 uppercase tracking-wider animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Warning: &gt;20m Max Wait Exceeded!</span>
                  </div>
                )}
                {/* Header */}
                <div className={`p-md flex justify-between items-center border-b ${
                  isLate ? 'bg-error/15 border-error/30' : 'bg-surface-container-highest border-outline-variant'
                }`}>
                  <div className="flex items-baseline gap-xs">
                    <span className={`font-display text-4xl leading-none font-extrabold ${isLate ? 'text-error' : 'text-primary'}`}>
                      {order.tableId}
                    </span>
                    <span className="font-label-md text-xs text-outline uppercase tracking-widest font-semibold ml-1">Main</span>
                  </div>
                  <div className="text-right">
                    <p className="font-label-sm text-xs text-on-surface-variant font-bold">ORDER #{order.id}</p>
                    <p className={`font-headline-sm text-lg font-black flex items-center justify-end gap-1 ${
                      isLate ? 'text-error animate-pulse' : isNew ? 'text-primary' : 'text-secondary'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>{order.elapsedMinutes}:00</span>
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-grow p-lg space-y-sm overflow-y-auto max-h-[300px] custom-scrollbar">
                  {order.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col py-1 border-b border-outline-variant/30 last:border-0"
                    >
                      <p className="font-headline-sm text-lg text-on-surface font-bold">
                        {item.quantity}x {item.menuItem.name}
                      </p>
                      {item.notes && (
                        <p className="font-label-md text-xs text-tertiary font-semibold uppercase mt-0.5">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="p-md grid grid-cols-2 gap-md bg-surface-container-low border-t border-outline-variant/60">
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                    className="py-3 rounded-xl font-label-md font-semibold text-sm transition-all flex items-center justify-center gap-sm border-2 text-error border-error/30 hover:bg-error/10 hover:border-error active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="py-3 rounded-xl font-label-md bg-primary text-on-primary hover:bg-primary/95 transition-all flex items-center justify-center gap-sm shadow-sm font-bold text-sm active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Ready</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Fallback Empty State */}
          {filteredOrders.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-outline-variant/60 p-xl text-center text-on-surface-variant flex flex-col items-center justify-center min-h-[350px]">
              <ChefHat className="w-16 h-16 text-outline mb-sm animate-bounce" />
              <h3 className="font-headline-sm text-lg font-bold">No active cooking tickets</h3>
              <p className="text-sm mt-xs">Hooray! The kitchen queue is completely clear.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation Station Status */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant flex items-center justify-between px-xl h-14 z-50 shrink-0 shadow-inner">
        <div className="flex items-center gap-xl text-sm">
          <div className="flex items-center gap-sm">
            <div className="w-3 h-3 rounded-full bg-primary-container order-glow-new"></div>
            <span className="font-label-sm text-xs font-semibold text-on-surface-variant">New Order</span>
          </div>
          <div className="flex items-center gap-sm">
            <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
            <span className="font-label-sm text-xs font-semibold text-on-surface-variant">In Progress</span>
          </div>
          <div className="flex items-center gap-sm">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <span className="font-label-sm text-xs font-semibold text-on-surface-variant">Delayed (&gt;20m)</span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <span className="font-headline-sm text-on-surface font-mono text-base font-bold">{currentTime}</span>
          <span className="text-outline">|</span>
          <span className="font-label-sm text-xs font-semibold text-on-surface-variant">Kitchen #1 Station</span>
        </div>
      </footer>
      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
};
export default KDS;
