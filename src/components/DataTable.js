import React, { useState, useMemo } from 'react';
import { parseCurrency, formatCurrency } from '../data/golfData';

const DataTable = ({ data }) => {
  const [filters, setFilters] = useState({
    day: '',
    timeBand: '',
    availability: '',
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    let filtered = [...data];

    if (filters.day) {
      filtered = filtered.filter(row => row.day === filters.day);
    }
    if (filters.timeBand) {
      filtered = filtered.filter(row => row.time_band === filters.timeBand);
    }
    if (filters.availability === 'available') {
      filtered = filtered.filter(row => row.available_slots > 0);
    } else if (filters.availability === 'none') {
      filtered = filtered.filter(row => row.available_slots === 0);
    }

    return filtered;
  }, [data, filters]);

  const totalRevenue = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + parseCurrency(row.potential_revenue), 0);
  }, [filteredData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatus = (slots) => {
    // Map availability to a risk-style badge for UI only
    if (slots === 0) {
      return {
        label: 'Low risk',
        bgClass: 'bg-[#E6FFF5]',
        textClass: 'text-[#065F46]',
      };
    }
    if (slots < 50) {
      return {
        label: 'Medium risk',
        bgClass: 'bg-[#FFFBEB]',
        textClass: 'text-[#92400E]',
      };
    }
    return {
      label: 'High risk',
      bgClass: 'bg-[#FEE2E2]',
      textClass: 'text-[#B91C1C]',
    };
  };

  // Get unique days from data
  const uniqueDays = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(row => row.day))].filter(Boolean);
  }, [data]);

  // Time range mapping
  const timeRanges = {
    'Morning': '07:00-09:59',
    'Late AM': '10:00-11:59',
    'Early PM': '12:00-13:59',
    'Late PM': '14:00-16:59',
  };

  return (
    <div className="card p-6 fade-in" style={{ animationDelay: '0.9s' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#013734]">Tee Time Data</h3>
          <p className="text-sm text-[#5C6B6B]">Detailed slot availability breakdown</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="filter-input"
            value={filters.day}
            onChange={(e) => handleFilterChange('day', e.target.value)}
          >
            <option value="">All Days</option>
            {uniqueDays.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <select
            className="filter-input"
            value={filters.timeBand}
            onChange={(e) => handleFilterChange('timeBand', e.target.value)}
          >
            <option value="">All Time Bands</option>
            <option value="Morning">Morning</option>
            <option value="Late AM">Late AM</option>
            <option value="Early PM">Early PM</option>
            <option value="Late PM">Late PM</option>
          </select>
          <select
            className="filter-input"
            value={filters.availability}
            onChange={(e) => handleFilterChange('availability', e.target.value)}
          >
            <option value="">All Availability</option>
            <option value="available">Has Availability</option>
            <option value="none">No Availability</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table text-sm">
          <thead className="text-xs">
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Time Band</th>
              <th>Available Slots</th>
              <th>Avg Price</th>
              <th>Potential Revenue</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-[#5C6B6B]">No data available</td>
              </tr>
            ) : (
              filteredData.map((row, index) => {
                const status = getStatus(row.available_slots);
                return (
                  <tr key={index} className="align-middle">
                    <td className="font-medium text-[#013734]">{row.play_date}</td>
                    <td className="text-[#013734]">{row.day}</td>
                    <td className="text-[#013734]">
                      <span className="inline-flex items-center rounded-full bg-[#F5F2E8] px-3 py-1 text-xs font-medium whitespace-nowrap">
                        {row.time_band} 
                        {timeRanges[row.time_band] && (
                          <span className="text-[12px] ml-1.5 font-normal text-gray-400">
                            ({timeRanges[row.time_band]})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="font-semibold text-[#013734]">{row.available_slots}</td>
                    <td className="text-[#5C6B6B]">{row.avg_price}</td>
                    <td className="text-[#126D5B] font-semibold">{row.potential_revenue}</td>
                    <td className="text-left">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                          status.bgClass,
                          status.textClass,
                        ].join(' ')}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-[#5C6B6B]">
        <span>Showing {filteredData.length} records</span>
        <span className="font-medium text-[#013734]">Total Revenue Opportunity: {formatCurrency(totalRevenue)}</span>
      </div>
    </div>
  );
};

export default DataTable;
