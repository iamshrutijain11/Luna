import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, Key, CheckCircle2, Lock } from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const currentSettings = vaultStore.getState().settings;
  const [name, setName] = useState(currentSettings.name);
  const [email, setEmail] = useState(currentSettings.email);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (presetName: string, presetEmail: string) => {
    setName(presetName);
    setEmail(presetEmail);
    vaultStore.updateSettings({ name: presetName, email: presetEmail });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    vaultStore.updateSettings({ name: name.trim(), email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com` });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-luna-pearl border border-luna-pearl-grey rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-luna-pearl-grey">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-luna-primary">LUNA Sign In & User Profile</h3>
              <p className="text-xs text-luna-secondary">Authentication & Identity Management</p>
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

        {/* Success Alert */}
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile session updated! Switched to <strong>{name}</strong>.</span>
          </div>
        )}

        {/* Current Active Persona */}
        <div className="p-3.5 rounded-xl bg-luna-ivory/60 border border-luna-pearl-grey flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {currentSettings.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SJ'}
            </div>
            <div>
              <p className="text-sm font-semibold text-luna-primary">{currentSettings.name}</p>
              <p className="text-xs text-luna-secondary">{currentSettings.email}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Active Session
          </span>
        </div>

        {/* Quick Switch Personas */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-luna-secondary uppercase tracking-wider">
            Quick Persona Switch
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset('Shruti Jain', 'shruti.jain@example.com')}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentSettings.name === 'Shruti Jain'
                  ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-luna-pearl-grey hover:border-luna-accent hover:bg-luna-ivory/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-luna-primary">Shruti Jain</span>
                {currentSettings.name === 'Shruti Jain' && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-luna-secondary mt-0.5">Default Hackathon Demo Persona</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('Amazon Judge', 'judge.reviewer@amazon.dev')}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentSettings.name === 'Amazon Judge'
                  ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-luna-pearl-grey hover:border-luna-accent hover:bg-luna-ivory/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-luna-primary">Amazon Judge</span>
                {currentSettings.name === 'Amazon Judge' && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-luna-secondary mt-0.5">Evaluation & Review Session</p>
            </button>
          </div>
        </div>

        {/* Custom Sign-In Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1 border-t border-luna-pearl-grey">
          <label className="text-xs font-semibold text-luna-secondary uppercase tracking-wider">
            Sign In with Custom Details
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-luna-pearl-grey focus:border-indigo-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-luna-pearl-grey focus:border-indigo-500 focus:outline-none bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-luna-pearl-grey rounded-xl text-xs font-medium text-luna-secondary hover:text-luna-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Sign In / Apply
            </button>
          </div>
        </form>

        {/* Architectural Note on Auth for Judges */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Why is login pre-authenticated?</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            LUNA is configured in <strong>Hackathon Demo Mode</strong> to allow instant evaluation of document intelligence, MCP tool calling, and action workflows without requiring manual sign-up. In production, LUNA connects to <strong>Amazon Cognito</strong> and <strong>Alexa Skill Account Linking (OAuth 2.0 PKCE)</strong> with cryptographic user isolation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
