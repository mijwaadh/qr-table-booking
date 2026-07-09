import React from 'react';
import { Search, Bell, HelpCircle, User } from 'lucide-react';

interface TopNavBarProps {
  title?: string;
  onSearchChange?: (val: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ title, onSearchChange }) => {
  return (
    <header className="flex justify-between items-center h-16 px-lg w-full sticky top-0 bg-surface z-40 border-b border-outline-variant transition-all duration-200 shrink-0">
      <div className="flex items-center gap-xl flex-1 max-w-xl">
        {title && <h2 className="hidden md:block font-headline-md text-headline-md font-bold text-primary mr-lg">{title}</h2>}
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 font-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface"
            placeholder="Search tables, orders, or menu..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-lg ml-xl">
        <button className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant relative transition-colors duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>
        <button className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors duration-200">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-8 w-[1px] bg-outline-variant mx-sm"></div>
        <button className="flex items-center gap-sm px-md py-1.5 rounded-full bg-primary text-on-primary font-label-md hover:opacity-90 transition-all shadow-sm">
          <User className="w-4 h-4" />
          <span>Profile</span>
          <img
            className="w-6 h-6 rounded-full border border-on-primary/20 object-cover"
            alt="Manager avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlEqRSEyK7vZg7wxK53bHxx5pxHPuXoG_7Gk1fpe95hN6TwnxB7bbTBR5TkEH17FgPX4G5QnfVQ8IeXUl1AQ3XCxhWMSlTe2MJU_oo_SECkGI93cFQQA0hkun9ydmCAyAaY85eIlnxpszN5N8ipWE4-WufERgkuIOHEj_GtAnOGnB4qVt17p2L677qJBsprKKziEMLIXQvQqj3-Zvwb6VA48XO0mEHVfkAmtxAyLyj5sae8nN-xE0Boh3Kwi8XWXKoqIS8gbKNjCF6"
          />
        </button>
      </div>
    </header>
  );
};
export default TopNavBar;
