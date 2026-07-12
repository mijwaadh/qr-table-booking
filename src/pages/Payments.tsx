import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import BillPreviewModal from '../components/BillPreviewModal';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import { type ReceiptOrderInfo } from '../utils/whatsappReceipt';
import { 
  CheckCircle2, 
  ArrowRight, 
  CreditCard, 
  QrCode, 
  IndianRupee, 
  Wallet, 
  Edit2, 
  Printer,
  Receipt,
  Ticket,
  Zap,
  Plus,
  Minus,
  X,
  Search
} from 'lucide-react';
import type { MenuItem } from '../types';
import { playBilledSound, playCashPaymentSound, playItemTapSound, playNewOrderSound } from '../utils/audioAlerts';

export const Payments: React.FC = () => {
  const { tables, orders, menuItems, settleBill, addOrder } = useRestaurant();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0); // in percent
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paidOrderData, setPaidOrderData] = useState<ReceiptOrderInfo | null>(null);

  // Cash payment calculator states
  const [customerPaidAmount, setCustomerPaidAmount] = useState<number | ''>(1000);

  // Quick Bill Take-Away states
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);
  const [parcelCustomerName, setParcelCustomerName] = useState('Parcel Customer');
  const [parcelCustomerPhone, setParcelCustomerPhone] = useState('');
  const [parcelCart, setParcelCart] = useState<{ menuItem: MenuItem; quantity: number }[]>([]);
  const [parcelSearchTerm, setParcelSearchTerm] = useState('');
  const [parcelPaymentMethod, setParcelPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('Cash');
  const [parcelPaidAmount, setParcelPaidAmount] = useState<number | ''>(500);
  const [sendKOTToKitchen, setSendKOTToKitchen] = useState(true);

  // Universal Bill Preview Modal state
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [previewOrderData, setPreviewOrderData] = useState<{
    tableId: string;
    tableName: string;
    items: { menuItem: MenuItem; quantity: number }[];
    amount: number;
    orderType: string;
    customerName?: string;
  } | null>(null);

  // Get active pending tables
  const pendingTables = tables
    .filter(t => t.status === 'PAYMENT_PENDING' || t.status === 'OCCUPIED')
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Find selected table details
  const currentTable = selectedTableId ? tables.find(t => t.id === selectedTableId) : null;
  
  // Find orders for selected table
  const tableOrders = selectedTableId ? orders.filter(o => o.tableId === selectedTableId && o.status !== 'COMPLETED' && o.status !== 'CANCELLED') : [];
  
  // Calculate subtotal from active orders
  const subtotal = tableOrders.length > 0 
    ? tableOrders.reduce((sum, o) => sum + o.amount, 0) 
    : (currentTable?.amount || 0);
  const gst = subtotal * 0.05;
  const serviceCharge = subtotal > 0 ? 5.00 : 0;
  const discountAmount = subtotal * (discountApplied / 100);
  const total = subtotal > 0 ? Math.max(0, subtotal + gst + serviceCharge - discountAmount) : 0;

  // Compute Cash Return Amount for regular billing
  const returnAmount = typeof customerPaidAmount === 'number' && customerPaidAmount > total ? (customerPaidAmount - total) : 0;

  // Parcel Cart calculations
  const parcelSubtotal = parcelCart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const parcelGst = parcelSubtotal * 0.05;
  const parcelTotal = parcelSubtotal + parcelGst;
  const parcelReturnAmount = typeof parcelPaidAmount === 'number' && parcelPaidAmount > parcelTotal ? (parcelPaidAmount - parcelTotal) : 0;

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'SF20') {
      setDiscountApplied(20);
      alert('Discount code "SF20" applied! 20% off.');
    } else {
      alert('Invalid code. Try "SF20" for a 20% mock discount.');
    }
  };

  const handleGenerateBill = () => {
    if (!currentTable || (subtotal === 0 && tableOrders.length === 0)) {
      alert('No active order items for this table.');
      return;
    }
    // Open Universal Bill Preview
    const itemsToPreview = tableOrders.length > 0 
      ? tableOrders.flatMap(o => o.items.map(i => ({ menuItem: i.menuItem, quantity: i.quantity })))
      : [
          { menuItem: { id: 'd1', name: `Dine-In Charges (${currentTable.name})`, price: subtotal, description: '', category: 'Main Course', available: true, type: 'VEG' }, quantity: 1 }
        ];

    setPreviewOrderData({
      tableId: currentTable.id,
      tableName: currentTable.name,
      items: itemsToPreview as any,
      amount: total,
      orderType: `Dine-In • ${currentTable.name}`
    });
    setShowBillPreview(true);
  };

  const handlePrintAndSettle = () => {
    if (!currentTable) return;
    playBilledSound();
    handleGenerateBill();
    setTimeout(() => {
      if (currentTable) settleBill(currentTable.id, selectedMethod);
    }, 500);
  };

  // Quick Bill Take-Away actions
  const handleAddParcelItem = (item: MenuItem) => {
    playItemTapSound();
    setParcelCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleRemoveParcelItem = (itemId: string) => {
    playItemTapSound();
    setParcelCart(prev => {
      const existing = prev.find(i => i.menuItem.id === itemId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(i => i.menuItem.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.menuItem.id !== itemId);
    });
  };

  const handleSettleQuickBill = async () => {
    if (parcelCart.length === 0) {
      alert('Please add at least one item to the Take-Away cart.');
      return;
    }
    if (sendKOTToKitchen) {
      playNewOrderSound();
      // Record parcel order and send KOT to kitchen KDS
      await addOrder('Take-Away', parcelCart.map(i => ({
        menuItem: i.menuItem,
        quantity: i.quantity,
        notes: `Take-Away (${parcelCustomerName}) - KOT Sent`
      })));
    } else {
      playBilledSound();
    }

    setPreviewOrderData({
      tableId: 'Take-Away',
      tableName: `${parcelCustomerName} (${parcelCustomerPhone || 'Take-Away'})`,
      items: parcelCart,
      amount: parcelTotal,
      orderType: sendKOTToKitchen ? 'PickUp (KOT Sent to Kitchen)' : 'PickUp (Direct Counter)',
      customerName: parcelCustomerName
    });
    const invoiceNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setPaidOrderData({
      invoiceNumber: invoiceNum,
      tableId: 'Take-Away',
      tableName: `${parcelCustomerName} (${parcelCustomerPhone || 'Take-Away'})`,
      items: parcelCart,
      subtotal: parcelSubtotal,
      gst: parcelGst,
      serviceCharge: 0,
      total: parcelTotal,
      paymentMethod: parcelPaymentMethod,
      paymentStatus: 'Paid',
      time: timeStr,
      customerName: parcelCustomerName,
      customerPhone: parcelCustomerPhone
    });
    setShowQuickBillModal(false);
    setShowSuccessModal(true);
    setParcelCart([]);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      {/* Top Navigation */}
      <TopNavBar title="Billing Terminal" onSearchChange={setSearchTerm} />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-lg custom-scrollbar">
        <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-lg h-full">
          
          {/* Left Section: Table Selection & Quick Bill (7 Columns) */}
          <section className="col-span-12 lg:col-span-7 flex flex-col gap-lg h-full overflow-y-auto no-scrollbar">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30">
              <div className="flex gap-sm overflow-x-auto pb-1">
                <button className="px-4 py-1.5 bg-primary text-on-primary rounded-xl font-label-md text-sm font-bold shadow-sm transition-all">All Sections</button>
                <button className="px-4 py-1.5 bg-surface-container text-on-surface-variant rounded-xl font-label-md text-sm font-semibold hover:bg-outline-variant/30 transition-all">Dining Hall</button>
                <button className="px-4 py-1.5 bg-surface-container text-on-surface-variant rounded-xl font-label-md text-sm font-semibold hover:bg-outline-variant/30 transition-all">Patio</button>
              </div>

              {/* Quick Bill Take-Away Action Button */}
              <button
                onClick={() => setShowQuickBillModal(true)}
                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-amber-600 active:scale-95 transition-all animate-pulse"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Quick Bill / Take-Away</span>
              </button>
            </div>

            {/* Grid of Pending Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {pendingTables.map((table) => (
                <div 
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`bg-white p-md rounded-xl border-2 bill-preview-shadow cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden group ${
                    selectedTableId === table.id ? 'border-primary' : 'border-outline-variant/40'
                  }`}
                >
                  {selectedTableId === table.id && (
                    <div className="absolute top-0 right-0 p-2 text-primary opacity-100">
                      <CheckCircle2 className="w-5 h-5 fill-primary text-white" />
                    </div>
                  )}
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-xs font-bold text-lg">{table.name}</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-md text-xs">
                    {table.seats} Guests • {(table.elapsedMinutes ?? 0)}m seated
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-label-sm text-outline mb-1 uppercase tracking-wider text-[10px] font-bold">Pending</p>
                      <p className="font-headline-sm text-headline-sm text-on-surface font-bold">₹{(table.amount || 0).toFixed(2)}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}

              {pendingTables.length === 0 && (
                <div className="col-span-2 bg-white rounded-xl p-xl border border-outline-variant/30 text-center text-on-surface-variant">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-sm" />
                  <p className="font-bold text-sm">No pending checkout tables.</p>
                  <p className="text-xs mt-1">Excellent! All tables have settled their accounts. Or use Quick Bill Take-Away above.</p>
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-auto">
              <div className="bg-secondary-container/10 border border-secondary-fixed p-md rounded-xl flex items-center gap-md">
                <div className="bg-secondary-fixed p-sm rounded-lg text-secondary">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-label-sm text-outline uppercase text-[10px] font-bold">Total Receivable</p>
                  <p className="font-headline-sm text-headline-sm text-secondary font-bold">
                    ₹{tables.reduce((sum, t) => sum + (t.status !== 'AVAILABLE' ? t.amount || 0 : 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-primary-container/10 border border-primary-fixed p-md rounded-xl flex items-center gap-md">
                <div className="bg-primary-fixed p-sm rounded-lg text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-label-sm text-outline uppercase text-[10px] font-bold">Today's Revenue</p>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold">₹1,452.80</p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Section: Bill Preview (5 Columns) */}
          <aside className="col-span-12 lg:col-span-5 h-full overflow-y-auto no-scrollbar">
            {(!currentTable || (tableOrders.length === 0 && (!currentTable.amount || currentTable.amount === 0))) ? (
              <div className="bg-white rounded-2xl border border-outline-variant bill-preview-shadow h-full flex flex-col items-center justify-center p-xl text-center">
                <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-md text-outline">
                  <Receipt className="w-10 h-10 text-on-surface-variant/40" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-lg mb-2">No Active Bill Selected</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs text-xs leading-relaxed">
                  Select an ordered or payment-pending table from the left to view its bill breakdown and process checkout. Or use <strong className="text-amber-600 font-semibold">Quick Bill / Take-Away</strong>.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-outline-variant bill-preview-shadow h-full flex flex-col overflow-hidden animate-fadeIn">
                
                {/* Bill Header */}
                <div className="p-lg border-b border-outline-variant bg-surface-bright flex justify-between items-start">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Bill Preview</h3>
                    <p className="text-label-sm text-on-surface-variant text-xs">
                      {currentTable.name} • Order #{tableOrders[0]?.id || `TBL-${currentTable.id.replace(/^T0?/, '')}`}
                    </p>
                  </div>
                  <button onClick={handleGenerateBill} title="Open full print layout" className="text-on-surface-variant hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bill Content */}
                <div className="flex-1 p-lg space-y-md overflow-y-auto custom-scrollbar">
                  
                  {/* Order Items List */}
                  <div className="space-y-md border-b border-surface-variant pb-md">
                    {tableOrders.length > 0 ? (
                      tableOrders.map(order => 
                        order.items.map((item, idx) => (
                          <div key={`${order.id}-${idx}`} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-md">
                              <div className="w-8 h-8 bg-surface-container flex items-center justify-center rounded font-bold text-xs">{item.quantity}x</div>
                              <span className="font-body-md text-on-surface">{item.menuItem.name}</span>
                            </div>
                            <span className="font-body-md font-semibold text-on-surface">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))
                      )
                    ) : (
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-md">
                          <div className="w-8 h-8 bg-surface-container flex items-center justify-center rounded font-bold text-xs">1x</div>
                          <span className="font-body-md text-on-surface">Dine-In Charges ({currentTable.name})</span>
                        </div>
                        <span className="font-body-md font-semibold text-on-surface">₹{(currentTable.amount || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Calculations Section */}
                  <div className="mt-xl space-y-sm">
                    <div className="flex justify-between text-body-md text-sm">
                      <span className="text-on-surface-variant">Subtotal</span>
                      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-body-md text-sm">
                      <span className="text-on-surface-variant">GST (5%)</span>
                      <span className="font-semibold">₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-body-md text-sm">
                      <span className="text-on-surface-variant">Service Charge</span>
                      <span className="font-semibold">₹{serviceCharge.toFixed(2)}</span>
                    </div>
                    {discountApplied > 0 && (
                      <div className="flex justify-between text-body-md text-sm text-primary">
                        <span>Discount ({discountApplied}%)</span>
                        <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-sm">
                      <div className="relative">
                        <Ticket className="w-4 h-4 absolute left-md top-1/2 -translate-y-1/2 text-outline" />
                        <input 
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          className="w-full pl-xl pr-20 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-xs"
                          placeholder="Add discount code (SF20)..."
                          type="text"
                        />
                        <button 
                          type="button"
                          onClick={handleApplyDiscount}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-primary font-bold text-xs hover:underline"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                    <div className="pt-md mt-md border-t border-dashed border-outline-variant flex justify-between items-end">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Grand Total</span>
                      <span className="font-display text-headline-lg text-primary font-bold text-2xl">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mt-xl">
                    <p className="text-label-sm text-outline mb-md uppercase tracking-widest font-extrabold text-[10px]">Payment Method</p>
                    <div className="grid grid-cols-3 gap-sm">
                      <button 
                        onClick={() => setSelectedMethod('UPI')}
                        className={`flex flex-col items-center justify-center p-md rounded-xl border-2 transition-all ${
                          selectedMethod === 'UPI' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        <QrCode className="w-5 h-5 mb-xs" />
                        <span className="font-label-md text-xs font-semibold">UPI</span>
                      </button>
                      <button 
                        onClick={() => setSelectedMethod('Card')}
                        className={`flex flex-col items-center justify-center p-md rounded-xl border-2 transition-all ${
                          selectedMethod === 'Card' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 mb-xs" />
                        <span className="font-label-md text-xs font-semibold">Card</span>
                      </button>
                      <button 
                        onClick={() => { setSelectedMethod('Cash'); playCashPaymentSound(); }}
                        className={`flex flex-col items-center justify-center p-md rounded-xl border-2 transition-all ${
                          selectedMethod === 'Cash' ? 'border-primary bg-primary-container/10 text-primary font-bold' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        <IndianRupee className="w-5 h-5 mb-xs" />
                        <span className="font-label-md text-xs font-semibold">Cash</span>
                      </button>
                    </div>

                    {/* Cash Payment Calculator inputs and return balance */}
                    {selectedMethod === 'Cash' && (
                      <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                          <span>Customer Paid Amount (Cash Received):</span>
                          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-amber-500/40 shadow-inner">
                            <span className="text-gray-500">₹</span>
                            <input 
                              type="number" 
                              value={customerPaidAmount} 
                              onChange={(e) => setCustomerPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                              placeholder="1000"
                              className="w-20 font-bold text-sm text-right bg-transparent outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm font-extrabold text-on-surface pt-2 border-t border-amber-500/20">
                          <span>Return Amount (Balance):</span>
                          <span className="text-base px-2.5 py-1 bg-amber-500 text-white rounded-lg shadow">
                            ₹{returnAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="p-lg bg-surface border-t border-outline-variant grid grid-cols-2 gap-md">
                  <button 
                    onClick={handlePrintAndSettle}
                    className="bg-primary text-on-primary py-3 rounded-xl font-headline-sm text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 font-bold"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Print & Settle</span>
                  </button>
                  <button 
                    onClick={handleGenerateBill}
                    className="bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded-xl font-headline-sm text-sm hover:bg-surface-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                    <Printer className="w-4 h-4 text-outline" />
                    <span>Preview Bill</span>
                  </button>
                </div>

              </div>
            )}
          </aside>

        </div>
      </div>

      {/* Quick Bill Take-Away Modal */}
      {showQuickBillModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-outline-variant/30">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-surface-container-lowest border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Zap className="w-5 h-5 fill-amber-600" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">Quick Bill / Parcel Order (Take-Away)</h3>
                  <p className="text-xs text-on-surface-variant">Add items instantly and settle payment right at the counter</p>
                </div>
              </div>
              <button 
                onClick={() => setShowQuickBillModal(false)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Menu Selection */}
              <div className="flex flex-col gap-4 border-r md:pr-6 border-outline-variant/20">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search menu items..."
                    value={parcelSearchTerm}
                    onChange={(e) => setParcelSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-outline-variant/60 focus:border-primary outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-2 pr-1 custom-scrollbar">
                  {menuItems
                    .filter(item => item.available && item.name.toLowerCase().includes(parcelSearchTerm.toLowerCase()))
                    .map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAddParcelItem(item)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/30 hover:bg-primary/5 hover:border-primary/40 cursor-pointer transition-all"
                      >
                        <div className="flex flex-col pr-2">
                          <span className="font-bold text-xs text-on-surface">{item.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-primary">₹{item.price}</span>
                          <span className="p-1 rounded-lg bg-primary text-white">
                            <Plus className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Column: Cart & Payment details */}
              <div className="flex flex-col justify-between">
                <div>
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface mb-1">Customer Name</label>
                      <input 
                        type="text" 
                        value={parcelCustomerName} 
                        onChange={(e) => setParcelCustomerName(e.target.value)}
                        placeholder="e.g. Rahul / Parcel #1"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-outline-variant/60 focus:border-primary outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface mb-1">Phone (Optional)</label>
                      <input 
                        type="tel" 
                        value={parcelCustomerPhone} 
                        onChange={(e) => setParcelCustomerPhone(e.target.value)}
                        placeholder="+91 98765..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-outline-variant/60 focus:border-primary outline-none font-semibold"
                      />
                    </div>
                  </div>

                  <p className="text-xs font-bold text-on-surface mb-2 flex items-center justify-between">
                    <span>Take-Away Cart Items ({parcelCart.reduce((s, i) => s + i.quantity, 0)})</span>
                  </p>

                  <div className="max-h-[22vh] overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                    {parcelCart.map((cItem, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                        <span className="font-semibold text-on-surface truncate pr-2">{cItem.menuItem.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleRemoveParcelItem(cItem.menuItem.id)} className="p-1 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold w-4 text-center">{cItem.quantity}</span>
                          <button onClick={() => handleAddParcelItem(cItem.menuItem)} className="p-1 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-right w-14">₹{cItem.menuItem.price * cItem.quantity}</span>
                        </div>
                      </div>
                    ))}
                    {parcelCart.length === 0 && (
                      <div className="text-center py-6 text-gray-400 text-xs italic">
                        Click items on the left to add to Take-Away order
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                  <div className="flex justify-between text-xs font-bold text-on-surface">
                    <span>Subtotal + GST (5%)</span>
                    <span className="text-primary text-sm">₹{parcelTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment Method selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'Card', 'Cash'] as const).map(pm => (
                      <button
                        key={pm}
                        onClick={() => setParcelPaymentMethod(pm)}
                        className={`py-1.5 rounded-lg text-xs font-bold border ${
                          parcelPaymentMethod === pm ? 'bg-primary text-white border-primary' : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>

                  {/* Cash calculator for Parcel */}
                  {parcelPaymentMethod === 'Cash' && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1">
                        <span>Paid: ₹</span>
                        <input 
                          type="number" 
                          value={parcelPaidAmount} 
                          onChange={(e) => setParcelPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          className="w-16 bg-white px-1.5 py-0.5 rounded border border-amber-500/40 text-right outline-none"
                        />
                      </div>
                      <div>
                        <span>Return: <span className="bg-amber-500 text-white px-2 py-0.5 rounded">₹{parcelReturnAmount.toFixed(2)}</span></span>
                      </div>
                    </div>
                  )}

                  {/* KOT Check Button Option */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs font-bold text-on-surface">
                    <span className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        checked={sendKOTToKitchen} 
                        onChange={(e) => setSendKOTToKitchen(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                      <span>Send KOT Check to Kitchen (KDS)</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">Optional</span>
                  </div>

                  <button
                    onClick={handleSettleQuickBill}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>{sendKOTToKitchen ? 'Print KOT, Settle & Print Bill' : 'Settle & Print Take-Away Bill'} (₹{parcelTotal.toFixed(2)})</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Universal Bill Preview Modal */}
      <BillPreviewModal
        isOpen={showBillPreview}
        onClose={() => setShowBillPreview(false)}
        tableId={previewOrderData?.tableId}
        tableName={previewOrderData?.tableName}
        items={previewOrderData?.items}
        amount={previewOrderData?.amount}
        orderType={previewOrderData?.orderType}
        customerName={previewOrderData?.customerName}
      />

      {/* Success Modal Overlay */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setDiscountApplied(0);
          setDiscountCode('');
          setSelectedTableId(null);
        }}
        orderInfo={paidOrderData}
        onBackToHome={() => {
          setShowSuccessModal(false);
          setDiscountApplied(0);
          setDiscountCode('');
          setSelectedTableId(null);
        }}
      />

    </div>
  );
};
export default Payments;
