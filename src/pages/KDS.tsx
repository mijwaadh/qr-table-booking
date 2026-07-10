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
  ChevronLeft,
  Volume2,
  VolumeX,
  ChevronDown,
  Utensils,
  X
} from 'lucide-react';
import { playNewOrderSound, playKOTReadySound, isAudioAlertsEnabled, setAudioAlertsEnabled, playItemTapSound, playBilledSound } from '../utils/audioAlerts';


export const KDS: React.FC = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isAudioAlertsEnabled());
  const [prevOrdersCount, setPrevOrdersCount] = useState<number>(orders.length);

  // KDS UI & Notification State
  const [showBumpOrders, _setShowBumpOrders] = useState(false);
  const [activeStateDropdown, setActiveStateDropdown] = useState<string | null>(null);
  const [bumpedOrderIds, setBumpedOrderIds] = useState<string[]>([]);
  const [kdsToast, setKdsToast] = useState<string | null>(null);

  const triggerKdsToast = (msg: string) => {
    setKdsToast(msg);
    setTimeout(() => setKdsToast(null), 4500);
  };

  useEffect(() => {
    if (orders.length > prevOrdersCount) {
      playNewOrderSound();
    }
    setPrevOrdersCount(orders.length);
  }, [orders.length, prevOrdersCount]);

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
            <button 
              onClick={() => {
                const next = !soundEnabled;
                setAudioAlertsEnabled(next);
                setSoundEnabled(next);
              }}
              title={soundEnabled ? 'Mute KDS Sound Alerts' : 'Unmute KDS Sound Alerts'}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs transition-all border shadow-sm ${
                soundEnabled 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' 
                  : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" /> : <VolumeX className="w-4 h-4 text-red-500" />}
              <span>{soundEnabled ? 'Sound: ON' : 'Sound: OFF'}</span>
            </button>
            <button 
              onClick={() => playNewOrderSound()}
              title="Test KDS Order Bell"
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface text-xs font-bold border border-outline-variant/60 shadow-sm"
            >
              <Bell className="w-4 h-4 text-primary" />
              <span>Test Bell</span>
            </button>
            <button className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface">
              <Maximize className="w-5 h-5" />
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

      {/* Main KDS Grid & Top Bar */}
      <main className="p-6 container mx-auto max-w-[1920px] flex-1 space-y-6">
        {/* Top Control Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-end">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200 font-extrabold text-sm text-gray-800">
            <span>Total pending KOT&apos;s :</span>
            <span className="w-6 h-6 rounded-full bg-red-500 text-white font-black text-xs inline-flex items-center justify-center shadow-sm">
              {orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && !bumpedOrderIds.includes(o.id)).length}
            </span>
          </div>
        </div>

        {/* Bento Grid KOT Cards matching KDS screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
          {filteredOrders
            .filter(o => showBumpOrders || !bumpedOrderIds.includes(o.id))
            .map(order => {
              const isBumped = bumpedOrderIds.includes(order.id);
              const isDropdownOpen = activeStateDropdown === order.id;

              return (
                <div 
                  key={order.id}
                  className={`rounded-xl border shadow-md overflow-visible relative flex flex-col transition-all bg-white ${
                    isBumped ? 'border-amber-400 opacity-70' : 'border-gray-300 hover:shadow-xl'
                  }`}
                >
                  {/* Card Header matching gray banner exactly (#5b5b5b) */}
                  <div className="bg-[#5b5b5b] text-white px-3.5 py-2.5 rounded-t-xl flex items-center justify-between font-extrabold text-xs tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-gray-300" />
                      <span>Table{order.tableId.replace(/^T0?/, '')}</span>
                    </div>
                    <span className="text-gray-200">KOT : {order.id.replace(/[^0-9]/g, '') || order.id}</span>
                    <span className="uppercase text-[10px] tracking-wider font-black px-1.5 py-0.5 bg-black/20 rounded">
                      {isBumped ? 'BUMPED' : 'ADMIN'}
                    </span>
                  </div>

                  {/* White Card Body with bold quantities & items */}
                  <div 
                    onClick={() => setSelectedOrder(order)}
                    className="p-4 divide-y divide-gray-100 cursor-pointer min-h-[140px] flex flex-col justify-center space-y-1"
                  >
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center gap-3 font-black text-base text-gray-900 leading-snug">
                        <span className="text-gray-900 text-lg w-5 text-right">{item.quantity}</span>
                        <span className="text-gray-400 font-normal">×</span>
                        <span className="text-gray-900 flex-1 truncate">{item.menuItem.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer matching gray banner exactly */}
                  <div className="bg-[#5b5b5b] text-white px-3.5 py-2.5 rounded-b-xl flex items-center justify-between text-xs font-bold relative">
                    <div className="flex items-center gap-1.5 text-gray-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.elapsedMinutes === 0 ? 'Just Placed' : `${order.elapsedMinutes}m`}</span>
                    </div>

                    {/* Trigger Button: [ Placed ▼ ] */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStateDropdown(isDropdownOpen ? null : order.id);
                        }}
                        className="bg-[#222222] hover:bg-black text-white px-3 py-1.5 rounded font-black text-xs tracking-wider flex items-center gap-1.5 shadow active:scale-95 transition-all"
                      >
                        <span>{isBumped ? 'BUMPED' : order.status === 'PENDING' ? 'PLACED' : order.status === 'COMPLETED' ? 'SERVED' : order.status}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Floating Dropdown: Update State exactly like screenshot */}
                      {isDropdownOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-11 z-[80] w-44 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1 text-gray-900 animate-fadeIn"
                        >
                          <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                            Update State
                          </div>
                          <div className="p-1 space-y-0.5 font-extrabold text-xs">
                            <button
                              onClick={() => {
                                setBumpedOrderIds(prev => prev.filter(id => id !== order.id));
                                updateOrderStatus(order.id, 'PENDING');
                                setActiveStateDropdown(null);
                                playItemTapSound();
                                triggerKdsToast('KOT status updated from KDS');
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 text-purple-700 transition-colors"
                            >
                              PLACED
                            </button>
                            <button
                              onClick={() => {
                                setBumpedOrderIds(prev => [...new Set([...prev, order.id])]);
                                setActiveStateDropdown(null);
                                playItemTapSound();
                                triggerKdsToast('KOT status updated from KDS');
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-amber-900 transition-colors"
                            >
                              BUMPED
                            </button>
                            <button
                              onClick={() => {
                                setBumpedOrderIds(prev => prev.filter(id => id !== order.id));
                                updateOrderStatus(order.id, 'PREPARING');
                                setActiveStateDropdown(null);
                                playItemTapSound();
                                triggerKdsToast('KOT status updated from KDS');
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 transition-colors"
                            >
                              PREPARING
                            </button>
                            <button
                              onClick={() => {
                                setBumpedOrderIds(prev => prev.filter(id => id !== order.id));
                                updateOrderStatus(order.id, 'READY');
                                setActiveStateDropdown(null);
                                playKOTReadySound();
                                triggerKdsToast('KOT status updated from KDS');
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 text-green-900 transition-colors"
                            >
                              READY
                            </button>
                            <button
                              onClick={() => {
                                setBumpedOrderIds(prev => prev.filter(id => id !== order.id));
                                updateOrderStatus(order.id, 'COMPLETED');
                                setActiveStateDropdown(null);
                                playBilledSound();
                                triggerKdsToast('KOT status updated from KDS');
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors"
                            >
                              SERVED
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {filteredOrders.filter(o => showBumpOrders || !bumpedOrderIds.includes(o.id)).length === 0 && (
            <div className="col-span-full bg-white rounded-3xl border border-gray-200 p-16 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
              <ChefHat className="w-14 h-14 text-gray-300 mb-3 animate-bounce" />
              <h4 className="font-headline-sm font-black text-xl text-gray-900">No active KOT orders</h4>
              <p className="text-xs mt-1 text-gray-500 max-w-sm">All KOT orders have been prepared or served! New mobile customer orders will appear here automatically.</p>
            </div>
          )}
        </div>

        {/* Universal Notification Toast Banner matching screenshot exactly */}
        {kdsToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-5 py-3.5 flex items-center justify-between min-w-[320px] max-w-md gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-serif italic font-black text-sm shrink-0 shadow-sm">
                  i
                </div>
                <span className="font-extrabold text-gray-800 text-sm leading-tight">{kdsToast}</span>
              </div>
              <button 
                onClick={() => setKdsToast(null)} 
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
