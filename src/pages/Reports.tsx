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
  DollarSign, 
  Calendar,
  Sparkles,
  TrendingDown,
  Loader2
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

export const Reports: React.FC = () => {
  const { orders } = useRestaurant();
  const [filter, setFilter] = useState<'today' | 'weekly' | 'monthly'>('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api';

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
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [orders]);

  const topItems = stats?.bestSellingItems || [
    { name: 'Wagyu Truffle Burger', category: 'Main Course', orders: 0, revenue: 0, trend: 'up' },
    { name: 'Atlantic Salmon Steak', category: 'Main Course', orders: 0, revenue: 0, trend: 'up' }
  ];

  const filteredTopItems = topItems.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Weekly Revenue Area Chart Data
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
      y: { 
        beginAtZero: true, 
        grid: { color: '#f3f4f6' },
        ticks: { callback: (value: any) => '$' + value / 1000 + 'k' }
      },
      x: { grid: { display: false } }
    }
  };

  // Best Selling Categories Donut Data
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
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: 'Inter' }
        }
      }
    }
  };

  // Peak Hours Bar Chart Data
  const peakHoursData = {
    labels: stats?.peakHours?.labels || ['11am', '1pm', '3pm', '5pm', '7pm', '9pm', '11pm'],
    datasets: [{
      label: 'Orders',
      data: stats?.peakHours?.data || [45, 82, 30, 65, 120, 95, 40],
      backgroundColor: '#10b981',
      borderRadius: 6,
    }]
  };

  const peakHoursOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#f3f4f6' }, display: false },
      x: { grid: { display: false } }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-md text-sm text-on-surface-variant font-medium">Loading Real-Time Analytics...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Navigation */}
      <TopNavBar title="Reports & Analytics" onSearchChange={setSearchTerm} />

      {/* Analytics Canvas */}
      <div className="p-container-margin md:p-xl space-y-xl">
        
        {/* Page Header & Filters */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Reports & Insights</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time performance metrics for your restaurant.</p>
          </div>
          <div className="inline-flex bg-surface-container-low p-1 rounded-xl border border-outline-variant">
            <button 
              onClick={() => setFilter('today')}
              className={`px-lg py-2 rounded-lg font-label-md text-sm font-semibold transition-all ${
                filter === 'today' ? 'bg-white text-primary font-bold shadow-sm border border-outline-variant/30' : 'text-on-surface-variant'
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => setFilter('weekly')}
              className={`px-lg py-2 rounded-lg font-label-md text-sm font-semibold transition-all ${
                filter === 'weekly' ? 'bg-white text-primary font-bold shadow-sm border border-outline-variant/30' : 'text-on-surface-variant'
              }`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setFilter('monthly')}
              className={`px-lg py-2 rounded-lg font-label-md text-sm font-semibold transition-all ${
                filter === 'monthly' ? 'bg-white text-primary font-bold shadow-sm border border-outline-variant/30' : 'text-on-surface-variant'
              }`}
            >
              Monthly
            </button>
          </div>
        </section>

        {/* Stats Overview Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-xs font-semibold">TOTAL REVENUE</p>
              <TrendingUp className="text-primary w-5 h-5" />
            </div>
            <p className="font-headline-md text-headline-md font-bold text-on-surface">
              ${stats?.todaySales ? stats.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
            <p className="text-xs text-primary font-semibold mt-sm flex items-center gap-1">
              +12.5% <span className="font-normal text-on-surface-variant">vs last period</span>
            </p>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-xs font-semibold">TOTAL ORDERS</p>
              <ShoppingBag className="text-primary w-5 h-5" />
            </div>
            <p className="font-headline-md text-headline-md font-bold text-on-surface">
              {stats?.completedOrdersCount || 0}
            </p>
            <p className="text-xs text-primary font-semibold mt-sm flex items-center gap-1">
              +5.2% <span className="font-normal text-on-surface-variant">vs last period</span>
            </p>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-xs font-semibold">AVG ORDER VALUE</p>
              <DollarSign className="text-secondary w-5 h-5" />
            </div>
            <p className="font-headline-md text-headline-md font-bold text-on-surface">
              ${stats?.averageOrderValue ? stats.averageOrderValue.toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-tertiary font-semibold mt-sm flex items-center gap-1">
              -1.2% <span className="font-normal text-on-surface-variant">vs last period</span>
            </p>
          </div>
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-xs font-semibold">ACTIVE TABLES</p>
              <Calendar className="text-primary w-5 h-5" />
            </div>
            <p className="font-headline-md text-headline-md font-bold text-on-surface">
              {stats?.occupiedTablesCount || 0} / 10
            </p>
            <p className="text-xs text-on-surface-variant font-semibold mt-sm">Capacity live floor status</p>
          </div>
        </div>

        {/* Primary Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Large Area Chart: Weekly Revenue */}
          <div className="lg:col-span-2 bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Weekly Revenue</h3>
            </div>
            <div className="h-64 w-full">
              <Line data={weeklyRevenueData} options={weeklyRevenueOptions} />
            </div>
          </div>

          {/* Donut Chart: Best Selling Categories */}
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base mb-lg">Category Distribution</h3>
            <div className="flex-grow flex items-center justify-center relative min-h-[220px]">
              <Doughnut data={categoryDonutData} options={categoryDonutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Sales</p>
                <p className="font-headline-sm text-headline-sm font-bold text-base">${stats?.todaySales ? (stats.todaySales / 1000).toFixed(1) + 'k' : '0.0k'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Bar Chart: Peak Hours */}
          <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base mb-lg">Peak Service Hours</h3>
            <div className="h-56 w-full">
              <BarChart data={peakHoursData} options={peakHoursOptions} />
            </div>
          </div>

          {/* Table: Best Selling Items */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Top Selling Items</h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-lg py-md font-label-md text-on-surface-variant text-xs font-semibold">Item Name</th>
                    <th className="px-lg py-md font-label-md text-on-surface-variant text-xs font-semibold">Category</th>
                    <th className="px-lg py-md font-label-md text-on-surface-variant text-xs font-semibold">Orders</th>
                    <th className="px-lg py-md font-label-md text-on-surface-variant text-right text-xs font-semibold">Revenue</th>
                    <th className="px-lg py-md font-label-md text-on-surface-variant text-xs font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm">
                  {filteredTopItems.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-surface-bright transition-all cursor-default">
                      <td className="px-lg py-md font-body-md font-semibold text-on-surface">{item.name}</td>
                      <td className="px-lg py-md">
                        <span className={`px-sm py-1 text-xs rounded-lg font-bold ${
                          item.category === 'Main Course' ? 'bg-primary-container/10 text-primary-container' :
                          item.category === 'Beverages' ? 'bg-secondary-container/10 text-secondary-container' :
                          'bg-tertiary-container/10 text-tertiary-container'
                        }`}>{item.category}</span>
                      </td>
                      <td className="px-lg py-md font-body-md text-on-surface-variant">{item.orders}</td>
                      <td className="px-lg py-md font-body-md text-on-surface font-bold text-right">${item.revenue.toLocaleString()}</td>
                      <td className="px-lg py-md">
                        {item.trend === 'up' ? (
                          <TrendingUp className="text-primary w-4 h-4" />
                        ) : (
                          <TrendingDown className="text-tertiary w-4 h-4" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTopItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-lg py-md text-center text-on-surface-variant">No items found matching "{searchTerm}"</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ad/Insight Banner */}
        <div className="relative rounded-2xl overflow-hidden p-xl bg-primary text-on-primary flex flex-col md:flex-row items-center justify-between gap-xl">
          <div className="relative z-10 max-w-xl">
            <h4 className="font-headline-md text-headline-md font-bold mb-md text-white">Maximize your weekend revenue</h4>
            <p className="font-body-md text-body-md opacity-90 mb-lg text-white/90">
              Based on last week's data, adding a 'Brunch Special' could increase your Saturday morning traffic by up to 22%.
            </p>
            <button 
              onClick={() => alert('AI Suggestions applied! Brunch specials added to menu drafts.')}
              className="bg-white text-primary px-xl py-md rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-sm text-sm"
            >
              <span>Apply AI Suggestions</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full md:w-1/3 aspect-video rounded-xl bg-primary-fixed/20 overflow-hidden relative border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 to-transparent"></div>
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=300')" }}
            ></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
