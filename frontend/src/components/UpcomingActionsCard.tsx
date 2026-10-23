import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ShieldCheck, Receipt, FileCheck, Layers } from 'lucide-react';
import { UpcomingActionItem } from '../types/api';

interface UpcomingActionsCardProps {
  actions: UpcomingActionItem[];
}

export const UpcomingActionsCard: React.FC<UpcomingActionsCardProps> = ({ actions }) => {
  const getActionIcon = (category: UpcomingActionItem['category']) => {
    switch (category) {
      case 'review':
        return {
          icon: ShieldCheck,
          bgColor: 'bg-purple-50 border-purple-100 text-purple-700',
        };
      case 'payment':
        return {
          icon: Receipt,
          bgColor: 'bg-amber-50 border-amber-100 text-amber-700',
        };
      case 'workflow':
        return {
          icon: FileCheck,
          bgColor: 'bg-orange-50 border-orange-100 text-orange-700',
        };
      default:
        return {
          icon: CheckCircle,
          bgColor: 'bg-blue-50 border-blue-100 text-blue-700',
        };
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-200/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-luna-secondary" />
          <h3 className="font-semibold text-luna-primary text-base">Upcoming Actions</h3>
        </div>
        <Link
          to="/workflows"
          className="inline-flex items-center gap-1 text-xs font-medium text-luna-accent hover:text-luna-accent-hover transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Actions List */}
      {actions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-luna-secondary">
          <div className="w-10 h-10 rounded-full bg-luna-ivory flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 text-luna-silver" />
          </div>
          <p className="text-sm font-medium text-luna-primary">All caught up!</p>
          <p className="text-xs text-luna-silver mt-0.5">
            LUNA will recommend actions here when documents require claims, payments, or reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1 flex-1">
          {actions.map((act) => {
            const { icon: ActionIcon, bgColor } = getActionIcon(act.category);

            return (
              <Link
                key={act.id}
                to="/workflows"
                className="group flex items-center justify-between gap-3 p-2.5 rounded-luna-md hover:bg-luna-ivory/80 transition-colors border border-transparent hover:border-luna-pearl-grey"
              >
                {/* Action Icon & Text */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-luna-sm border flex items-center justify-center shrink-0 shadow-xs ${bgColor}`}
                  >
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-luna-primary group-hover:text-luna-accent transition-colors truncate">
                      {act.title}
                    </p>
                    <p className="text-xs text-luna-secondary truncate">
                      {act.description}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 text-luna-silver group-hover:text-luna-primary group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingActionsCard;
