import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Table2, 
  UtensilsCrossed, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChefHat,
  Smartphone,
  Sparkles,
  Brain
} from 'lucide-react';

export const SideNavBar: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTabParam = searchParams.get('tab') || 'overview';
  
  const isAiIntelligenceActive = location.pathname === '/ai-intelligence';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: Receipt },
    { to: '/tables', label: 'Tables', icon: Table2 },
    { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/billing', label: 'Payments', icon: CreditCard },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/ai-intelligence', label: 'AI Intelligence', icon: Brain },
    { to: '/kds', label: 'Kitchen KDS', icon: ChefHat },
    { to: '/order-now', label: 'Mobile Order', icon: Smartphone },
    { to: '/demo', label: 'Demo Control', icon: Sparkles },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-[280px] h-screen sticky top-0 left-0 bg-surface-bright border-r border-outline-variant flex flex-col py-xl shrink-0">
      <div className="px-lg mb-2xl">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">ServeFlow</h1>
        <p className="font-body-md text-body-md text-on-surface-variant opacity-70">Management Console</p>
      </div>

      <nav className="flex-1 space-y-1 px-md overflow-y-auto custom-scroll">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          
          if (item.to === '/ai-intelligence') {
            return (
              <div key={item.to} className="flex flex-col">
                <NavLink
                  to="/ai-intelligence?tab=overview"
                  className={`flex items-center gap-md px-lg py-md rounded-lg transition-all duration-200 ease-in-out font-medium ${
                    isAiIntelligenceActive
                      ? 'text-primary border-r-4 border-primary bg-primary-container/10 font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-body-md">{item.label}</span>
                </NavLink>
                
                {/* Branch sub-tree */}
                <div className="pl-[26px] flex flex-col font-mono text-[10px] text-on-surface-variant/75 select-none mt-1">
                  <div className="pl-[26px] leading-none opacity-40 mb-0.5">│</div>
                  {[
                    { tab: 'overview', label: 'Overview' },
                    { tab: 'market', label: 'Market Intelligence' },
                    { tab: 'forecast', label: 'Forecast & Predictions' },
                    { tab: 'supplier', label: 'Supplier Intelligence' },
                    { tab: 'menu', label: 'Menu Profitability' },
                    { tab: 'inventory', label: 'Inventory Insights' },
                    { tab: 'waste', label: 'Waste Analysis' },
                    { tab: 'purchase', label: 'Purchase Recommendations' },
                    { tab: 'copilot', label: 'AI Copilot' },
                    { tab: 'reports', label: 'Reports' }
                  ].map((sub, sIdx, arr) => {
                    const isLast = sIdx === arr.length - 1;
                    const isSubActive = isAiIntelligenceActive && activeTabParam === sub.tab;
                    const branch = isLast ? '└──' : '├──';
                    
                    return (
                      <NavLink
                        key={sub.tab}
                        to={`/ai-intelligence?tab=${sub.tab}`}
                        className={`flex items-center hover:text-primary transition-colors py-1 pl-md ${
                          isSubActive ? 'text-primary font-bold' : 'text-on-surface-variant/80'
                        }`}
                      >
                        <span className="text-outline mr-sm opacity-50 font-normal">{branch}</span>
                        <span className="font-sans font-medium text-[11px]">{sub.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-md px-lg py-md rounded-lg transition-all duration-200 ease-in-out font-medium ${
                isActive
                  ? 'text-primary border-r-4 border-primary bg-primary-container/10 font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-body-md">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-lg mt-auto pt-xl border-t border-outline-variant/30">
        <div className="flex items-center gap-md p-md rounded-xl bg-surface-container-low">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
            JD
          </div>
          <div className="overflow-hidden">
            <p className="font-label-md text-label-md truncate font-semibold">John Doe</p>
            <p className="text-[10px] text-on-surface-variant">Admin Access</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default SideNavBar;
