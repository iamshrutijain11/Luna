import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bot,
  GitBranch,
  History,
  Settings as SettingsIcon,
  ChevronRight,
  User,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import LunaLogo from './LunaLogo';
import { vaultStore } from '../lib/vaultStore';
import AuthModal from './AuthModal';

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
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(vaultStore.getState().settings);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return vaultStore.subscribe(() => {
      setSettings({ ...vaultStore.getState().settings });
    });
  }, []);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const initials = settings.name
    ? settings.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SJ';

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
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#DCD9FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.08] relative z-10 shrink-0">
          <LunaLogo size="md" />
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) => {
                  const active = isActive || (item.path === '/' && window.location.pathname === '/overview');
                  return `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                    active
                      ? 'text-white font-semibold bg-linear-to-r from-white/[0.14] to-white/[0.06] border border-white/[0.18] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.06]'
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

        {/* User Profile Footer & Interactive Popover */}
        <div className="p-3 border-t border-white/[0.08] relative z-20 shrink-0" ref={menuRef}>
          {/* Popover Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#18181B] border border-white/15 rounded-2xl shadow-2xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]/40 border border-white/20 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate tracking-tight">{settings.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{settings.email}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">Active Demo Session &bull; {settings.plan}</span>
              </div>

              {/* Actions */}
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/settings');
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <SettingsIcon className="w-4 h-4 text-zinc-400" />
                  <span>Account & Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Switch Account / Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vaultStore.resetToDemo();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Reset Demo Session</span>
                </button>
              </div>

              {/* Security info footer */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Production integrates with Amazon Cognito / OAuth2</span>
              </div>
            </div>
          )}

          {/* Profile Card Trigger */}
          <div
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Click to manage user account or sign in"
          >
            <div className="w-9 h-9 rounded-full bg-[#7C3AED]/35 border border-white/25 flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate tracking-tight">{settings.name}</p>
              <p className="text-xs text-luna-lavender truncate font-normal">{settings.plan}</p>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-[#A1A1AA] ml-auto shrink-0 transition-transform ${
                isProfileMenuOpen ? '-rotate-90 text-white' : ''
              }`}
            />
          </div>
        </div>
      </aside>

      {/* Sign-In / Account Persona Switcher Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Sidebar;
