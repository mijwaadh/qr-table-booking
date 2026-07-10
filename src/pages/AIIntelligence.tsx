import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Line, Bar } from 'react-chartjs-2';
import TopNavBar from '../components/TopNavBar';
import { 
  Sparkles, 
  TrendingUp, 
  Truck, 
  ShoppingBag, 
  RefreshCw, 
  Check, 
  Layers, 
  Package, 
  ChevronRight,
  Coins,
  Scale,
  Flame,
  MessageSquare,
  Send,
  Loader2,
  FileText,
  Download
} from 'lucide-react';

// Register Chart.js components
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

interface MarketCommodity {
  id: string;
  name: string;
  unit: string;
  todayPrice: number;
  yesterdayPrice: number;
  difference: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: string;
}

interface Recommendation {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  savings: number;
  actionText: string;
}

interface Supplier {
  name: string;
  reliability: number; // percentage
  deliverySpeed: string;
  priceStability: 'high' | 'medium' | 'low';
  status: 'excellent' | 'good' | 'critical';
  itemCategory: string;
}

interface MenuItemMargin {
  name: string;
  recipeCost: number;
  sellingPrice: number;
  margin: number; // percentage
  volume: 'high' | 'medium' | 'low';
  status: 'healthy' | 'warning' | 'critical';
}

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  runoutDays: number;
  autoOrderQty: number;
  status: 'ok' | 'reorder' | 'critical';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  table?: Array<Record<string, any>>;
  recommendations?: string[];
}

