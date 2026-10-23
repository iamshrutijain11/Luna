import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Upload,
  CheckCircle2,
  GitBranch,
  Bot,
  Layers,
  History,
} from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';
import { ActivityCategory, ActivityEvent } from '../types/api';

export const Activity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>(vaultStore.getState().activities);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('All');
  const [dateRange, setDateRange] = useState('Last 30 days');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = vaultStore.subscribe(() => {
      setActivities([...vaultStore.getState().activities]);
    });
    return unsub;
  }, []);

  const categories: ActivityCategory[] = ['All', 'Documents', 'Workflows', 'Assistant', 'Actions'];

  const filteredEvents = activities.filter((ev) => {
    if (selectedCategory === 'All') return true;
    return ev.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getEventIcon = (type: ActivityEvent['icon_type']) => {
    switch (type) {
      case 'upload':
        return (
          <div className="w-10 h-10 rounded-luna-sm bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <Upload className="w-5 h-5" />
          </div>
        );
      case 'analysis':
        return (
          <div className="w-10 h-10 rounded-luna-sm bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'workflow':
        return (
          <div className="w-10 h-10 rounded-luna-sm bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <GitBranch className="w-5 h-5" />
          </div>
        );
      case 'assistant':
        return (
          <div className="w-10 h-10 rounded-luna-sm bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-luna-sm bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        );
    }
  };

  const handleRowClick = (ev: ActivityEvent) => {
    if (ev.category === 'Documents') {
      navigate('/documents');
    } else if (ev.category === 'Workflows') {
      navigate('/workflows');
    } else if (ev.category === 'Assistant') {
      navigate('/assistant');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header Section (Matching Screen 6) ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight font-sans">
            Activity
          </h1>
          <p className="text-sm text-luna-secondary mt-1 font-medium">
            Track all your documents, workflows and interactions.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-luna-pearl px-3 py-1.5 rounded-luna-md border border-luna-pearl-grey shadow-xs">
          <Calendar className="w-4 h-4 text-luna-secondary" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-luna-primary focus:outline-none cursor-pointer"
          >
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
            <option value="Last 90 days">Last 90 days</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* ─── Category Filter Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-luna-charcoal text-white shadow-xs'
                : 'bg-luna-pearl text-luna-secondary hover:text-luna-primary border border-luna-pearl-grey hover:bg-luna-ivory'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Chronological Feed Container (Matching Screen 6 Bottom-Left) ─── */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-luna-secondary">
            <History className="w-8 h-8 text-luna-silver mx-auto mb-2" />
            <h3 className="text-base font-semibold text-luna-primary">No activity in this period</h3>
            <p className="text-xs text-luna-silver mt-1">
              Events will appear as you upload documents and interact with LUNA.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-luna-pearl-grey/60">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleRowClick(ev)}
                className="group py-3.5 px-2 hover:bg-luna-ivory/60 rounded-luna-md flex items-center justify-between gap-4 transition-colors cursor-pointer"
              >
                {/* Left Icon & Event Details */}
                <div className="flex items-center gap-4 min-w-0">
                  {getEventIcon(ev.icon_type)}

                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-luna-primary group-hover:text-luna-accent transition-colors truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-luna-secondary truncate mt-0.5">
                      {ev.target}
                    </p>
                  </div>
                </div>

                {/* Right Timestamp */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-luna-secondary">
                    {ev.relative_time}
                  </p>
                  <p className="text-[11px] text-luna-silver mt-0.5 hidden sm:block">
                    {ev.formatted_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
