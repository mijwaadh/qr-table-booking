import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import BillPreviewModal from '../components/BillPreviewModal';
import type { Order, MenuItem } from '../types';
import TopNavBar from '../components/TopNavBar';
import { 
  Clock,
  CheckSquare2, 
  Zap,
  History,
  FileSpreadsheet,
  FileText,
  Filter,
  Eye,
  Receipt,
  ChevronDown,
  Utensils,
  X,
  RefreshCw
} from 'lucide-react';
import { playItemTapSound, playNewOrderSound, playBilledSound } from '../utils/audioAlerts';

export const Orders: React.FC = () => {
  const { orders, updateOrderStatus } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Bill Preview Modal State
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [previewOrderData, setPreviewOrderData] = useState<{
    tableId: string;
    tableName?: string;
    items: { menuItem: MenuItem; quantity: number }[];
    amount?: number;
    orderType?: string;
    customerName?: string;
    orderId?: string;
  } | null>(null);

  // KDS UI & Notification State
  const [showBumpOrders, setShowBumpOrders] = useState(false);
  const [activeStateDropdown, setActiveStateDropdown] = useState<string | null>(null);
  const [bumpedOrderIds, setBumpedOrderIds] = useState<string[]>([]);
  const [kdsToast, setKdsToast] = useState<string | null>(null);

  const triggerKdsToast = (msg: string) => {
    setKdsToast(msg);
    setTimeout(() => setKdsToast(null), 4500);
  };

  const filterBySearch = (list: Order[]) => {
    return list.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tableId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(i => i.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const pendingOrders = filterBySearch(orders.filter(o => o.status === 'PENDING'));
  const preparingOrders = filterBySearch(orders.filter(o => o.status === 'PREPARING'));
  const readyOrders = filterBySearch(orders.filter(o => o.status === 'READY'));

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
      <TopNavBar title="Orders Console" onSearchChange={setSearchQuery} />

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

          {/* ======================= TAB 1: LIVE ORDERS (KDS VIEW) ======================= */}
          {activeTab === 'LIVE' && (
            <div className="space-y-6 animate-fadeIn pb-12">
              {/* Top Control Bar matching MBill KDS screenshot exactly */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm font-extrabold text-gray-800 select-none hover:text-black transition-colors">
                    <input 
                      type="checkbox"
                      checked={showBumpOrders}
                      onChange={(e) => setShowBumpOrders(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span>Show bump orders</span>
                  </label>

                  <button 
                    onClick={() => {
                      playItemTapSound();
                      triggerKdsToast('KDS live queue refreshed from server');
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 active:scale-95 transition-all text-sm font-extrabold text-gray-800 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                    <span>Refresh</span>
                  </button>

                  <button 
                    onClick={() => {
                      const pending = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
                      if (pending.length === 0) return;
                      if (confirm(`Mark all ${pending.length} active KOT orders as Served?`)) {
                        pending.forEach(o => updateOrderStatus(o.id, 'COMPLETED'));
                        playBilledSound();
                        triggerKdsToast('All KOT orders settled & marked as served.');
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 active:scale-95 transition-all text-sm font-extrabold text-gray-800 shadow-sm"
                  >
                    Settle All
                  </button>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200 font-extrabold text-sm text-gray-800">
                  <span>Total pending KOT&apos;s :</span>
                  <span className="w-6 h-6 rounded-full bg-red-500 text-white font-black text-xs inline-flex items-center justify-center shadow-sm">
                    {orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && !bumpedOrderIds.includes(o.id)).length}
                  </span>
                </div>
              </div>

              {/* Bento Grid KOT Cards matching KDS screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {orders
                  .filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
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
                          className="p-4 divide-y divide-gray-100 cursor-pointer min-h-[130px] flex flex-col justify-center space-y-1"
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
                            <span>{order.elapsedMinutes === 0 ? 'Just Placed' : `${order.elapsedMinutes}m ago`}</span>
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
                                      playNewOrderSound();
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

                {orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && (showBumpOrders || !bumpedOrderIds.includes(o.id))).length === 0 && (
                  <div className="col-span-full bg-white rounded-3xl border border-gray-200 p-16 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
                    <CheckSquare2 className="w-14 h-14 text-gray-300 mb-3 animate-bounce" />
                    <h4 className="font-headline-sm font-black text-xl text-gray-900">No active KOT orders</h4>
                    <p className="text-xs mt-1 text-gray-500 max-w-sm">All KOT orders have been prepared or served! New mobile customer orders will appear here automatically.</p>
                  </div>
                )}
              </div>

              {/* Universal Notification Toast Banner matching screenshot exactly */}
              {kdsToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
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
