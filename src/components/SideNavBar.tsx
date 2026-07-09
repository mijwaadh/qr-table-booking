import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';

export const SideNavBar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: Receipt },
    { to: '/tables', label: 'Tables', icon: Table2 },
    { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/billing', label: 'Payments', icon: CreditCard },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
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
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-md px-lg py-md rounded-lg transition-all duration-200 ease-in-out font-medium ${
                isActive
                  ? 'text-primary border-r-4 border-primary bg-primary-container/10 font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-body-md">{item.label}</span>
          </NavLink>
        ))}
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
