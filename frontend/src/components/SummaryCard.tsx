import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  value: number | string;
  label: string;
  subtext: string;
  trend?: string;
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  icon: Icon,
  iconBgColor,
  iconColor,
  value,
  label,
  subtext,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white/85 backdrop-blur-md border border-white/90 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:border-white transition-all duration-200 flex items-start gap-4 ${
        onClick ? 'cursor-pointer hover:border-white' : ''
      }`}
    >
      {/* Icon Square */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBgColor}`}
      >
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>

      {/* Metric Content */}
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-luna-primary tracking-tight">
          {value}
        </div>
        <div className="text-sm font-medium text-luna-secondary mt-0.5">
          {label}
        </div>
        <div className="text-xs text-luna-secondary/80 mt-1 flex items-center gap-1">
          {subtext}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
