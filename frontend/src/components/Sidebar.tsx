import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bot,
  GitBranch,
  History,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react';
import LunaLogo from './LunaLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/documents', label: 'My Documents', icon: FileText },
  { path: '/assistant', label: 'AI Assistant', icon: Bot },
  { path: '/workflows', label: 'Workflows', icon: GitBranch },
  { path: '/activity', label: 'Activity', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Glassmorphic Dark Charcoal Sidebar (Architectural Cut-Glass Monolith) */}
      <aside
        className={`luna-glass-sidebar text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.08] relative z-10 shrink-0">
          <LunaLogo size="md" showText={true} />
          <button
            onClick={onClose}
            className="p-1 text-luna-silver hover:text-white lg:hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-luna-halo"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-6 space-y-2 overflow-y-auto relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) => {
                  const active = isActive || (item.path === '/' && window.location.pathname === '/overview');
                  return `group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-white/[0.09] text-white border border-white/[0.18] shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] hover:border-white/[0.08] border border-transparent'
                  }`;
                }}
              >
                {({ isActive }) => {
                  const active = isActive || (item.path === '/' && window.location.pathname === '/overview');
                  return (
                    <>
                      <Icon
                        className={`w-4 h-4 transition-all ${
                          active
                            ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                            : 'text-[#A1A1AA] group-hover:text-white'
                        }`}
                      />
                      <span>{item.label}</span>
                      {active && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-[#DCD9FF] shadow-[0_0_10px_#DCD9FF,0_0_4px_#FFFFFF]" />
                      )}
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-white/[0.08] relative z-10 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.14] transition-all cursor-pointer shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#7C3AED]/35 border border-white/25 flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0">
              SJ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate tracking-tight">Shruti Jain</p>
              <p className="text-xs text-luna-lavender truncate font-normal">Vault Pro</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A1A1AA] ml-auto shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
