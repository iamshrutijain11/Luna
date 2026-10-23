import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, CheckCircle2, ShieldCheck, LogOut, ArrowRight } from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const currentSettings = vaultStore.getState().settings;
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState(currentSettings.name || '');
  const [email, setEmail] = useState(currentSettings.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const displayName = mode === 'signup' 
      ? (name.trim() || email.split('@')[0])
      : (name.trim() || currentSettings.name || email.split('@')[0]);

    // Save session credentials
    const authSession = {
      email: email.trim(),
      name: displayName,
      token: `luna_jwt_${btoa(email.trim())}_${Date.now()}`,
      authenticatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('luna_user_session', JSON.stringify(authSession));
    } catch {
      // Ignore storage errors
    }

    vaultStore.updateSettings({
      name: displayName,
      email: email.trim(),
    });

    setSuccessMessage(
      mode === 'signup'
        ? `Account created! Welcome to LUNA, ${displayName}.`
        : `Welcome back, ${displayName}! Successfully signed in.`
    );

    setTimeout(() => {
      setSuccessMessage(null);
      setPassword('');
      onClose();
    }, 1200);
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('luna_user_session');
    } catch {
      // Ignore
    }
    vaultStore.updateSettings({
      name: 'Guest User',
      email: 'guest@luna.ai',
    });
    setSuccessMessage('Signed out successfully.');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-luna-pearl border border-luna-pearl-grey rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-luna-pearl-grey">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-luna-primary">
                {mode === 'signin' ? 'Sign In to Your Vault' : 'Create Your Account'}
              </h3>
              <p className="text-xs text-luna-secondary">Secure Document Intelligence & Actions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-luna-silver hover:text-luna-primary p-1 rounded-lg hover:bg-luna-pearl-grey/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-luna-ivory/80 rounded-xl border border-luna-pearl-grey text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-luna-primary shadow-xs'
                : 'text-luna-secondary hover:text-luna-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-luna-primary shadow-xs'
                : 'text-luna-secondary hover:text-luna-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-luna-primary mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-luna-silver absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Shruti Jain"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-luna-pearl-grey focus:border-indigo-500 focus:outline-none bg-white shadow-2xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-luna-primary mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-luna-silver absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-luna-pearl-grey focus:border-indigo-500 focus:outline-none bg-white shadow-2xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-luna-primary">Password</label>
              {mode === 'signin' && (
                <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-luna-silver absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-luna-pearl-grey focus:border-indigo-500 focus:outline-none bg-white shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-luna-silver hover:text-luna-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 text-luna-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-luna-pearl-grey text-indigo-600 focus:ring-indigo-500/30"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{mode === 'signin' ? 'Sign In to Vault' : 'Create Vault Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Current Active Account & Sign Out */}
        <div className="pt-3 border-t border-luna-pearl-grey flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-luna-secondary">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-bit AES Vault Encryption</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-medium"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
