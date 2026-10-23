import React, { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(searchQuery);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-luna-pearl-grey px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & Global Search input */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-luna-secondary hover:text-luna-primary rounded-lg hover:bg-luna-pearl-grey/50 transition-colors focus:outline-none"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-luna-secondary">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search documents, tags, policies, receipts..."
            className="w-full pl-10 pr-4 py-2 bg-luna-ivory/80 hover:bg-luna-ivory focus:bg-white border border-luna-pearl-grey rounded-full text-xs sm:text-sm text-luna-primary placeholder-luna-secondary focus:outline-none focus:ring-2 focus:ring-luna-halo/60 focus:border-luna-halo transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-luna-secondary bg-white border border-luna-pearl-grey rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls: Notifications, Avatar */}
      <div className="flex items-center gap-3.5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-luna-secondary hover:text-luna-primary rounded-full hover:bg-luna-pearl-grey/60 transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-luna-warning ring-2 ring-white" />
          </button>

          {/* Quick notification flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-luna-dropdown border border-luna-pearl-grey p-3.5 z-50 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-luna-pearl-grey font-semibold text-luna-primary">
                <span>Recent Alerts</span>
                <span className="text-[10px] text-luna-secondary">2 new</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                  <p className="font-medium text-amber-900">Edison Power Bill Due in 3 Days</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">$184.20 due July 22, 2026</p>
                </div>
                <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                  <p className="font-medium text-emerald-900">Dell Warranty Draft Prepared</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Ready for user authorization</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-luna-pearl-grey">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-luna-charcoal to-luna-halo/70 text-white font-semibold text-xs flex items-center justify-center shadow-2xs">
            SJ
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-luna-primary leading-tight">Shruti Jain</p>
            <p className="text-[10px] text-luna-secondary leading-none">Vault Pro</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
