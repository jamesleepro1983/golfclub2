import React, { useMemo } from 'react';
import { parseCurrency } from '../data/golfData';

const TimeDistributionChart = ({ data }) => {
  const bands = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Map time band names used in the image
    const bandConfig = {
      'Morning': { label: 'Morning', time: '07:00-09:59', order: 0 },
      'Late AM': { label: 'Late AM', time: '10:00-11:59', order: 1 },
      'Early PM': { label: 'Early PM', time: '12:00-13:59', order: 2 },
      'Late PM': { label: 'Late PM', time: '14:00-16:59', order: 3 },
    };

    const bandData = {};

    data.forEach(row => {
      const band = row.time_band;
      if (!bandConfig[band]) return;

      if (!bandData[band]) {
        bandData[band] = {
          label: bandConfig[band].label,
          time: bandConfig[band].time,
          order: bandConfig[band].order,
          totalSlots: 0,
          totalAvailable: 0,
          totalPrice: 0,
          priceCount: 0,
        };
      }

      const available = row.available_slots || 0;
      const price = parseCurrency(row.avg_price);

      bandData[band].totalAvailable += available;
      // Estimate total capacity: available slots represent unfilled portion
      // We'll compute occupancy from available vs capacity later
      bandData[band].totalSlots += available;
      if (price > 0) {
        bandData[band].totalPrice += price;
        bandData[band].priceCount += 1;
      }
    });

    const entries = Object.values(bandData).sort((a, b) => a.order - b.order);

    // Calculate occupancy: highest availability = lowest occupancy
    // Use the max available slots as a reference for scaling
    const maxAvailable = Math.max(...entries.map(e => e.totalAvailable), 1);

    return entries.map(entry => {
      // Occupancy inversely related to available slots
      // More unfilled slots = lower occupancy
      const occupancy = Math.max(
        10,
        Math.round(100 - (entry.totalAvailable / maxAvailable) * 100)
      );
      const avgPrice = entry.priceCount > 0
        ? Math.round(entry.totalPrice / entry.priceCount)
        : 0;

      return {
        label: entry.label,
        time: entry.time,
        occupancy,
        unfilledSlots: entry.totalAvailable,
        pricePerRound: avgPrice,
      };
    });
  }, [data]);

  if (!bands || bands.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  // Color and styling per occupancy level
  const getBarStyle = (occupancy) => {
    if (occupancy >= 85) return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
    if (occupancy >= 70) return { bar: 'bg-yellow-400', text: 'text-yellow-500' };
    if (occupancy >= 55) return { bar: 'bg-orange-400', text: 'text-orange-500' };
    return { bar: 'bg-red-500', text: 'text-red-500' };
  };

  return (
    <div className="flex flex-col justify-center h-full gap-5 px-1">
      {bands.map((band, index) => {
        const style = getBarStyle(band.occupancy);
        return (
          <div key={band.label} className="space-y-1.5">
            {/* Header row: label + percentage */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                {band.label} <span className="text-sm font-normal text-gray-400">({band.time})</span>
              </span>
              <span className={`text-sm font-bold ${style.text}`}>
                {band.occupancy}% full
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${style.bar} transition-all duration-700 ease-out`}
                style={{
                  width: `${band.occupancy}%`,
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            </div>

            {/* Subtitle: unfilled slots + price */}
            <p className="text-sm text-gray-400">
              {band.unfilledSlots} slots unfilled · £{band.pricePerRound}/round
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TimeDistributionChart;
