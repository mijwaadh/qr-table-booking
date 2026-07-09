import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRestaurant } from '../contexts/RestaurantContext';
import { 
  Receipt, 
  UserCheck, 
  Droplets, 
  Search, 
  Flame, 
  Leaf, 
  Star, 
  Plus, 
  ShoppingCart, 
  X, 
  UtensilsCrossed,
  CheckCircle2,
  Hourglass,
  ChevronLeft,
  Loader2,
  Check
} from 'lucide-react';
import type { MenuItem } from '../types';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export const MobileOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { menuItems, addOrder, orders, settleBill, setTableStatus } = useRestaurant();

  const rawTableId = searchParams.get('tableId') || searchParams.get('table') || 'T04';
  const normalizeTableId = (id: string): string => {
    const clean = id.trim().toUpperCase();
    const match = clean.match(/^T(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return `T${num.toString().padStart(2, '0')}`;
    }
    return clean;
  };
  const tableId = normalizeTableId(rawTableId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Starters' | 'Main Course' | 'Beverages' | 'Desserts'>('All');
  
  // Local Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modal Views
  const [activeModal, setActiveModal] = useState<'NONE' | 'CHECKOUT' | 'TRACKING' | 'BILLING'>('NONE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'Online' | 'Cash'>('Online');

  // Trigger temporary toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) {
      alert('Sorry, this item is sold out.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    triggerToast(`Added ${item.name} to cart`);
  };

  // Cart Calculations
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const cartServiceCharge = cartSubtotal * 0.10;
  const cartTotal = cartSubtotal + cartServiceCharge;

  // Active Table Orders and Calculations
  const activeTableOrders = orders.filter(o => o.tableId === tableId && o.status !== 'COMPLETED');
  const activeTableSubtotal = activeTableOrders.reduce((sum, o) => sum + o.amount, 0);
  const activeTableGst = activeTableSubtotal * 0.05;
  const activeTableService = activeTableSubtotal > 0 ? 5.00 : 0.0;
  const activeTableTotal = activeTableSubtotal + activeTableGst + activeTableService;

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    
    addOrder(tableId, cart.map(i => ({
      menuItem: i.menuItem,
      quantity: i.quantity
    })));

    setCart([]); // Clear cart
    setActiveModal('TRACKING'); // Open order tracking
    triggerToast('Order placed successfully! Preparing now.');
  };

  const handleCheckout = () => {
    if (activeTableOrders.length === 0) {
      triggerToast('No active orders to checkout. Add items to cart first!');
      return;
    }
    setActiveModal('BILLING');
  };

  const handleSimulatePayment = () => {
    if (selectedMethod === 'Online') {
      setIsProcessingPayment(true);
      setTimeout(() => {
        setIsProcessingPayment(false);
        setActiveModal('NONE');
        settleBill(tableId, 'Online');
        triggerToast('Demo payment successful! Table is now free.');
      }, 2000);
    } else {
      // Cash payment
      setTableStatus(tableId, 'PAYMENT_PENDING', activeTableTotal);
      setActiveModal('NONE');
      triggerToast('Cashier notified! Please settle payment at the checkout counter.');
    }
  };

  // Find latest active order for tracking timeline
  const latestActiveOrder = activeTableOrders[activeTableOrders.length - 1];

  return (
    <div className="bg-[#f9f9ff] text-on-surface min-h-screen flex justify-center w-full">
      
      {/* Simulating Mobile Device Frame */}
      <main className="min-h-screen pb-32 max-w-md w-full relative bg-white overflow-x-hidden border-x border-outline-variant shadow-lg flex flex-col justify-between">
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Header Banner Section */}
          <header className="relative h-64 overflow-hidden shrink-0">
            <button 
              onClick={() => navigate('/')}
              className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center border border-outline-variant/30 text-on-surface shadow-sm hover:bg-white active:scale-95 transition-all"
              title="Go back to console"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30 z-10"></div>
            <div className="absolute bottom-0 left-0 w-full p-md z-20">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold text-xl drop-shadow-sm">ServeFlow Demo Restaurant</h1>
                  <p className="font-body-sm text-body-sm text-on-surface-variant font-medium text-xs">Modern Cuisine & Fine Spirits</p>
                </div>
                <div className="bg-primary text-on-primary font-label-md text-xs font-bold px-md py-xs rounded-full shadow-lg flex items-center gap-xs">
                  Table {tableId.replace(/^T0?/, '')}
                </div>
              </div>
            </div>
          </header>

          {/* Service Quick Actions */}
          <section className="px-md mt-lg grid grid-cols-3 gap-sm">
            <button 
              onClick={handleCheckout}
              className="flex flex-col items-center justify-center p-md bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors"
            >
              <Receipt className="w-5 h-5 text-primary mb-xs" />
              <span className="font-label-sm text-xs font-semibold text-on-surface">Request Bill</span>
            </button>
            <button 
              onClick={() => triggerToast('Staff called! A waiter will assist you shortly.')}
              className="flex flex-col items-center justify-center p-md bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors"
            >
              <UserCheck className="w-5 h-5 text-primary mb-xs" />
              <span className="font-label-sm text-xs font-semibold text-on-surface">Call Staff</span>
            </button>
            <button 
              onClick={() => triggerToast('Water request sent! Fresh water is on the way.')}
              className="flex flex-col items-center justify-center p-md bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors"
            >
              <Droplets className="w-5 h-5 text-primary mb-xs" />
              <span className="font-label-sm text-xs font-semibold text-on-surface">Need Water</span>
            </button>
          </section>

          {/* Search Bar */}
          <section className="px-md mt-lg sticky top-0 z-30 pt-xs bg-white/80 backdrop-blur-md">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-md top-1/2 -translate-y-1/2 text-outline" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-xl pr-md py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md text-sm text-on-surface" 
                placeholder="Search menu items..." 
                type="text"
              />
            </div>
          </section>

          {/* Categories Horizontal Scroll */}
          <section className="mt-md px-md">
            <div className="flex gap-sm overflow-x-auto no-scrollbar pb-xs">
              {(['All', 'Starters', 'Main Course', 'Beverages', 'Desserts'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-lg py-1.5 rounded-full font-label-md text-xs font-bold border transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'
                  }`}
                >
                  {cat === 'Main Course' ? 'Mains' : cat}
                </button>
              ))}
            </div>
          </section>

          {/* Menu Items List */}
          <section className="px-md mt-lg space-y-lg">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className={`bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 flex group hover:shadow-md transition-all duration-300 ${
                  !item.available ? 'opacity-65 bg-surface-container-low/40' : ''
                }`}
              >
                <div className="w-1/3 h-28 relative overflow-hidden bg-surface-container-low shrink-0">
                  {item.imageUrl ? (
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={item.name} 
                      src={item.imageUrl} 
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-outline">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                  )}
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-2/3 p-md flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex justify-between items-start gap-xs">
                      <h3 className="font-headline-sm text-sm text-on-surface font-bold truncate pr-1" title={item.name}>{item.name}</h3>
                      <span className="font-label-md text-sm text-primary font-bold shrink-0">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-md shrink-0">
                    <div className="flex items-center gap-xs text-[10px]">
                      {item.badge === 'Best Seller' ? (
                        <div className="flex items-center text-secondary font-bold gap-xs">
                          <Star className="w-3 h-3 fill-secondary" />
                          <span>Popular</span>
                        </div>
                      ) : item.calories ? (
                        <div className="flex items-center text-outline font-bold gap-xs">
                          <Flame className="w-3 h-3 text-tertiary-container" />
                          <span>{item.calories} Cal</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-primary font-bold gap-xs">
                          <Leaf className="w-3 h-3 text-primary" />
                          <span>{item.type}</span>
                        </div>
                      )}
                    </div>
                    {!item.available ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-outline-variant/30 text-on-surface-variant rounded-lg uppercase tracking-wider">
                        Sold Out
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="w-8 h-8 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center hover:scale-95 transition-transform active:bg-primary active:text-on-primary"
                      >
                        <Plus className="w-4 h-4 text-primary group-active:text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Floating Cart Bar */}
        {cartItemCount > 0 && activeModal === 'NONE' && (
          <div className="absolute bottom-20 left-md right-md z-50 animate-slide-up">
            <button 
              onClick={() => setActiveModal('CHECKOUT')}
              className="w-full bg-primary text-on-primary p-lg rounded-2xl shadow-2xl flex justify-between items-center transform transition-transform active:scale-95"
            >
              <div className="flex items-center gap-md">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-white" />
                  <span className="absolute -top-2.5 -right-2.5 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary">
                    {cartItemCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-label-md text-xs font-bold leading-none text-white">View Cart</p>
                  <p className="font-body-sm text-[10px] opacity-80 text-white/90 mt-0.5">{cartItemCount} items selected</p>
                </div>
              </div>
              <p className="font-headline-sm text-sm font-bold text-white">${cartSubtotal.toFixed(2)}</p>
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 pb-safe bg-surface-container-lowest shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 rounded-t-xl shrink-0">
          <button 
            onClick={() => setActiveModal('NONE')}
            className={`flex flex-col items-center justify-center p-2 transition-transform scale-95 active:scale-90 ${
              activeModal === 'NONE' ? 'text-primary bg-primary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="font-label-sm-mobile text-[10px] font-bold">Menu</span>
          </button>
          <button 
            onClick={() => cartItemCount > 0 ? setActiveModal('CHECKOUT') : alert('Your cart is empty! Add items first.')}
            className={`flex flex-col items-center justify-center p-2 transition-transform scale-95 active:scale-90 ${
              activeModal === 'CHECKOUT' ? 'text-primary bg-primary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-label-sm-mobile text-[10px] font-bold">Cart</span>
          </button>
          <button 
            onClick={() => setActiveModal('TRACKING')}
            className={`flex flex-col items-center justify-center p-2 transition-transform scale-95 active:scale-90 ${
              activeModal === 'TRACKING' ? 'text-primary bg-primary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="font-label-sm-mobile text-[10px] font-bold">Tracker</span>
          </button>
        </nav>

        {/* Modals Container Overlay */}
        {activeModal !== 'NONE' && (
          <div 
            onClick={() => { if (!isProcessingPayment) setActiveModal('NONE'); }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center"
          >
            
            {/* Checkout Drawer */}
            {activeModal === 'CHECKOUT' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-t-3xl p-xl max-h-[85%] overflow-y-auto z-70 animate-slide-up flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-lg"></div>
                  <div className="flex justify-between items-center mb-xl">
                    <h2 className="font-headline-md text-lg font-bold text-on-surface">Your Cart</h2>
                    <button onClick={() => setActiveModal('NONE')} className="text-outline-variant"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-md overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-md border-b border-outline-variant/30 text-sm">
                        <div className="flex items-center gap-md">
                          <span className="w-8 h-8 flex items-center justify-center bg-surface-container rounded-lg font-bold text-xs">{item.quantity}x</span>
                          <span className="font-body-md text-on-surface font-semibold">{item.menuItem.name}</span>
                        </div>
                        <span className="font-label-md text-sm font-bold">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-xl pt-lg border-t border-outline-variant/60">
                  <div className="space-y-sm">
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Subtotal</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Service Charge (10%)</span>
                      <span>${cartServiceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface font-headline-sm pt-sm border-t border-outline-variant font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handlePlaceOrder}
                    className="w-full bg-primary text-on-primary py-lg rounded-2xl mt-xl font-headline-sm hover:shadow-xl active:scale-95 transition-all font-bold text-sm text-white"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            )}

            {/* Order Tracking Modal */}
            {activeModal === 'TRACKING' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-t-3xl p-xl max-h-[85%] overflow-y-auto z-70 animate-slide-up"
              >
                <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-lg"></div>
                <div className="flex justify-between items-center mb-xl">
                  <h2 className="font-headline-md text-lg font-bold text-on-surface">Track Order</h2>
                  <button onClick={() => setActiveModal('NONE')} className="text-outline-variant"><X className="w-5 h-5" /></button>
                </div>
                
                {latestActiveOrder ? (
                  <div className="relative py-lg pl-2">
                    {/* Timeline Bar */}
                    <div className="absolute left-6 top-lg bottom-lg w-0.5 bg-outline-variant/30"></div>
                    
                    <div className="space-y-xl relative">
                      {/* Step 1: Placed */}
                      <div className="flex items-start gap-xl relative">
                        <div className="z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white ring-8 ring-primary/10 shrink-0">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-sm font-bold text-primary">Order Placed</h3>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">Your order is logged and sent to the kitchen.</p>
                          <span className="font-label-sm text-[10px] text-outline mt-1 block">Sent: {latestActiveOrder.time}</span>
                        </div>
                      </div>

                      {/* Step 2: Preparing */}
                      <div className={`flex items-start gap-xl relative ${latestActiveOrder.status === 'PENDING' ? 'opacity-40' : ''}`}>
                        <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          latestActiveOrder.status === 'PREPARING' 
                            ? 'bg-amber-500 text-white ring-8 ring-amber-500/10' 
                            : latestActiveOrder.status === 'READY' || latestActiveOrder.status === 'COMPLETED'
                              ? 'bg-primary text-white'
                              : 'bg-surface-container text-outline'
                        }`}>
                          <Hourglass className={`w-5 h-5 ${latestActiveOrder.status === 'PREPARING' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <h3 className={`font-headline-sm text-sm font-bold ${latestActiveOrder.status === 'PREPARING' ? 'text-amber-600' : 'text-on-surface'}`}>Cooking</h3>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">The chef is crafting your selections fresh.</p>
                        </div>
                      </div>

                      {/* Step 3: Ready */}
                      <div className={`flex items-start gap-xl relative ${latestActiveOrder.status === 'PENDING' || latestActiveOrder.status === 'PREPARING' ? 'opacity-40' : ''}`}>
                        <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          latestActiveOrder.status === 'READY'
                            ? 'bg-green-600 text-white ring-8 ring-green-600/10 animate-bounce' 
                            : 'bg-surface-container text-outline'
                        }`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`font-headline-sm text-sm font-bold ${latestActiveOrder.status === 'READY' ? 'text-green-600' : 'text-on-surface'}`}>Ready</h3>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">Your food is ready and on its way to your table!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2xl">
                    <UtensilsCrossed className="w-12 h-12 text-outline mx-auto mb-md animate-pulse" />
                    <p className="font-bold text-sm text-on-surface">No active orders</p>
                    <p className="text-xs text-on-surface-variant mt-1">Place an order from the menu items above.</p>
                  </div>
                )}

                {latestActiveOrder && (
                  <div className="mt-xl p-md bg-surface-container-low rounded-xl border border-outline-variant/30 text-center">
                    <p className="font-label-md text-xs font-bold text-on-surface-variant">Order ID: #{latestActiveOrder.id}</p>
                    <p className="font-body-sm text-[10px] text-outline mt-0.5">Table {tableId.replace(/^T0?/, '')} • Live Tracker</p>
                  </div>
                )}
              </div>
            )}

            {/* Billing Drawer */}
            {activeModal === 'BILLING' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-t-3xl p-xl max-h-[85%] overflow-y-auto z-70 animate-slide-up"
              >
                <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-lg"></div>
                <div className="flex justify-between items-center mb-xl">
                  <h2 className="font-headline-md text-lg font-bold text-on-surface">Table Settlement</h2>
                  <button 
                    onClick={() => { if (!isProcessingPayment) setActiveModal('NONE'); }} 
                    className="text-outline-variant"
                    disabled={isProcessingPayment}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isProcessingPayment ? (
                  <div className="flex flex-col items-center justify-center py-2xl space-y-md">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="font-headline-sm text-sm font-bold text-on-surface">Processing Simulated Payment...</p>
                    <p className="text-xs text-on-surface-variant">Connecting to secure demo transaction gateway</p>
                  </div>
                ) : (
                  <div className="space-y-xl">
                    {/* Bill breakdown */}
                    <div className="space-y-md border-b border-outline-variant/40 pb-md">
                      <p className="font-label-sm text-outline uppercase tracking-wider text-[10px] font-bold">Order Summary</p>
                      {activeTableOrders.map(order => 
                        order.items.map((oi, idx) => (
                          <div key={`${order.id}-${idx}`} className="flex justify-between text-sm">
                            <span className="text-on-surface-variant">{oi.quantity}x {oi.menuItem.name}</span>
                            <span className="font-semibold text-on-surface">${(oi.menuItem.price * oi.quantity).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-sm">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Subtotal</span>
                        <span>${activeTableSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>GST (5%)</span>
                        <span>${activeTableGst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Service Charge</span>
                        <span>${activeTableService.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-on-surface pt-sm border-t border-outline-variant/40">
                        <span>Grand Total</span>
                        <span className="text-primary">${activeTableTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Method Selector */}
                    <div className="space-y-md">
                      <p className="font-label-sm text-outline uppercase tracking-wider text-[10px] font-bold">Select Payment Mode</p>
                      <div className="grid grid-cols-2 gap-md">
                        <button
                          onClick={() => setSelectedMethod('Online')}
                          className={`py-3 rounded-xl border-2 transition-all text-sm font-semibold flex items-center justify-center gap-xs ${
                            selectedMethod === 'Online' 
                              ? 'border-primary bg-primary-container/10 text-primary' 
                              : 'border-outline-variant text-on-surface-variant hover:border-outline'
                          }`}
                        >
                          <span>Simulated Online</span>
                        </button>
                        <button
                          onClick={() => setSelectedMethod('Cash')}
                          className={`py-3 rounded-xl border-2 transition-all text-sm font-semibold flex items-center justify-center gap-xs ${
                            selectedMethod === 'Cash' 
                              ? 'border-primary bg-primary-container/10 text-primary' 
                              : 'border-outline-variant text-on-surface-variant hover:border-outline'
                          }`}
                        >
                          <span>Cash / Counter</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSimulatePayment}
                      className="w-full bg-primary text-on-primary py-lg rounded-2xl font-bold hover:shadow-xl active:scale-95 transition-all text-sm text-white"
                    >
                      {selectedMethod === 'Online' ? 'Confirm Payment Gateway' : 'Notify Cashier to Pay Cash'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Temporary Toast Display */}
        {toastMessage && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-slide-up">
            <div className="flex items-center gap-md px-lg py-3 rounded-full shadow-2xl bg-white border border-primary/20 text-primary">
              <CheckCircle2 className="w-4 h-4 fill-primary text-white shrink-0" />
              <span className="font-label-md text-xs font-bold whitespace-nowrap">{toastMessage}</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default MobileOrder;
