import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import BillPreviewModal from '../components/BillPreviewModal';
import type { Order, MenuItem } from '../types';
import TopNavBar from '../components/TopNavBar';
import { 
  Clock,
  Printer, 
  TrendingDown, 
  CheckSquare2, 
  CheckCheck,
  Zap,
  History,
  FileSpreadsheet,
  FileText,
  Filter,
  Eye,
  Receipt
} from 'lucide-react';

export const Orders: React.FC = () => {
  const { orders, updateOrderStatus } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'PREPARING' | 'READY'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  // Filtering orders
  const filterBySearch = (list: typeof orders) => {
    return list.filter(o => {
      const matchesSearch = 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.tableId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items.some(i => i.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const pendingOrders = filterBySearch(orders.filter(o => o.status === 'PENDING'));
  const preparingOrders = filterBySearch(orders.filter(o => o.status === 'PREPARING'));
  const readyOrders = filterBySearch(orders.filter(o => o.status === 'READY'));
  const completedOrders = filterBySearch(orders.filter(o => o.status === 'COMPLETED'));

  const historyOrders = filterBySearch(orders);

  // Trigger universal bill preview modal
  const handleOpenBillPreview = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemsToPreview = order.items.map(i => ({ menuItem: i.menuItem, quantity: i.quantity }));
    setPreviewOrderData({
      tableId: order.tableId,
      tableName: `Table ${order.tableId}`,
      items: itemsToPreview,
      amount: order.amount,
      orderType: `Order #${order.id} • Table ${order.tableId}`
    });
    setShowBillPreview(true);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (historyOrders.length === 0) {
      alert('No orders available to export.');
      return;
    }
    const headers = ['Order ID', 'Table/Type', 'Status', 'Time', 'Elapsed (Mins)', 'Total Items', 'Items List', 'Amount (INR)'];
    const rows = historyOrders.map(o => [
      `"${o.id}"`,
      `"${o.tableId}"`,
      `"${o.status}"`,
      `"${o.time}"`,
      o.elapsedMinutes,
      o.items.reduce((sum, i) => sum + i.quantity, 0),
      `"${o.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join('; ')}"`,
      o.amount.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ServeFlow_Order_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export / Print as PDF
  const handleExportPDF = () => {
    if (historyOrders.length === 0) {
      alert('No orders available to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups for this site.');
      return;
    }

    const totalRevenue = historyOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalItemsCount = historyOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Order History Report - ServeFlow</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              margin: 30px;
              color: #1a1c1e;
              background: white;
            }
            .header-box {
              border-bottom: 3px solid #006c49;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .restaurant-title {
              font-size: 28px;
              font-weight: 800;
              color: #006c49;
              margin: 0;
            }
            .report-title {
              font-size: 16px;
              font-weight: 600;
              color: #535f70;
            }
            .stats-row {
              display: flex;
              gap: 20px;
              margin-bottom: 24px;
            }
            .stat-card {
              background: #f4f6f8;
              padding: 12px 20px;
              border-radius: 12px;
              border: 1px solid #dfe3e8;
              flex: 1;
            }
            .stat-label {
              font-size: 11px;
              text-transform: uppercase;
              color: #637381;
              font-weight: 700;
            }
            .stat-val {
              font-size: 22px;
              font-weight: 800;
              color: #006c49;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #dfe3e8;
              padding: 10px 14px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #f4f6f8;
              font-weight: 700;
              color: #212b36;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .status-badge {
              font-size: 11px;
              font-weight: 700;
              padding: 3px 8px;
              border-radius: 4px;
              display: inline-block;
            }
            .status-COMPLETED { background: #e6f4ea; color: #137333; }
            .status-PENDING { background: #fef7e0; color: #b06000; }
            .status-PREPARING { background: #e8f0fe; color: #1a73e8; }
            .status-READY { background: #fce8e6; color: #c5221f; }
            .footer {
              margin-top: 40px;
              font-size: 11px;
              color: #919eab;
              text-align: center;
              border-top: 1px solid #dfe3e8;
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <h1 class="restaurant-title">SERVEFLOW RESTAURANT MANAGEMENT</h1>
              <div class="report-title">Full Order History & Financial Report</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #637381;">
              <strong>Generated On:</strong> ${new Date().toLocaleString()}<br/>
              <strong>Total Orders:</strong> ${historyOrders.length}
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-label">Total Orders Exported</div>
              <div class="stat-val">${historyOrders.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Dishes Served</div>
              <div class="stat-val">${totalItemsCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Gross Revenue (INR)</div>
              <div class="stat-val">₹${totalRevenue.toFixed(2)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Table</th>
                <th>Time</th>
                <th>Status</th>
                <th>Items Ordered</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${historyOrders.map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>${o.tableId}</td>
                  <td>${o.time}</td>
                  <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                  <td>${o.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}</td>
                  <td style="text-align: right;"><strong>₹${o.amount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            ServeFlow AI Restaurant Management System • Confidential Floor Report • End of Document
          </div>

          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Navigation */}
      <TopNavBar title="Orders Console" onSearchChange={setSearchTerm} />

      {/* Main Content Area */}
      <main className="p-xl overflow-y-auto">
        <div className="max-w-[1440px] mx-auto space-y-lg">
          
          {/* Header & Section Tabs */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md border-b border-outline-variant/30 pb-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Order Management</h2>
              <p className="text-on-surface-variant font-body-md">Oversee live kitchen orders or browse complete order history.</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/40 shadow-sm">
              <button
                onClick={() => setActiveTab('LIVE')}
                className={`px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'LIVE'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Live Floor Orders ({pendingOrders.length + preparingOrders.length + readyOrders.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'HISTORY'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Order History ({orders.length})</span>
              </button>
            </div>
          </div>

          {/* ======================= TAB 1: LIVE ORDERS ======================= */}
          {activeTab === 'LIVE' && (
            <div className="space-y-lg animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-sm bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20">
                <div className="flex flex-wrap gap-sm">
                  <span className="px-4 py-1.5 bg-primary-container/20 text-primary border border-primary/30 rounded-full font-label-md flex items-center gap-2 text-xs font-bold">
                    Pending ({pendingOrders.length})
                  </span>
                  <span className="px-4 py-1.5 bg-sky-500/10 text-sky-700 border border-sky-400/30 rounded-full font-label-md flex items-center gap-2 text-xs font-bold">
                    Preparing ({preparingOrders.length})
                  </span>
                  <span className="px-4 py-1.5 bg-amber-500/10 text-amber-700 border border-amber-400/30 rounded-full font-label-md flex items-center gap-2 text-xs font-bold">
                    Ready ({readyOrders.length})
                  </span>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
                
                {/* Live Orders Column (8 Columns) */}
                <div className="xl:col-span-8 space-y-md">
                  <div className="flex items-center justify-between mb-sm">
                    <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm font-bold">
                      Active Kitchen Queue
                      <span className="bg-primary text-white text-[12px] px-2 py-0.5 rounded-full font-bold">
                        {pendingOrders.length + preparingOrders.length + readyOrders.length}
                      </span>
                    </h3>
                  </div>

                  {/* Bento Grid layout for active orders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    
                    {/* Pending List */}
                    {pendingOrders.map(order => {
                      const isLate = order.elapsedMinutes >= 20;
                      return (
                        <div 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className={`rounded-2xl border card-shadow p-5 flex flex-col gap-4 relative overflow-hidden cursor-pointer transition-all ${
                            isLate ? 'border-error border-2 bg-error/10 animate-pulse shadow-error/10 shadow-lg' : 'bg-white border-outline-variant hover:border-primary/50'
                          }`}
                        >
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${isLate ? 'bg-error' : 'bg-tertiary-container'}`}></div>
                          <div className="flex justify-between items-start pl-1">
                            <div>
                              <h4 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">Order #{order.id}</h4>
                              <p className="text-primary font-bold flex items-center gap-1 text-sm mt-0.5">
                                Table {order.tableId}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isLate ? 'bg-error text-white' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {order.status}
                              </span>
                              <span className={`text-xs mt-1 flex items-center gap-1 ${
                                isLate ? 'text-error font-extrabold' : 'text-outline-variant font-medium'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                {order.elapsedMinutes}m elapsed
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 py-3 border-y border-surface-container-highest pl-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-body-md text-sm">
                                <span className="text-on-surface font-medium">{item.quantity}x {item.menuItem.name}</span>
                                <span className="text-outline font-bold">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-auto pl-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                              className="flex-1 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all text-xs"
                            >
                              Start Preparing
                            </button>
                            <button 
                              onClick={(e) => handleOpenBillPreview(order, e)}
                              title="Print Universal Receipt"
                              className="p-2.5 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors text-primary"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Preparing List */}
                    {preparingOrders.map(order => {
                      const isLate = order.elapsedMinutes >= 20;
                      return (
                        <div 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className={`rounded-2xl border card-shadow p-5 flex flex-col gap-4 relative overflow-hidden cursor-pointer transition-all ${
                            isLate ? 'border-error border-2 bg-error/10 animate-pulse' : 'bg-white border-outline-variant hover:border-primary/50'
                          }`}
                        >
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${isLate ? 'bg-error' : 'bg-sky-500'}`}></div>
                          <div className="flex justify-between items-start pl-1">
                            <div>
                              <h4 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">Order #{order.id}</h4>
                              <p className="text-primary font-bold flex items-center gap-1 text-sm mt-0.5">
                                Table {order.tableId}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                {order.status}
                              </span>
                              <span className={`text-xs mt-1 flex items-center gap-1 ${
                                isLate ? 'text-error font-extrabold' : 'text-outline-variant font-medium'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                {order.elapsedMinutes}m elapsed
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 py-3 border-y border-surface-container-highest pl-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-body-md text-sm">
                                <span className="text-on-surface font-medium">{item.quantity}x {item.menuItem.name}</span>
                                <span className="text-outline font-bold">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-auto pl-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'READY')}
                              className="flex-1 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all text-xs"
                            >
                              Mark Ready
                            </button>
                            <button 
                              onClick={(e) => handleOpenBillPreview(order, e)}
                              title="Print Universal Receipt"
                              className="p-2.5 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors text-primary"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Ready List */}
                    {readyOrders.map(order => {
                      const isLate = order.elapsedMinutes >= 20;
                      return (
                        <div 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-2xl border card-shadow p-5 flex flex-col gap-4 relative overflow-hidden cursor-pointer transition-all bg-white border-outline-variant hover:border-primary/50"
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                          <div className="flex justify-between items-start pl-1">
                            <div>
                              <h4 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">Order #{order.id}</h4>
                              <p className="text-primary font-bold flex items-center gap-1 text-sm mt-0.5">
                                Table {order.tableId}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {order.status}
                              </span>
                              <span className={`text-xs mt-1 flex items-center gap-1 ${
                                isLate ? 'text-error font-extrabold' : 'text-outline-variant font-medium'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                {order.elapsedMinutes}m elapsed
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 py-3 border-y border-surface-container-highest pl-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-body-md text-sm">
                                <span className="text-on-surface font-medium">{item.quantity}x {item.menuItem.name}</span>
                                <span className="text-outline font-bold">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-auto pl-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                              className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all text-xs"
                            >
                              Serve & Complete
                            </button>
                            <button 
                              onClick={(e) => handleOpenBillPreview(order, e)}
                              title="Print Universal Receipt"
                              className="p-2.5 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors text-primary"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty State */}
                    {pendingOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0 && (
                      <div className="col-span-2 bg-white rounded-3xl border border-outline-variant/30 p-12 text-center text-on-surface-variant flex flex-col items-center justify-center min-h-[300px]">
                        <CheckSquare2 className="w-14 h-14 text-outline mb-3" />
                        <h4 className="font-headline-sm font-bold text-lg text-on-surface">No active orders</h4>
                        <p className="text-xs mt-1 max-w-sm">All kitchen queue orders have been successfully prepared and served!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed Orders Column (4 Columns) */}
                <div className="xl:col-span-4 space-y-md">
                  <div className="flex items-center justify-between mb-sm">
                    <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm text-on-surface-variant font-bold">
                      Recently Completed
                      <span className="bg-surface-container-highest text-on-surface-variant text-[12px] px-2 py-0.5 rounded-full font-bold">
                        {completedOrders.length} Today
                      </span>
                    </h3>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {completedOrders.map(order => (
                      <div 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-3 p-3 bg-white hover:bg-surface-container-highest rounded-xl transition-colors cursor-pointer group shadow-sm border border-outline-variant/20"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                          <CheckCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-on-surface text-sm">#{order.id} • Table {order.tableId}</span>
                            <span className="text-[10px] text-outline font-semibold">{order.time}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">
                            {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-1">
                          <p className="font-extrabold text-on-surface text-sm">₹{order.amount.toFixed(2)}</p>
                          <p className="text-[9px] text-emerald-600 uppercase font-black">Paid</p>
                        </div>
                      </div>
                    ))}
                    {completedOrders.length === 0 && (
                      <p className="text-center text-xs text-on-surface-variant py-8">No orders completed yet during this shift.</p>
                    )}
                  </div>

                  {/* Efficiency Card */}
                  <div className="bg-primary text-white rounded-2xl p-6 relative overflow-hidden card-shadow">
                    <div className="relative z-10">
                      <p className="text-primary-fixed font-label-md uppercase tracking-widest opacity-80 text-xs font-bold">Floor Efficiency</p>
                      <h4 className="text-display font-display mt-1 font-black text-4xl">18.4m</h4>
                      <p className="text-body-sm text-primary-fixed-dim mt-1.5 flex items-center gap-1 text-xs font-medium">
                        <TrendingDown className="w-4 h-4" />
                        2.4m faster avg preparation speed
                      </p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <Zap className="w-28 h-28" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================= TAB 2: ORDER HISTORY (ALL ORDERS + EXPORT) ======================= */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Controls Bar: Filters and Export Buttons */}
              <div className="bg-white p-5 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-on-surface">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-transparent text-xs font-bold text-primary outline-none cursor-pointer pr-2"
                    >
                      <option value="ALL">All Statuses ({orders.length})</option>
                      <option value="COMPLETED">Completed ({orders.filter(o => o.status === 'COMPLETED').length})</option>
                      <option value="READY">Ready ({orders.filter(o => o.status === 'READY').length})</option>
                      <option value="PREPARING">Preparing ({orders.filter(o => o.status === 'PREPARING').length})</option>
                      <option value="PENDING">Pending ({orders.filter(o => o.status === 'PENDING').length})</option>
                    </select>
                  </div>
                </div>

                {/* Export Buttons: Excel & PDF */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel (.csv)</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Print PDF Report</span>
                  </button>
                </div>
              </div>

              {/* Comprehensive Order History Table */}
              <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/30 text-[11px] uppercase tracking-wider text-on-surface-variant font-extrabold">
                        <th className="py-4 px-6">Order ID</th>
                        <th className="py-4 px-6">Table / Type</th>
                        <th className="py-4 px-6">Date & Time</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Items Summary</th>
                        <th className="py-4 px-6 text-right">Total Amount</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-xs font-medium text-on-surface">
                      {historyOrders.map(order => (
                        <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="py-4 px-6 font-extrabold text-primary">
                            #{order.id}
                          </td>
                          <td className="py-4 px-6 font-bold">
                            Table {order.tableId}
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant">
                            {order.time || 'Today'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'READY' ? 'bg-amber-100 text-amber-800' :
                              order.status === 'PREPARING' ? 'bg-sky-100 text-sky-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 max-w-xs truncate text-on-surface-variant">
                            {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                          </td>
                          <td className="py-4 px-6 text-right font-black text-sm text-on-surface">
                            ₹{order.amount.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                title="View details"
                                className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleOpenBillPreview(order, e)}
                                title="Print Universal Bill Preview"
                                className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {historyOrders.length === 0 && (
                  <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center">
                    <History className="w-12 h-12 text-outline mb-3 opacity-50" />
                    <h4 className="font-bold text-sm">No history orders found</h4>
                    <p className="text-xs mt-1">Try resetting the search query or status filters.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

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

      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
};
export default Orders;
