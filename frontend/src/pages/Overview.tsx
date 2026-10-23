import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Calendar,
  Layers,
  RefreshCw,
  FolderOpen,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { SummaryCard } from '../components/SummaryCard';
import { UploadZone } from '../components/UploadZone';
import { ImportantDatesCard } from '../components/ImportantDatesCard';
import { RecentDocumentsCard } from '../components/RecentDocumentsCard';
import { UpcomingActionsCard } from '../components/UpcomingActionsCard';
import { LunaAssistantBar } from '../components/LunaAssistantBar';
import { vaultStore, VaultState } from '../lib/vaultStore';

export const Overview: React.FC = () => {
  const [vaultState, setVaultState] = useState<VaultState>(vaultStore.getState());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = vaultStore.subscribe(() => {
      setVaultState({ ...vaultStore.getState() });
    });
    return unsubscribe;
  }, []);

  const metrics = vaultStore.getMetrics();

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const handleLoadDemo = () => {
    vaultStore.loadReferenceData();
  };

  const handleClear = () => {
    vaultStore.setEmptyState();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ─── Header Section ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight font-sans">
            Good evening, Shruti
          </h1>
          <p className="text-sm sm:text-base text-luna-secondary mt-1 font-medium">
            Paperwork, simplified.
          </p>
        </div>

        {/* Process Guide / Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex border-l-2 border-indigo-600 pl-3.5 flex-col justify-center text-xs space-y-0.5">
            <span className="text-luna-secondary font-medium">Organize</span>
            <span className="text-luna-secondary font-medium">Understand</span>
            <span className="text-indigo-600 font-semibold flex items-center gap-1">
              Take Action <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          {/* Quick dataset switcher for testing/reviewing empty vs reference state */}
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-1 rounded-xl border border-stone-200/60 text-xs shadow-2xs">
            {vaultState.isDemoMode ? (
              <button
                type="button"
                onClick={handleClear}
                title="View empty state"
                className="px-2 py-1 text-luna-secondary hover:text-rose-600 rounded flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Test Empty State</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoadDemo}
                title="Load hackathon reference data"
                className="px-2 py-1 text-luna-accent hover:text-luna-accent-hover font-medium rounded flex items-center gap-1 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Load Reference Data</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1 text-luna-secondary hover:text-luna-primary rounded transition-colors"
              title="Refresh vault"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 Summary Metric Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Documents */}
        <SummaryCard
          icon={FileText}
          iconBgColor="bg-indigo-50 border border-indigo-100"
          iconColor="text-indigo-600"
          value={metrics.totalDocuments}
          label="Documents"
          subtext={
            metrics.totalDocuments > 0
              ? `↑ ${metrics.documentsThisMonth} this month`
              : 'Vault is empty'
          }
        />

        {/* Metric 2: Pending Workflows */}
        <SummaryCard
          icon={Layers}
          iconBgColor="bg-slate-50 border border-slate-100"
          iconColor="text-slate-700"
          value={metrics.pendingWorkflows}
          label="Pending Workflows"
          subtext={
            metrics.pendingWorkflows > 0 ? 'Needs your review' : 'No pending reviews'
          }
        />

        {/* Metric 3: Important Dates */}
        <SummaryCard
          icon={Calendar}
          iconBgColor="bg-rose-50 border border-rose-100"
          iconColor="text-rose-600"
          value={metrics.importantDatesCount}
          label="Important Dates"
          subtext={
            metrics.importantDatesCount > 0
              ? `${metrics.datesWithin30Days} within 30 days`
              : 'No dates tracked'
          }
        />

        {/* Metric 4: Actions Due Soon */}
        <SummaryCard
          icon={Clock}
          iconBgColor="bg-amber-50 border border-amber-100"
          iconColor="text-amber-600"
          value={metrics.actionsDueSoonCount}
          label="Actions Due Soon"
          subtext={
            metrics.actionsDueSoonCount > 0
              ? `${metrics.actionsDueToday} today`
              : 'All actions completed'
          }
        />
      </div>

      {/* ─── Document Upload Area ────────────────────────────────────────── */}
      <UploadZone />

      {/* ─── Three Column Bottom Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Important Dates */}
        <ImportantDatesCard dates={vaultState.importantDates} />

        {/* Column 2: Recent Documents */}
        <RecentDocumentsCard documents={vaultState.documents} />

        {/* Column 3: Upcoming Actions */}
        <UpcomingActionsCard actions={vaultState.upcomingActions} />
      </div>

      {/* ─── Signature LUNA AI Assistant Entry Point ──────────────────────── */}
      <div className="pt-2">
        <LunaAssistantBar />
      </div>
    </div>
  );
};

export default Overview;
