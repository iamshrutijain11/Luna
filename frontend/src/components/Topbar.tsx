import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';

interface TopbarProps {
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, onSearch }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settings, setSettings] = useState(vaultStore.getState().settings);

  useEffect(() => {
    return vaultStore.subscribe(() => {
      setSettings({ ...vaultStore.getState().settings });
    });
  }, []);

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

  const initials = settings.name
    ? settings.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SJ';

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

        {/* Global Vault Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-luna-silver absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents, warranties, bills, serial numbers..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-luna-ivory/60 border border-luna-pearl-grey rounded-full placeholder-luna-silver focus:outline-none focus:border-luna-accent focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-luna-secondary hover:text-luna-primary rounded-full hover:bg-luna-pearl-grey/50 transition-colors relative focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white animate-pulse" />
          </button>

          {/* Simple Dropdown for Notifications */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-luna-md border border-luna-pearl-grey shadow-luna-card p-3 z-50 animate-in fade-in text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-luna-pearl-grey pb-2">
                <span className="font-semibold text-luna-primary">Notifications</span>
                <span className="text-[10px] text-luna-secondary">2 new</span>
              </div>
              <div className="space-y-1.5">
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

        {/* User Profile Pill — Clickable to navigate to Account Settings */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-2 border-l border-luna-pearl-grey hover:opacity-85 transition-opacity text-left cursor-pointer focus:outline-none"
          title="Account Settings & Profile"
        >
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-luna-charcoal to-luna-halo/70 text-white font-semibold text-xs flex items-center justify-center shadow-2xs">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-luna-primary leading-tight">{settings.name}</p>
            <p className="text-[10px] text-luna-secondary leading-none">{settings.plan}</p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
