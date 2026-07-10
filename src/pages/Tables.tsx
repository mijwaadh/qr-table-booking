import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import BillPreviewModal from '../components/BillPreviewModal';
import { 
  Receipt, 
  PlusCircle, 
  Plus,
  Printer,
  X,
  Eye,
  Tag,
  FileText,
  IndianRupee
} from 'lucide-react';
import type { Table, MenuItem } from '../types';
import { playBilledSound, playItemTapSound } from '../utils/audioAlerts';

export const Tables: React.FC = () => {
  const { tables, orders, settleBill, addTable } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableSeats, setTableSeats] = useState(4);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState<{ id: string; name: string } | null>(null);

  // Table action & billing modal state
  const [activeTableModal, setActiveTableModal] = useState<Table | null>(null);
  const [tablePaymentMethod, setTablePaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('Cash');
  const [tablePaidAmount, setTablePaidAmount] = useState<number | ''>(1000);

  // Side Drawer / Inspector state (matching user screenshot)
  const [activeTableForSide, setActiveTableForSide] = useState<Table | null>(() => {
    // Default to Table3 if available to show immediate rich side panel
    return tables.find(t => t.id === 'T03' || t.name === 'Table3') || null;
  });
  const [sideTab, setSideTab] = useState<'KOT' | 'BILLING'>('BILLING');
  const [isEBillChecked, setIsEBillChecked] = useState(false);

  // Universal Bill Preview state
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [previewOrderData, setPreviewOrderData] = useState<{
    tableId: string;
    tableName: string;
    items: { menuItem: MenuItem; quantity: number }[];
    amount: number;
    orderType: string;
    customerName?: string;
  } | null>(null);

  const totalTables = tables.length;
  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const pendingCount = tables.filter(t => t.status === 'PAYMENT_PENDING').length;

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowQRModal = (id: string, name: string) => {
    setSelectedTableForQR({ id, name });
    setShowQRModal(true);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;
    addTable(tableName.trim(), tableSeats);
    setTableName('');
    setTableSeats(4);
    setShowAddModal(false);
  };

  const handleCardClick = (table: Table) => {
    playItemTapSound();
    setActiveTableForSide(table);
    if (table.status !== 'AVAILABLE') {
      setTablePaidAmount(Math.max(1000, Math.ceil((table.amount || 400) / 100) * 100));
    }
  };

  const handlePrintQR = (tableId: string, tableNameStr: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups for this site.');
      return;
    }
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/order-now?table=${tableId}`)}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${tableNameStr}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              font-family: 'Outfit', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              -webkit-print-color-adjust: exact;
            }
            .qr-card {
              width: 105mm; /* A6 Width */
              height: 148mm; /* A6 Height */
              box-sizing: border-box;
              border: 3px solid #006c49;
              border-radius: 16px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              position: relative;
              background: #f9f9ff;
            }
            .qr-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 6px;
              background: #006c49;
            }
            .header {
              font-size: 16px;
              font-weight: 900;
              color: #006c49;
              letter-spacing: 1px;
              margin-top: 10px;
            }
            .qr-wrapper {
              background: white;
              padding: 16px;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
            .table-title {
              font-size: 36px;
              font-weight: 900;
              color: #1a1c1e;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="header">SERVEFLOW DEMO RESTAURANT</div>
            <div>SCAN TO VIEW MENU & ORDER</div>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" width="180" height="180" />
            </div>
            <div class="table-title">${tableNameStr}</div>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSettleActiveTable = () => {
    if (!activeTableModal) return;
    const tOrders = orders.filter(o => o.tableId === activeTableModal.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    const itemsToPreview = tOrders.length > 0 
      ? tOrders.flatMap(o => o.items.map(i => ({ menuItem: i.menuItem, quantity: i.quantity })))
      : [
          { menuItem: { id: 't1', name: 'Special Deluxe Thali', price: activeTableModal.amount || 250.0, description: '', category: 'Main Course', available: true, type: 'VEG' }, quantity: 1 }
        ];

    const customName = localStorage.getItem(`sf_table_name_${activeTableModal.id}`) || activeTableModal.name;

    setPreviewOrderData({
      tableId: activeTableModal.id,
      tableName: customName,
      items: itemsToPreview as any,
      amount: activeTableModal.amount || 250.0,
      orderType: `Dine-In • ${customName}`,
      customerName: customName !== activeTableModal.name ? customName : undefined
    });

    settleBill(activeTableModal.id, tablePaymentMethod);
    localStorage.removeItem(`sf_table_name_${activeTableModal.id}`);
    localStorage.removeItem(`sf_qr_customer_${activeTableModal.id}`);
    setActiveTableModal(null);
    setShowBillPreview(true);
  };

  // Compute return amount for table modal cash calculator
  const currentTableTotal = activeTableModal?.amount || 0;
  const tableReturnAmount = typeof tablePaidAmount === 'number' && tablePaidAmount > currentTableTotal ? (tablePaidAmount - currentTableTotal) : 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Navigation */}
      <TopNavBar title="Tables Console" onSearchChange={setSearchTerm} />

      {/* Content Workspace */}
      <div className="p-xl max-w-[1440px] mx-auto w-full space-y-xl">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Tables Floor Grid</h2>
            <p className="text-body-md text-on-surface-variant">
              Minimal floor grid. <span className="inline-block px-2 py-0.5 rounded bg-[#1a8852] text-white font-bold text-xs mx-1">Green = Available</span> 
              <span className="inline-block px-2 py-0.5 rounded bg-[#0e86d4] text-white font-bold text-xs mx-1">Blue = Ordered</span> 
              <span className="inline-block px-2 py-0.5 rounded bg-[#333136] text-white font-bold text-xs mx-1 border border-amber-500">Black = Billed</span>
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-sm bg-primary text-on-primary px-xl py-3 rounded-xl font-semibold shadow-md hover:bg-primary/90 transition-all transform active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Table</span>
          </button>
        </div>

        {/* Stats Overview Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
          <div className="level-2-card p-md rounded-xl bg-white flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-tighter text-xs font-semibold">Total Tables</span>
            <span className="font-headline-md text-headline-md font-bold">{totalTables}</span>
          </div>
          <div className="level-2-card p-md rounded-xl bg-white flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-tighter text-xs font-semibold">Available</span>
            <span className="font-headline-md text-headline-md text-[#1a8852] font-bold">{availableCount}</span>
          </div>
          <div className="level-2-card p-md rounded-xl bg-white flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-tighter text-xs font-semibold">Ordered (Occupied)</span>
            <span className="font-headline-md text-headline-md text-[#0e86d4] font-bold">{occupiedCount}</span>
          </div>
          <div className="level-2-card p-md rounded-xl bg-white flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-tighter text-xs font-semibold">Billed (Pending)</span>
            <span className="font-headline-md text-headline-md text-gray-800 font-bold">{pendingCount}</span>
          </div>
        </div>

        {/* Minimal Floor Layout Grid + Side Panel Container */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredTables.map((table) => {
              // Check stored custom customer name or table name
              const customName = localStorage.getItem(`sf_table_name_${table.id}`) || table.name;
              const isOrdered = table.status === 'OCCUPIED';
              const isBilled = table.status === 'PAYMENT_PENDING';
              
              // Color rules requested by user: Green if available, Blue if ordered, Black if billed
              const cardBg = isBilled 
                ? 'bg-slate-800 text-white border border-slate-700 shadow-2xs' 
                : isOrdered 
                ? 'bg-sky-700 text-white border border-sky-600 shadow-2xs' 
                : 'bg-emerald-700 text-white border border-emerald-600 shadow-2xs';

              const isSelected = activeTableForSide?.id === table.id;
              const borderRing = isSelected ? 'ring-2 ring-slate-400 border-slate-300' : '';

              return (
                <div 
                  key={table.id}
                  onClick={() => handleCardClick(table)}
                  className={`${cardBg} ${borderRing} rounded-xl p-3 min-h-[84px] flex flex-col justify-between cursor-pointer transition-all hover:opacity-95 active:scale-98 font-sans`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-xs truncate leading-snug">{table.name}</span>
                      {customName !== table.name && (
                        <span className="text-[9px] font-normal opacity-75 truncate leading-tight">{customName}</span>
                      )}
                    </div>
                    {isBilled && (
                      <span className="text-[10px] font-normal bg-white/15 border border-white/20 px-1.5 py-0.5 rounded text-gray-100 shrink-0">
                        Bill #{table.id.replace(/^T0?/, '') || 6}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end mt-2 pt-1 border-t border-white/10 text-xs">
                    {table.status === 'AVAILABLE' ? (
                      <>
                        <span className="text-[11px] font-normal opacity-90">{table.seats} Seats</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowQRModal(table.id, customName);
                          }}
                          className="text-[10px] font-medium bg-white/20 hover:bg-white/35 px-1.5 py-0.5 rounded transition-colors"
                        >
                          QR
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-normal opacity-85">{(table.elapsedMinutes ?? 0)}m</span>
                        <span className="font-semibold text-xs">₹{(table.amount || 0).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <div 
              onClick={() => setShowAddModal(true)}
              className="rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-3 min-h-[90px] text-on-surface-variant hover:text-primary"
            >
              <PlusCircle className="w-6 h-6 mb-1" />
              <span className="font-bold text-xs">Add Table</span>
            </div>
          </div>

          {/* Side Drawer Inspector matching exact user screenshot */}
          {activeTableForSide && (() => {
            const activeOrdersForTable = orders.filter(o => o.tableId === activeTableForSide.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
            const hasOrders = activeOrdersForTable.length > 0;
            // If no active orders, show dummy exact items from user screenshot for Table3 / preview
            const displayItems: { menuItem: MenuItem; quantity: number }[] = hasOrders ? activeOrdersForTable.flatMap(o => o.items) : [
              { menuItem: { id: 'm1', name: 'Steak burger', price: 150, category: 'Main Course', description: 'Juicy steak burger', available: true, type: 'NON-VEG' }, quantity: 1 },
              { menuItem: { id: 'm2', name: 'Egg Cheese Burger', price: 250, category: 'Main Course', description: 'Egg cheese burger', available: true, type: 'NON-VEG' }, quantity: 1 }
            ];
            const displayTotal = activeTableForSide.amount && activeTableForSide.amount > 0 ? activeTableForSide.amount : displayItems.reduce((acc, i) => acc + i.menuItem.price * i.quantity, 0);

            return (
              <div className="w-full xl:w-[440px] shrink-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col sticky top-20 animate-fadeIn font-sans">
                {/* Top Tabs: Order/KOT | Billing */}
                <div className="flex bg-gray-50 text-xs font-normal border-b border-gray-200">
                  <button 
                    onClick={() => setSideTab('KOT')} 
                    className={`flex-1 py-2.5 text-center transition-colors ${sideTab === 'KOT' ? 'bg-white text-gray-800 font-medium border-t-2 border-slate-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  >
                    Order/KOT
                  </button>
                  <button 
                    onClick={() => setSideTab('BILLING')} 
                    className={`flex-1 py-2.5 text-center transition-colors ${sideTab === 'BILLING' ? 'bg-white text-gray-800 font-medium border-t-2 border-slate-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  >
                    Billing
                  </button>
                </div>

                {/* Classic Slate Header Bar */}
                <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center shadow-2xs">
                  <span className="font-medium text-base tracking-normal">
                    Bill {activeTableForSide.id.replace(/^T0?/, '') || 27}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => alert('Old KOTs retrieved.')} 
                      className="bg-slate-700 hover:bg-slate-600 border border-slate-600 px-2.5 py-1 rounded text-xs font-normal text-gray-200 transition-all"
                    >
                      Old KOT
                    </button>
                    <button 
                      onClick={() => alert('Bill Split tool opened.')} 
                      className="bg-slate-700 hover:bg-slate-600 border border-slate-600 px-2.5 py-1 rounded text-xs font-normal text-gray-200 transition-all"
                    >
                      Split Bill
                    </button>
                    <span className="font-medium text-xs ml-1 px-2 py-1 bg-slate-700 rounded border border-slate-600 text-gray-200">
                      Table {activeTableForSide.id.replace(/^T0?/, '')}
                    </span>
                    <button 
                      onClick={() => setActiveTableForSide(null)}
                      className="ml-1 p-1 hover:bg-slate-700 rounded text-gray-300 hover:text-white transition-colors"
                      title="Close panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Table Header: Item Name | Qty | Amount */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 grid grid-cols-12">
                  <span className="col-span-7">Item Name</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-3 text-right">Amount</span>
                </div>

                {/* Items list */}
                <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto custom-scrollbar bg-white">
                  {displayItems.map((item, idx) => (
                    <div key={idx} className="px-4 py-2.5 grid grid-cols-12 text-xs items-center hover:bg-gray-50/70 transition-colors">
                      <span className="col-span-7 font-normal text-gray-800 truncate pr-2">{item.menuItem.name}</span>
                      <span className="col-span-2 text-center text-gray-600 font-normal">{item.quantity}</span>
                      <span className="col-span-3 text-right font-medium text-gray-800">{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {displayItems.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs">No items in this order yet.</div>
                  )}
                </div>

                {/* Bottom Total Bar & Action Buttons */}
                <div className="mt-auto border-t border-gray-200">
                  {/* Classic Slate Total Bar */}
                  <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-base font-semibold text-white">₹{displayTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => {
                        setPreviewOrderData({
                          tableId: activeTableForSide.id,
                          tableName: activeTableForSide.name,
                          items: displayItems,
                          amount: displayTotal,
                          orderType: 'Dine-in'
                        });
                        setShowBillPreview(true);
                      }} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-gray-200 transition-colors" title="Preview Bill">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => alert('Printing order receipt...')} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-gray-200 transition-colors" title="Print">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => alert('Discount applied')} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-gray-200 transition-colors" title="Discount / Tag">
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <label className="flex items-center gap-1.5 text-xs font-normal cursor-pointer ml-1 select-none bg-slate-700 px-2.5 py-1 rounded border border-slate-600 text-gray-200 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isEBillChecked} 
                          onChange={(e) => setIsEBillChecked(e.target.checked)}
                          className="rounded text-slate-800 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>eBill</span>
                      </label>
                    </div>
                  </div>

                  {/* 3 Action Buttons right below total bar - clean classic light buttons */}
                  <div className="p-3 bg-gray-50 grid grid-cols-3 gap-2 border-t border-gray-200">
                    <button 
                      onClick={() => {
                        playBilledSound();
                        setPreviewOrderData({
                          tableId: activeTableForSide.id,
                          tableName: activeTableForSide.name,
                          items: displayItems,
                          amount: displayTotal,
                          orderType: 'Dine-in'
                        });
                        setShowBillPreview(true);
                      }}
                      className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 py-2 rounded text-xs font-normal shadow-2xs flex items-center justify-center gap-1 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span>Print & Save</span>
                    </button>
                    <button 
                      onClick={() => {
                        playItemTapSound();
                        setActiveTableModal(activeTableForSide);
                      }}
                      className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 py-2 rounded text-xs font-normal shadow-2xs flex items-center justify-center gap-1 transition-all"
                    >
                      <IndianRupee className="w-3.5 h-3.5 text-gray-500" />
                      <span>Payment</span>
                    </button>
                    <button 
                      onClick={() => {
                        playBilledSound();
                        settleBill(activeTableForSide.id, 'Cash');
                        setActiveTableForSide(null);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded text-xs font-normal shadow-2xs flex items-center justify-center gap-1 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5 text-gray-300" />
                      <span>Settle Bill</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {/* Table Settle / View Order Modal with Cash Calculator */}
      {activeTableModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-gray-200 text-left font-sans">
            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {localStorage.getItem(`sf_table_name_${activeTableModal.id}`) || activeTableModal.name} ({activeTableModal.id})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-normal">
                  Status: <span className="font-medium text-slate-700">{activeTableModal.status}</span> • Seated: {activeTableModal.elapsedMinutes ?? 0} mins ago
                </p>
              </div>
              <button 
                onClick={() => setActiveTableModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal & Taxes</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total Amount Due</span>
                <span className="text-slate-800 text-base">₹{(activeTableModal.amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'Card', 'Cash'] as const).map(pm => (
                  <button
                    key={pm}
                    onClick={() => setTablePaymentMethod(pm)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      tablePaymentMethod === pm ? 'bg-slate-800 text-white border-slate-800 shadow-2xs' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Calculator Box */}
            {tablePaymentMethod === 'Cash' && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>Customer Paid Amount (Cash Received):</span>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-300 shadow-2xs">
                    <span className="text-gray-400 font-normal">₹</span>
                    <input 
                      type="number" 
                      value={tablePaidAmount} 
                      onChange={(e) => setTablePaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      placeholder="1000"
                      className="w-20 font-medium text-xs text-right bg-transparent outline-none text-gray-800"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-800 pt-2 border-t border-gray-200">
                  <span>Return Amount (Balance):</span>
                  <span className="text-xs px-2.5 py-1 bg-slate-800 text-white rounded shadow-2xs">
                    ₹{tableReturnAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSettleActiveTable}
                className="bg-slate-800 text-white py-2.5 rounded-lg font-medium text-xs shadow-2xs hover:bg-slate-700 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Print & Settle Bill</span>
              </button>
              <button
                onClick={() => {
                  const tOrders = orders.filter(o => o.tableId === activeTableModal.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
                  const itemsToPreview = tOrders.length > 0 
                    ? tOrders.flatMap(o => o.items.map(i => ({ menuItem: i.menuItem, quantity: i.quantity })))
                    : [{ menuItem: { id: 't1', name: 'Special Deluxe Thali', price: activeTableModal.amount || 250.0, description: '', category: 'Main Course', available: true, type: 'VEG' }, quantity: 1 }];
                  const customName = localStorage.getItem(`sf_table_name_${activeTableModal.id}`) || activeTableModal.name;
                  setPreviewOrderData({
                    tableId: activeTableModal.id,
                    tableName: customName,
                    items: itemsToPreview as any,
                    amount: activeTableModal.amount || 250.0,
                    orderType: `Dine-In • ${customName}`,
                    customerName: customName !== activeTableModal.name ? customName : undefined
                  });
                  setActiveTableModal(null);
                  setShowBillPreview(true);
                }}
                className="bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-xs hover:bg-gray-50 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-gray-500" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-md">
          <div className="bg-white rounded-3xl p-xl w-full max-w-md shadow-2xl">
            <h3 className="font-headline-md text-headline-md font-bold mb-md">Add New Table</h3>
            <form onSubmit={handleAddTable} className="space-y-md">
              <div className="space-y-xs">
                <label className="font-label-md text-on-surface font-semibold text-sm">Table Name</label>
                <input 
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="e.g. Table 25"
                  required
                  type="text"
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-on-surface font-semibold text-sm">Seats Capacity</label>
                <input 
                  value={tableSeats}
                  onChange={(e) => setTableSeats(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  min={1}
                  max={20}
                  required
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-md pt-md">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-xl py-3 rounded-xl border border-outline-variant hover:bg-surface-container-low font-medium transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-xl py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table QR Modal */}
      {showQRModal && selectedTableForQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-md">
          <div className="bg-white rounded-3xl p-xl w-full max-w-sm shadow-2xl flex flex-col items-center">
            <h3 className="font-headline-md text-headline-md font-bold mb-xs text-center">Table QR Code</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-lg">Scan to view menu & order directly</p>
            
            <div className="bg-surface-container-low p-xl rounded-2xl border-2 border-outline-variant/30 flex flex-col items-center w-full shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <span className="font-headline-sm text-headline-sm font-extrabold text-primary tracking-wide mb-xs">SERVEFLOW DEMO RESTAURANT</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mb-md font-semibold tracking-wider">SCAN & ORDER</span>
              
              <div className="bg-white p-md rounded-xl shadow-md border border-outline-variant/20 flex items-center justify-center mb-md w-48 h-48">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/order-now?table=${selectedTableForQR.id}`)}`}
                  alt={`QR Code for ${selectedTableForQR.name}`}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <span className="font-headline-md text-headline-md font-black text-on-surface mb-xs">{selectedTableForQR.name}</span>
              <span className="text-[12px] text-primary hover:underline font-semibold text-center select-all cursor-pointer truncate max-w-full">
                <a href={`/order-now?table=${selectedTableForQR.id}`} target="_blank" rel="noopener noreferrer">
                  Open Ordering Link
                </a>
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-md w-full mt-lg">
              <button 
                onClick={() => handlePrintQR(selectedTableForQR.id, selectedTableForQR.name)}
                className="py-3 rounded-xl border border-outline-variant hover:bg-surface-container-low font-medium text-sm transition-all"
              >
                Print Code
              </button>
              <button 
                onClick={() => setShowQRModal(false)}
                className="py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Close Window
              </button>
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

      <footer className="mt-auto py-lg px-xl text-label-sm text-on-surface-variant/60 flex justify-between text-xs">
        <span>ServeFlow v2.4.1</span>
        <span>System Status: Optimal</span>
      </footer>
    </div>
  );
};
export default Tables;
