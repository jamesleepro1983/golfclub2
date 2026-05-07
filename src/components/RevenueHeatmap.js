import React, { useMemo } from 'react';

const RevenueHeatmap = ({ data }) => {
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const bandConfig = {
      'Morning': { label: 'Morning', time: '07:00-09:59' },
      'Late AM': { label: 'Late AM', time: '10:00-11:59' },
      'Early PM': { label: 'Early PM', time: '12:00-13:59' },
      'Late PM': { label: 'Late PM', time: '14:00-16:59' },
    };
    const bandKeys = Object.keys(bandConfig);

    // Aggregate available_slots by (day, time_band)
    const grid = {};
    bandKeys.forEach(band => {
      grid[band] = {};
      days.forEach(day => {
        grid[band][day] = 0;
      });
    });

    data.forEach(row => {
      const band = row.time_band;
      const dayRaw = row.day;
      if (!band || !dayRaw || !bandConfig[band]) return;
      const dayAbbr = dayRaw.substring(0, 3);
      if (grid[band] && grid[band][dayAbbr] !== undefined) {
        grid[band][dayAbbr] += row.available_slots || 0;
      }
    });

    // Find min/max for color scaling and identify worst performing period
    let allValues = [];
    let worstPeriod = { value: -1, day: '', band: '' };

    bandKeys.forEach(band => {
      days.forEach(day => {
        const val = grid[band][day];
        allValues.push(val);

        if (val > worstPeriod.value) {
          worstPeriod = { value: val, day, band };
        }
      });
    });
    const maxVal = Math.max(...allValues, 1);
    const minVal = Math.min(...allValues);

    return { grid, days, bandKeys, bandConfig, maxVal, minVal, worstPeriod };
  }, [data]);

  if (!heatmapData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const { grid, days, bandKeys, bandConfig, maxVal, minVal, worstPeriod } = heatmapData;

  const fullDayNames = {
    'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday',
    'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
  };

  // Color function: low = light sage green, mid = muted olive/tan, high = coral/red
  const getCellClasses = (value) => {
    const range = maxVal - minVal || 1;
    const ratio = (value - minVal) / range;

    if (ratio < 0.33) return 'bg-emerald-500 text-white';
    if (ratio < 0.66) return 'bg-yellow-400 text-yellow-900';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="w-full">
      {/* Title */}
      <h3 className="text-base font-semibold text-gray-800 mb-5">
        Revenue gap heatmap — slots unfilled by day &amp; band
      </h3>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Column headers: days */}
          <thead>
            <tr>
              <th className="py-2 px-3 text-xs font-medium text-gray-400 text-left w-20" />
              {days.map(day => (
                <th
                  key={day}
                  className="py-2 px-3 text-xs font-medium text-gray-500 text-center"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {bandKeys.map(band => (
              <tr key={band}>
                {/* Row label */}
                <td className="py-2 px-3 text-xs font-medium text-gray-500 text-left whitespace-nowrap">
                  {bandConfig[band].label} <span className="text-[12px] font-normal text-gray-400">({bandConfig[band].time})</span>
                </td>

                {/* Data cells */}
                {days.map(day => {
                  const value = grid[band][day];
                  return (
                    <td key={day} className="p-1.5 text-center">
                      <div
                        className={`rounded-lg py-2.5 px-3 text-sm font-semibold transition-all duration-300 ${getCellClasses(value)}`}
                      >
                        {value}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Action Block based on the Highest Unfilled Slots */}
      {worstPeriod && worstPeriod.value > 0 && (
        <div className="mt-5 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-3 shadow-sm fade-in">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-700 font-bold">⚠️ Worst performing period this week:</span>
            <span className="text-red-900 font-bold">
              {fullDayNames[worstPeriod.day]} {bandConfig[worstPeriod.band].label}
            </span>
          </div>
          <span className="text-red-700 font-extrabold text-md uppercase tracking-wider">
            ACT NOW
          </span>
        </div>
      )}
    </div>
  );
};

export default RevenueHeatmap;
