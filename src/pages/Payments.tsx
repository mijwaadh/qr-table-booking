import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import { 
  CheckCircle2, 
  ArrowRight, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  Wallet, 
  Edit2, 
  Printer,
  Receipt,
  Ticket
} from 'lucide-react';

export const Payments: React.FC = () => {
  const { tables, orders, settleBill } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string>('T18'); // Default select Table 18 as in Stitch design
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0); // in percent
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get active pending tables
  const pendingTables = tables
    .filter(t => t.status === 'PAYMENT_PENDING' || t.status === 'OCCUPIED')
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Find selected table details
  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];
  
  // Find orders for selected table
  const tableOrders = orders.filter(o => o.tableId === selectedTableId && o.status !== 'COMPLETED');
  
  // Calculate subtotal from active orders
  const subtotal = tableOrders.reduce((sum, o) => sum + o.amount, 0) || (currentTable?.amount || 0);
  const gst = subtotal * 0.05;
  const serviceCharge = subtotal > 0 ? 5.00 : 0;
  const discountAmount = subtotal * (discountApplied / 100);
  const total = subtotal + gst + serviceCharge - discountAmount;

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'SF20') {
      setDiscountApplied(20);
      alert('Discount code "SF20" applied! 20% off.');
    } else {
      alert('Invalid code. Try "SF20" for a 20% mock discount.');
    }
  };

  const handleGenerateBill = () => {
    if (subtotal === 0) {
      alert('No pending amount for this table.');
      return;
    }
    setShowSuccessModal(true);
  };

  const handleCheckoutConfirm = () => {
    if (currentTable) {
      settleBill(currentTable.id);
    }
    setShowSuccessModal(false);
    setDiscountApplied(0);
    setDiscountCode('');
    
    // Auto select another pending table if available
    const nextPending = tables.find(t => t.id !== selectedTableId && (t.status === 'PAYMENT_PENDING' || t.status === 'OCCUPIED'));
    if (nextPending) {
      setSelectedTableId(nextPending.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      {/* Top Navigation */}
      <TopNavBar title="Billing Terminal" onSearchChange={setSearchTerm} />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-lg custom-scrollbar">
        <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-lg h-full">
          
          {/* Left Section: Table Selection (7 Columns) */}
          <section className="col-span-12 lg:col-span-7 flex flex-col gap-lg h-full overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between">
              <div className="flex gap-sm overflow-x-auto pb-2">
                <button className="px-md py-xs bg-primary text-on-primary rounded-full font-label-md text-sm font-semibold transition-all">All Sections</button>
                <button className="px-md py-xs bg-surface-container-high text-on-surface-variant rounded-full font-label-md text-sm font-semibold hover:bg-outline-variant/30 transition-all">Dining Hall</button>
                <button className="px-md py-xs bg-surface-container-high text-on-surface-variant rounded-full font-label-md text-sm font-semibold hover:bg-outline-variant/30 transition-all">Patio</button>
              </div>
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
                    {table.seats} Guests • {table.elapsedMinutes || 30}m seated
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-label-sm text-outline mb-1 uppercase tracking-wider text-[10px] font-bold">Pending</p>
                      <p className="font-headline-sm text-headline-sm text-on-surface font-bold">${(table.amount || 0).toFixed(2)}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}

              {pendingTables.length === 0 && (
                <div className="col-span-2 bg-white rounded-xl p-xl border border-outline-variant/30 text-center text-on-surface-variant">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-sm" />
                  <p className="font-bold text-sm">No pending checkout tables.</p>
                  <p className="text-xs mt-1">Excellent! All tables have settled their accounts.</p>
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
                    ${tables.reduce((sum, t) => sum + (t.status !== 'AVAILABLE' ? t.amount || 0 : 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-primary-container/10 border border-primary-fixed p-md rounded-xl flex items-center gap-md">
                <div className="bg-primary-fixed p-sm rounded-lg text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-label-sm text-outline uppercase text-[10px] font-bold">Today's Revenue</p>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold">$1,452.80</p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Section: Bill Preview (5 Columns) */}
          <aside className="col-span-12 lg:col-span-5 h-full overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-2xl border border-outline-variant bill-preview-shadow h-full flex flex-col overflow-hidden">
              
              {/* Bill Header */}
              <div className="p-lg border-b border-outline-variant bg-surface-bright flex justify-between items-start">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Bill Preview</h3>
                  <p className="text-label-sm text-on-surface-variant text-xs">
                    {currentTable?.name || 'No Table Selected'} • Order #{tableOrders[0]?.id || 'SF-MOCK'}
                  </p>
                </div>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
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
                          <span className="font-body-md font-semibold text-on-surface">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    )
                  ) : (
                    // Default fallback mock items matching Table 18 from Stitch
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-md">
                          <div className="w-8 h-8 bg-surface-container flex items-center justify-center rounded font-bold text-xs">2x</div>
                          <span className="font-body-md text-on-surface">Grilled Salmon Steak</span>
                        </div>
                        <span className="font-body-md font-semibold text-on-surface">$57.00</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-md">
                          <div className="w-8 h-8 bg-surface-container flex items-center justify-center rounded font-bold text-xs">1x</div>
                          <span className="font-body-md text-on-surface">Truffle Mushroom Risotto</span>
                        </div>
                        <span className="font-body-md font-semibold text-on-surface">$24.00</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-md">
                          <div className="w-8 h-8 bg-surface-container flex items-center justify-center rounded font-bold text-xs">3x</div>
                          <span className="font-body-md text-on-surface">Virgin Mojito (L)</span>
                        </div>
                        <span className="font-body-md font-semibold text-on-surface">$37.50</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Calculations Section */}
                <div className="mt-xl space-y-sm">
                  <div className="flex justify-between text-body-md text-sm">
                    <span className="text-on-surface-variant">Subtotal</span>
                    <span className="font-semibold">${subtotal > 0 ? subtotal.toFixed(2) : '118.50'}</span>
                  </div>
                  <div className="flex justify-between text-body-md text-sm">
                    <span className="text-on-surface-variant">GST (5%)</span>
                    <span className="font-semibold">${gst > 0 ? gst.toFixed(2) : '5.92'}</span>
                  </div>
                  <div className="flex justify-between text-body-md text-sm">
                    <span className="text-on-surface-variant">Service Charge</span>
                    <span className="font-semibold">${serviceCharge > 0 ? serviceCharge.toFixed(2) : '5.00'}</span>
                  </div>
                  {discountApplied > 0 && (
                    <div className="flex justify-between text-body-md text-sm text-primary">
                      <span>Discount ({discountApplied}%)</span>
                      <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
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
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Total Amount</span>
                    <span className="font-display text-headline-lg text-primary font-bold text-2xl">
                      ${total > 0 ? total.toFixed(2) : '129.42'}
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
                      onClick={() => setSelectedMethod('Cash')}
                      className={`flex flex-col items-center justify-center p-md rounded-xl border-2 transition-all ${
                        selectedMethod === 'Cash' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 mb-xs" />
                      <span className="font-label-md text-xs font-semibold">Cash</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="p-lg bg-surface border-t border-outline-variant grid grid-cols-1 gap-md">
                <button 
                  onClick={handleGenerateBill}
                  className="w-full bg-primary text-on-primary py-md rounded-xl font-headline-sm text-headline-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-md shadow-lg shadow-primary-container/20 font-bold"
                >
                  <Receipt className="w-5 h-5" />
                  <span>Generate Bill</span>
                </button>
                <button 
                  onClick={() => alert('Printing receipt on Cashier Printer...')}
                  className="w-full bg-white border border-outline text-on-surface py-md rounded-xl font-headline-sm text-headline-sm hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-md font-semibold"
                >
                  <Printer className="w-5 h-5 text-outline" />
                  <span>Print Receipt</span>
                </button>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-3xl p-2xl w-full max-w-md mx-md flex flex-col items-center text-center bill-preview-shadow transform transition-transform duration-300 scale-100">
            <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-xl text-primary">
              <CheckCircle2 className="w-16 h-16 fill-primary text-white" />
            </div>
            <h2 className="font-display text-headline-lg text-on-surface mb-sm font-bold text-2xl">Payment Successful</h2>
            <p className="font-body-md text-on-surface-variant mb-2xl text-sm">
              Bill for Table {currentTable?.name || '18'} has been processed successfully via {selectedMethod}. A digital copy has been sent to the customer.
            </p>
            <div className="w-full space-y-md">
              <button 
                onClick={handleCheckoutConfirm}
                className="w-full bg-primary text-on-primary py-md rounded-xl font-headline-sm text-headline-sm hover:brightness-110 active:scale-[0.98] transition-all font-bold text-base"
              >
                Confirm Settle
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-surface-container-high text-on-surface py-md rounded-xl font-label-md text-label-md hover:bg-surface-container transition-all font-semibold text-sm"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Payments;
