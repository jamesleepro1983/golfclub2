import React from 'react';
import { RefreshCw } from 'lucide-react';
import fiqLogo from '../assets/fiq-logo.png';

import canterburyLogo from '../assets/canterbury.jpg';

const Header = ({ dateRange, lastUpdated, onRefresh }) => {
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <header className="bg-[#013734] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Fairway IQ Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={fiqLogo} 
              alt="Fairway IQ" 
              className="h-12 w-auto"
            />
            <div className="hidden sm:block">
              <p className="text-xs text-[#40FFB9]">Tee Time Analytics</p>
            </div>
          </div>

          {/* Center: Date Range & Refresh */}
          <div className="flex items-center gap-4">
            <div className="text-center hidden md:block">
              <p className="text-sm text-white font-medium">{dateRange}</p>
              {lastUpdated && (
                <p className="text-xs text-[#40FFB9]/80">Updated: {formatLastUpdated()}</p>
              )}
            </div>
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-[#126D5B] transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-[#40FFB9]" />
            </button>
            <span className="text-sm text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#40FFB9] mr-2 animate-pulse"></span>
              Live
            </span>
          </div>

          {/* Right: Golf Club Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={canterburyLogo} 
              alt="Canterbury Golf Club" 
              className="h-20 w-auto "
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
