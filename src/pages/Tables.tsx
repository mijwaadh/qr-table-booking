import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import { 
  Users, 
  Clock, 
  Receipt, 
  QrCode, 
  PlusCircle, 
  Plus
} from 'lucide-react';

export const Tables: React.FC = () => {
  const { tables, settleBill, addTable } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState<{ id: string; name: string } | null>(null);

  const handleShowQRModal = (id: string, name: string) => {
    setSelectedTableForQR({ id, name });
    setShowQRModal(true);
  };

  const handlePrintQR = (tableId: string, tableName: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups for this site.');
      return;
    }
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/order-now?table=${tableId}`)}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${tableName}</title>
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
            .subtitle {
              font-size: 10px;
              font-weight: 600;
              color: #5d5e66;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .qr-container {
              background: white;
              padding: 10px;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
              border: 1px solid rgba(0,108,73,0.15);
              width: 150px;
              height: 150px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
            }
            .table-number {
              font-size: 24px;
              font-weight: 900;
              color: #1a1c1e;
              margin: 10px 0;
            }
            .footer {
              font-size: 9px;
              color: #5d5e66;
              line-height: 1.4;
              margin-bottom: 10px;
              max-width: 90%;
            }
            @media print {
              .qr-card {
                border: none;
                border-radius: 0;
                width: 100%;
                height: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="header">SERVEFLOW DEMO RESTAURANT</div>
            <div class="subtitle">SCAN & ORDER</div>
            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR code" />
            </div>
            <div class="table-number">${tableName}</div>
            <div class="footer">Scan with your phone camera to order directly from your table.</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Form states for adding table
  const [tableName, setTableName] = useState('');
  const [tableSeats, setTableSeats] = useState(4);

  // Calculations
  const totalTables = tables.length;
  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const pendingCount = tables.filter(t => t.status === 'PAYMENT_PENDING').length;

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSettle = (tableId: string) => {
    settleBill(tableId);
    alert(`Table ${tableId} bill settled. The table is now Available.`);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName) return;
    
    addTable(tableName, tableSeats);
    setShowAddModal(false);
    setTableName('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Navigation */}
      <TopNavBar title="Tables Console" onSearchChange={setSearchTerm} />

      {/* Content Workspace */}
      <div className="p-xl max-w-[1440px] mx-auto w-full space-y-xl">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Tables Management</h2>
            <p className="text-body-md text-on-surface-variant">Oversee real-time table status and floor activity.</p>
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
            <span className="font-headline-md text-headline-md text-primary font-bold">{availableCount}</span>
          </div>
          <div className="level-2-card p-md rounded-xl bg-white flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-tighter text-xs font-semibold">Occupied</span>
            <span className="font-headline-md text-headline-md text-secondary font-bold">{occupiedCount}</span>
          </div>
          <div className="level-2-card p-md rounded-xl bg-white flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-tighter text-xs font-semibold">Pending</span>
            <span className="font-headline-md text-headline-md text-tertiary font-bold">{pendingCount}</span>
          </div>
        </div>

        {/* Floor Layout Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {filteredTables.map((table) => (
            <div 
              key={table.id} 
              className={`level-2-card rounded-[16px] bg-white overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl group border ${
                table.status === 'PAYMENT_PENDING' ? 'border-tertiary/20' : 'border-outline-variant/30'
              }`}
            >
              {/* Card Header */}
              <div className="p-lg flex justify-between items-start border-b border-gray-50">
                <div className="flex flex-col">
                  <span className={`text-5xl leading-none font-extrabold transition-colors ${
                    table.status === 'AVAILABLE' ? 'text-primary/10 group-hover:text-primary/25' :
                    table.status === 'OCCUPIED' ? 'text-secondary/10 group-hover:text-secondary/25' :
                    'text-tertiary/10 group-hover:text-tertiary/25'
                  }`}>{table.id}</span>
                  <span className="font-headline-sm text-headline-sm -mt-5 font-bold">{table.name}</span>
                </div>
                <span className={`px-md py-1 text-label-sm rounded-full font-bold flex items-center gap-xs text-xs ${
                  table.status === 'AVAILABLE' ? 'bg-primary/10 text-primary' :
                  table.status === 'OCCUPIED' ? 'bg-secondary/10 text-secondary' :
                  'bg-tertiary/10 text-tertiary'
                }`}>
                  {table.status === 'AVAILABLE' && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>}
                  {table.status === 'OCCUPIED' && <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>}
                  {table.status === 'PAYMENT_PENDING' && <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce"></span>}
                  {table.status === 'AVAILABLE' ? 'Available' : table.status === 'OCCUPIED' ? 'Occupied' : 'Pending Bill'}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-lg space-y-md">
                {table.status === 'AVAILABLE' ? (
                  <div className="flex items-center gap-sm text-on-surface-variant text-sm">
                    <Users className="w-4 h-4" />
                    <span>{table.seats} Seats</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-on-surface-variant text-sm">
                    <div className="flex items-center gap-xs">
                      <Clock className="w-4 h-4" />
                      <span>{table.elapsedMinutes} mins</span>
                    </div>
                    {table.amount && (
                      <div className="flex items-center gap-xs font-semibold">
                        <Receipt className="w-4 h-4" />
                        <span>${table.amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex flex-col gap-sm pt-md">
                  {table.status === 'PAYMENT_PENDING' ? (
                    <button 
                      onClick={() => handleSettle(table.id)}
                      className="w-full py-2.5 rounded-lg bg-tertiary text-on-tertiary font-semibold text-sm hover:bg-tertiary/90 shadow-md transition-all"
                    >
                      Settle Bill
                    </button>
                  ) : table.status === 'OCCUPIED' ? (
                    <button 
                      onClick={() => alert(`Showing active order for ${table.name}`)}
                      className="w-full py-2.5 rounded-lg bg-secondary text-on-secondary font-semibold text-sm hover:bg-secondary/90 shadow-sm transition-all"
                    >
                      View Order
                    </button>
                  ) : (
                    <button 
                      onClick={() => alert(`Booking details for ${table.name}`)}
                      className="w-full py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-all font-medium text-sm"
                    >
                      View Details
                    </button>
                  )}
                   <button 
                    onClick={() => handleShowQRModal(table.id, table.name)}
                    className="w-full py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface-variant flex items-center justify-center gap-sm hover:text-primary transition-all text-sm font-medium"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generate QR</span>
                  </button>
                </div>
              </div>

            </div>
          ))}

          {/* Quick Add Bento box */}
          <div 
            onClick={() => setShowAddModal(true)}
            className="rounded-[16px] border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-xl group min-h-[280px]"
          >
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-md group-hover:bg-primary/10 transition-colors">
              <PlusCircle className="w-8 h-8 text-outline group-hover:text-primary transition-colors" />
            </div>
            <span className="font-headline-sm text-on-surface-variant group-hover:text-primary transition-colors font-bold">Quick Add Table</span>
            <p className="text-label-sm text-on-surface-variant text-center mt-xs text-xs">Define seats & position</p>
          </div>
        </div>

      </div>

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
            
            {/* Beautiful Printable Card Layout */}
            <div className="bg-surface-container-low p-xl rounded-2xl border-2 border-outline-variant/30 flex flex-col items-center w-full shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <span className="font-headline-sm text-headline-sm font-extrabold text-primary tracking-wide mb-xs">SERVEFLOW DEMO RESTAURANT</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mb-md font-semibold tracking-wider">SCAN & ORDER</span>
              
              {/* QR Image */}
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

      <footer className="mt-auto py-lg px-xl text-label-sm text-on-surface-variant/60 flex justify-between text-xs">
        <span>ServeFlow v2.4.1</span>
        <span>System Status: Optimal</span>
      </footer>
    </div>
  );
};
export default Tables;
