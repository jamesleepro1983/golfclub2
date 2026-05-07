import React from 'react';

const ChartCard = ({ title, subtitle, children, insight, insightType = 'success', delay = 0 }) => {
  return (
    <div className="card p-6 fade-in" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#013734]">{title}</h3>
          <p className="text-sm text-[#5C6B6B]">{subtitle}</p>
        </div>
      </div>
      <div className="relative h-[280px]">
        {children}
      </div>
      {/* {insight && (
        <div className={`mt-4 p-4 rounded-xl ${
          insightType === 'warning' 
            ? 'bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A]' 
            : 'bg-gradient-to-r from-[#E6FFF5] to-[#D4FBE8] border border-[#A7F3D0]'
        }`}>
          <p className={`text-sm ${insightType === 'warning' ? 'text-[#92400E]' : 'text-[#013734]'}`}>
            <strong>{insightType === 'warning' ? '⚠️ Opportunity:' : '💡 Insight:'}</strong> {insight}
          </p>
        </div>
      )} */}
    </div>
  );
};

export default ChartCard;
