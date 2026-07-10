import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  Calendar, 
  Wallet, 
  Server, 
  Users, 
  UserCheck, 
  CreditCard, 
  Settings, 
  CheckCircle2, 
  X, 
  ArrowUpRight, 
  DollarSign, 
  PieChart, 
  AlertCircle,
  FolderPlus,
  BarChart3
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  category: string;
  subCategory: string;
  amount: number;
  paymentMode: string;
  desc: string;
  date: string;
}

interface CategoryOption {
  name: string;
  subCategories: string[];
}

const defaultCategories: CategoryOption[] = [
  { name: 'Vendor', subCategories: ['Sabzi', 'Milk & Dairy', 'Meat & Seafood', 'Groceries', 'Spices & Condiments'] },
  { name: 'Utility & Bills', subCategories: ['Electricity Bill', 'Water Bill', 'Internet & Wi-Fi', 'Gas Cylinder'] },
  { name: 'Kitchen Supplies', subCategories: ['Packaging Boxes', 'Napkins & Tissues', 'Cleaning Chemicals', 'Utensils'] },
  { name: 'Maintenance', subCategories: ['AC Servicing', 'Plumbing & Repairs', 'Exhaust & Chimney Cleaning', 'Electrical'] },
  { name: 'Salary & Wages', subCategories: ['Daily Wage Helper', 'Chef Advance', 'Staff Incentive', 'Security Staff'] },
  { name: 'Petty Cash', subCategories: ['Tea & Refreshment', 'Stationery', 'Local Conveyance', 'Miscellaneous'] }
];

const initialExpenses: ExpenseItem[] = [
  { id: 'exp-1', category: 'Vendor', subCategory: 'Sabzi', amount: 2000, paymentMode: 'Cash', desc: '', date: '30 April 2024 8:04 PM' },
  { id: 'exp-2', category: 'Vendor', subCategory: 'Milk & Dairy', amount: 1450, paymentMode: 'Cash', desc: 'Daily morning fresh milk & paneer supply', date: '30 April 2024 6:30 AM' },
  { id: 'exp-3', category: 'Utility & Bills', subCategory: 'Electricity Bill', amount: 8400, paymentMode: 'Bank Transfer', desc: 'Monthly AC & dining lights commercial tariff', date: '29 April 2024 4:15 PM' },
  { id: 'exp-4', category: 'Kitchen Supplies', subCategory: 'Gas Cylinder', amount: 3800, paymentMode: 'GooglePay', desc: '2x 19kg Commercial LPG cylinder refill', date: '28 April 2024 11:20 AM' },
  { id: 'exp-5', category: 'Maintenance', subCategory: 'AC Servicing', amount: 1200, paymentMode: 'Cash', desc: 'Dining room split AC cooling coil washing & gas check', date: '27 April 2024 2:00 PM' },
  { id: 'exp-6', category: 'Salary & Wages', subCategory: 'Daily Wage Helper', amount: 1500, paymentMode: 'Cash', desc: 'Extra weekend cleaning helper for banquet kitchen', date: '26 April 2024 9:00 PM' },
  { id: 'exp-7', category: 'Petty Cash', subCategory: 'Tea & Refreshment', amount: 180, paymentMode: 'Paytm', desc: 'Evening snacks & chai for kitchen night shift', date: '26 April 2024 5:30 PM' }
];

