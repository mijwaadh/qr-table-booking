import type { Table, Order, MenuItem } from '../types';

export interface CopilotResponse {
  text: string;
  table?: { [key: string]: string | number }[];
  recommendations?: string[];
  executedAction?: string;
  actionButtons?: { label: string; route: string }[];
}

export const processCopilotQuery = async (
  query: string,
  tables: Table[],
  orders: Order[],
  _menuItems: MenuItem[],
  navigate?: (path: string) => void,
  actions?: {
    setTableStatus?: (tableId: string, status: Table['status'], amount?: number) => void;
    updateOrderStatus?: (orderId: string, status: Order['status']) => void;
    showGlobalNotification?: (msg: string) => void;
  }
): Promise<CopilotResponse> => {
  const q = query.trim().toLowerCase();

  // -------------------------------------------------------------
  // 1. NAVIGATION / OPEN COMMANDS ("open dashboard", "open sidebars", etc.)
  // -------------------------------------------------------------
  if (
    q.startsWith('open ') ||
    q.startsWith('go to ') ||
    q.startsWith('show ') ||
    q.startsWith('navigate to ') ||
    q.includes('open dashboard') ||
    q.includes('open kds') ||
    q.includes('open payments') ||
    q.includes('open tables') ||
    q.includes('open reports') ||
    q.includes('open ai')
  ) {
    if (q.includes('dashboard') || q === 'open home' || q === 'go home') {
      if (navigate) navigate('/');
      actions?.showGlobalNotification?.('AI Copilot: Navigated to Dashboard');
      return {
        text: '⚡ **System Command Executed:** Navigating directly to the **Live Operations Dashboard (`/`)**.\nHere you can monitor live table revenue, hourly ticket density, and critical alert feeds.',
        executedAction: 'Navigated to Dashboard (`/`)',
        actionButtons: [{ label: 'View Kitchen KDS', route: '/kds' }, { label: 'Open Payments', route: '/billing' }]
      };
    }
    if (q.includes('kds') || q.includes('kitchen')) {
      if (navigate) navigate('/kds');
      actions?.showGlobalNotification?.('AI Copilot: Opened Kitchen KDS');
      const pendingTickets = orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length;
      return {
        text: `⚡ **System Command Executed:** Opening **Kitchen Display System (KDS)** (` + `/kds` + `).\nCurrently there are **${pendingTickets} active kitchen tickets** in preparation queue.`,
        executedAction: 'Navigated to Kitchen Display System (`/kds`)',
        actionButtons: [{ label: 'View Floor Console', route: '/tables' }]
      };
    }
    if (q.includes('payment') || q.includes('billing') || q.includes('checkout') || q.includes('settle')) {
      if (navigate) navigate('/billing');
      actions?.showGlobalNotification?.('AI Copilot: Opened Payments Terminal');
      const pendingCount = tables.filter(t => t.status === 'PAYMENT_PENDING').length;
      return {
        text: `⚡ **System Command Executed:** Opening **Payments & Checkout Terminal** (` + `/billing` + `).\nYou currently have **${pendingCount} tables** ready for immediate bill settlement.`,
        executedAction: 'Navigated to Payments (`/billing`)',
        actionButtons: [{ label: 'Open Tables Console', route: '/tables' }]
      };
    }
    if (q.includes('table') || q.includes('floor') || q.includes('seat')) {
      if (navigate) navigate('/tables');
      actions?.showGlobalNotification?.('AI Copilot: Opened Tables Console');
      const freeCount = tables.filter(t => t.status === 'AVAILABLE').length;
      return {
        text: `⚡ **System Command Executed:** Opening **Interactive Tables & Floor Console** (` + `/tables` + `).\nThere are **${freeCount} free tables** available for new guest seating right now.`,
        executedAction: 'Navigated to Tables Console (`/tables`)',
        actionButtons: [{ label: 'Open Mobile Order', route: '/order-now' }]
      };
    }
    if (q.includes('market') && q.includes('intelligence')) {
      if (navigate) navigate('/ai-intelligence?tab=market');
      return {
        text: '⚡ **System Command Executed:** Switched to **Market Intelligence & Wholesale Prices** (`/ai-intelligence?tab=market`).',
        executedAction: 'Switched to Market Intelligence Sub-tab'
      };
    }
    if (q.includes('forecast') || q.includes('prediction')) {
      if (navigate) navigate('/ai-intelligence?tab=forecast');
      return {
        text: '⚡ **System Command Executed:** Switched to **30-Day Price Forecast & Predictions** (`/ai-intelligence?tab=forecast`).',
        executedAction: 'Switched to Forecast Sub-tab'
      };
    }
    if (q.includes('supplier')) {
      if (navigate) navigate('/ai-intelligence?tab=supplier');
      return {
        text: '⚡ **System Command Executed:** Switched to **Supplier Reliability & Price Comparison** (`/ai-intelligence?tab=supplier`).',
        executedAction: 'Switched to Supplier Intelligence Sub-tab'
      };
    }
    if (q.includes('menu') && (q.includes('profit') || q.includes('margin'))) {
      if (navigate) navigate('/ai-intelligence?tab=menu');
      return {
        text: '⚡ **System Command Executed:** Switched to **Menu Profitability Matrix** (`/ai-intelligence?tab=menu`).',
        executedAction: 'Switched to Menu Profitability Sub-tab'
      };
    }
    if (q.includes('inventory')) {
      if (navigate) navigate('/ai-intelligence?tab=inventory');
      return {
        text: '⚡ **System Command Executed:** Switched to **Inventory Runout Insights** (`/ai-intelligence?tab=inventory`).',
        executedAction: 'Switched to Inventory Insights Sub-tab'
      };
    }
    if (q.includes('waste')) {
      if (navigate) navigate('/ai-intelligence?tab=waste');
      return {
        text: '⚡ **System Command Executed:** Switched to **Waste & Spoilage Analysis** (`/ai-intelligence?tab=waste`).',
        executedAction: 'Switched to Waste Analysis Sub-tab'
      };
    }
    if (q.includes('purchase') || q.includes('checklist')) {
      if (navigate) navigate('/ai-intelligence?tab=purchase');
      return {
        text: '⚡ **System Command Executed:** Switched to **Immediate Purchase Recommendations Checklist** (`/ai-intelligence?tab=purchase`).',
        executedAction: 'Switched to Purchase Recommendations Sub-tab'
      };
    }
    if (q.includes('ai') || q.includes('intelligence') || q.includes('model')) {
      if (navigate) navigate('/ai-intelligence');
      actions?.showGlobalNotification?.('AI Copilot: Opened AI Intelligence Center');
      return {
        text: '⚡ **System Command Executed:** Opening **AI Intelligence Center** (`/ai-intelligence`).\nYou have 10 live neural subsystems analyzing cost logs, recipes, and vendor metrics.',
        executedAction: 'Navigated to AI Intelligence (`/ai-intelligence`)'
      };
    }
    if (q.includes('report') || q.includes('audit') || q.includes('analytics')) {
      if (navigate) navigate('/reports');
      actions?.showGlobalNotification?.('AI Copilot: Opened Reports & Analytics');
      return {
        text: '⚡ **System Command Executed:** Opening **Reports & Analytics Console** (`/reports`).',
        executedAction: 'Navigated to Reports (`/reports`)'
      };
    }
    if (q.includes('expense') || q.includes('wallet') || q.includes('cost tracking')) {
      if (navigate) navigate('/expenses');
      actions?.showGlobalNotification?.('AI Copilot: Opened Expenses & Ledger');
      return {
        text: '⚡ **System Command Executed:** Opening **Expenses & Operational Ledger** (`/expenses`).',
        executedAction: 'Navigated to Expenses (`/expenses`)'
      };
    }
    if (q.includes('mobile') || q.includes('order now') || q.includes('qr order')) {
      if (navigate) navigate('/order-now');
      actions?.showGlobalNotification?.('AI Copilot: Opened Mobile Ordering App');
      return {
        text: '⚡ **System Command Executed:** Opening **Guest Mobile QR Ordering App** (`/order-now`).',
        executedAction: 'Navigated to Mobile Ordering (`/order-now`)'
      };
    }
    if (q.includes('demo')) {
      if (navigate) navigate('/demo');
      return {
        text: '⚡ **System Command Executed:** Opening **Developer Demo Control Center** (`/demo`).',
        executedAction: 'Navigated to Demo Control (`/demo`)'
      };
    }
    if (q.includes('setting')) {
      if (navigate) navigate('/settings');
      return {
        text: '⚡ **System Command Executed:** Opening **Restaurant Settings & Configurations** (`/settings`).',
        executedAction: 'Navigated to Settings (`/settings`)'
      };
    }
  }

  // -------------------------------------------------------------
  // 2. LIVE TABLE & SEATING QUERIES ("which table is free", etc.)
  // -------------------------------------------------------------
  if (
    q.includes('table is free') ||
    q.includes('free table') ||
    q.includes('available table') ||
    q.includes('vacant table') ||
    q.includes('which table can i seat') ||
    q.includes('empty table')
  ) {
    const freeTables = tables.filter(t => t.status === 'AVAILABLE');
    if (freeTables.length === 0) {
      return {
        text: '⚠️ **All tables are currently occupied or billing!** There are no free tables at this exact moment. You can monitor floor turnover on the Tables Console.',
        actionButtons: [{ label: 'Open Tables Console', route: '/tables' }]
      };
    }
    return {
      text: `✅ **Live System Status:** There are currently **${freeTables.length} free (AVAILABLE) tables** ready to seat new guests right now. Here is the exact status breakdown:`,
      table: freeTables.map(t => ({
        'Table ID': t.id,
        'Name': t.name,
        'Capacity': `${t.seats} Seats`,
        'Status': 'AVAILABLE 🟢',
        'Current Balance': '₹0.00'
      })),
      recommendations: [
        `Seat large parties at ${freeTables.find(t => t.seats >= 6)?.name || freeTables[0].name} (${freeTables.find(t => t.seats >= 6)?.seats || freeTables[0].seats} seats available).`,
        'Click the action button below to jump straight to the Floor Map to assign servers.'
      ],
      actionButtons: [{ label: 'Open Tables Console (`/tables`)', route: '/tables' }]
    };
  }

  if (
    q.includes('occupied table') ||
    q.includes('busy table') ||
    q.includes('seated table') ||
    q.includes('which tables are busy')
  ) {
    const busyTables = tables.filter(t => t.status === 'OCCUPIED' || t.status === 'PAYMENT_PENDING');
    if (busyTables.length === 0) {
      return {
        text: '🎉 **All tables are currently free!** No active dine-in orders on the floor right now.',
        actionButtons: [{ label: 'Open Tables Console', route: '/tables' }]
      };
    }
    return {
      text: `📊 **Live Floor Report:** There are **${busyTables.length} tables currently seated or billing** across the restaurant.`,
      table: busyTables.map(t => ({
        'Table ID': t.id,
        'Name': t.name,
        'Seats': `${t.seats} Seats`,
        'Status': t.status === 'PAYMENT_PENDING' ? 'BILL PENDING 🟡' : 'OCCUPIED 🔴',
        'Current Bill': `₹${(t.amount || 0).toFixed(2)}`
      })),
      recommendations: [
        `Prioritize checkout for ${busyTables.filter(t => t.status === 'PAYMENT_PENDING').map(t => t.name).join(', ') || 'payment pending tables'} to turn over seats.`
      ],
      actionButtons: [{ label: 'Open Payments Terminal', route: '/billing' }]
    };
  }

  if (
    q.includes('pending bill') ||
    q.includes('needs bill') ||
    q.includes('needs payment') ||
    q.includes('who is billing')
  ) {
    const pending = tables.filter(t => t.status === 'PAYMENT_PENDING');
    if (pending.length === 0) {
      return {
        text: '✅ **Zero pending checkouts.** All dining tables have either settled their bills or are still actively dining.',
        actionButtons: [{ label: 'View All Tables', route: '/tables' }]
      };
    }
    return {
      text: `💳 **Checkout Alert:** There are **${pending.length} tables awaiting payment checkout right now**. Total pending receivable amount is **₹${pending.reduce((s, t) => s + (t.amount || 0), 0).toFixed(2)}**.`,
      table: pending.map(t => ({
        'Table': t.name,
        'Capacity': `${t.seats} Seats`,
        'Status': 'PAYMENT PENDING 🟡',
        'Amount Due': `₹${(t.amount || 0).toFixed(2)}`
      })),
      recommendations: [
        'Collect UPI or Cash payment at the counter and settle the bills to release tables for waiting guests.'
      ],
      actionButtons: [{ label: 'Open Payments & Checkout (`/billing`)', route: '/billing' }]
    };
  }

  // -------------------------------------------------------------
  // 3. FOOD / MENU SALES & BESTSELLERS ("which food is most sold")
  // -------------------------------------------------------------
  if (
    q.includes('most sold') ||
    q.includes('best selling') ||
    q.includes('bestseller') ||
    q.includes('popular food') ||
    q.includes('top selling') ||
    q.includes('what sells most') ||
    q.includes('top dish')
  ) {
    // Aggregate order frequencies from active ticket logs
    const itemCounts: { [name: string]: { qty: number; rev: number; category: string } } = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        const name = i.menuItem.name;
        if (!itemCounts[name]) {
          itemCounts[name] = { qty: 0, rev: 0, category: i.menuItem.category };
        }
        itemCounts[name].qty += i.quantity;
        itemCounts[name].rev += (i.menuItem.price * i.quantity);
      });
    });

    let topItems = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty || b.rev - a.rev)
      .slice(0, 6);

    // If no order items placed in this session yet, provide high-margin historical POS analytics
    if (topItems.length === 0) {
      topItems = [
        { name: 'Wagyu Truffle Burger', qty: 48, rev: 60000, category: 'Main Course' },
        { name: 'Atlantic Salmon Steak', qty: 36, rev: 50040, category: 'Main Course' },
        { name: 'Saffron Cream Penne', qty: 42, rev: 18900, category: 'Main Course' },
        { name: 'Avocado Green Salad', qty: 30, rev: 11400, category: 'Starters' },
        { name: 'Truffle Mushroom Risotto', qty: 25, rev: 11250, category: 'Main Course' }
      ];
    }

    return {
      text: `🏆 **Top Selling Dishes Report:** Here is the live bestseller analysis based on active ticket volumes and cumulative revenue generation:`,
      table: topItems.map((item, idx) => ({
        'Rank': `#${idx + 1}`,
        'Dish Name': item.name,
        'Category': item.category,
        'Total Ordered Qty': `${item.qty} Units`,
        'Revenue Generated': `₹${item.rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      })),
      recommendations: [
        `Ensure kitchen prep tables are fully stocked for **${topItems[0]?.name || 'top dish'}** during rush hours.`,
        `Consider bundling **${topItems[0]?.name}** with a high-margin beverage or appetizer to boost average order value.`
      ],
      actionButtons: [
        { label: 'View Menu Profitability Matrix', route: '/ai-intelligence?tab=menu' },
        { label: 'Open Kitchen KDS Console', route: '/kds' }
      ]
    };
  }

  // -------------------------------------------------------------
  // 4. DIRECT SYSTEM MANIPULATION COMMANDS ("make table T18 free", "clear kds", etc.)
  // -------------------------------------------------------------
  if (q.includes('make table') && (q.includes('free') || q.includes('available'))) {
    // Try to find table name/ID in string
    const foundTable = tables.find(t => 
      q.includes(t.id.toLowerCase()) || 
      q.includes(t.name.toLowerCase()) ||
      q.includes(t.id.replace(/^t0?/, '').toLowerCase())
    );
    if (foundTable && actions?.setTableStatus) {
      actions.setTableStatus(foundTable.id, 'AVAILABLE', 0);
      return {
        text: `⚡ **System Command Executed:** Table **${foundTable.name} (${foundTable.id})** has been reset to **AVAILABLE 🟢** and balance cleared to ₹0.00.`,
        executedAction: `Marked ${foundTable.name} as AVAILABLE`,
        actionButtons: [{ label: 'View Tables Console', route: '/tables' }]
      };
    }
  }

  if (q.includes('clear kds') || q.includes('complete all kitchen orders') || q.includes('bump all orders')) {
    const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING');
    if (pendingOrders.length > 0 && actions?.updateOrderStatus) {
      pendingOrders.forEach(o => actions.updateOrderStatus!(o.id, 'READY'));
      return {
        text: `⚡ **System Command Executed:** All **${pendingOrders.length} pending kitchen tickets** have been marked as **READY 🍽️** on the Kitchen Display System (KDS).`,
        executedAction: `Marked ${pendingOrders.length} tickets READY`,
        actionButtons: [{ label: 'View Kitchen KDS', route: '/kds' }]
      };
    } else {
      return {
        text: '✅ **KDS is already clear!** There are no pending tickets currently preparing in the kitchen.',
        actionButtons: [{ label: 'View Kitchen KDS', route: '/kds' }]
      };
    }
  }

  // -------------------------------------------------------------
  // 5. EXISTING INTELLIGENCE / INVENTORY / SUPPLIER KEYWORDS
  // -------------------------------------------------------------
  if (q.includes('food cost') || q.includes('increasing') || q.includes('why is food cost')) {
    return {
      text: "Your overall food cost percentage has risen by **1.8%** this week, primarily driven by wholesale market surges on fresh produce (Roma Tomatoes & Hybrid Tomatoes). Increasing menu item prices or locking contract rates can protect gross margins.",
      table: [
        { "Ingredient": "Roma Tomatoes", "Price Surge": "+15.0%", "Impact": "High (Penne Pasta & Pizza)", "Action": "Adjust menu price by +₹15" },
        { "Ingredient": "Atlantic Salmon", "Price Surge": "+4.2%", "Impact": "Medium (Salmon Steak)", "Action": "Defer bulk buy by 7d" },
        { "Ingredient": "Wagyu Beef", "Price Surge": "+2.1%", "Impact": "High (Truffle Burger)", "Action": "Lock contract rates" }
      ],
      recommendations: [
        "Increase Saffron Cream Penne price by ₹15 to offset Tomato price increases.",
        "Check wholesale market intelligence tab for alternative mandi arrival rates."
      ],
      actionButtons: [{ label: 'Open Market Intelligence', route: '/ai-intelligence?tab=market' }]
    };
  }

  if (q.includes('supplier') || q.includes('cheapest') || q.includes('vendor')) {
    return {
      text: "Based on purchase logs and reliability indices, **Metro Wholesale** is currently the cheapest supplier for dry storage goods (-7% unit cost), while **FreshFoods Ltd** has the best contract rates and 97% reliability for proteins.",
      table: [
        { "Supplier": "FreshFoods Ltd", "Category": "Meats & Seafood", "Avg Unit Cost": "Lower (-4%)", "Reliability": "97% (Excellent 🟢)" },
        { "Supplier": "Metro Wholesale", "Category": "Dry Goods", "Avg Unit Cost": "Lowest (-7%)", "Reliability": "89% (Good 🟢)" },
        { "Supplier": "Sai Farm Fresh", "Category": "Fresh Produce", "Avg Unit Cost": "Market Standard", "Reliability": "74% (Critical 🔴)" }
      ],
      recommendations: [
        "Shift fresh produce purchases from Sai Farm Fresh to Direct Mandi / Metro Wholesale due to poor delivery punctuality."
      ],
      actionButtons: [{ label: 'Open Supplier Intelligence', route: '/ai-intelligence?tab=supplier' }]
    };
  }

  if (q.includes('menu') && (q.includes('losing') || q.includes('margin') || q.includes('profit'))) {
    return {
      text: "Three of your primary menu dishes are currently operating below your 60% target margin due to rising ingredient costs. **Saffron Cream Penne** has the lowest margin at **42.2%**.",
      table: [
        { "Dish": "Saffron Cream Penne", "Recipe Cost": "₹260.00", "Price": "₹450.00", "Gross Margin": "42.2% (Critical 🔴)" },
        { "Dish": "Avocado Green Salad", "Recipe Cost": "₹190.00", "Price": "₹380.00", "Gross Margin": "50.0% (Warning 🟡)" },
        { "Dish": "Atlantic Salmon Steak", "Recipe Cost": "₹580.00", "Price": "₹1,390.00", "Gross Margin": "58.3% (Warning 🟡)" }
      ],
      recommendations: [
        "Increase Saffron Cream Penne price to ₹520 to achieve a healthy 50%+ gross margin.",
        "Adjust avocado portioning slightly in Green Salad during off-season."
      ],
      actionButtons: [{ label: 'View Menu Profitability Matrix', route: '/ai-intelligence?tab=menu' }]
    };
  }

  if (q.includes('buy') || q.includes('today') || q.includes('purchase')) {
    return {
      text: "Based on inventory runout levels (`Hass Avocados` & `Roma Tomatoes` under 24 hours) and 7-day price predictions, here is your immediate procurement checklist for today:",
      table: [
        { "Item": "Roma Tomatoes", "Urgency": "High (0.9 days left 🔴)", "Market Price": "₹52.00/kg", "Forecast 7d": "₹59.80/kg (+15%)", "Action": "Buy 25kg Today" },
        { "Item": "Hass Avocados", "Urgency": "High (1.2 days left 🔴)", "Market Price": "₹95.00/pc", "Forecast 7d": "₹99.00/pc", "Action": "Buy 40pcs Today" },
        { "Item": "Atlantic Salmon Filets", "Urgency": "Medium (1.8 days left 🟡)", "Market Price": "₹1,150.00/kg", "Forecast 7d": "₹1,090.00/kg (-5%)", "Action": "Buy minimum qty today" }
      ],
      recommendations: [
        "Procure Tomatoes immediately today to lock in rates before predicted weekly surge.",
        "Defer bulk Salmon procurement until next week when market rates drop by -5%."
      ],
      actionButtons: [{ label: 'Open Purchase Recommendations', route: '/ai-intelligence?tab=purchase' }]
    };
  }

  // -------------------------------------------------------------
  // 6. GENERAL SYSTEM STATS & SUMMARY (Fallback for any other question)
  // -------------------------------------------------------------
  const activeCount = tables.filter(t => t.status === 'OCCUPIED' || t.status === 'PAYMENT_PENDING').length;
  const freeCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const pendingRev = tables.filter(t => t.status === 'PAYMENT_PENDING').reduce((s, t) => s + (t.amount || 0), 0);

  return {
    text: `🤖 **ServeFlow AI Copilot (System Controlled):** I have full visibility and control across your restaurant's live operations.\n\nHere is your current snapshot right now:\n- **Free Tables:** ${freeCount} Tables (${tables.length} Total)\n- **Active/Seated Tables:** ${activeCount} Tables\n- **Pending Bills Receivable:** ₹${pendingRev.toFixed(2)}\n- **Active Kitchen Tickets:** ${orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length} KOTs\n\n**Try giving me any command or asking a question:**\n- *"which table is free?"* or *"which food is most sold?"*\n- *"open dashboard"*, *"open kds"*, *"open payments"*, or *"open ai intelligence"*\n- *"clear kds"* or *"make table T01 free"*`,
    actionButtons: [
      { label: 'Open Dashboard (`/`)', route: '/' },
      { label: 'Open Tables (`/tables`)', route: '/tables' },
      { label: 'Open KDS (`/kds`)', route: '/kds' }
    ]
  };
};
