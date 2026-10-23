import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Plus } from 'lucide-react';
import { ImportantDateItem } from '../types/api';

interface ImportantDatesCardProps {
  dates: ImportantDateItem[];
}

export const ImportantDatesCard: React.FC<ImportantDatesCardProps> = ({ dates }) => {
  return (
    <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-200/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-luna-secondary" />
          <h3 className="font-semibold text-luna-primary text-base">Important Dates</h3>
        </div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1 text-xs font-medium text-luna-accent hover:text-luna-accent-hover transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Date Items List */}
      {dates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-luna-secondary">
          <div className="w-10 h-10 rounded-full bg-luna-ivory flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5 text-luna-silver" />
          </div>
          <p className="text-sm font-medium text-luna-primary">No upcoming dates</p>
          <p className="text-xs text-luna-silver mt-0.5">
            Key expiry, due dates, and renewals will appear here once documents are parsed.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1 flex-1">
          {dates.map((item) => {
            const isCritical = item.urgency === 'critical';
            const isWarning = item.urgency === 'warning';

            return (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 p-2.5 rounded-luna-md hover:bg-luna-ivory/80 transition-colors border border-transparent hover:border-luna-pearl-grey"
              >
                {/* Date Badge Stack */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-luna-sm flex flex-col items-center justify-center shrink-0 border ${
                      isCritical
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : isWarning
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}
                  >
                    <span className="text-sm font-bold leading-none">{item.day}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider leading-none mt-0.5">
                      {item.month}
                    </span>
                  </div>

                  {/* Title & Issuer */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-luna-primary truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-luna-secondary truncate">
                      {item.issuer}
                    </p>
                  </div>
                </div>

                {/* Status / Urgency Tag */}
                <div className="shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      isCritical
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isWarning
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-luna-pearl-grey/60 text-luna-secondary border-luna-pearl-grey'
                    }`}
                  >
                    {item.badgeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Important Date Action */}
      <div className="mt-3 pt-3 border-t border-stone-200/50 shrink-0">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add important date</span>
        </Link>
      </div>
    </div>
  );
};

export default ImportantDatesCard;
