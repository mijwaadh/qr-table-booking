import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import { 
  IndianRupee, 
  TrendingUp, 
  Receipt, 
  Table2, 
  AlertCircle, 
  MoreHorizontal, 
  QrCode, 
  PlusCircle, 
  BellRing
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { tables, orders } = useRestaurant();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState('T04');

  // Calculate metrics dynamically from live orders
  const activeOrdersCount = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;
  const occupiedTablesCount = tables.filter(t => t.status === 'OCCUPIED' || t.status === 'PAYMENT_PENDING').length;
  const totalTablesCount = tables.length;
  const completedTodayCount = orders.filter(o => o.status === 'COMPLETED').length;
  
  const todaysSales = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.amount, 0);

  // Filter recent orders based on search
  const filteredOrders = orders
    .filter(order => {
      const matchSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tableId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(i => i.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    })
    .slice(0, 5); // top 5 recent orders

  const handleBroadcastAlert = () => {
    alert('Broadcast Alert: Notification sent to all kitchen staff stations.');
  };

  const handleGenerateQR = () => {
    setShowQRModal(true);
  };

  const handlePrintQR = (tableId: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups for this site.');
      return;
    }
    const tableName = tables.find(t => t.id === tableId)?.name || `Table ${tableId.replace(/^T0?/, '')}`;
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

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Navigation */}
      <TopNavBar title="Service Dashboard" onSearchChange={setSearchTerm} />

      {/* Main Content */}
      <main className="p-xl overflow-y-auto">
        <div className="max-w-[1440px] mx-auto space-y-xl">
          
          {/* Welcome Section */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Service Dashboard</h2>
              <p className="font-body-md text-on-surface-variant">Live metrics for Demo Operations</p>
            </div>
            <div className="flex items-center gap-md">
              <span className="inline-flex items-center gap-xs px-md py-sm rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Live System
              </span>
            </div>
          </div>

          {/* 4 Metric Cards Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            {/* Today's Sales */}
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-md text-on-surface-variant mb-xs">Today's Sales</p>
                  <h3 className="font-headline-md text-headline-md">₹{todaysSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-sm rounded-lg bg-primary-container/10 text-primary">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-md flex items-center gap-sm">
                <span className="text-primary font-label-sm flex items-center">
                  <TrendingUp className="w-4 h-4 mr-0.5" />
                  +12.4%
                </span>
                <div className="flex-1 h-8">
                  <svg className="w-full h-full" viewBox="0 0 100 30">
                    <path d="M0,25 Q10,15 20,20 T40,10 T60,18 T80,5 T100,12" fill="none" stroke="#006c49" strokeWidth="2"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Today's Orders */}
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-md text-on-surface-variant mb-xs">Today's Orders</p>
                  <h3 className="font-headline-md text-headline-md">{completedTodayCount}</h3>
                </div>
                <div className="p-sm rounded-lg bg-secondary-container/10 text-secondary">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-md">
                <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="mt-xs text-[10px] text-on-surface-variant">85% of daily target reached</p>
              </div>
            </div>

            {/* Occupied Tables */}
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-md text-on-surface-variant mb-xs">Occupied Tables</p>
                  <h3 className="font-headline-md text-headline-md">{occupiedTablesCount}/{totalTablesCount}</h3>
                </div>
                <div className="p-sm rounded-lg bg-primary-container/10 text-primary">
                  <Table2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-md flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">T02</div>
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold">T03</div>
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold">T05</div>
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">T08</div>
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-outline-variant text-on-surface flex items-center justify-center text-[10px] font-bold">+{occupiedTablesCount - 4 > 0 ? occupiedTablesCount - 4 : 0}</div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-md text-on-surface-variant mb-xs">Pending Orders</p>
                  <h3 className="font-headline-md text-headline-md">{activeOrdersCount}</h3>
                </div>
                <div className="p-sm rounded-lg bg-tertiary-container/10 text-tertiary">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-md flex items-center gap-sm">
                <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-wider">High Volume</span>
                <p className="text-[10px] text-on-surface-variant">Avg. wait: 14 mins</p>
              </div>
            </div>
          </div>

          {/* Main Grid: Tables and Sidebar */}
          <div className="grid grid-cols-12 gap-lg">
            {/* Recent Orders Table */}
            <div className="col-span-12 lg:col-span-9 bg-white rounded-xl card-shadow border border-outline-variant/30 overflow-hidden">
              <div className="px-lg py-md border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Orders</h3>
                <button onClick={() => navigate('/orders')} className="text-primary font-label-md hover:underline font-semibold">View All Orders</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low font-label-sm text-on-surface-variant border-b border-outline-variant/20">
                    <tr>
                      <th className="px-lg py-md font-semibold">Table</th>
                      <th className="px-lg py-md font-semibold">Order ID</th>
                      <th className="px-lg py-md font-semibold">Amount</th>
                      <th className="px-lg py-md font-semibold">Status</th>
                      <th className="px-lg py-md font-semibold">Time</th>
                      <th className="px-lg py-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md divide-y divide-outline-variant/10">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-container-low transition-colors duration-150">
                        <td className="px-lg py-md font-semibold">{order.tableId}</td>
                        <td className="px-lg py-md text-on-surface-variant">#{order.id}</td>
                        <td className="px-lg py-md">₹{order.amount.toFixed(2)}</td>
                        <td className="px-lg py-md">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'PREPARING' ? 'status-preparing' : 
                            order.status === 'PENDING' ? 'status-pending' : 
                            order.status === 'READY' ? 'bg-primary/20 text-primary' : 
                            'status-completed'
                          }`}>
                            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-lg py-md text-on-surface-variant">{order.time}</td>
                        <td className="px-lg py-md text-right">
                          <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-outline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant">
                          No recent orders found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Sidebar Section */}
            <div className="col-span-12 lg:col-span-3 space-y-lg">
              <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Quick Actions</h3>
                <div className="space-y-md">
                  <button 
                    onClick={handleGenerateQR}
                    className="w-full flex items-center gap-md p-md bg-surface border border-outline-variant/40 rounded-xl hover:border-primary/40 hover:bg-primary-container/5 transition-all group"
                  >
                    <div className="p-sm bg-primary-container/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-label-md text-on-surface font-semibold">Generate QR Codes</p>
                      <p className="text-[10px] text-on-surface-variant">For new tables or menus</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => navigate('/menu')}
                    className="w-full flex items-center gap-md p-md bg-surface border border-outline-variant/40 rounded-xl hover:border-primary/40 hover:bg-primary-container/5 transition-all group"
                  >
                    <div className="p-sm bg-secondary-container/10 text-secondary rounded-lg group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-label-md text-on-surface font-semibold">Add Menu Item</p>
                      <p className="text-[10px] text-on-surface-variant">Update seasonal offerings</p>
                    </div>
                  </button>

                  <button 
                    onClick={handleBroadcastAlert}
                    className="w-full flex items-center gap-md p-md bg-surface border border-outline-variant/40 rounded-xl hover:border-primary/40 hover:bg-primary-container/5 transition-all group"
                  >
                    <div className="p-sm bg-tertiary-container/10 text-tertiary rounded-lg group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-label-md text-on-surface font-semibold">Broadcast Alert</p>
                      <p className="text-[10px] text-on-surface-variant">Notify all kitchen staff</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* System Health / Ad Component */}
              <div className="relative overflow-hidden bg-inverse-surface text-inverse-on-surface p-lg rounded-xl card-shadow">
                <div className="relative z-10">
                  <h4 className="font-label-md font-bold mb-xs text-white">Premium Support</h4>
                  <p className="text-xs text-white/80 mb-md">Get 24/7 dedicated assistance for your peak service hours.</p>
                  <button className="w-full py-2 bg-primary-fixed text-on-primary-fixed rounded-lg font-label-sm hover:opacity-90 transition-opacity font-semibold">Contact Expert</button>
                </div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary rounded-full opacity-20 blur-2xl"></div>
              </div>
            </div>
          </div>

          {/* Footer / Status Info */}
          <div className="pt-xl border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-md opacity-60">
            <p className="text-[12px]">© 2024 ServeFlow Management Inc. All rights reserved.</p>
            <div className="flex items-center gap-lg text-[12px]">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-primary transition-colors" href="#">Support Center</a>
            </div>
          </div>

        </div>
      </main>

      {/* Dashboard Table QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-md">
          <div className="bg-white rounded-3xl p-xl w-full max-w-sm shadow-2xl flex flex-col items-center">
            <h3 className="font-headline-md text-headline-md font-bold mb-xs text-center">Table QR Code</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-lg">Scan to view menu & order directly</p>
            
            {/* Table Dropdown selector */}
            <div className="w-full mb-md">
              <label className="font-label-sm text-on-surface font-semibold text-xs mb-xs block">Select Table</label>
              <select 
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-bright outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
              >
                {tables.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                ))}
              </select>
            </div>

            {/* Beautiful Printable Card Layout */}
            <div className="bg-surface-container-low p-xl rounded-2xl border-2 border-outline-variant/30 flex flex-col items-center w-full shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <span className="font-headline-sm text-headline-sm font-extrabold text-primary tracking-wide mb-xs">SERVEFLOW DEMO RESTAURANT</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mb-md font-semibold tracking-wider">SCAN & ORDER</span>
              
              {/* QR Image */}
              <div className="bg-white p-md rounded-xl shadow-md border border-outline-variant/20 flex items-center justify-center mb-md w-48 h-48">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/order-now?table=${selectedTableId}`)}`}
                  alt={`QR Code for ${selectedTableId}`}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <span className="font-headline-md text-headline-md font-black text-on-surface mb-xs">
                {tables.find(t => t.id === selectedTableId)?.name || `Table ${selectedTableId.replace(/^T0?/, '')}`}
              </span>
              <span className="text-[12px] text-primary hover:underline font-semibold text-center select-all cursor-pointer truncate max-w-full">
                <a href={`/order-now?table=${selectedTableId}`} target="_blank" rel="noopener noreferrer">
                  Open Ordering Link
                </a>
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-md w-full mt-lg">
              <button 
                onClick={() => handlePrintQR(selectedTableId)}
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
    </div>
  );
};
export default Dashboard;
