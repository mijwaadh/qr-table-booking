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
  Minus,
  ShoppingCart, 
  X, 
  UtensilsCrossed,
  CheckCircle2,
  Hourglass,
  ChevronLeft,
  Loader2,
  Check,
  ArrowLeft,
  RefreshCw,
  LogOut
} from 'lucide-react';
import type { MenuItem } from '../types';
import { playNewOrderSound, playCashPaymentSound, playItemTapSound, playBilledSound } from '../utils/audioAlerts';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import { type ReceiptOrderInfo } from '../utils/whatsappReceipt';

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
    let clean = id.trim().toUpperCase();
    clean = clean.replace(/^(TABLE|TBL|T[\s_-]*)/, '').trim();
    const match = clean.match(/^(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return `T${num.toString().padStart(2, '0')}`;
    }
    return clean.startsWith('T') ? clean : `T${clean}`;
  };
  const tableId = normalizeTableId(rawTableId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Starters' | 'Main Course' | 'Beverages' | 'Desserts'>('All');
  
  // Customer QR Scan Registration State
  const [customerName, setCustomerName] = useState(() => {
    try {
      const saved = localStorage.getItem(`sf_qr_customer_${tableId}`);
      return saved ? JSON.parse(saved).name || '' : '';
    } catch { return ''; }
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    try {
      const saved = localStorage.getItem(`sf_qr_customer_${tableId}`);
      return saved ? JSON.parse(saved).phone || '' : '';
    } catch { return ''; }
  });
  const [showQRRegistrationModal, setShowQRRegistrationModal] = useState(false);
  const [isRegisteringQR, setIsRegisteringQR] = useState(false);

  // Table PIN and Order with friends State
  const [tablePin] = useState(() => {
    try {
      const saved = localStorage.getItem(`sf_table_pin_${tableId}`);
      if (saved) return saved;
      const pin = '27' + (tableId.replace(/[^0-9]/g, '').padStart(2, '0') || '44');
      localStorage.setItem(`sf_table_pin_${tableId}`, pin);
      return pin;
    } catch { return '2744'; }
  });
  const [qrModalTab, setQrModalTab] = useState<'NEW' | 'JOIN'>('NEW');
  const [joinPinInput, setJoinPinInput] = useState('');
  const [, setRazorpayPaymentId] = useState<string | null>(null);

  // Local Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paidOrderInfo, setPaidOrderInfo] = useState<ReceiptOrderInfo | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Modal Views
  const [activeModal, setActiveModal] = useState<'NONE' | 'CHECKOUT' | 'TRACKING' | 'BILLING' | 'SERVICE'>('NONE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'Online' | 'Cash'>('Online');
  const [serviceCheckboxes, setServiceCheckboxes] = useState({
    callWaiter: false,
    getBill: false,
    cleanTable: false,
    getWater: false,
    getCutlery: false
  });

  const handleSendServiceRequest = () => {
    const selected: string[] = [];
    if (serviceCheckboxes.callWaiter) selected.push('Call Waiter');
    if (serviceCheckboxes.getBill) selected.push('Get Bill');
    if (serviceCheckboxes.cleanTable) selected.push('Clean Table');
    if (serviceCheckboxes.getWater) selected.push('Get Water');
    if (serviceCheckboxes.getCutlery) selected.push('Get Cutlery');

    if (selected.length === 0) {
      triggerToast('Please select at least one request option.');
      return;
    }

    playNewOrderSound();
    triggerToast(`Request sent: ${selected.join(', ')}`);
    setActiveModal('NONE');
    setServiceCheckboxes({
      callWaiter: false,
      getBill: false,
      cleanTable: false,
      getWater: false,
      getCutlery: false
    });
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0 || isPlacingOrder) return;
    // Open the Name and Number prompt when customer clicks Place Order
    setShowQRRegistrationModal(true);
  };

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
    playItemTapSound();
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleDecrementQuantity = (itemId: string) => {
    playItemTapSound();
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === itemId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(i => i.menuItem.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.menuItem.id !== itemId);
    });
  };

  // Cart Calculations
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const cartServiceCharge = cartSubtotal * 0.10;
  const cartTotal = cartSubtotal + cartServiceCharge;

  // Active Table Orders and Calculations
  const activeTableOrders = orders.filter(o => o.tableId === tableId && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
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

  const handleSaveQRRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter both your Name and Phone Number to continue.');
      return;
    }
    setIsRegisteringQR(true);
    try {
      // Save on database via API call
      try {
        await fetch('http://localhost:8000/api/customers/qr-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerName.trim(),
            phone: customerPhone.trim(),
            tableId: tableId
          })
        });
      } catch (err) {
        console.warn('QR scan customer registration API error:', err);
      }

      localStorage.setItem(`sf_qr_customer_${tableId}`, JSON.stringify({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        tableId: tableId,
        scannedAt: new Date().toISOString()
      }));

      // If cart has items when they submit their Name & Number, immediately place order
      if (cart.length > 0) {
        setIsPlacingOrder(true);
        const success = await addOrder(tableId, cart.map(i => ({
          menuItem: i.menuItem,
          quantity: i.quantity,
          notes: `QR Order (${customerName.trim()} • ${customerPhone.trim()})`
        })));

        if (success) {
          playNewOrderSound();
          localStorage.setItem(`sf_table_name_${tableId}`, customerName.trim());
          setTableStatus(tableId, 'OCCUPIED', activeTableTotal + cartTotal);
          setCart([]); // Clear cart
          setActiveModal('TRACKING');
          triggerToast('Order placed successfully with kitchen chime! Sent to KDS.');
        }
        setIsPlacingOrder(false);
      } else {
        triggerToast(`Welcome to Table ${tableId.replace(/^T0?/, '')}, ${customerName}!`);
      }
      setShowQRRegistrationModal(false);
    } finally {
      setIsRegisteringQR(false);
    }
  };

  const handleJoinWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinPinInput.trim() || !customerName.trim()) {
      alert('Please enter both your Name and the Table PIN.');
      return;
    }
    if (joinPinInput.trim() !== tablePin) {
      alert(`Invalid Table PIN! Please ask your friend at Table ${tableId.replace(/^T0?/, '')} for PIN: ${tablePin}.`);
      return;
    }
    localStorage.setItem(`sf_qr_customer_${tableId}`, JSON.stringify({
      name: customerName.trim(),
      phone: `Joined PIN ${tablePin}`,
      tableId: tableId,
      scannedAt: new Date().toISOString()
    }));
    setShowQRRegistrationModal(false);
    setActiveModal('TRACKING');
    triggerToast(`Joined Table ${tableId.replace(/^T0?/, '')} session successfully! Synced with friends.`);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const triggerPaymentSuccess = (methodName: string, amount: number) => {
    const invoiceNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setPaidOrderInfo({
      invoiceNumber: invoiceNum,
      tableId: tableId,
      items: activeTableOrders.flatMap(o => o.items).length > 0
        ? activeTableOrders.flatMap(o => o.items)
        : cart.map(i => ({ menuItem: i.menuItem, quantity: i.quantity })),
      subtotal: activeTableSubtotal || cartSubtotal,
      gst: activeTableGst || (cartSubtotal * 0.05),
      serviceCharge: activeTableService || cartServiceCharge,
      total: amount,
      paymentMethod: methodName,
      paymentStatus: 'Paid',
      time: timeStr,
      customerName: customerName || 'Dining Guest',
      customerPhone: customerPhone
    });
    setShowSuccessModal(true);
  };

  const handleSimulatePayment = async () => {
    if (selectedMethod === 'Online') {
      setIsProcessingPayment(true);
      const isRazorpayLoaded = await loadRazorpayScript();
      
      if (!isRazorpayLoaded) {
        // Fallback simulation if offline/blocked
        setTimeout(() => {
          setIsProcessingPayment(false);
          setActiveModal('NONE');
          settleBill(tableId, 'Online (Simulated)');
          triggerToast('Online payment successful! Receipt ready.');
          triggerPaymentSuccess('Online (Simulated)', activeTableTotal);
        }, 1500);
        return;
      }

      setIsProcessingPayment(false);
      const amountInPaise = Math.max(100, Math.round(activeTableTotal * 100)); // e.g. ₹400 -> 40000 paise
      const options = {
        key: 'rzp_test_DemoTableOrderKey', // Test key for demo/offline
        amount: amountInPaise,
        currency: 'INR',
        name: 'Antigravity Restaurant & Bar',
        description: `Table ${tableId.replace(/^T0?/, '')} Dining Bill Settlement`,
        image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
        handler: function (response: any) {
          playBilledSound();
          setRazorpayPaymentId(response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 10)}`);
          setActiveModal('NONE');
          settleBill(tableId, `Online (Razorpay: ${response.razorpay_payment_id || 'RZP_SUCCESS'})`);
          triggerToast(`₹${activeTableTotal.toFixed(2)} Paid via Razorpay successfully!`);
          triggerPaymentSuccess('Online (Razorpay)', activeTableTotal);
        },
        prefill: {
          name: customerName || 'Dining Guest',
          contact: customerPhone || '9876543210'
        },
        notes: {
          tableId: tableId,
          tablePin: tablePin
        },
        theme: {
          color: '#1a8852'
        },
        modal: {
          ondismiss: function () {
            triggerToast('Razorpay payment popup closed.');
          }
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert(`Razorpay Payment Failed: ${response.error.description || 'Unknown error'}`);
        });
        rzp.open();
      } catch (err) {
        console.warn('Razorpay open failed, using fallback simulation:', err);
        setTimeout(() => {
          setActiveModal('NONE');
          settleBill(tableId, 'Online (Razorpay Fallback)');
          triggerToast('Online payment processed via fallback gateway.');
          triggerPaymentSuccess('Online (Fallback)', activeTableTotal);
        }, 1000);
      }
    } else {
      // Cash payment
      playCashPaymentSound();
      if (customerName.trim()) {
        localStorage.setItem(`sf_table_name_${tableId}`, customerName.trim());
      }
      setTableStatus(tableId, 'PAYMENT_PENDING', activeTableTotal);
      setActiveModal('NONE');
      triggerToast('Cashier notified with sound alert! Receipt ready for counter payment.');
      triggerPaymentSuccess('Cash (Counter)', activeTableTotal);
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
          <section className="px-md mt-lg grid grid-cols-4 gap-2">
            <button 
              onClick={() => {
                setServiceCheckboxes({ callWaiter: false, getBill: true, cleanTable: false, getWater: false, getCutlery: false });
                setActiveModal('SERVICE');
                playItemTapSound();
              }}
              className="flex flex-col items-center justify-center py-3 px-1 bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors shadow-sm active:scale-95"
            >
              <Receipt className="w-5 h-5 text-primary mb-1" />
              <span className="font-label-sm text-[11px] font-bold text-on-surface">Get Bill</span>
            </button>
            <button 
              onClick={() => {
                setServiceCheckboxes({ callWaiter: true, getBill: false, cleanTable: false, getWater: false, getCutlery: false });
                setActiveModal('SERVICE');
                playItemTapSound();
              }}
              className="flex flex-col items-center justify-center py-3 px-1 bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors shadow-sm active:scale-95"
            >
              <UserCheck className="w-5 h-5 text-primary mb-1" />
              <span className="font-label-sm text-[11px] font-bold text-on-surface">Call Waiter</span>
            </button>
            <button 
              onClick={() => {
                setServiceCheckboxes({ callWaiter: false, getBill: false, cleanTable: false, getWater: true, getCutlery: false });
                setActiveModal('SERVICE');
                playItemTapSound();
              }}
              className="flex flex-col items-center justify-center py-3 px-1 bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors shadow-sm active:scale-95"
            >
              <Droplets className="w-5 h-5 text-primary mb-1" />
              <span className="font-label-sm text-[11px] font-bold text-on-surface">Get Water</span>
            </button>
            <button 
              onClick={() => {
                setActiveModal('SERVICE');
                playItemTapSound();
              }}
              className="flex flex-col items-center justify-center py-3 px-1 bg-surface-container-low rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors shadow-sm active:scale-95"
            >
              <UtensilsCrossed className="w-5 h-5 text-primary mb-1" />
              <span className="font-label-sm text-[11px] font-bold text-on-surface">More Help</span>
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
                      <span className="font-label-md text-sm text-primary font-bold shrink-0">₹{item.price.toFixed(2)}</span>
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
                    ) : (() => {
                      const cartItem = cart.find(i => i.menuItem.id === item.id);
                      if (cartItem && cartItem.quantity > 0) {
                        return (
                          <div className="flex items-center gap-1.5 bg-primary text-on-primary rounded-xl px-1.5 py-1 shadow-sm transition-all animate-fade-in">
                            <button 
                              onClick={() => handleDecrementQuantity(item.id)}
                              className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5 text-white" />
                            </button>
                            <span className="font-label-md text-xs font-bold px-1 min-w-[18px] text-center text-white">
                              {cartItem.quantity}
                            </span>
                            <button 
                              onClick={() => handleAddToCart(item)}
                              className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                              title="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="w-8 h-8 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center hover:scale-95 transition-transform active:bg-primary active:text-on-primary shadow-sm"
                          title="Add to cart"
                        >
                          <Plus className="w-4 h-4 text-primary group-active:text-white" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Floating Cart Bar */}
        {cartItemCount > 0 && activeModal === 'NONE' && (
          <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 z-50 animate-slide-up pointer-events-none">
            <button 
              onClick={() => setActiveModal('CHECKOUT')}
              className="w-full bg-primary text-on-primary p-lg rounded-2xl shadow-2xl flex justify-between items-center transform transition-transform active:scale-95 pointer-events-auto border border-primary-container/30"
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
              <p className="font-headline-sm text-sm font-bold text-white">₹{cartSubtotal.toFixed(2)}</p>
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full flex justify-around items-center px-4 py-2 pb-safe bg-surface-container-lowest shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.15)] z-50 rounded-t-2xl shrink-0 border-t border-outline-variant/30">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end justify-center"
          >
            
            {/* Checkout Drawer */}
            {activeModal === 'CHECKOUT' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-t-3xl p-xl max-h-[85%] overflow-y-auto z-70 animate-slide-up flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-lg"></div>
                  <div className="flex justify-between items-center mb-xl">
                    <h2 className="font-headline-md text-lg font-bold text-on-surface">Your Cart</h2>
                    <button onClick={() => setActiveModal('NONE')} className="text-outline-variant"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-md overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                    {cart.map((item, idx) => (
                      <div key={item.menuItem.id || idx} className="flex justify-between items-center py-md border-b border-outline-variant/30 text-sm gap-2">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-1 shrink-0 border border-outline-variant/20">
                            <button
                              onClick={() => handleDecrementQuantity(item.menuItem.id)}
                              className="w-6 h-6 rounded bg-surface hover:bg-surface-container-lowest flex items-center justify-center text-on-surface transition-colors active:scale-90 shadow-2xs"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 text-on-surface-variant" />
                            </button>
                            <span className="font-label-md text-xs font-bold px-1 min-w-[18px] text-center text-on-surface">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item.menuItem)}
                              className="w-6 h-6 rounded bg-surface hover:bg-surface-container-lowest flex items-center justify-center text-on-surface transition-colors active:scale-90 shadow-2xs"
                              title="Increase quantity"
                            >
                              <Plus className="w-3 h-3 text-on-surface-variant" />
                            </button>
                          </div>
                          <span className="font-body-md text-on-surface font-semibold truncate" title={item.menuItem.name}>{item.menuItem.name}</span>
                        </div>
                        <span className="font-label-md text-sm font-bold shrink-0 ml-2">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-xl pt-lg border-t border-outline-variant/60">
                  <div className="space-y-sm">
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Subtotal</span>
                      <span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant text-xs">
                      <span>Service Charge (10%)</span>
                      <span>₹{cartServiceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface font-headline-sm pt-sm border-t border-outline-variant font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className={`w-full bg-primary text-on-primary py-lg rounded-2xl mt-xl font-headline-sm hover:shadow-xl active:scale-95 transition-all font-bold text-sm text-white flex items-center justify-center gap-2 ${
                      isPlacingOrder ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending to Kitchen...</span>
                      </>
                    ) : (
                      <span>Place Order</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Order Tracking / Order with Friends Modal matching exact screenshot */}
            {activeModal === 'TRACKING' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-t-3xl p-5 max-h-[90%] overflow-y-auto z-70 animate-slide-up space-y-4 shadow-2xl"
              >
                <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-1"></div>
                
                {/* Top Header with Back Arrow, Name, Phone, Refresh, Logout */}
                <div className="flex justify-between items-start pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setActiveModal('NONE')} className="p-1 hover:bg-gray-100 rounded-full text-gray-700">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-lg font-black text-gray-900 leading-tight">Hi, {customerName || 'Rajesh'}</h2>
                      <p className="text-xs text-gray-500 font-semibold">{customerPhone || '9075448855'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => triggerToast('Orders synced with friends!')}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-all active:rotate-180 duration-500"
                      title="Sync / Refresh"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Leave table session?')) {
                          localStorage.removeItem(`sf_qr_customer_${tableId}`);
                          setCustomerName('');
                          setCustomerPhone('');
                          setActiveModal('NONE');
                          setShowQRRegistrationModal(true);
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-full text-rose-700 transition-colors"
                      title="Exit session"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Table PIN Card matching exact screenshot */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Your Table PIN</h3>
                    <p className="text-xs text-gray-400 font-medium">Order with friends</p>
                  </div>
                  <div className="px-3.5 py-1 border-2 border-[#683323] rounded-xl font-black text-lg text-[#683323] tracking-widest bg-[#683323]/5 shadow-inner">
                    {tablePin}
                  </div>
                </div>

                {/* Get Bill & Order Again Buttons matching exact screenshot */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button 
                    onClick={() => setActiveModal('BILLING')}
                    className="w-full border-2 border-[#683323] text-[#683323] font-bold py-2.5 rounded-xl hover:bg-[#683323]/5 active:scale-95 transition-all text-sm shadow-sm"
                  >
                    Get Bill
                  </button>
                  <button 
                    onClick={() => setActiveModal('NONE')}
                    className="w-full border-2 border-[#683323] text-[#683323] font-bold py-2.5 rounded-xl hover:bg-[#683323]/5 active:scale-95 transition-all text-sm shadow-sm"
                  >
                    Order Again
                  </button>
                </div>
                <button 
                  onClick={() => {
                    triggerPaymentSuccess('Cash / Online', activeTableTotal);
                    setActiveModal('NONE');
                  }}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl active:scale-95 transition-all text-sm shadow-sm flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View & Share Receipt (WhatsApp / PDF)</span>
                </button>

                {/* Items Box with PLACED BY badge exactly like screenshot */}
                <div className="border border-gray-200 rounded-2xl p-4 relative pt-6 mt-6 bg-white shadow-sm">
                  <div className="absolute top-0 right-0 bg-[#683323] text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider shadow">
                    PLACED BY {(latestActiveOrder?.notes && latestActiveOrder.notes.includes('(')) ? latestActiveOrder.notes.split('(')[1].split('•')[0].trim().toUpperCase() : (customerName || 'RAJESH').toUpperCase()}
                  </div>

                  <p className="text-xs font-bold text-gray-400 mb-2">Items</p>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {activeTableOrders.length > 0 ? (
                      activeTableOrders.flatMap(o => o.items).map((oi, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-800">
                          <span>{oi.quantity} x {oi.menuItem.name}</span>
                          <span className="text-gray-600">Rs {(oi.menuItem.price * oi.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                          <span>1 x Steak burger</span>
                          <span className="text-gray-600">Rs 150.00</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                          <span>1 x Egg Cheese Burger</span>
                          <span className="text-gray-600">Rs 250.00</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ORDER PLACED ON</p>
                    <p className="text-xs font-extrabold text-gray-700 mt-0.5">
                      {latestActiveOrder?.time ? `Today ${latestActiveOrder.time}` : '02 May 2024 10:31 PM'}
                    </p>
                  </div>
                </div>

                {/* Live Order Timeline Progress */}
                {latestActiveOrder && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-500 mb-3">Live Kitchen Status (# {latestActiveOrder.id})</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                        <span className="text-[10px] font-extrabold text-emerald-800 block">Placed</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${latestActiveOrder.status === 'PREPARING' || latestActiveOrder.status === 'READY' ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200 opacity-40'}`}>
                        <Hourglass className={`w-4 h-4 mx-auto mb-1 ${latestActiveOrder.status === 'PREPARING' ? 'text-amber-600 animate-spin' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-extrabold text-amber-800 block">Cooking</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${latestActiveOrder.status === 'READY' ? 'bg-green-50 border-green-300 animate-bounce' : 'bg-gray-50 border-gray-200 opacity-40'}`}>
                        <CheckCircle2 className={`w-4 h-4 mx-auto mb-1 ${latestActiveOrder.status === 'READY' ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-extrabold text-green-800 block">Ready!</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Billing Drawer */}
            {activeModal === 'BILLING' && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-t-3xl p-xl max-h-[85%] overflow-y-auto z-70 animate-slide-up"
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
                            <span className="font-semibold text-on-surface">₹{(oi.menuItem.price * oi.quantity).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-sm">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Subtotal</span>
                        <span>₹{activeTableSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>GST (5%)</span>
                        <span>₹{activeTableGst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Service Charge</span>
                        <span>₹{activeTableService.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-on-surface pt-sm border-t border-outline-variant/40">
                        <span>Grand Total</span>
                        <span className="text-primary">₹{activeTableTotal.toFixed(2)}</span>
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
                          onClick={() => { setSelectedMethod('Cash'); playCashPaymentSound(); }}
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

            {activeModal === 'SERVICE' && (
              <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-outline-variant/30 space-y-5 animate-slide-up text-left">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-black text-on-surface tracking-tight">Request sent.</h2>
                  <button 
                    onClick={() => setActiveModal('NONE')} 
                    className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3.5 py-1">
                  <label className="flex items-center gap-3.5 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={serviceCheckboxes.callWaiter}
                      onChange={(e) => setServiceCheckboxes(prev => ({ ...prev, callWaiter: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                    <span>Call Waiter</span>
                  </label>

                  <label className="flex items-center gap-3.5 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={serviceCheckboxes.getBill}
                      onChange={(e) => setServiceCheckboxes(prev => ({ ...prev, getBill: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                    <span>Get Bill</span>
                  </label>

                  <label className="flex items-center gap-3.5 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={serviceCheckboxes.cleanTable}
                      onChange={(e) => setServiceCheckboxes(prev => ({ ...prev, cleanTable: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                    <span>Clean Table</span>
                  </label>

                  <label className="flex items-center gap-3.5 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={serviceCheckboxes.getWater}
                      onChange={(e) => setServiceCheckboxes(prev => ({ ...prev, getWater: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                    <span>Get Water</span>
                  </label>

                  <label className="flex items-center gap-3.5 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={serviceCheckboxes.getCutlery}
                      onChange={(e) => setServiceCheckboxes(prev => ({ ...prev, getCutlery: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                    <span>Get Cutlery</span>
                  </label>
                </div>

                <button
                  onClick={handleSendServiceRequest}
                  className="w-full bg-white hover:bg-gray-50 active:scale-95 transition-all border border-gray-300 text-gray-900 py-3 rounded-xl font-bold text-sm shadow-sm tracking-wide"
                >
                  Send Request
                </button>
              </div>
            )}

          </div>
        )}

        {/* Temporary Toast Display matching exact screenshot */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-5 py-3.5 flex items-center justify-between min-w-[320px] max-w-md gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-serif italic font-black text-sm shrink-0 shadow-sm">
                  i
                </div>
                <span className="font-extrabold text-gray-800 text-sm leading-tight">{toastMessage}</span>
              </div>
              <button 
                onClick={() => setToastMessage(null)} 
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors pointer-events-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* QR Scan Registration / Place Order / Join with PIN Prompt Modal */}
        {showQRRegistrationModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-outline-variant/30 text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <button 
                onClick={() => setShowQRRegistrationModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <UserCheck className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {cart.length > 0 ? 'Confirm Your Order' : `Table ${tableId.replace(/^T0?/, '')} Dining`}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Start a new table session or join your friends with the Table PIN.
                </p>
              </div>

              {/* Tabs: Start Session vs Join with PIN */}
              <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setQrModalTab('NEW')}
                  className={`flex-1 py-2 rounded-lg transition-all ${qrModalTab === 'NEW' ? 'bg-white text-primary shadow-sm font-extrabold' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Start Session / Host
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalTab('JOIN')}
                  className={`flex-1 py-2 rounded-lg transition-all ${qrModalTab === 'JOIN' ? 'bg-white text-primary shadow-sm font-extrabold' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Join with PIN / Friend
                </button>
              </div>

              {qrModalTab === 'NEW' ? (
                <form onSubmit={handleSaveQRRegistration} className="space-y-3.5 text-left animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Rajesh Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="e.g. +91 90754 48855"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRegisteringQR || isPlacingOrder}
                    className="w-full mt-2 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {isRegisteringQR || isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Order...</span>
                      </>
                    ) : cart.length > 0 ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Place Order ({cartItemCount} items) • ₹{cartTotal.toFixed(2)}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save & Start Ordering</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoinWithPin} className="space-y-3.5 text-left animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Amit (Friend)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">4-Digit Table PIN</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={4}
                      placeholder={`e.g. ${tablePin}`}
                      value={joinPinInput}
                      onChange={(e) => setJoinPinInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-base font-extrabold tracking-widest text-center text-[#683323] outline-none transition-all"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Ask your friend sitting at Table {tableId.replace(/^T0?/, '')} for the Table PIN.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 bg-[#683323] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#683323]/25 hover:bg-[#683323]/90 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Join Table Session & Sync</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Payment Success Modal with WhatsApp Share and PDF Download */}
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          orderInfo={paidOrderInfo}
          onBackToHome={() => {
            setShowSuccessModal(false);
            setActiveModal('NONE');
            navigate('/');
          }}
        />

      </main>
    </div>
  );
};

export default MobileOrder;
