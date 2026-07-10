import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import BillPreviewModal from '../components/BillPreviewModal';
import { 
  Receipt, 
  PlusCircle, 
  Plus,
  Printer,
  X
} from 'lucide-react';
import type { Table, MenuItem } from '../types';

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
    if (table.status === 'AVAILABLE') {
      handleShowQRModal(table.id, table.name);
    } else {
      setActiveTableModal(table);
      setTablePaidAmount(Math.max(1000, Math.ceil((table.amount || 100) / 100) * 100));
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

        {/* Minimal Floor Layout Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredTables.map((table) => {
            // Check stored custom customer name or table name
            const customName = localStorage.getItem(`sf_table_name_${table.id}`) || table.name;
            const isOrdered = table.status === 'OCCUPIED';
            const isBilled = table.status === 'PAYMENT_PENDING';
            
            // Color rules requested by user: Green if available, Blue if ordered, Black if billed
            const cardBg = isBilled 
              ? 'bg-[#333136] text-white border-2 border-amber-500 shadow-lg' 
              : isOrdered 
              ? 'bg-[#0e86d4] text-white border border-sky-400 shadow-md' 
              : 'bg-[#1a8852] text-white border border-emerald-500/80 shadow-sm';

            return (
              <div 
                key={table.id}
                onClick={() => handleCardClick(table)}
                className={`${cardBg} rounded-2xl p-3 min-h-[90px] flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.03] active:scale-95`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="font-extrabold text-sm truncate leading-snug">{customName}</span>
                  {isBilled && (
                    <span className="text-[10px] font-bold bg-amber-500/30 border border-amber-400/50 px-1.5 py-0.5 rounded text-amber-200 shrink-0">
                      Bill No: {table.id.replace(/^T0?/, '') || 6}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end mt-2 pt-1 border-t border-white/10">
                  {table.status === 'AVAILABLE' ? (
                    <>
                      <span className="text-xs font-medium opacity-90">{table.seats} Seats</span>
                      <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">QR</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] opacity-85">{table.elapsedMinutes || 20}m</span>
                      <span className="font-extrabold text-sm">Rs {(table.amount || 0).toFixed(2)}</span>
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

      </div>

      {/* Table Settle / View Order Modal with Cash Calculator */}
      {activeTableModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-outline-variant/30 text-left">
            <div className="flex justify-between items-start border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {localStorage.getItem(`sf_table_name_${activeTableModal.id}`) || activeTableModal.name} ({activeTableModal.id})
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                  Status: <span className="font-bold text-primary">{activeTableModal.status}</span> • Seated: {activeTableModal.elapsedMinutes || 20} mins ago
                </p>
              </div>
              <button 
                onClick={() => setActiveTableModal(null)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 space-y-2">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Subtotal & Taxes</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-on-surface pt-1 border-t border-outline-variant/30">
                <span>Total Amount Due</span>
                <span className="text-primary text-xl">₹{(activeTableModal.amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'Card', 'Cash'] as const).map(pm => (
                  <button
                    key={pm}
                    onClick={() => setTablePaymentMethod(pm)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      tablePaymentMethod === pm ? 'bg-primary text-white border-primary shadow-md' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Calculator Box matching user screenshot requirement */}
            {tablePaymentMethod === 'Cash' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                  <span>Customer Paid Amount (Cash Received):</span>
                  <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-amber-500/40 shadow-inner">
                    <span className="text-gray-500 font-bold">₹</span>
                    <input 
                      type="number" 
                      value={tablePaidAmount} 
                      onChange={(e) => setTablePaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      placeholder="1000"
                      className="w-20 font-extrabold text-sm text-right bg-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm font-extrabold text-on-surface pt-2 border-t border-amber-500/20">
                  <span>Return Amount (Balance):</span>
                  <span className="text-base px-3 py-1 bg-amber-500 text-white rounded-xl shadow-md">
                    ₹{tableReturnAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleSettleActiveTable}
                className="bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
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
                className="bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded-xl font-bold text-sm hover:bg-surface-container active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-outline" />
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
