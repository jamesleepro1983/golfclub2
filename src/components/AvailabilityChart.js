import React, { useMemo } from 'react';

const AvailabilityChart = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Aggregate slots by day of week
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = {};

    data.forEach(row => {
      const day = row.day_of_week;
      if (!day) return;
      // Normalize to 3-letter abbreviation
      const abbr = day.substring(0, 3);
      dayMap[abbr] = (dayMap[abbr] || 0) + (row.slots_available || 0);
    });

    return dayOrder
      .filter(d => dayMap[d] !== undefined)
      .map(d => ({ day: d, slots: dayMap[d] }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const maxSlots = Math.max(...chartData.map(d => d.slots));

  // Color gradient: low values = green, mid = yellow/orange, high = red
  const getBarColor = (value, max) => {
    const ratio = value / max;
    if (ratio < 0.35) return 'bg-emerald-500';
    if (ratio < 0.55) return 'bg-yellow-400';
    if (ratio < 0.75) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // Text color matching the bar
  const getTextColor = (value, max) => {
    const ratio = value / max;
    if (ratio < 0.35) return 'text-emerald-600';
    if (ratio < 0.55) return 'text-yellow-500';
    if (ratio < 0.75) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col justify-center h-full gap-3 px-1">
      {chartData.map((item, index) => {
        const widthPct = maxSlots > 0 ? (item.slots / maxSlots) * 100 : 0;
        return (
          <div key={item.day} className="flex items-center ml-4">
            {/* Day label */}
            <span className="w-10 text-sm font-medium text-gray-600 text-right shrink-0">
              {item.day}
            </span>

            {/* Bar Track container */}
            <div className="flex-1 relative h-8 ml-6 bg-[#F8F7F2] rounded-md overflow-hidden transition-all duration-300">
              {/* Colored Fill */}
              <div
                className={`absolute top-0 left-0 h-full rounded-md ${getBarColor(item.slots, maxSlots)} transition-all duration-700 ease-out`}
                style={{
                  width: `${widthPct}%`,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
              
              {/* Value label - Always on the right */}
              <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                <span className={`text-sm font-bold transition-colors duration-500 ${
                  widthPct > 92 ? 'text-white' : getTextColor(item.slots, maxSlots).replace('text-', 'text-opacity-100 text-')
                }`}>
                  {item.slots}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AvailabilityChart;