const mockNCRData = [
  { id: 'ncr-1', dept: 'Main Kitchen', item: 'Butter Chicken Portion (Tester)', qty: 2, cost: 240, reason: 'Quality check & new recipe seasoning validation', approvedBy: 'Head Chef Sharma', date: '30 April 2024 1:30 PM' },
  { id: 'ncr-2', dept: 'Service Floor', item: 'Deluxe Thali (Complimentary)', qty: 1, cost: 180, reason: 'Customer replacement due to extra spicy feedback', approvedBy: 'Floor Manager Rahul', date: '29 April 2024 8:45 PM' },
  { id: 'ncr-3', dept: 'Pantry Bar', item: 'Virgin Mojito Syrup Bottle', qty: 1, cost: 350, reason: 'Accidental breakage near bar counter sink', approvedBy: 'Admin JD', date: '28 April 2024 4:10 PM' },
  { id: 'ncr-4', dept: 'Staff Cafeteria', item: 'Staff Lunch Meal Pack', qty: 18, cost: 1440, reason: 'Daily standard staff lunch complimentary allowance', approvedBy: 'HR Desk', date: '28 April 2024 2:00 PM' }
];

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('serveflow_expenses_list');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [categories, setCategories] = useState<CategoryOption[]>(() => {
    const saved = localStorage.getItem('serveflow_expense_categories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'graph' | 'ncr'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [isFetching, setIsFetching] = useState(false);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // New Expense Form State
  const [newExpenseCategory, setNewExpenseCategory] = useState('Vendor');
  const [newExpenseSubCategory, setNewExpenseSubCategory] = useState('Sabzi');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpensePaymentMode, setNewExpensePaymentMode] = useState('Cash');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSublist, setNewCatSublist] = useState('');

  useEffect(() => {
    localStorage.setItem('serveflow_expenses_list', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('serveflow_expense_categories', JSON.stringify(categories));
  }, [categories]);

  const activeSubCategories = categories.find(c => c.name === newExpenseCategory)?.subCategories || ['General'];

  const handleFetch = () => {
    setIsFetching(true);
    setTimeout(() => setIsFetching(false), 450);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newExpenseAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: newExpenseCategory,
      subCategory: newExpenseSubCategory || 'General',
      amount: amountVal,
      paymentMode: newExpensePaymentMode,
      desc: newExpenseDesc.trim(),
      date: nowStr
    };

    setExpenses([newExp, ...expenses]);
    setNewExpenseAmount('');
    setNewExpenseDesc('');
    setIsAddExpenseOpen(false);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Please enter a category name.');
      return;
    }

    const subs = newCatSublist
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newCat: CategoryOption = {
      name: newCatName.trim(),
      subCategories: subs.length > 0 ? subs : ['General']
    };

    setCategories([...categories, newCat]);
    setNewExpenseCategory(newCat.name);
    if (newCat.subCategories[0]) setNewExpenseSubCategory(newCat.subCategories[0]);
    
    setNewCatName('');
    setNewCatSublist('');
    setIsAddCategoryOpen(false);
  };

  const filteredExpenses = selectedCategoryFilter === 'All' 
    ? expenses 
    : expenses.filter(e => e.category === selectedCategoryFilter);

  const totalExpenseAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const handleExportExcel = () => {
    const headers = ['Category', 'Sub-category', 'Amount (INR)', 'Payment Mode', 'Description', 'Date & Time'];
    const rows = filteredExpenses.map(e => [
      `"${e.category}"`,
      `"${e.subCategory}"`,
      e.amount.toFixed(2),
      `"${e.paymentMode}"`,
      `"${e.desc}"`,
      `"${e.date}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ServeFlow_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col p-6 gap-6 font-sans">
      
      {/* Top Banner Header matching screenshot (`Expense Management` banner & Action buttons) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#006c49] text-white p-5 rounded-2xl shadow-md">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider">Expense Management</h1>
          <p className="text-xs text-emerald-100 font-medium">Track supplier bills, daily petty cash, repairs & store requisitions</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="bg-[#1e1b4b] hover:bg-[#312e81] text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-sm flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="bg-[#1e1b4b] hover:bg-[#312e81] text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-sm flex items-center gap-2 active:scale-95 transition-all"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>+ Add Category</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout with Left Sub-Sidebar + Right Pane matching exact screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sub-Sidebar Menu (similar to screenshot left white panel) */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col gap-3">
          {/* IP Address Card */}
          <div className="flex items-center gap-2.5 bg-emerald-700 text-white px-4 py-3 rounded-xl font-mono text-xs font-bold shadow-sm">
            <Server className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>IP: 192.168.10.47 (Active)</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-50 text-[#006c49] font-black text-sm border-l-4 border-[#006c49] transition-all text-left shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#006c49]" />
              <span>Add Expense</span>
            </button>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer text-left">
              <Users className="w-4 h-4 text-gray-500" />
              <span>User Management</span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer text-left">
              <UserCheck className="w-4 h-4 text-gray-500" />
              <span>Customer Management</span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer text-left">
              <Wallet className="w-4 h-4 text-gray-500" />
              <span>Wallet Management</span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer text-left">
              <Settings className="w-4 h-4 text-gray-500" />
              <span>Account Settings</span>
            </div>
          </div>

          {/* Mini Budget status box */}
          <div className="mt-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">April Petty Cash Limit</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-black text-on-surface">₹ {totalExpenseAmount.toFixed(0)}</span>
              <span className="text-xs font-bold text-emerald-600">of ₹ 50,000</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-[#006c49] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((totalExpenseAmount / 50000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Main Content Pane */}
        <div className="lg:col-span-9 bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col gap-6">
          
          {/* Top Tabs matching screenshot (`Overview`, `All Expenses`, `Graph`, `NCR Report`) */}
          <div className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-2 text-sm transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-[#006c49] text-[#006c49] font-bold'
                  : 'text-gray-500 font-semibold hover:text-gray-800'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-2 text-sm transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-b-2 border-[#006c49] text-[#006c49] font-bold'
                  : 'text-gray-500 font-semibold hover:text-gray-800'
              }`}
            >
              All Expenses
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`py-3 px-2 text-sm transition-all whitespace-nowrap ${
                activeTab === 'graph'
                  ? 'border-b-2 border-[#006c49] text-[#006c49] font-bold'
                  : 'text-gray-500 font-semibold hover:text-gray-800'
              }`}
            >
              Graph
            </button>

            <button
              onClick={() => setActiveTab('ncr')}
              className={`py-3 px-2 text-sm transition-all whitespace-nowrap ${
                activeTab === 'ncr'
                  ? 'border-b-2 border-[#006c49] text-[#006c49] font-bold'
                  : 'text-gray-500 font-semibold hover:text-gray-800'
              }`}
            >
              NCR Report
            </button>
          </div>

          {/* ======================= TAB 1: ALL EXPENSES (Exact Screenshot Grid) ======================= */}
          {activeTab === 'all' && (
            <div className="flex flex-col gap-4">
              
              {/* Filter Row matching screenshot (`All`, Date box, `Fetch`, `Export to Excel`) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-[#1e1b4b] text-white px-4 py-2 rounded-xl font-bold text-xs tracking-wider outline-none cursor-pointer shadow-sm"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((c, idx) => (
                      <option key={idx} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <div className="bg-white border border-gray-300 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-2 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-[#006c49]" />
                    <span>30 April 2024 12:00 AM - 30 April 2024 11:59 PM</span>
                  </div>

                  <button
                    onClick={handleFetch}
                    className="bg-[#1e1b4b] hover:bg-[#312e81] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all"
                  >
                    {isFetching ? 'Fetching...' : 'Fetch'}
                  </button>
                </div>

                <button
                  onClick={handleExportExcel}
                  className="bg-[#1e1b4b] hover:bg-[#312e81] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Export to Excel</span>
                </button>
              </div>

              {/* Exact Expense Table matching screenshot */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-200/80 text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 border-r border-gray-300">Category</th>
                      <th className="py-3 px-4 border-r border-gray-300">Sub-category</th>
                      <th className="py-3 px-4 border-r border-gray-300 text-center">Amount</th>
                      <th className="py-3 px-4 border-r border-gray-300 text-center">Payment Mode</th>
                      <th className="py-3 px-4 border-r border-gray-300">Desc</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs font-semibold text-gray-800">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">No expense records found in this filter. Click "+ Add Expense" to record new bills.</td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900 border-r border-gray-200">{exp.category}</td>
                          <td className="py-3.5 px-4 font-medium text-gray-700 border-r border-gray-200">{exp.subCategory}</td>
                          <td className="py-3.5 px-4 text-center font-black text-[#006c49] border-r border-gray-200">₹ {exp.amount.toFixed(0)}</td>
                          <td className="py-3.5 px-4 text-center border-r border-gray-200">
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-[11px]">{exp.paymentMode}</span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 font-normal border-r border-gray-200 max-w-[220px] truncate">{exp.desc}</td>
                          <td className="py-3.5 px-4 text-right font-medium text-gray-600">{exp.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-black text-xs text-on-surface">
                      <td colSpan={2} className="py-4 px-4 text-right uppercase text-gray-600">Total Expenses:</td>
                      <td className="py-4 px-4 text-center font-black text-base text-[#006c49] border-l border-r border-gray-300">
                        ₹ {totalExpenseAmount.toFixed(2)}
                      </td>
                      <td colSpan={3} className="py-4 px-4 text-gray-500 font-medium">
                        {filteredExpenses.length} transaction records processed
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination matching screenshot */}
              <div className="flex items-center justify-end gap-3 text-xs font-bold text-gray-600 pt-2">
                <span className="cursor-pointer hover:text-primary">Previous</span>
                <span className="px-3 py-1.5 bg-[#1e1b4b] text-white rounded font-black">1</span>
                <span className="cursor-pointer hover:text-primary">Next</span>
              </div>
            </div>
          )}

          {/* ======================= TAB 2: OVERVIEW ======================= */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Recorded Expenses</span>
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-950">₹ {totalExpenseAmount.toFixed(2)}</div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Across {filteredExpenses.length} verified vouchers</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Cash vs Online Split</span>
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-xl font-black text-blue-950">
                    ₹ {expenses.filter(e => e.paymentMode === 'Cash').reduce((s, e) => s + e.amount, 0).toFixed(0)} <span className="text-xs font-normal">Cash</span> / ₹ {expenses.filter(e => e.paymentMode !== 'Cash').reduce((s, e) => s + e.amount, 0).toFixed(0)} <span className="text-xs font-normal">Online</span>
                  </div>
                  <div className="text-xs font-semibold text-blue-700">All petty cash tallied against till</div>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Highest Expense Area</span>
                    <PieChart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-amber-950">Utility & Bills (₹ 8,400)</div>
                  <div className="text-xs font-semibold text-amber-700">45.8% of total current vouchers</div>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 p-4 font-bold text-xs uppercase tracking-wider text-gray-700">Category-wise Summary</div>
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <tr>
                      <th className="p-3">Category Name</th>
                      <th className="p-3">Sub-categories Active</th>
                      <th className="p-3 text-center">Voucher Count</th>
                      <th className="p-3 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((c, idx) => {
                      const catExps = expenses.filter(e => e.category === c.name);
                      const catTotal = catExps.reduce((s, e) => s + e.amount, 0);
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-900">{c.name}</td>
                          <td className="p-3 text-gray-600">{c.subCategories.join(', ')}</td>
                          <td className="p-3 text-center font-bold">{catExps.length}</td>
                          <td className="p-3 text-right font-black text-primary">₹ {catTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB 3: GRAPH ======================= */}
          {activeTab === 'graph' && (
            <div className="flex flex-col gap-6 items-center justify-center py-12 bg-surface-container-low rounded-xl border border-dashed border-gray-300">
              <BarChart3 className="w-12 h-12 text-[#006c49] opacity-80" />
              <div className="text-center">
                <h3 className="text-base font-bold text-on-surface">Category Expenditure Trends</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md">Visual distribution of daily and weekly overhead bills plotted across vendor categories and payment channels.</p>
              </div>

              {/* Mock Bar chart representation */}
              <div className="w-full max-w-2xl px-6 py-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3">
                {categories.map((c, idx) => {
                  const catExps = expenses.filter(e => e.category === c.name);
                  const catTotal = catExps.reduce((s, e) => s + e.amount, 0);
                  const pct = totalExpenseAmount > 0 ? (catTotal / totalExpenseAmount) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center gap-4 text-xs font-bold">
                      <span className="w-32 truncate text-gray-700">{c.name}</span>
                      <div className="flex-1 bg-gray-100 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#006c49] h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="w-24 text-right font-black text-gray-900">₹ {catTotal.toFixed(0)} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================= TAB 4: NCR REPORT ======================= */}
          {activeTab === 'ncr' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900 font-medium">
                  <strong>Non-Chargeable Requisition (NCR) & Wastage Register:</strong> Tracks all complimentary customer meals, staff daily cafeteria allowance, recipe testing, and internal kitchen stock requisitions.
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-gray-200/80 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 border-r border-gray-300">Voucher ID</th>
                      <th className="py-3 px-4 border-r border-gray-300">Department</th>
                      <th className="py-3 px-4 border-r border-gray-300">Item / Requisition</th>
                      <th className="py-3 px-4 border-r border-gray-300 text-center">Qty</th>
                      <th className="py-3 px-4 border-r border-gray-300 text-right">Approx Cost</th>
                      <th className="py-3 px-4 border-r border-gray-300">Reason / Justification</th>
                      <th className="py-3 px-4">Approved By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {mockNCRData.map((ncr) => (
                      <tr key={ncr.id} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4 font-bold text-gray-900 border-r border-gray-200">{ncr.id}</td>
                        <td className="py-3.5 px-4 font-bold text-primary border-r border-gray-200">{ncr.dept}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900 border-r border-gray-200">{ncr.item}</td>
                        <td className="py-3.5 px-4 text-center border-r border-gray-200">{ncr.qty}</td>
                        <td className="py-3.5 px-4 text-right font-black text-amber-700 border-r border-gray-200">₹ {ncr.cost.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-gray-600 border-r border-gray-200">{ncr.reason}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-800">{ncr.approvedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-black text-xs text-on-surface">
                      <td colSpan={4} className="py-3.5 px-4 text-right uppercase">Total NCR & Requisitions Value:</td>
                      <td className="py-3.5 px-4 text-right text-amber-800 font-black border-l border-r border-gray-300">
                        ₹ {mockNCRData.reduce((s, n) => s + n.cost, 0).toFixed(2)}
                      </td>
                      <td colSpan={2} className="py-3.5 px-4 text-gray-500 font-medium">Tally verified by Store Audit</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ======================= MODAL: ADD EXPENSE ======================= */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#006c49] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#006c49]" />
                  <span>Record New Expense</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">Add a supplier bill or petty cash voucher</p>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700">Category</label>
                  <select
                    value={newExpenseCategory}
                    onChange={(e) => {
                      setNewExpenseCategory(e.target.value);
                      const found = categories.find(c => c.name === e.target.value);
                      if (found && found.subCategories[0]) {
                        setNewExpenseSubCategory(found.subCategories[0]);
                      }
                    }}
                    className="p-2.5 bg-surface-container-low rounded-xl border border-gray-300 outline-none focus:border-[#006c49] font-bold"
                  >
                    {categories.map((c, idx) => (
                      <option key={idx} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700">Sub-category</label>
                  <select
                    value={newExpenseSubCategory}
                    onChange={(e) => setNewExpenseSubCategory(e.target.value)}
                    className="p-2.5 bg-surface-container-low rounded-xl border border-gray-300 outline-none focus:border-[#006c49] font-bold"
                  >
                    {activeSubCategories.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700">Amount (INR ₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2000"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    required
                    className="p-2.5 bg-surface-container-low rounded-xl border border-gray-300 outline-none focus:border-[#006c49] font-black text-sm text-[#006c49]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700">Payment Mode</label>
                  <select
                    value={newExpensePaymentMode}
                    onChange={(e) => setNewExpensePaymentMode(e.target.value)}
                    className="p-2.5 bg-surface-container-low rounded-xl border border-gray-300 outline-none focus:border-[#006c49] font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GooglePay">GooglePay</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700">Description / Bill Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Daily morning vegetables supply invoice #458"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  className="p-2.5 bg-surface-container-low rounded-xl border border-gray-300 outline-none focus:border-[#006c49] font-normal resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#006c49] text-white font-black hover:bg-[#005a3c] shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD CATEGORY ======================= */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1e1b4b] flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-500" />
                  <span>Add Expense Category</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">Create a custom expense grouping</p>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Store Repairs & Hardware"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="p-2.5 bg-surface-container-low rounded-xl border border-gray-300 outline-none focus:border-[#1e1b4b] font-bold text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700">Sub-categories (Comma separated) *</label>
                <input
                  type="text"
                  placeholder="e.g. Plumbing, Oven Spares, Paint, Carpentry"
                  value={newCatSublist}
                  onChange={(e) => setNewCatSublist(e.target.value)}
                  required
                  className="p-2.5 bg-surface-container-low rounded-xl border border-gray-300 outline-none focus:border-[#1e1b4b] font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1e1b4b] text-white font-black hover:bg-[#312e81] shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;