export const AIIntelligence: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'overview';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>(tabParam);
  
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  const [regenerating, setRegenerating] = useState(false);
  const [appliedRecommendations, setAppliedRecommendations] = useState<{ [key: string]: boolean }>({});
  
  // Market Prices Filter state
  const [marketTab, setMarketTab] = useState<'all' | 'increasing' | 'decreasing' | 'stable'>('all');
  
  // Supplier Reliability threshold state
  const [reliabilityThreshold, setReliabilityThreshold] = useState(70);
  
  // Menu Margin Sorting
  const [menuSort, setMenuSort] = useState<'margin' | 'cost' | 'price'>('margin');
  
  // Inventory Auto-Order status
  const [autoOrderedItems, setAutoOrderedItems] = useState<{ [key: string]: boolean }>({});
  
  // Waste Intelligence Timeframe
  const [wasteTimeframe, setWasteTimeframe] = useState<'thisWeek' | 'lastWeek'>('thisWeek');

  // AI Copilot States
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'assistant',
      text: 'Hello! I am your ServeFlow AI Copilot. I analyze menu costs, supplier rates, inventory runout risks, and demand forecasts. How can I help you today?',
      time: '10:00 AM'
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Sub-tabs list
  const subTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'market', label: 'Market Intelligence' },
    { id: 'forecast', label: 'Forecast & Predictions' },
    { id: 'supplier', label: 'Supplier Intelligence' },
    { id: 'menu', label: 'Menu Profitability' },
    { id: 'inventory', label: 'Inventory Insights' },
    { id: 'waste', label: 'Waste Analysis' },
    { id: 'purchase', label: 'Purchase Recommendations' },
    { id: 'copilot', label: 'AI Copilot' },
    { id: 'reports', label: 'Reports' }
  ];

  // Mock Market Commodities Data
  const initialCommodities: MarketCommodity[] = [
    { id: '1', name: 'Roma Tomatoes', unit: 'kg', todayPrice: 52, yesterdayPrice: 46, difference: 6, trend: 'increasing', prediction: 'Monsoon delays will elevate prices by 5% this week.' },
    { id: '2', name: 'Wagyu Beef Flank', unit: 'kg', todayPrice: 2200, yesterdayPrice: 2150, difference: 50, trend: 'increasing', prediction: 'Stabilizing soon as supplier flight cargo resumes.' },
    { id: '3', name: 'Atlantic Salmon Filet', unit: 'kg', todayPrice: 1150, yesterdayPrice: 1200, difference: -50, trend: 'decreasing', prediction: 'Sliding further by 4% on healthy global catches.' },
    { id: '4', name: 'Fresh Cream 35%', unit: 'L', todayPrice: 180, yesterdayPrice: 180, difference: 0, trend: 'stable', prediction: 'Contract rates locked; stable price for 15 days.' },
    { id: '5', name: 'Yellow Bell Peppers', unit: 'kg', todayPrice: 110, yesterdayPrice: 125, difference: -15, trend: 'decreasing', prediction: 'Abundant mandi arrivals; prices expected to hover low.' },
    { id: '6', name: 'Hass Avocados', unit: 'piece', todayPrice: 95, yesterdayPrice: 85, difference: 10, trend: 'increasing', prediction: 'High import surcharge; expect rising prices to hold.' },
  ];

  // API URL
  const rawApiUrl = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api').trim().replace(/\/$/, '');
  const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

  // AI Recommendations State & API Fetch Hook
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 'rec_1',
      severity: 'High',
      title: 'Tomato prices increased by 12%.',
      description: 'Increase Pasta price by ₹10 to protect target recipe margins.',
      savings: 4500,
      actionText: 'Apply Price Hike',
    },
    {
      id: 'rec_2',
      severity: 'Medium',
      title: 'Salmon preparation surplus predicted',
      description: 'Reduce Atlantic Salmon daily prep level by 15% based on Sunday rainy forecast.',
      savings: 2400,
      actionText: 'Adjust Prep Quantity',
    },
    {
      id: 'rec_3',
      severity: 'High',
      title: 'Wagyu Beef wholesale discount opportunity',
      description: 'Shift beef flank orders to FreshFoods Ltd; current promo gives 8% bulk discount.',
      savings: 4200,
      actionText: 'Apply Vendor Shift',
    },
    {
      id: 'rec_4',
      severity: 'Low',
      title: 'Flour inventory safety stock buffer high',
      description: 'Decrease safety stock buffer from 50kg to 35kg to lower carrying costs.',
      savings: 1100,
      actionText: 'Reduce Safety Stock',
    }
  ]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/recommendations`);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((d: any) => ({
            id: d.id,
            severity: d.priority as 'High' | 'Medium' | 'Low',
            title: d.title,
            description: `${d.description} Reason: ${d.reason} (Confidence: ${d.confidence_score}%)`,
            savings: d.savings,
            actionText: d.actionText
          }));
          if (mapped.length > 0) {
            setRecommendations(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic backend recommendations: ", err);
      }
    };
    
    fetchRecommendations();
  }, []);

  // Mock Suppliers Data
  const initialSuppliers: Supplier[] = [
    { name: 'FreshFoods Ltd', reliability: 97, deliverySpeed: 'Same Day', priceStability: 'high', status: 'excellent', itemCategory: 'Meats & Seafood' },
    { name: 'Metro Wholesale', reliability: 89, deliverySpeed: 'Next Day', priceStability: 'medium', status: 'good', itemCategory: 'Dry Goods' },
    { name: 'Sai Farm Fresh', reliability: 74, deliverySpeed: 'Next Day', priceStability: 'low', status: 'critical', itemCategory: 'Fresh Produce' },
    { name: 'Apex Dairy Corp', reliability: 95, deliverySpeed: 'Same Day', priceStability: 'high', status: 'excellent', itemCategory: 'Dairy Products' },
    { name: 'Direct Bakeries', reliability: 82, deliverySpeed: 'Same Day', priceStability: 'medium', status: 'good', itemCategory: 'Bread & Buns' },
  ];

  // Mock Menu Margins Data
  const initialMenuMargins: MenuItemMargin[] = [
    { name: 'Wagyu Truffle Burger', recipeCost: 420, sellingPrice: 1250, margin: 66.4, volume: 'high', status: 'healthy' },
    { name: 'Atlantic Salmon Steak', recipeCost: 580, sellingPrice: 1390, margin: 58.3, volume: 'medium', status: 'warning' },
    { name: 'Truffle Parmesan Fries', recipeCost: 115, sellingPrice: 320, margin: 64.0, volume: 'high', status: 'healthy' },
    { name: 'Avocado Green Salad', recipeCost: 190, sellingPrice: 380, margin: 50.0, volume: 'medium', status: 'warning' },
    { name: 'Saffron Cream Penne', recipeCost: 260, sellingPrice: 450, margin: 42.2, volume: 'low', status: 'critical' },
  ];

  // Mock Inventory Items Data
  const initialInventory: InventoryItem[] = [
    { id: 'inv_1', name: 'Hass Avocados', stock: 12, unit: 'pcs', runoutDays: 1.2, autoOrderQty: 40, status: 'critical' },
    { id: 'inv_2', name: 'Atlantic Salmon Filets', stock: 8.5, unit: 'kg', runoutDays: 1.8, autoOrderQty: 15, status: 'reorder' },
    { id: 'inv_3', name: 'Fresh Cream 35%', stock: 24, unit: 'L', runoutDays: 4.5, autoOrderQty: 30, status: 'ok' },
    { id: 'inv_4', name: 'Wagyu Beef Flanks', stock: 15, unit: 'kg', runoutDays: 2.2, autoOrderQty: 10, status: 'ok' },
    { id: 'inv_5', name: 'Roma Tomatoes', stock: 8, unit: 'kg', runoutDays: 0.9, autoOrderQty: 25, status: 'critical' },
  ];

  // Simulated Sync function
  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
    }, 1000);
  };

  // Filter Market Commodities
  const filteredCommodities = initialCommodities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (marketTab === 'increasing') return c.trend === 'increasing';
    if (marketTab === 'decreasing') return c.trend === 'decreasing';
    if (marketTab === 'stable') return c.trend === 'stable';
    return true;
  });

  // Filter Suppliers
  const filteredSuppliers = initialSuppliers.filter(s => 
    s.reliability >= reliabilityThreshold &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort Menu Margins
  const sortedMenuMargins = [...initialMenuMargins]
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (menuSort === 'margin') return b.margin - a.margin;
      if (menuSort === 'cost') return b.recipeCost - a.recipeCost;
      if (menuSort === 'price') return b.sellingPrice - a.sellingPrice;
      return 0;
    });

  // Filter Inventory
  const filteredInventory = initialInventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle Recommendations
  const toggleRecommendation = (id: string) => {
    setAppliedRecommendations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle Inventory Auto Order
  const triggerAutoOrder = (id: string) => {
    setAutoOrderedItems(prev => ({
      ...prev,
      [id]: true
    }));
    setTimeout(() => {
      alert(`Auto-Order request sent successfully to procurement.`);
    }, 400);
  };

  // Copilot Chat Handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const query = chatInput;
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      if (response.ok) {
        const replyData = await response.json();
        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: replyData.text,
          table: replyData.table || undefined,
          recommendations: replyData.recommendations || undefined,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, botMessage]);
      } else {
        throw new Error("Chat response failed");
      }
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'assistant',
        text: "I am having trouble accessing the server database parameters right now. Please try again in a few moments.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Price Trend Chart Data (Line Chart)
  const priceTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Wagyu Beef (per kg)',
        data: [2100, 2050, 2180, 2220, 2150, 2190, 2200],
        borderColor: '#a43a3a', // tertiary
        backgroundColor: 'rgba(164, 58, 58, 0.05)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Atlantic Salmon (per kg)',
        data: [1300, 1280, 1240, 1260, 1210, 1180, 1150],
        borderColor: '#0058be', // secondary
        backgroundColor: 'rgba(0, 88, 190, 0.05)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Roma Tomatoes (per kg)',
        data: [35, 38, 42, 40, 48, 45, 52],
        borderColor: '#006c49', // primary
        backgroundColor: 'rgba(0, 108, 73, 0.05)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const priceTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, family: 'Inter' }
        }
      }
    },
    scales: {
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      }
    }
  };

  // Forecast Chart Data
  const forecastData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Actual Sales (Prev. Week)',
        data: [42000, 48000, 41000, 52000, 78000, 92000, 85000],
        backgroundColor: 'rgba(0, 88, 190, 0.2)', // secondary
        borderColor: '#0058be',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Predicted Sales (AI Forecast)',
        data: [44000, 46000, 45000, 58000, 84000, 99000, 89000],
        backgroundColor: 'rgba(0, 108, 73, 0.7)', // primary green
        borderColor: '#006c49',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const forecastOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, family: 'Inter' }
        }
      }
    },
    scales: {
      y: {
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 10 },
          callback: (value: any) => '₹' + (value / 1000) + 'k'
        }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      }
    }
  };

  // Waste Intelligence Metrics
  const wasteDistribution = wasteTimeframe === 'thisWeek' 
    ? { spoilage: 45, overprep: 35, leftovers: 20, total: 13700 }
    : { spoilage: 52, overprep: 28, leftovers: 20, total: 15400 };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background">
      {/* Top Navigation */}
      <TopNavBar title="AI Intelligence Center" onSearchChange={setSearchTerm} />

      {/* Page Header */}
      <div className="px-xl pt-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <div className="flex items-center gap-sm">
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">AI Intelligence</h2>
            <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Live Models
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant mt-xs">
            Subsystem calculations tracking inventory logs, supplier reliability indices, and forecast models.
          </p>
        </div>

        <button 
          onClick={handleRegenerate}
          className="flex items-center gap-sm px-md py-2 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold hover:brightness-110 active:scale-95 shadow-md shadow-primary/10 transition-all disabled:opacity-50 self-start md:self-end"
          disabled={regenerating}
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          <span>{regenerating ? 'Syncing...' : 'Sync Models'}</span>
        </button>
      </div>

      {/* Sub-tabs Horizontal Navigation */}
      <div className="px-xl mt-lg border-b border-outline-variant/30 bg-surface-bright sticky top-0 z-30">
        <div className="flex gap-lg overflow-x-auto no-scrollbar py-2">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-sm py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-all relative ${
                activeTab === tab.id 
                  ? 'border-primary text-primary font-bold' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/45'
              }`}
            >
              {tab.label}
              {tab.id === 'copilot' && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-primary rounded-full animate-ping"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents Frame */}
      <main className="p-xl flex-grow overflow-y-auto">
        <div className="max-w-[1440px] mx-auto animate-slide-up">
          
          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-12 gap-lg">
              {/* Today's AI Summary Card */}
              <div className="col-span-12 lg:col-span-8 bg-white rounded-xl card-shadow border border-outline-variant/30 overflow-hidden flex flex-col justify-between relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-container to-secondary"></div>
                
                <div className="p-lg">
                  <div className="flex justify-between items-center mb-md">
                    <div className="flex items-center gap-sm">
                      <div className="p-2 rounded-lg bg-primary-container/10 text-primary">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Today's AI Summary</h3>
                        <p className="text-[10px] text-on-surface-variant opacity-75">Generated based on menu and POS activity</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary animate-pulse">Live</span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-md mb-lg mt-md">
                    <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between">
                      <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">AI Health Score</span>
                      <div className="flex items-baseline gap-xs mt-sm"><span className="font-headline-md font-extrabold text-on-surface">94%</span></div>
                      <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold mt-sm self-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>Healthy
                      </span>
                    </div>

                    <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between">
                      <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Total Food Cost</span>
                      <div className="flex items-baseline gap-xs mt-sm"><span className="font-headline-md font-extrabold text-on-surface">28.5%</span></div>
                      <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold mt-sm self-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>Healthy
                      </span>
                    </div>

                    <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between">
                      <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Est. Monthly Profit</span>
                      <div className="flex items-baseline gap-xs mt-sm"><span className="font-headline-md font-extrabold text-on-surface">₹4.2L</span></div>
                      <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold mt-sm self-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>Healthy
                      </span>
                    </div>

                    <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between">
                      <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Market Risk Level</span>
                      <div className="flex items-baseline gap-xs mt-sm"><span className="font-headline-md font-extrabold text-on-surface">Medium</span></div>
                      <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold mt-sm self-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>Medium
                      </span>
                    </div>

                    <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between">
                      <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Active Alerts</span>
                      <div className="flex items-baseline gap-xs mt-sm"><span className="font-headline-md font-extrabold text-on-surface">3 Alerts</span></div>
                      <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20 text-[9px] font-bold mt-sm self-start">
                        <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span>Critical
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-lg py-md bg-surface-container-low/40 border-t border-outline-variant/20 flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Click on other sub-tabs to inspect granular models.</span>
                  <button onClick={() => setActiveTab('copilot')} className="text-primary hover:underline font-semibold flex items-center gap-xs">
                    <span>Ask AI Copilot</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Purchase Recommendations Mini */}
              <div className="col-span-12 lg:col-span-4 bg-white rounded-xl card-shadow border border-outline-variant/30 flex flex-col justify-between overflow-hidden">
                <div className="p-lg">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base mb-md">Top AI Recommendation</h3>
                  <div className="p-md rounded-xl border border-tertiary/20 bg-tertiary/5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary">High Severity</span>
                    <h4 className="font-semibold text-xs text-on-surface mt-sm font-headline-sm">Tomato prices increased by 12%.</h4>
                    <p className="text-[11px] text-on-surface-variant mt-sm">Increase Pasta price by ₹10 to offset recipe margin slippage.</p>
                    <p className="text-xs font-bold text-primary mt-sm">Monthly Savings: ₹4,500</p>
                  </div>
                </div>
                <div className="px-lg py-md bg-surface-container-low/40 border-t border-outline-variant/20 text-center">
                  <button onClick={() => setActiveTab('purchase')} className="text-primary text-xs font-semibold hover:underline">View All Recommendations</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Market Intelligence */}
          {activeTab === 'market' && (
            <div className="bg-white rounded-xl card-shadow border border-outline-variant/30 overflow-hidden">
              <div className="p-lg border-b border-outline-variant/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Market Intelligence</h3>
                  <p className="text-[10px] text-on-surface-variant">Live external vendor indices and local wholesale mandi metrics</p>
                </div>

                <div className="flex items-center gap-sm">
                  {/* Category filters */}
                  <div className="flex bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/40 shrink-0">
                    {(['all', 'increasing', 'decreasing', 'stable'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setMarketTab(tab)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold capitalize transition-all ${
                          marketTab === tab 
                            ? 'bg-white text-primary shadow-sm' 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {tab === 'all' ? 'All' : tab === 'increasing' ? '↑ Rising' : tab === 'decreasing' ? '↓ Falling' : '→ Stable'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-xs border-b border-outline-variant/20">
                    <tr>
                      <th className="px-lg py-3 font-semibold">Commodity</th>
                      <th className="px-lg py-3 font-semibold text-right">Today's Price</th>
                      <th className="px-lg py-3 font-semibold text-right">Yesterday's Price</th>
                      <th className="px-lg py-3 font-semibold text-right">Difference</th>
                      <th className="px-lg py-3 font-semibold text-center">Trend</th>
                      <th className="px-lg py-3 font-semibold">AI Prediction Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-xs">
                    {filteredCommodities.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="px-lg py-3.5 font-semibold text-on-surface">{c.name} <span className="text-[10px] text-outline font-normal">({c.unit})</span></td>
                        <td className="px-lg py-3.5 text-right font-semibold text-on-surface">₹{c.todayPrice}</td>
                        <td className="px-lg py-3.5 text-right text-on-surface-variant">₹{c.yesterdayPrice}</td>
                        <td className="px-lg py-3.5 text-right">
                          <span className={`font-bold ${
                            c.trend === 'increasing' ? 'text-tertiary' : 
                            c.trend === 'decreasing' ? 'text-primary' : 
                            'text-on-surface-variant'
                          }`}>
                            {c.difference > 0 ? `+₹${c.difference}` : c.difference < 0 ? `-₹${Math.abs(c.difference)}` : '₹0'}
                          </span>
                        </td>
                        <td className="px-lg py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center font-black text-sm w-6 h-6 rounded-full ${
                            c.trend === 'increasing' ? 'text-tertiary bg-tertiary/10 border border-tertiary/20' : 
                            c.trend === 'decreasing' ? 'text-primary bg-primary/10 border border-primary/20' : 
                            'text-outline bg-surface-container-highest'
                          }`}>
                            {c.trend === 'increasing' ? '↑' : c.trend === 'decreasing' ? '↓' : '→'}
                          </span>
                        </td>
                        <td className="px-lg py-3.5 text-on-surface-variant font-medium leading-tight max-w-[300px] truncate hover:whitespace-normal transition-all" title={c.prediction}>{c.prediction}</td>
                      </tr>
                    ))}
                    {filteredCommodities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-lg py-12 text-center text-on-surface-variant">No commodity matching your search query was found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Forecast & Predictions */}
          {activeTab === 'forecast' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg animate-slide-up">
              {/* Price Trends */}
              <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
                <div className="flex justify-between items-start mb-md">
                  <div className="flex items-center gap-sm">
                    <div className="p-2 rounded-lg bg-tertiary-container/10 text-tertiary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Ingredient Price Trends</h3>
                      <p className="text-[10px] text-on-surface-variant">Fluctuations of bulk commodity price parameters</p>
                    </div>
                  </div>
                </div>
                <div className="h-72 w-full mt-md">
                  <Line data={priceTrendData} options={priceTrendOptions} />
                </div>
              </div>

              {/* Weekly Forecast */}
              <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
                <div className="flex justify-between items-start mb-md">
                  <div className="flex items-center gap-sm">
                    <div className="p-2 rounded-lg bg-primary-container/10 text-primary">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Sales Demand Forecast</h3>
                      <p className="text-[10px] text-on-surface-variant">Predictive sales expectations versus last week actuals</p>
                    </div>
                  </div>
                </div>
                <div className="h-72 w-full mt-md">
                  <Bar data={forecastData} options={forecastOptions} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Supplier Intelligence */}
          {activeTab === 'supplier' && (
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
                <div className="flex items-center gap-sm">
                  <div className="p-2 rounded-lg bg-secondary-container/10 text-secondary">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Supplier Intelligence</h3>
                    <p className="text-[10px] text-on-surface-variant">Predictive rating and reliability grading of wholesale merchants</p>
                  </div>
                </div>

                <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-[10px] font-bold text-on-surface-variant mb-0.5">Min Reliability: {reliabilityThreshold}%</label>
                  <input 
                    type="range" 
                    min="60" 
                    max="95" 
                    value={reliabilityThreshold} 
                    onChange={(e) => setReliabilityThreshold(Number(e.target.value))}
                    className="w-full sm:w-[150px] accent-primary" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
                {filteredSuppliers.map((supplier, idx) => (
                  <div key={idx} className="flex justify-between items-center p-md rounded-xl border border-outline-variant/20 bg-surface-bright hover:bg-surface-container-low/40 transition-colors">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary font-bold text-xs">
                        {supplier.name.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-on-surface">{supplier.name}</p>
                        <p className="text-[10px] text-outline font-medium">{supplier.itemCategory} • Speed: {supplier.deliverySpeed}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-sm justify-end">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          supplier.status === 'excellent' ? 'bg-primary/10 text-primary' :
                          supplier.status === 'good' ? 'bg-secondary/10 text-secondary' :
                          'bg-tertiary/10 text-tertiary'
                        }`}>
                          {supplier.status}
                        </span>
                        <span className="font-bold text-xs text-on-surface">{supplier.reliability}%</span>
                      </div>
                      <p className="text-[9px] text-on-surface-variant opacity-85 mt-0.5">Price Stability: <strong className="capitalize">{supplier.priceStability}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Menu Profitability */}
          {activeTab === 'menu' && (
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
                <div className="flex items-center gap-sm">
                  <div className="p-2 rounded-lg bg-tertiary-container/10 text-tertiary">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Menu Profitability</h3>
                    <p className="text-[10px] text-on-surface-variant">Recipe profitability parameters and margin health metrics</p>
                  </div>
                </div>

                <select 
                  value={menuSort}
                  onChange={(e) => setMenuSort(e.target.value as any)}
                  className="px-sm py-1 border border-outline-variant/40 rounded-lg text-xs bg-surface-bright font-semibold outline-none"
                >
                  <option value="margin">Sort by Margin</option>
                  <option value="cost">Sort by Recipe Cost</option>
                  <option value="price">Sort by Sale Price</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                {sortedMenuMargins.map((item, idx) => (
                  <div key={idx} className="p-md rounded-xl border border-outline-variant/20 bg-surface-bright hover:border-outline-variant transition-colors flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-xs">
                      <p className="font-bold text-xs text-on-surface">{item.name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        item.status === 'healthy' ? 'bg-primary/10 text-primary' :
                        item.status === 'warning' ? 'bg-secondary/10 text-secondary' :
                        'bg-tertiary/10 text-tertiary'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-xs text-[10px] text-on-surface-variant mt-sm pt-sm border-t border-outline-variant/10">
                      <div>
                        <p className="text-outline">Recipe Cost</p>
                        <p className="font-semibold text-on-surface">₹{item.recipeCost}</p>
                      </div>
                      <div>
                        <p className="text-outline">Sale Price</p>
                        <p className="font-semibold text-on-surface">₹{item.sellingPrice}</p>
                      </div>
                      <div>
                        <p className="text-outline">Margin</p>
                        <p className="font-bold text-primary">{item.margin}%</p>
                      </div>
                    </div>

                    <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden mt-md">
                      <div 
                        className={`h-full rounded-full ${
                          item.status === 'healthy' ? 'bg-primary' :
                          item.status === 'warning' ? 'bg-secondary' :
                          'bg-tertiary'
                        }`} 
                        style={{ width: `${item.margin}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Inventory Insights */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
              <div className="flex items-center gap-sm mb-lg">
                <div className="p-2 rounded-lg bg-primary-container/10 text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Inventory Insights</h3>
                  <p className="text-[10px] text-on-surface-variant">Predictive ingredient depletion warnings and replenishment triggers</p>
                </div>
              </div>

              <div className="space-y-md">
                {filteredInventory.map((item) => {
                  const isOrdered = autoOrderedItems[item.id];
                  return (
                    <div key={item.id} className="p-md rounded-xl border border-outline-variant/20 bg-surface-bright flex justify-between items-center gap-md">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-xs">
                          <p className="font-bold text-xs text-on-surface truncate">{item.name}</p>
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.status === 'critical' ? 'bg-tertiary animate-pulse' :
                            item.status === 'reorder' ? 'bg-secondary' :
                            'bg-primary'
                          }`}></span>
                        </div>
                        
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Available Stock: <strong className="text-on-surface font-semibold">{item.stock} {item.unit}</strong> • Expected depletion in: <strong className="text-tertiary font-bold">{item.runoutDays} days</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => triggerAutoOrder(item.id)}
                        disabled={isOrdered}
                        className={`px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 transition-all ${
                          isOrdered 
                            ? 'bg-primary/10 text-primary cursor-default' 
                            : 'bg-primary text-on-primary hover:brightness-110 active:scale-95'
                        }`}
                      >
                        {isOrdered ? 'Order Placed' : `Dispatch +${item.autoOrderQty} ${item.unit}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: Waste Analysis */}
          {activeTab === 'waste' && (
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
                <div className="flex items-center gap-sm">
                  <div className="p-2 rounded-lg bg-tertiary-container/10 text-tertiary">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">Waste Analysis</h3>
                    <p className="text-[10px] text-on-surface-variant">Quantified prep loss parameters and food spoilage calculations</p>
                  </div>
                </div>

                {/* Timeframe switch */}
                <div className="flex bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/40 shrink-0">
                  <button
                    onClick={() => setWasteTimeframe('thisWeek')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                      wasteTimeframe === 'thisWeek' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setWasteTimeframe('lastWeek')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                      wasteTimeframe === 'lastWeek' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'
                    }`}
                  >
                    Last Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mt-md">
                {/* Waste cost */}
                <div className="text-center py-xl rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col justify-center">
                  <p className="text-xs text-outline uppercase font-extrabold tracking-wider">Estimated Waste Loss Value</p>
                  <p className="font-headline-lg text-headline-lg font-black text-tertiary mt-sm">₹{wasteDistribution.total.toLocaleString()}</p>
                </div>

                {/* Breakdown list */}
                <div className="space-y-sm text-xs md:col-span-2 p-md border border-outline-variant/20 rounded-xl bg-surface-bright flex flex-col justify-center">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-on-surface mb-0.5">
                      <span>Spoilage / Expiry</span>
                      <span>{wasteDistribution.spoilage}%</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full rounded-full" style={{ width: `${wasteDistribution.spoilage}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-on-surface mb-0.5">
                      <span>Overproduction in Kitchen</span>
                      <span>{wasteDistribution.overprep}%</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: `${wasteDistribution.overprep}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-on-surface mb-0.5">
                      <span>Customer Leftovers</span>
                      <span>{wasteDistribution.leftovers}%</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                      <div className="bg-outline-variant h-full rounded-full" style={{ width: `${wasteDistribution.leftovers}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable tip */}
              <div className="mt-lg p-md rounded-xl bg-primary/5 border border-primary/10 flex gap-sm items-start">
                <Flame className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <strong className="text-primary font-bold">Waste Reduction Suggestion:</strong> Weather models predict rain this weekend. Reducing prep on perishable meats by 15% will yield high cost savings.
                </p>
              </div>
            </div>
          )}

          {/* TAB 8: Purchase Recommendations */}
          {activeTab === 'purchase' && (
            <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30">
              <div className="flex justify-between items-center mb-lg">
                <div className="flex items-center gap-sm">
                  <div className="p-2 rounded-lg bg-secondary-container/10 text-secondary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">AI Purchase & Pricing Recommendations</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {recommendations.map((rec) => {
                  const isApplied = appliedRecommendations[rec.id];
                  return (
                    <div 
                      key={rec.id} 
                      className={`p-md rounded-xl border transition-all flex flex-col justify-between ${
                        isApplied 
                          ? 'bg-primary/5 border-primary/20 opacity-80' 
                          : 'bg-surface-bright border-outline-variant/20 hover:border-outline-variant'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-sm mb-sm">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            rec.severity === 'High' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' :
                            rec.severity === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                            'bg-secondary/10 text-secondary border border-secondary/20'
                          }`}>
                            {rec.severity} Severity
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-on-surface mb-xs font-headline-sm">{rec.title}</h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed mb-md">{rec.description}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-sm mt-md pt-sm border-t border-outline-variant/10">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-outline uppercase font-semibold">Est. Monthly Savings</span>
                          <span className="font-bold text-xs text-primary font-body-md">₹{rec.savings.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => toggleRecommendation(rec.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-xs shrink-0 ${
                            isApplied 
                              ? 'bg-primary text-on-primary' 
                              : 'bg-surface-container-highest hover:bg-outline-variant/30 text-on-surface'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Applied</span>
                            </>
                          ) : (
                            <span>{rec.actionText}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 9: AI Copilot */}
          {activeTab === 'copilot' && (
            <div className="bg-white rounded-xl card-shadow border border-outline-variant/30 overflow-hidden flex flex-col h-[550px]">
              {/* Header */}
              <div className="px-lg py-md border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
                <div className="flex items-center gap-sm">
                  <div className="p-2 rounded-lg bg-primary-container/10 text-primary animate-pulse">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">ServeFlow AI Copilot</h3>
                    <p className="text-[10px] text-on-surface-variant">Ask questions about menu pricing, recipes, inventory replenishment, or forecasts</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                  Active Agent
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-lg space-y-md bg-surface-bright custom-scrollbar">
                {chatHistory.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[75%] rounded-2xl p-md text-xs relative ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-on-primary rounded-tr-none' 
                          : 'bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      
                      {msg.table && msg.table.length > 0 && (
                        <div className="mt-md overflow-x-auto border border-outline-variant/30 rounded-lg bg-surface-bright p-sm">
                          <table className="min-w-full text-[10px] text-on-surface">
                            <thead>
                              <tr className="border-b border-outline-variant/20">
                                {Object.keys(msg.table[0]).map((key) => (
                                  <th key={key} className="px-sm py-1 text-left font-bold uppercase tracking-wider text-[8px] text-outline">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.table.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-container-low/20">
                                  {Object.values(row).map((val: any, cIdx) => (
                                    <td key={cIdx} className="px-sm py-1 font-semibold text-on-surface">
                                      {val}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-md space-y-xs border-t border-outline-variant/10 pt-sm">
                          <p className="text-[9px] uppercase font-bold text-primary">Recommended Actions:</p>
                          <ul className="list-disc pl-sm space-y-1">
                            {msg.recommendations.map((rec, idx) => (
                              <li key={idx} className="font-semibold text-[10px] text-on-surface-variant leading-relaxed">
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <span className={`text-[8px] mt-1.5 block text-right opacity-60 ${
                        msg.sender === 'user' ? 'text-on-primary' : 'text-on-surface-variant'
                      }`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-2xl rounded-tl-none p-md text-xs flex items-center gap-sm">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-[10px] text-outline font-semibold">AI is analyzing database parameters...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChat} className="p-md border-t border-outline-variant/20 bg-surface-container-low flex gap-md">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask copilot: 'How can I save on Salmon?' or 'Why are tomato prices rising?'..."
                  className="flex-1 bg-white border border-outline-variant/40 rounded-xl px-md py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                />
                <button 
                  type="submit"
                  className="px-md bg-primary text-on-primary rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-xs font-bold text-xs"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 10: Reports */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg animate-slide-up">
              {/* Export AI audit logs */}
              <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30 flex flex-col justify-between h-[220px]">
                <div>
                  <div className="flex items-center gap-sm mb-sm">
                    <div className="p-2 rounded-lg bg-primary-container/10 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-on-surface font-headline-sm">Generate AI Operational Audit Report</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-sm leading-relaxed">
                    Export a comprehensive PDF summary detailing all applied safety stock adjustments, menu pricing shifts, price warnings, and supplier reliability ratings over the last 30 days.
                  </p>
                </div>
                <button 
                  onClick={() => alert('PDF Audit report compiled and downloaded successfully.')}
                  className="w-full sm:w-auto self-start mt-md px-xl py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110 active:scale-95 flex items-center justify-center gap-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Audit</span>
                </button>
              </div>

              {/* Model Performance metrics */}
              <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant/30 flex flex-col justify-between h-[220px]">
                <div>
                  <div className="flex items-center gap-sm mb-sm">
                    <div className="p-2 rounded-lg bg-secondary-container/10 text-secondary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-on-surface font-headline-sm">AI Model Health Log</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-sm leading-relaxed">
                    Overview of the core backend forecasting and scoring model metrics. Accuracy indices are calculated daily against POS actuals.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-md text-[11px] mt-md pt-sm border-t border-outline-variant/10">
                  <div>
                    <span className="text-outline block">Demand Model MAPEs</span>
                    <strong className="text-primary font-bold font-body-md">5.2% (94.8% Accuracy)</strong>
                  </div>
                  <div>
                    <span className="text-outline block">Price Prediction Accuracy</span>
                    <strong className="text-primary font-bold font-body-md">91.4% Confidence</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AIIntelligence;
