import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title as ChartTitle, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Doughnut, Bar as BarChart } from 'react-chartjs-2';
import TopNavBar from '../components/TopNavBar';
import { useRestaurant } from '../contexts/RestaurantContext';
import { 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  Calendar,
  Sparkles,
  TrendingDown,
  FileSpreadsheet,
  Printer,
  FileText,
  RefreshCw,
  Search,
  BarChart3,
  Table as TableIcon
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export type ReportTab = 
  | 'sales' 
  | 'todays' 
  | 'items' 
  | 'payment' 
  | 'tax' 
  | 'order' 
  | 'category' 
  | 'kitchen';

export const Reports: React.FC = () => {
  const { orders } = useRestaurant();
  const [viewMode, setViewMode] = useState<'POS_TABLE' | 'CHARTS'>('POS_TABLE');
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  
  // Date & Filter States
  const [dateRangeStr, setDateRangeStr] = useState('30 April 2024 12:00 AM - 30 April 2024 11:59 PM');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [billStatusFilter, setBillStatusFilter] = useState('All');
  const [terminalFilter, setTerminalFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [isFetching, setIsFetching] = useState(false);

  // Charts view state
  const [filter, setFilter] = useState<'today' | 'weekly' | 'monthly'>('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  const rawApiUrl = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api').trim().replace(/\/$/, '');
  const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reports/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch reports stats:", e);
      }
    };
    fetchStats();
  }, [orders]);

  // Mock POS Bills data matching user screenshot + live orders integrated
  const basePOSBills = [
    { billNo: 1, table: 'Table1', date: '30 April 2024 10:10 AM', amount: 201.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Dine-In', payment: 'Cash', username: 'admin' },
    { billNo: 2, table: 'Table2', date: '30 April 2024 10:10 AM', amount: 26.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Dine-In', payment: 'Cash', username: 'admin' },
    { billNo: 3, table: 'Quick Bill', date: '30 April 2024 10:10 AM', amount: 181.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Quick Bill', payment: 'GooglePay', username: 'admin' },
    { billNo: 4, table: 'Quick Bill', date: '30 April 2024 10:11 AM', amount: 410.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Quick Bill', payment: 'Paytm', username: 'admin' },
    { billNo: 5, table: 'Quick Bill', date: '30 April 2024 10:11 AM', amount: 610.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Quick Bill', payment: 'UberEats', username: 'admin' },
    { billNo: 6, table: 'tata', date: '30 April 2024 12:21 PM', amount: 1230.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Takeaway', payment: 'Card', username: 'admin' },
    { billNo: 7, table: 'birla', date: '30 April 2024 12:22 PM', amount: 210.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Takeaway', payment: 'Paytm', username: 'admin' },
    { billNo: 8, table: 'Table2', date: '30 April 2024 12:22 PM', amount: 595.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Dine-In', payment: 'Cash', username: 'admin' },
    { billNo: 9, table: 'Table2', date: '30 April 2024 12:24 PM', amount: 595.00, discount: 0.00, discountReason: '', tax: 0.00, type: 'Dine-In', payment: 'Cash', username: 'admin' },
  ];

  // Merge live orders into POS table rows
  const livePOSBills = orders.map((o, idx) => ({
    billNo: 10 + idx,
    table: o.tableId,
    date: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${o.time || '1:15 PM'}`,
    amount: o.amount,
    discount: 0.00,
    discountReason: '',
    tax: o.amount * 0.05,
    type: o.tableId.includes('Take') || o.tableId.includes('Parcel') ? 'Takeaway' : 'Dine-In',
    payment: idx % 2 === 0 ? 'Cash' : 'GooglePay',
    username: 'admin'
  }));

  const combinedPOSBills = activeTab === 'todays' ? livePOSBills.length > 0 ? livePOSBills : basePOSBills.slice(0, 5) : [...basePOSBills, ...livePOSBills];

  // Filtered Bills based on Search & Dropdowns
  const filteredPOSBills = combinedPOSBills.filter(bill => {
    const matchesSearch = 
      bill.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.payment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.billNo.toString().includes(searchQuery);
    
    const matchesType = orderTypeFilter === 'All' || bill.type === orderTypeFilter;
    const matchesUser = userFilter === 'All' || bill.username === userFilter;
    const matchesDelivery = deliveryFilter === 'All' || (deliveryFilter === 'None' && !['UberEats', 'Zomato', 'Swiggy'].includes(bill.payment)) || bill.payment === deliveryFilter;
    
    return matchesSearch && matchesType && matchesUser && matchesDelivery;
  });

  const totalPOSAmount = filteredPOSBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPOSDiscount = filteredPOSBills.reduce((sum, b) => sum + b.discount, 0);
  const totalPOSTax = filteredPOSBills.reduce((sum, b) => sum + b.tax, 0);

  // Mock data for other specific tabs
  const itemsReportData = [
    { code: 'IT-101', name: 'Special Deluxe Thali', category: 'Main Course', qty: 45, rate: 250.00, total: 11250.00, share: '24.5%' },
    { code: 'IT-102', name: 'Butter Chicken Masala', category: 'Main Course', qty: 38, rate: 320.00, total: 12160.00, share: '26.4%' },
    { code: 'IT-103', name: 'Paneer Tikka Kebab', category: 'Starters', qty: 52, rate: 210.00, total: 10920.00, share: '23.8%' },
    { code: 'IT-104', name: 'Virgin Mojito (Large)', category: 'Beverages', qty: 84, rate: 90.00, total: 7560.00, share: '16.4%' },
    { code: 'IT-105', name: 'Sizzling Brownie with Ice Cream', category: 'Desserts', qty: 22, rate: 180.00, total: 3960.00, share: '8.6%' },
  ];

  const paymentReportData = [
    { from: 'Card', amount: 1760.00, count: 2, status: 'fulfilled' },
    { from: 'Cash', amount: 7622.00, count: 12, status: 'fulfilled' },
    { from: 'GooglePay', amount: 181.00, count: 1, status: 'fulfilled' },
    { from: 'Paytm', amount: 620.00, count: 2, status: 'fulfilled' },
    { from: 'UberEats', amount: 610.00, count: 1, status: 'fulfilled' },
  ];

  const taxReportData = filteredPOSBills.map(b => ({
    billNo: b.billNo,
    table: b.table,
    taxable: (b.amount / 1.05).toFixed(2),
    cgst: ((b.amount / 1.05) * 0.025).toFixed(2),
    sgst: ((b.amount / 1.05) * 0.025).toFixed(2),
    totalGst: (b.amount - (b.amount / 1.05)).toFixed(2),
    status: 'Filed / Paid'
  }));

  const categoryReportData = [
    { category: 'Main Course', totalQty: 185, revenue: 48500.00, topItem: 'Butter Chicken Masala', margin: '68%' },
    { category: 'Starters & Appetizers', totalQty: 142, revenue: 26800.00, topItem: 'Paneer Tikka Kebab', margin: '72%' },
    { category: 'Beverages & Drinks', totalQty: 210, revenue: 16500.00, topItem: 'Virgin Mojito', margin: '84%' },
    { category: 'Desserts & Sweets', totalQty: 68, revenue: 9800.00, topItem: 'Sizzling Brownie', margin: '76%' },
  ];

  const kitchenReportData = [
    { station: 'Main Curry Station (North Indian)', orders: 94, avgPrep: '14.2 mins', onTimeRate: '96%', delayed: 4, status: 'Optimal' },
    { station: 'Tandoor & Grill Station', orders: 82, avgPrep: '16.5 mins', onTimeRate: '92%', delayed: 7, status: 'High Load' },
    { station: 'Beverages & Mocktail Bar', orders: 145, avgPrep: '4.5 mins', onTimeRate: '99%', delayed: 1, status: 'Optimal' },
    { station: 'Desserts & Pantry Station', orders: 48, avgPrep: '6.0 mins', onTimeRate: '98%', delayed: 1, status: 'Optimal' },
  ];

  const handleFetch = () => {
    setIsFetching(true);
    setTimeout(() => {
      setIsFetching(false);
    }, 450);
  };

  const handleClearSelection = () => {
    setSearchQuery('');
    setOrderTypeFilter('All');
    setBillStatusFilter('All');
    setTerminalFilter('All');
    setUserFilter('All');
    setDeliveryFilter('All');
  };

  // Export to Excel / CSV
  const handleExportPOSExcel = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `ServeFlow_POS_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'sales' || activeTab === 'todays' || activeTab === 'order') {
      headers = ['Bill No', 'Table', 'Date', 'Amount', 'Discount', 'Discount Reason', 'Tax', 'Type', 'Payment', 'Username'];
      rows = filteredPOSBills.map(b => [b.billNo, `"${b.table}"`, `"${b.date}"`, b.amount.toFixed(2), b.discount.toFixed(2), `"${b.discountReason}"`, b.tax.toFixed(2), `"${b.type}"`, `"${b.payment}"`, `"${b.username}"`]);
    } else if (activeTab === 'items') {
      headers = ['Item Code', 'Item Name', 'Category', 'Qty Sold', 'Avg Rate', 'Total Amount', '% Share'];
      rows = itemsReportData.map(i => [i.code, `"${i.name}"`, `"${i.category}"`, i.qty, i.rate.toFixed(2), i.total.toFixed(2), `"${i.share}"`]);
    } else if (activeTab === 'payment') {
      headers = ['Payment From', 'Amount', 'Count', 'Status'];
      rows = paymentReportData.map(p => [`"${p.from}"`, p.amount.toFixed(2), p.count, `"${p.status}"`]);
    } else if (activeTab === 'tax') {
      headers = ['Bill No', 'Table', 'Taxable Value', 'CGST (2.5%)', 'SGST (2.5%)', 'Total GST', 'Status'];
      rows = taxReportData.map(t => [t.billNo, `"${t.table}"`, t.taxable, t.cgst, t.sgst, t.totalGst, `"${t.status}"`]);
    } else if (activeTab === 'category') {
      headers = ['Category', 'Total Qty Sold', 'Total Revenue', 'Top Selling Item', 'Profit Margin'];
      rows = categoryReportData.map(c => [`"${c.category}"`, c.totalQty, c.revenue.toFixed(2), `"${c.topItem}"`, `"${c.margin}"`]);
    } else {
      headers = ['Kitchen Station', 'Total Orders', 'Avg Prep Time', 'On-Time Rate', 'Delayed Orders', 'Status'];
      rows = kitchenReportData.map(k => [`"${k.station}"`, k.orders, `"${k.avgPrep}"`, `"${k.onTimeRate}"`, k.delayed, `"${k.status}"`]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF / Hard copy
  const handlePrintPOS = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker enabled. Please allow pop-ups.');
      return;
    }

    let tableHTML = '';
    if (activeTab === 'sales' || activeTab === 'todays' || activeTab === 'order') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Bill No</th><th>Table</th><th>Date</th><th style="text-align:right;">Amount</th><th style="text-align:right;">Discount</th><th>Tax</th><th>Type</th><th>Payment</th><th>Username</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPOSBills.map(b => `
              <tr>
                <td>${b.billNo}</td><td><strong>${b.table}</strong></td><td>${b.date}</td><td style="text-align:right;">${b.amount.toFixed(2)}</td><td style="text-align:right;">${b.discount.toFixed(2)}</td><td style="text-align:right;">${b.tax.toFixed(2)}</td><td>${b.type}</td><td>${b.payment}</td><td>${b.username}</td>
              </tr>
            `).join('')}
            <tr class="summary-row">
              <td colspan="3"><strong>TOTAL (${filteredPOSBills.length} Bills)</strong></td>
              <td style="text-align:right;"><strong>Rs ${totalPOSAmount.toFixed(2)}</strong></td>
              <td style="text-align:right;"><strong>Rs ${totalPOSDiscount.toFixed(2)}</strong></td>
              <td style="text-align:right;"><strong>Rs ${totalPOSTax.toFixed(2)}</strong></td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (activeTab === 'items') {
      tableHTML = `
        <table>
          <thead><tr><th>Code</th><th>Item Name</th><th>Category</th><th>Qty Sold</th><th style="text-align:right;">Avg Rate</th><th style="text-align:right;">Total Revenue</th><th>% Share</th></tr></thead>
          <tbody>
            ${itemsReportData.map(i => `<tr><td>${i.code}</td><td><strong>${i.name}</strong></td><td>${i.category}</td><td>${i.qty}</td><td style="text-align:right;">₹${i.rate.toFixed(2)}</td><td style="text-align:right;"><strong>₹${i.total.toFixed(2)}</strong></td><td>${i.share}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'payment') {
      tableHTML = `
        <table>
          <thead><tr><th>Payment From</th><th style="text-align:right;">Amount</th><th style="text-align:center;">Count</th><th style="text-align:center;">Status</th></tr></thead>
          <tbody>
            ${paymentReportData.map(p => `<tr><td><strong>${p.from}</strong></td><td style="text-align:right;">${p.amount.toFixed(2)}</td><td style="text-align:center;">${p.count}</td><td style="text-align:center;">${p.status}</td></tr>`).join('')}
            <tr class="summary-row">
              <td><strong>Total :</strong></td>
              <td style="text-align:right;"><strong>Rs ${paymentReportData.reduce((s, p) => s + p.amount, 0).toFixed(2)}</strong></td>
              <td style="text-align:center;"><strong>${paymentReportData.reduce((s, p) => s + p.count, 0)}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      tableHTML = `
        <table>
          <thead><tr><th>Bill No</th><th>Table</th><th style="text-align:right;">Taxable Value</th><th style="text-align:right;">CGST (2.5%)</th><th style="text-align:right;">SGST (2.5%)</th><th style="text-align:right;">Total GST</th><th>Status</th></tr></thead>
          <tbody>
            ${taxReportData.map(t => `<tr><td>${t.billNo}</td><td><strong>${t.table}</strong></td><td style="text-align:right;">₹${t.taxable}</td><td style="text-align:right;">₹${t.cgst}</td><td style="text-align:right;">₹${t.sgst}</td><td style="text-align:right;"><strong>₹${t.totalGst}</strong></td><td>${t.status}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>POS 60+ Report - ${activeTab.toUpperCase()} REPORT</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
            body { font-family: 'Outfit', sans-serif; margin: 24px; color: #1a1c1e; }
            .header { border-bottom: 3px solid #006c49; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 800; color: #006c49; margin: 0; }
            .subtitle { font-size: 14px; color: #637381; font-weight: 600; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th { background: #006c49; color: white; text-transform: uppercase; font-size: 11px; padding: 10px 12px; text-align: left; border: 1px solid #005a3c; }
            td { padding: 9px 12px; border: 1px solid #dfe3e8; }
            tr:nth-child(even) { background: #f9fafb; }
            .summary-row { background: #f4f6f8; font-weight: 800; border-top: 2px solid #637381; }
            .footer { margin-top: 30px; font-size: 11px; color: #919eab; text-align: center; border-top: 1px solid #dfe3e8; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">SERVEFLOW RESTAURANT MANAGEMENT • POS 60+</h1>
              <div class="subtitle">${activeTab.toUpperCase()} REPORT • ${dateRangeStr}</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #637381;">
              <strong>Generated On:</strong> ${new Date().toLocaleString()}<br/>
              <strong>User:</strong> admin (POS Terminal 1)
            </div>
          </div>
          ${tableHTML}
          <div class="footer">ServeFlow POS System • Generated by Sagar Ratna India Admin Console • End of Report</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Charts data
  const topItems = stats?.bestSellingItems || [
    { name: 'Wagyu Truffle Burger', category: 'Main Course', orders: 0, revenue: 0, trend: 'up' },
    { name: 'Atlantic Salmon Steak', category: 'Main Course', orders: 0, revenue: 0, trend: 'up' }
  ];

  const filteredTopItems = topItems.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const weeklyRevenueData = {
    labels: stats?.weeklyRevenue?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue',
      data: stats?.weeklyRevenue?.data || [12500, 15000, 14200, 18500, 24000, 32000, 28000],
      borderColor: '#006c49',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: '#006c49'
    }]
  };

  const weeklyRevenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { callback: (value: any) => '₹' + value / 1000 + 'k' } },
      x: { grid: { display: false } }
    }
  };

  const categoryDonutData = {
    labels: stats?.categoryDistribution?.labels || ['Main Course', 'Beverages', 'Starters', 'Desserts'],
    datasets: [{
      data: stats?.categoryDistribution?.data || [45, 25, 20, 10],
      backgroundColor: ['#006c49', '#10b981', '#4edea3', '#d8e2ff'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  const categoryDonutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 20, font: { size: 12, family: 'Inter' } } } }
  };

  const peakHoursData = {
    labels: stats?.peakHours?.labels || ['11am', '1pm', '3pm', '5pm', '7pm', '9pm', '11pm'],
    datasets: [{ label: 'Orders', data: stats?.peakHours?.data || [45, 82, 30, 65, 120, 95, 40], backgroundColor: '#10b981', borderRadius: 6 }]
  };

  const peakHoursOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { grid: { color: '#f3f4f6' }, display: false }, x: { grid: { display: false } } }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Navigation */}
      <TopNavBar title="Reports Console" onSearchChange={setSearchTerm} />

      {/* Main Container */}
      <div className="p-xl space-y-md max-w-[1550px] mx-auto w-full">
        
        {/* Top Mode Switcher & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-lg text-2xl font-black text-on-surface">60+ POS Reports</h2>
              <span className="bg-[#006c49] text-white px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Sagar Ratna India Admin</span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Comprehensive tabular billing reports, tax filing summaries, and live floor exports.</p>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/40 shadow-sm">
            <button
              onClick={() => setViewMode('POS_TABLE')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                viewMode === 'POS_TABLE' ? 'bg-[#006c49] text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>60+ POS Reports Layout</span>
            </button>
            <button
              onClick={() => setViewMode('CHARTS')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                viewMode === 'CHARTS' ? 'bg-[#006c49] text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>AI Visual Charts & Graphs</span>
            </button>
          </div>
        </div>

        {/* ===================== VIEW MODE 1: POS 60+ TABULAR REPORTS (EXACT SCREENSHOT MATCH) ===================== */}
        {viewMode === 'POS_TABLE' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar Vertical Tabs (2.5 Columns) */}
            <aside className="xl:col-span-3 bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden divide-y divide-outline-variant/20">
              <div className="p-3.5 bg-surface-container-lowest font-black text-xs uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                <span>Select Report Category</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px]">8 Tabs</span>
              </div>

              {(['sales', 'todays', 'items', 'payment', 'tax', 'order', 'category', 'kitchen'] as const).map((tabKey) => {
                const labels: Record<ReportTab, string> = {
                  sales: 'Sales Report',
                  todays: 'Todays Report',
                  items: 'Items Report',
                  payment: 'Payment Report',
                  tax: 'Tax Report',
                  order: 'Order Report',
                  category: 'Category-wise Report',
                  kitchen: 'Kitchen Dept. wise Report'
                };
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`w-full text-left px-5 py-4 font-bold text-sm transition-all flex items-center justify-between relative ${
                      isActive 
                        ? 'bg-[#f0f9f5] text-[#006c49] font-black border-r-4 border-r-[#006c49]' 
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span>{labels[tabKey]}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>}
                  </button>
                );
              })}
            </aside>

            {/* Right Main Panel: Controls & Forest Green Table (9.5 Columns) */}
            <div className="xl:col-span-9 space-y-4">
              
              {/* Top Row: Date Box & Action Buttons matching screenshot */}
              <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Date Box */}
                <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold text-on-surface">
                  <Calendar className="w-4 h-4 text-primary" />
                  <input 
                    type="text" 
                    value={dateRangeStr} 
                    onChange={(e) => setDateRangeStr(e.target.value)}
                    className="bg-transparent outline-none font-bold w-64 text-xs text-on-surface"
                  />
                </div>

                {/* 4 Action Buttons (`Fetch`, `Export to excel`, `Print`, `Print to PDF`) */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleFetch}
                    disabled={isFetching}
                    className="bg-[#1e1b4b] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#312e81] active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    <span>Fetch</span>
                  </button>
                  <button
                    onClick={handleExportPOSExcel}
                    className="bg-[#1e1b4b] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#312e81] active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export to excel</span>
                  </button>
                  <button
                    onClick={handlePrintPOS}
                    className="bg-[#1e1b4b] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#312e81] active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={handlePrintPOS}
                    className="bg-[#1e1b4b] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#312e81] active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print to PDF</span>
                  </button>
                </div>
              </div>

              {/* Second Row: Filters & Search bar matching screenshot (Only for Sales/Todays/Order reports) */}
              {(activeTab === 'sales' || activeTab === 'todays' || activeTab === 'order') && (
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search bill, table or user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>

                  <select 
                    value={orderTypeFilter}
                    onChange={(e) => setOrderTypeFilter(e.target.value)}
                    className="bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="All">__Filter by order type__</option>
                    <option value="Dine-In">Dine-In</option>
                    <option value="Quick Bill">Quick Bill</option>
                    <option value="Takeaway">Takeaway</option>
                  </select>

                  <select 
                    value={billStatusFilter}
                    onChange={(e) => setBillStatusFilter(e.target.value)}
                    className="bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="All">__Filter by bill status__</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>

                  <select 
                    value={terminalFilter}
                    onChange={(e) => setTerminalFilter(e.target.value)}
                    className="bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="All">__Filter by terminal__</option>
                    <option value="POS-1">POS-1</option>
                    <option value="Cashier-Main">Cashier-Main</option>
                  </select>

                  <select 
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="All">__Filter by user__</option>
                    <option value="admin">admin</option>
                    <option value="cashier">cashier</option>
                  </select>

                  <select 
                    value={deliveryFilter}
                    onChange={(e) => setDeliveryFilter(e.target.value)}
                    className="bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="All">__Filter by delivery__</option>
                    <option value="None">Direct POS</option>
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="UberEats">UberEats</option>
                  </select>

                  <button
                    onClick={handleClearSelection}
                    className="bg-[#1e1b4b] text-white px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-[#312e81] transition-all"
                  >
                    Clear Selection
                  </button>
                </div>
              )}

              {/* Exact Green Header Table (`bg-[#006c49]` text-white) */}
              <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                
                {/* 1. SALES REPORT / TODAYS REPORT / ORDER REPORT VIEW */}
                {(activeTab === 'sales' || activeTab === 'todays' || activeTab === 'order') && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#006c49] text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-3 px-4 border-r border-[#005a3c]">Bill No</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Table</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Date</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Amount</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Discount</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Discount Reason</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Tax</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Type</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Payment</th>
                          <th className="py-3 px-4">Username</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs font-semibold text-on-surface">
                        {filteredPOSBills.map((bill, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 transition-colors">
                            <td className="py-3 px-4 font-bold text-center border-r border-outline-variant/20">{bill.billNo}</td>
                            <td className="py-3 px-4 font-extrabold text-primary border-r border-outline-variant/20">{bill.table}</td>
                            <td className="py-3 px-4 text-on-surface-variant border-r border-outline-variant/20 whitespace-nowrap">{bill.date}</td>
                            <td className="py-3 px-4 text-right font-black border-r border-outline-variant/20">{bill.amount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right border-r border-outline-variant/20">{bill.discount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-gray-400 italic border-r border-outline-variant/20">{bill.discountReason || '—'}</td>
                            <td className="py-3 px-4 text-right border-r border-outline-variant/20">{bill.tax.toFixed(2)}</td>
                            <td className="py-3 px-4 border-r border-outline-variant/20">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                bill.type === 'Dine-In' ? 'bg-emerald-100 text-emerald-800' :
                                bill.type === 'Quick Bill' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                              }`}>{bill.type}</span>
                            </td>
                            <td className="py-3 px-4 border-r border-outline-variant/20 font-bold">{bill.payment}</td>
                            <td className="py-3 px-4 text-gray-600 font-medium">{bill.username}</td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Summary Footer matching screenshot */}
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-300 font-black text-xs text-on-surface">
                          <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider">Total Sales ({filteredPOSBills.length} Bills):</td>
                          <td className="py-3.5 px-4 text-right text-primary text-sm font-black border-l border-r border-gray-300">
                            Rs {totalPOSAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-sm font-black border-r border-gray-300">
                            Rs {totalPOSDiscount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 border-r border-gray-300"></td>
                          <td className="py-3.5 px-4 text-right text-sm font-black border-r border-gray-300">
                            Rs {totalPOSTax.toFixed(2)}
                          </td>
                          <td colSpan={3} className="py-3.5 px-4 text-gray-500 font-medium">Sagar Ratna India Verified</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* 2. ITEMS REPORT VIEW */}
                {activeTab === 'items' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#006c49] text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-3 px-4 border-r border-[#005a3c]">Item Code</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Item Name</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Category</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-center">Qty Sold</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Avg Rate</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Total Revenue</th>
                          <th className="py-3 px-4">% Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs font-semibold text-on-surface">
                        {itemsReportData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 transition-colors">
                            <td className="py-3 px-4 font-bold border-r border-outline-variant/20">{item.code}</td>
                            <td className="py-3 px-4 font-extrabold text-primary border-r border-outline-variant/20">{item.name}</td>
                            <td className="py-3 px-4 border-r border-outline-variant/20">{item.category}</td>
                            <td className="py-3 px-4 font-bold text-center border-r border-outline-variant/20">{item.qty}</td>
                            <td className="py-3 px-4 text-right border-r border-outline-variant/20">₹{item.rate.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-black border-r border-outline-variant/20">₹{item.total.toFixed(2)}</td>
                            <td className="py-3 px-4 font-bold text-primary">{item.share}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-300 font-black text-xs text-on-surface">
                          <td colSpan={3} className="py-3.5 px-4 text-right uppercase">Total Items Revenue:</td>
                          <td className="py-3.5 px-4 text-center font-black border-l border-r border-gray-300">{itemsReportData.reduce((s, i) => s + i.qty, 0)} Units</td>
                          <td className="py-3.5 px-4 border-r border-gray-300"></td>
                          <td className="py-3.5 px-4 text-right text-primary text-sm font-black border-r border-gray-300">₹{itemsReportData.reduce((s, i) => s + i.total, 0).toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-gray-500 font-medium">100.0%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* 3. PAYMENT REPORT VIEW matching exact screenshot */}
                {activeTab === 'payment' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#006c49] text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-3 px-6 border-r border-[#005a3c]">Payment From</th>
                          <th className="py-3 px-6 border-r border-[#005a3c] text-center">Amount</th>
                          <th className="py-3 px-6 border-r border-[#005a3c] text-center">Count</th>
                          <th className="py-3 px-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs font-semibold text-on-surface">
                        {paymentReportData.map((p, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 transition-colors">
                            <td className="py-3.5 px-6 font-extrabold text-on-surface border-r border-outline-variant/20">{p.from}</td>
                            <td className="py-3.5 px-6 text-center font-bold border-r border-outline-variant/20">{p.amount.toFixed(2)}</td>
                            <td className="py-3.5 px-6 text-center font-bold border-r border-outline-variant/20">{p.count}</td>
                            <td className="py-3.5 px-6 text-center font-bold text-on-surface-variant">{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-300 font-black text-xs text-on-surface">
                          <td className="py-4 px-6 border-r border-gray-300">Total :</td>
                          <td className="py-4 px-6 text-center font-black border-r border-gray-300">Rs {paymentReportData.reduce((s, p) => s + p.amount, 0).toFixed(2)}</td>
                          <td className="py-4 px-6 text-center font-black border-r border-gray-300">{paymentReportData.reduce((s, p) => s + p.count, 0)}</td>
                          <td className="py-4 px-6"></td>
                        </tr>
                      </tfoot>
                    </table>
                    {/* Pagination matching screenshot */}
                    <div className="p-4 bg-white border-t border-outline-variant/20 flex items-center justify-end gap-3 text-xs font-bold text-on-surface-variant">
                      <span className="cursor-pointer hover:text-primary">Previous</span>
                      <span className="px-3 py-1.5 bg-[#1e1b4b] text-white rounded font-black">1</span>
                      <span className="cursor-pointer hover:text-primary">Next</span>
                    </div>
                  </div>
                )}

                {/* 4. TAX REPORT VIEW */}
                {activeTab === 'tax' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#006c49] text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-3 px-4 border-r border-[#005a3c]">Bill No</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Table</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Taxable Value</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">CGST (2.5%)</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">SGST (2.5%)</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Total GST (5%)</th>
                          <th className="py-3 px-4">Filing Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs font-semibold text-on-surface">
                        {taxReportData.map((t, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 transition-colors">
                            <td className="py-3 px-4 font-bold border-r border-outline-variant/20">{t.billNo}</td>
                            <td className="py-3 px-4 font-extrabold text-primary border-r border-outline-variant/20">{t.table}</td>
                            <td className="py-3 px-4 text-right border-r border-outline-variant/20">₹{t.taxable}</td>
                            <td className="py-3 px-4 text-right border-r border-outline-variant/20">₹{t.cgst}</td>
                            <td className="py-3 px-4 text-right border-r border-outline-variant/20">₹{t.sgst}</td>
                            <td className="py-3 px-4 text-right font-black border-r border-outline-variant/20">₹{t.totalGst}</td>
                            <td className="py-3 px-4"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">{t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 5. CATEGORY-WISE REPORT VIEW */}
                {activeTab === 'category' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#006c49] text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-3 px-4 border-r border-[#005a3c]">Category Name</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-center">Total Qty Sold</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-right">Total Revenue</th>
                          <th className="py-3 px-4 border-r border-[#005a3c]">Top Selling Item</th>
                          <th className="py-3 px-4">Est. Profit Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs font-semibold text-on-surface">
                        {categoryReportData.map((c, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 transition-colors">
                            <td className="py-3 px-4 font-extrabold text-primary border-r border-outline-variant/20">{c.category}</td>
                            <td className="py-3 px-4 text-center font-bold border-r border-outline-variant/20">{c.totalQty} Units</td>
                            <td className="py-3 px-4 text-right font-black border-r border-outline-variant/20">₹{c.revenue.toFixed(2)}</td>
                            <td className="py-3 px-4 font-medium border-r border-outline-variant/20">{c.topItem}</td>
                            <td className="py-3 px-4 font-black text-emerald-700">{c.margin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 6. KITCHEN DEPT WISE REPORT VIEW */}
                {activeTab === 'kitchen' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#006c49] text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-3 px-4 border-r border-[#005a3c]">Kitchen Department / Station</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-center">Total Orders Processed</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-center">Avg Preparation Speed</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-center">On-Time Completion Rate</th>
                          <th className="py-3 px-4 border-r border-[#005a3c] text-center">Delayed (&gt;20m)</th>
                          <th className="py-3 px-4">Station Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs font-semibold text-on-surface">
                        {kitchenReportData.map((k, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 transition-colors">
                            <td className="py-3 px-4 font-extrabold text-primary border-r border-outline-variant/20">{k.station}</td>
                            <td className="py-3 px-4 text-center font-bold border-r border-outline-variant/20">{k.orders}</td>
                            <td className="py-3 px-4 text-center border-r border-outline-variant/20">{k.avgPrep}</td>
                            <td className="py-3 px-4 text-center font-black text-emerald-700 border-r border-outline-variant/20">{k.onTimeRate}</td>
                            <td className="py-3 px-4 text-center font-bold border-r border-outline-variant/20">{k.delayed}</td>
                            <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${k.status === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{k.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ===================== VIEW MODE 2: AI CHARTS & ANALYTICS (EXISTING VIEW) ===================== */}
        {viewMode === 'CHARTS' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter Pill Box */}
            <div className="flex justify-end">
              <div className="inline-flex bg-surface-container-low p-1 rounded-xl border border-outline-variant">
                <button 
                  onClick={() => setFilter('today')}
                  className={`px-4 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all ${
                    filter === 'today' ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setFilter('weekly')}
                  className={`px-4 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all ${
                    filter === 'weekly' ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setFilter('monthly')}
                  className={`px-4 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all ${
                    filter === 'monthly' ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-on-surface-variant font-bold uppercase">TOTAL REVENUE</p>
                  <TrendingUp className="text-primary w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-on-surface">
                  ₹{stats?.todaySales ? stats.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '4,918.00'}
                </p>
                <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                  +12.5% <span className="font-normal text-on-surface-variant">vs last period</span>
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-on-surface-variant font-bold uppercase">TOTAL ORDERS</p>
                  <ShoppingBag className="text-primary w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-on-surface">
                  {stats?.completedOrdersCount || 48}
                </p>
                <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                  +5.2% <span className="font-normal text-on-surface-variant">vs last period</span>
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-on-surface-variant font-bold uppercase">AVG ORDER VALUE</p>
                  <IndianRupee className="text-secondary w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-on-surface">
                  ₹{stats?.averageOrderValue ? stats.averageOrderValue.toFixed(2) : '385.50'}
                </p>
                <p className="text-xs text-tertiary font-semibold mt-1 flex items-center gap-1">
                  -1.2% <span className="font-normal text-on-surface-variant">vs last period</span>
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-on-surface-variant font-bold uppercase">ACTIVE TABLES</p>
                  <Calendar className="text-primary w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-on-surface">
                  {stats?.occupiedTablesCount || 3} / 10
                </p>
                <p className="text-xs text-on-surface-variant font-semibold mt-1">Capacity live floor status</p>
              </div>
            </div>

            {/* Primary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col">
                <h3 className="font-bold text-base text-on-surface mb-4">Weekly Revenue Breakdown</h3>
                <div className="h-64 w-full">
                  <Line data={weeklyRevenueData} options={weeklyRevenueOptions} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col">
                <h3 className="font-bold text-base text-on-surface mb-4">Category Distribution</h3>
                <div className="flex-grow flex items-center justify-center relative min-h-[220px]">
                  <Doughnut data={categoryDonutData} options={categoryDonutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Sales</p>
                    <p className="font-bold text-base">₹{stats?.todaySales ? (stats.todaySales / 1000).toFixed(1) + 'k' : '4.9k'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Peak Hours & Top Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col">
                <h3 className="font-bold text-base text-on-surface mb-4">Peak Service Hours</h3>
                <div className="h-56 w-full">
                  <BarChart data={peakHoursData} options={peakHoursOptions} />
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant">
                  <h3 className="font-bold text-base text-on-surface">Top Selling Items</h3>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-on-surface-variant">Item Name</th>
                        <th className="px-4 py-3 text-xs font-bold text-on-surface-variant">Category</th>
                        <th className="px-4 py-3 text-xs font-bold text-on-surface-variant">Orders</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-on-surface-variant">Revenue</th>
                        <th className="px-4 py-3 text-xs font-bold text-on-surface-variant">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 text-sm">
                      {filteredTopItems.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-surface-bright transition-all">
                          <td className="px-4 py-3 font-semibold text-on-surface">{item.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 text-xs rounded-lg font-bold ${
                              item.category === 'Main Course' ? 'bg-primary-container/10 text-primary' : 'bg-secondary-container/10 text-secondary'
                            }`}>{item.category}</span>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.orders || 14}</td>
                          <td className="px-4 py-3 font-bold text-right">₹{(item.revenue || 3500).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {item.trend === 'up' ? <TrendingUp className="text-primary w-4 h-4" /> : <TrendingDown className="text-tertiary w-4 h-4" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* AI Banner */}
            <div className="rounded-2xl p-6 bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
              <div className="max-w-xl">
                <h4 className="font-bold text-xl mb-2">Maximize your weekend revenue</h4>
                <p className="text-sm opacity-90 mb-4">Based on last week's data, adding a 'Brunch Special' could increase your Saturday morning traffic by up to 22%.</p>
                <button 
                  onClick={() => alert('AI Suggestions applied! Brunch specials added to menu drafts.')}
                  className="bg-white text-primary px-5 py-2.5 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 text-xs shadow"
                >
                  <span>Apply AI Suggestions</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
