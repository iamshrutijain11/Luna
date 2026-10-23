import React from 'react';

interface LunaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
}

export const LunaLogo: React.FC<LunaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  showTagline = false,
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', badge: 'text-[9px]' },
    md: { icon: 'w-8 h-8', text: 'text-xl', badge: 'text-[10px]' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl', badge: 'text-xs' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official LUNA Monogram Image */}
      <div className="relative flex items-center justify-center shrink-0">
        <img
          src="/luna-logo.png"
          alt="LUNA Monogram"
          className={`${icon} object-contain rounded-lg drop-shadow-sm transition-transform duration-200 hover:scale-105`}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-white ${text} font-sans`}>
              LUNA
            </span>
          </div>
          {showTagline && (
            <span className="text-[11px] text-luna-silver font-normal tracking-normal -mt-0.5">
              Paperwork, simplified.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LunaLogo;
