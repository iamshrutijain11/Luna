import React, { useState, useEffect } from 'react';
import {
  User,
  Palette,
  Bell,
  Mic,
  Shield,
  HelpCircle,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';
import { UserSettings } from '../types/api';

type SettingsTab =
  | 'Account'
  | 'Appearance'
  | 'Notifications'
  | 'Language & Voice'
  | 'Privacy & Security'
  | 'Help & Support';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(vaultStore.getState().settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [nameInput, setNameInput] = useState(settings.name);
  const [emailInput, setEmailInput] = useState(settings.email);
  const [savedAlert, setSavedAlert] = useState(false);

  useEffect(() => {
    const unsub = vaultStore.subscribe(() => {
      setSettings({ ...vaultStore.getState().settings });
    });
    return unsub;
  }, []);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    vaultStore.updateSettings({
      name: nameInput,
      email: emailInput,
    });
    showSavedNotification();
  };

  const handleUpdate = (partial: Partial<UserSettings>) => {
    vaultStore.updateSettings(partial);
    showSavedNotification();
  };

  const showSavedNotification = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const menuItems: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'Account', label: 'Account', icon: User },
    { id: 'Appearance', label: 'Appearance', icon: Palette },
    { id: 'Notifications', label: 'Notifications', icon: Bell },
    { id: 'Language & Voice', label: 'Language & Voice', icon: Mic },
    { id: 'Privacy & Security', label: 'Privacy & Security', icon: Shield },
    { id: 'Help & Support', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header Section (Matching Screen 7) ──────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight font-sans">
          Settings
        </h1>
        <p className="text-sm text-luna-secondary mt-1 font-medium">
          Manage your account, preferences and application settings.
        </p>
      </div>

      {/* Save Toast Notification */}
      {savedAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-luna-md flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved and persisted to local vault storage.</span>
        </div>
      )}

      {/* ─── Main Two-Column Settings Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Settings Sidebar (4 cols) */}
        <div className="md:col-span-4 bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-luna-md text-xs sm:text-sm font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-luna-charcoal text-white shadow-xs'
                    : 'text-luna-secondary hover:text-luna-primary hover:bg-luna-ivory'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-luna-halo' : 'text-luna-silver'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 px-2 mt-4 border-t border-luna-pearl-grey">
            <div className="p-3 bg-luna-ivory/80 rounded-luna-md border border-luna-pearl-grey">
              <p className="text-xs font-bold text-luna-primary">Vault Pro</p>
              <p className="text-[11px] text-luna-secondary mt-0.5">
                Up to 20 documents & local Alexa+ reasoning.
              </p>
            </div>
          </div>
        </div>

        {/* Right Settings Content Panel (8 cols) */}
        <div className="md:col-span-8 bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          {/* TAB 1: ACCOUNT INFORMATION (Matching Screen 7 Right Panel) */}
          {activeTab === 'Account' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-luna-primary border-b border-luna-pearl-grey pb-3">
                Account Information
              </h3>

              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-luna-md bg-luna-ivory/60 border border-luna-pearl-grey">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-luna-accent text-white font-bold text-lg flex items-center justify-center shadow-xs ring-4 ring-white">
                    SJ
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-luna-primary">{settings.name}</h4>
                    <p className="text-xs text-luna-secondary">{settings.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                      {settings.plan}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Photo upload simulated for local user profile.')}
                  className="text-xs font-medium text-luna-accent hover:underline text-left sm:text-right"
                >
                  Change Photo
                </button>
              </div>

              {/* Account Form Fields */}
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-luna-secondary block mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-luna-ivory/50 border border-luna-pearl-grey rounded-luna-md text-sm text-luna-primary font-medium focus:ring-2 focus:ring-luna-halo focus:outline-none"
                    />
                    <Edit2 className="w-4 h-4 text-luna-silver absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-luna-secondary block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-luna-ivory/50 border border-luna-pearl-grey rounded-luna-md text-sm text-luna-primary font-medium focus:ring-2 focus:ring-luna-halo focus:outline-none"
                  />
                </div>

                {/* Plan & Upgrade Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-luna-md border border-luna-pearl-grey bg-white">
                  <div>
                    <span className="text-xs font-semibold text-luna-secondary block">
                      Current Subscription
                    </span>
                    <span className="text-sm font-bold text-luna-primary">
                      {settings.plan}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ plan: settings.plan === 'Vault Pro' ? 'Pro Plan' : 'Vault Pro' })}
                    className="px-5 py-2 bg-luna-charcoal hover:bg-luna-charcoal-light text-white text-xs font-semibold rounded-luna-md shadow-xs transition-colors"
                  >
                    {settings.plan === 'Vault Pro' ? 'Upgrade to Pro' : 'Downgrade to Free'}
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-luna-accent hover:bg-luna-accent-hover text-white text-xs font-semibold rounded-luna-md shadow-sm transition-all focus:ring-2 focus:ring-luna-halo"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'Appearance' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-luna-primary border-b border-luna-pearl-grey pb-3">
                Appearance & Theme
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-luna-secondary block mb-2">
                    Visual Design Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'lunar', title: 'Lunar Ivory', desc: 'Authoritative hackathon palette' },
                      { id: 'light', title: 'Pearl White', desc: 'Crisp high-contrast theme' },
                      { id: 'dark', title: 'Eclipse Charcoal', desc: 'Dark ambient workstation' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleUpdate({ theme: th.id as UserSettings['theme'] })}
                        className={`p-3 rounded-luna-md border text-left transition-all ${
                          settings.theme === th.id
                            ? 'border-luna-charcoal bg-luna-charcoal text-white ring-2 ring-luna-halo'
                            : 'border-luna-pearl-grey bg-luna-ivory/60 hover:bg-luna-ivory text-luna-primary'
                        }`}
                      >
                        <p className="font-bold text-xs">{th.title}</p>
                        <p className={`text-[10px] mt-1 ${settings.theme === th.id ? 'text-luna-silver' : 'text-luna-secondary'}`}>
                          {th.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <div>
                    <span className="text-xs font-bold text-luna-primary block">
                      Frosted Glassmorphism
                    </span>
                    <span className="text-[11px] text-luna-secondary">
                      Enable delicate backdrop-blur and soft specular card highlights.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.glassmorphism}
                    onChange={(e) => handleUpdate({ glassmorphism: e.target.checked })}
                    className="w-4 h-4 text-luna-accent rounded focus:ring-luna-halo"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <div>
                    <span className="text-xs font-bold text-luna-primary block">
                      Reduced Motion Support
                    </span>
                    <span className="text-[11px] text-luna-secondary">
                      Minimize waveform pulses and card transitions for accessibility.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => handleUpdate({ reducedMotion: e.target.checked })}
                    className="w-4 h-4 text-luna-accent rounded focus:ring-luna-halo"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-luna-primary border-b border-luna-pearl-grey pb-3">
                Notification Preferences
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <div>
                    <span className="text-xs font-bold text-luna-primary block">
                      Email Expiry Reminders
                    </span>
                    <span className="text-[11px] text-luna-secondary">
                      Receive alerts before warranties and bill payment deadlines expire.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleUpdate({ emailNotifications: e.target.checked })}
                    className="w-4 h-4 text-luna-accent rounded focus:ring-luna-halo"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <div>
                    <span className="text-xs font-bold text-luna-primary block">
                      In-App Urgent Notifications
                    </span>
                    <span className="text-[11px] text-luna-secondary">
                      Display topbar badge for actions due within 7 days.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleUpdate({ pushNotifications: e.target.checked })}
                    className="w-4 h-4 text-luna-accent rounded focus:ring-luna-halo"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LANGUAGE & VOICE */}
          {activeTab === 'Language & Voice' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-luna-primary border-b border-luna-pearl-grey pb-3">
                Alexa+ Voice & Speech Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <div>
                    <span className="text-xs font-bold text-luna-primary block">
                      Spoken Assistant Answers (SpeechSynthesis)
                    </span>
                    <span className="text-[11px] text-luna-secondary">
                      Read out answers when speaking to LUNA Assistant.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.voiceSynthesis}
                    onChange={(e) => handleUpdate({ voiceSynthesis: e.target.checked })}
                    className="w-4 h-4 text-luna-accent rounded focus:ring-luna-halo"
                  />
                </div>

                <div className="p-3.5 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <div className="flex justify-between text-xs font-bold text-luna-primary mb-2">
                    <span>Speech Rate</span>
                    <span className="font-mono">{settings.speechRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={settings.speechRate}
                    onChange={(e) => handleUpdate({ speechRate: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <div>
                    <span className="text-xs font-bold text-luna-primary block">
                      Alexa+ Audio Chime
                    </span>
                    <span className="text-[11px] text-luna-secondary">
                      Play acoustic chime when speech recognition begins.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alexaChime}
                    onChange={(e) => handleUpdate({ alexaChime: e.target.checked })}
                    className="w-4 h-4 text-luna-accent rounded focus:ring-luna-halo"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & SECURITY */}
          {activeTab === 'Privacy & Security' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-luna-primary border-b border-luna-pearl-grey pb-3">
                Privacy, Vault & Security Controls
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-luna-ivory/50 rounded-luna-md border border-luna-pearl-grey">
                  <span className="text-xs font-bold text-luna-primary block">
                    Zero-Knowledge Local Vault Storage
                  </span>
                  <p className="text-xs text-luna-secondary mt-1 leading-relaxed">
                    Personal invoices, receipts, and claims are held strictly inside your authorized browser vault and encrypted in memory. Unverified documents are never uploaded to public clouds.
                  </p>
                </div>

                <div className="p-4 border border-rose-200 bg-rose-50/50 rounded-luna-md flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">
                      Clear Entire Local Vault
                    </span>
                    <span className="text-[11px] text-rose-700">
                      Permanently wipes all local documents, workflows, and chat history.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear your local paperwork vault?')) {
                        vaultStore.setEmptyState();
                        showSavedNotification();
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-luna-md text-xs font-semibold shadow-xs"
                  >
                    Clear Vault
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: HELP & SUPPORT */}
          {activeTab === 'Help & Support' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-luna-primary border-b border-luna-pearl-grey pb-3">
                Help & Documentation
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-luna-ivory/60 rounded-luna-md border border-luna-pearl-grey flex items-center justify-between">
                  <div>
                    <span className="font-bold text-luna-primary block">
                      Amazon Developer Hackathon 2026 — Alexa+ Track Guide
                    </span>
                    <span className="text-luna-secondary">
                      Learn how LUNA extracts requirements and automates claim workflows.
                    </span>
                  </div>
                  <span className="text-luna-accent font-semibold flex items-center gap-1">
                    v1.0.0 <Sparkles className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="p-3.5 bg-luna-ivory/60 rounded-luna-md border border-luna-pearl-grey">
                  <span className="font-bold text-luna-primary block mb-1">
                    FastAPI & Agent Backend Integration
                  </span>
                  <p className="text-luna-secondary leading-relaxed">
                    Run the local server with: <code className="bg-white px-1.5 py-0.5 rounded border border-luna-pearl-grey font-mono">{'$env:PYTHONPATH=".;ai-agent"; uvicorn backend.app.main:app --port 8000'}</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
