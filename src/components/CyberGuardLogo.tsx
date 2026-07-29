import React from 'react';
import { Shield, Lock, Cpu } from 'lucide-react';

interface CyberGuardLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const CyberGuardLogo: React.FC<CyberGuardLogoProps> = ({ size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  const containerSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      <div className={`relative ${containerSizes[size]} bg-gradient-to-br from-sky-500 via-blue-600 to-purple-600 p-[1.5px] shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all duration-300`}>
        <div className="w-full h-full bg-slate-950 rounded-[inherit] flex items-center justify-center relative overflow-hidden">
          {/* Subtle neon glow backplane */}
          <div className="absolute inset-0 bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors" />
          <Shield className={`${iconSizes[size]} text-sky-400 group-hover:scale-105 transition-transform duration-300`} />
          <Lock className="w-2.5 h-2.5 text-purple-300 absolute bottom-1 right-1" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold tracking-tight text-white font-mono flex items-center gap-1.5`}>
            CyberGuard <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent font-black">AI</span>
          </span>
        </div>
      )}
    </div>
  );
};
