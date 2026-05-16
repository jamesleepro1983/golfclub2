import { useState, useEffect, useMemo, useCallback } from 'react';
import {  RefreshCw } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import ChartCard from './components/ChartCard';
import OpportunityCards from './components/OpportunityCards';
import AvailabilityChart from './components/AvailabilityChart';
import TimeDistributionChart from './components/TimeDistributionChart';
import RevenueHeatmap from './components/RevenueHeatmap';
// import RevenueChart from './components/RevenueChart';
// import PricingChart from './components/PricingChart';
import DataTable from './components/DataTable';
import EmailGenerator from './components/EmailGenerator';
import { fetchAllData, formatCurrency, parseCurrency } from './data/golfData';

function App() {
  const [data, setData] = useState({
    lookerData: [],
    slotAnalysis: [],
    revenueOpportunity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [emailPrefill, setEmailPrefill] = useState('');

  const timeRanges = {
    'Morning': '07:00–09:59',
    'Late AM': '10:00–11:59',
    'Early PM': '12:00–13:59',
    'Late PM': '14:00–16:59',
  };

  const handleEmailClick = (item) => {
    const band = item.time_band || '';
    const range = timeRanges[band] ? ` (${timeRanges[band]})` : '';
    const prefill = `Generate a promotional email campaign for ${item.day || 'an upcoming'} ${band}${range} tee times on ${item.play_date || 'this week'}. There are ${item.available_slots} available slots with ${item.potential_revenue} in potential revenue. Encourage customers to book during this quieter period.`;
    setEmailPrefill(prefill);
  };

  const formatDateForInput = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10); // YYYY-MM-DD for input[type="date"]
  };

  const parseInputDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  // Handles both DD/MM/YYYY (Google Sheets) and YYYY-MM-DD (ISO) formats
  const parseAnyDate = (value) => {
    if (!value) return null;
    // Try DD/MM/YYYY
    const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Try YYYY-MM-DD or any ISO-like string
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const initializeDateRange = (lookerData) => {
    if (!lookerData || lookerData.length === 0) return;

    const dates = lookerData
      .map(row => row.play_date)
      .filter(Boolean)
      .map(d => parseAnyDate(d))
      .filter(d => d !== null);

    if (dates.length === 0) return;

    const sorted = dates.sort((a, b) => a - b);
    const firstDate = sorted[0];
    const lastDate = sorted[sorted.length - 1];

    setDateRange({
      from: formatDateForInput(firstDate),
      to: formatDateForInput(lastDate)
    });
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedData = await fetchAllData();
      setData(fetchedData);
      setLastUpdated(new Date());
      initializeDateRange(fetchedData.lookerData);
    } catch (err) {
      setError('Failed to load data from Google Sheets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fromDate = useMemo(() => parseInputDate(dateRange.from), [dateRange.from]);
  const toDateEnd = useMemo(() => {
    const d = parseInputDate(dateRange.to);
    if (!d) return null;
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [dateRange.to]);

  const filterByDateRange = useCallback((rows, getDateField) => {
    if (!rows || rows.length === 0) return [];

    return rows.filter(row => {
      const value = getDateField(row);
      if (!value) return false;
      const d = parseAnyDate(value);
      if (!d) return false;
      // Compare dates only (strip time from row date)
      const rowDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (fromDate && rowDateOnly < new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())) return false;
      if (toDateEnd && rowDateOnly > new Date(toDateEnd.getFullYear(), toDateEnd.getMonth(), toDateEnd.getDate())) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDateEnd]);

  const filteredLookerData = useMemo(
    () => filterByDateRange(data.lookerData, row => row.play_date),
    [data.lookerData, filterByDateRange]
  );

  const filteredSlotAnalysis = useMemo(
    () => filterByDateRange(data.slotAnalysis, row => row.play_date),
    [data.slotAnalysis, filterByDateRange]
  );

  const filteredRevenueOpportunity = useMemo(
    () => filterByDateRange(data.revenueOpportunity, row => row.play_date),
    [data.revenueOpportunity, filterByDateRange]
  );

  const revenueAtRisk = useMemo(() => {
    if (!filteredRevenueOpportunity || filteredRevenueOpportunity.length === 0) return 0;
    return filteredRevenueOpportunity.reduce(
      (sum, row) => sum + parseCurrency(row.potential_revenue),
      0
    );
  }, [filteredRevenueOpportunity]);

  const unfilledSlots = useMemo(() => {
    if (!filteredSlotAnalysis || filteredSlotAnalysis.length === 0) return 0;
    return filteredSlotAnalysis.reduce((sum, row) => sum + (row.available_slots || 0), 0);
  }, [filteredSlotAnalysis]);

  const avgVisitorPrice = useMemo(() => {
    if (!filteredLookerData || filteredLookerData.length === 0) return 0;
    const total = filteredLookerData.reduce(
      (sum, row) => sum + parseCurrency(row.avg_price_gbp),
      0
    );
    return total / filteredLookerData.length;
  }, [filteredLookerData]);

  const biggestSingleGap = useMemo(() => {
    if (!filteredSlotAnalysis || filteredSlotAnalysis.length === 0) {
      return { amount: 0, label: '—' };
    }

    const maxRow = filteredSlotAnalysis.reduce((max, row) => {
      if (!max) return row;
      return parseCurrency(row.potential_revenue) > parseCurrency(max.potential_revenue) ? row : max;
    }, null);

    return {
      amount: maxRow ? parseCurrency(maxRow.potential_revenue) : 0,
      label: maxRow ? `${maxRow.day} ${maxRow.time_band}` : '—'
    };
  }, [filteredSlotAnalysis]);

  // Generate date range string from data
  const getDateRange = () => {
    const formatDate = (d) =>
      d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

    const from = parseInputDate(dateRange.from);
    const to = parseInputDate(dateRange.to);

    if (!from && !to) return 'No date range selected';
    if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
    if (from) return `From ${formatDate(from)}`;
    return `To ${formatDate(to)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFA]">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-[#013734] animate-spin mx-auto mb-4" />
          <p className="text-[#013734]">Loading data from Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFA]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-[#013734] text-white px-6 py-2 rounded-lg hover:bg-[#126D5B] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFA]">
      <Header 
        dateRange={getDateRange()} 
        lastUpdated={lastUpdated}
        onRefresh={loadData}
      />

      {/* Top controls: title + date range inputs + tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-[#013734]">
            <span className="w-2 h-2 rounded-full bg-[#40FFB9]" />
            <span className="font-medium">Fairway IQ</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full md:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2 text-sm text-[#5C6B6B]">
              <span>From</span>
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, from: e.target.value }))
                  }
                  className="filter-input pr-9 text-sm text-[#013734]"
                />
               
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 text-sm text-[#5C6B6B]">
              <span className="sm:inline capitalize">to</span>
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="filter-input pr-9 text-sm text-[#013734]"
                />
                
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-b border-[#E0E8E8] w-full" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="mb-8">
          {/* Opportunity Cards - Top 3 Revenue Opportunities */}
          <OpportunityCards data={filteredSlotAnalysis} onEmailClick={handleEmailClick} />
        </section>

        {/* KPI Cards */}
        <div className="mb-4 fade-in">
          <h2 className="ml-6 text-xl font-bold text-[#013734]">
            {formatCurrency(revenueAtRisk)} in unfilled tee time revenue this week
          </h2>
        </div>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Revenue at risk */}
          <div
            className="bg-white border border-[#E0E8E8] rounded-2xl p-6 fade-in transition-transform duration-300 hover:scale-[1.02] shadow-[0_1px_3px_rgba(1,55,52,0.04),_0_4px_12px_rgba(1,55,52,0.03)]"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="mb-3">
              <span className="text-sm text-[#5C6B6B] font-medium">Revenue you're missing this week</span>
            </div>
            <div className="text-3xl font-bold text-[#013734] mb-1">{formatCurrency(revenueAtRisk)}</div>
            <div className="text-sm text-[#5C6B6B]">Unfilled tee times</div>
          </div>

          {/* Unfilled slots */}
          <div
            className="bg-white border border-[#E0E8E8] rounded-2xl p-6 fade-in transition-transform duration-300 hover:scale-[1.02] shadow-[0_1px_3px_rgba(1,55,52,0.04),_0_4px_12px_rgba(1,55,52,0.03)]"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="mb-3">
              <span className="text-sm text-[#5C6B6B] font-medium">Unfilled slots</span>
            </div>
            <div className="text-3xl font-bold text-[#013734] mb-1">{unfilledSlots.toLocaleString()}</div>
            <div className="text-sm text-[#5C6B6B]">Across all time bands</div>
          </div>

          {/* Avg visitor price */}
          <div
            className="bg-white border border-[#E0E8E8] rounded-2xl p-6 fade-in transition-transform duration-300 hover:scale-[1.02] shadow-[0_1px_3px_rgba(1,55,52,0.04),_0_4px_12px_rgba(1,55,52,0.03)]"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="mb-3">
              <span className="text-sm text-[#5C6B6B] font-medium">Avg visitor price</span>
            </div>
            <div className="text-3xl font-bold text-[#013734] mb-1">{formatCurrency(avgVisitorPrice)}</div>
            <div className="text-sm text-[#5C6B6B]">Per round</div>
          </div>

          {/* Biggest single gap */}
          <div
            className="bg-white border border-[#E0E8E8] rounded-2xl p-6 fade-in transition-transform duration-300 hover:scale-[1.02] shadow-[0_1px_3px_rgba(1,55,52,0.04),_0_4px_12px_rgba(1,55,52,0.03)]"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="mb-3">
              <span className="text-sm text-[#5C6B6B] font-medium">Biggest single gap</span>
            </div>
            <div className="text-3xl font-bold text-[#013734] mb-1">{formatCurrency(biggestSingleGap.amount)}</div>
            <div className="text-sm text-[#5C6B6B]">{biggestSingleGap.label}</div>
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Available slots by day"
            // subtitle="Tee time slots available per day"
            insight={generateAvailabilityInsight(filteredLookerData)}
            delay={0.5}
          >
            <AvailabilityChart data={filteredLookerData} />
          </ChartCard>

          <ChartCard
            title="Occupancy by time band"
            // subtitle="Availability breakdown by time band"
            insight={generateTimeInsight(filteredSlotAnalysis)}
            insightType="warning"
            delay={0.6}
          >
            <TimeDistributionChart data={filteredSlotAnalysis} />
          </ChartCard>
        </section>

        {/* Heatmap */}
        <section className="mb-6">
          <div className="card p-6 fade-in" style={{ animationDelay: '0.7s' }}>
            <RevenueHeatmap data={filteredSlotAnalysis} />
          </div>
        </section>

        {/* Charts Row 2 */}
        {/* <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Revenue Opportunity"
            subtitle="Potential revenue from unfilled slots"
            insight={generateRevenueInsight(filteredRevenueOpportunity)}
            delay={0.7}
          >
            <RevenueChart data={filteredRevenueOpportunity} />
          </ChartCard>

          <ChartCard
            title="Visitor Price Trends"
            subtitle="Average pricing by day of week"
            insight="Consistent pricing across all days. Consider dynamic pricing: higher rates on high-demand days, discounts on low-demand weekdays."
            delay={0.8}
          >
            <PricingChart data={filteredLookerData} />
          </ChartCard>
        </section> */}



        {/* AI Email Generator */}
        <section className="mb-8">
          <EmailGenerator prefill={emailPrefill} />
        </section>

        <section className="mt-8">
          {/* Data Table */}
          <DataTable data={filteredSlotAnalysis} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Generate dynamic insights
function generateAvailabilityInsight(data) {
  if (!data || data.length === 0) return 'Loading insights...';
  
  const maxDay = data.reduce((max, row) => 
    row.slots_available > (max?.slots_available || 0) ? row : max, data[0]);
  const minDay = data.reduce((min, row) => 
    row.slots_available < (min?.slots_available || Infinity) ? row : min, data[0]);
  
  return `${maxDay?.day_of_week} has the highest availability (${maxDay?.slots_available} slots), while ${minDay?.day_of_week} shows lowest availability (${minDay?.slots_available} slots) — indicating stronger demand.`;
}

function generateTimeInsight(data) {
  if (!data || data.length === 0) return 'Loading insights...';
  
  const timeBands = { Morning: 0, 'Late AM': 0, 'Early PM': 0, 'Late PM': 0 };
  data.forEach(row => {
    if (timeBands.hasOwnProperty(row.time_band)) {
      timeBands[row.time_band] += row.available_slots;
    }
  });
  
  const maxBand = Object.entries(timeBands).reduce((max, [band, slots]) => 
    slots > max[1] ? [band, slots] : max, ['', 0]);
  const minBand = Object.entries(timeBands).reduce((min, [band, slots]) => 
    slots < min[1] ? [band, slots] : min, ['', Infinity]);
  
  return `${minBand[0]} slots show lowest availability (${minBand[1]} total). ${maxBand[0]} dominates with ${maxBand[1]} slots — consider promotional pricing for ${minBand[0].toLowerCase()} tee times.`;
}

// used in the charts row2 first card but for now its commented so this one is being unused so its commented.
// function generateRevenueInsight(data) {
//   if (!data || data.length === 0) return 'Loading insights...';
  
//   const { parseCurrency, formatCurrency } = require('./data/golfData');
  
//   const totalRevenue = data.reduce((sum, row) => sum + parseCurrency(row.potential_revenue), 0);
//   const maxDay = data.reduce((max, row) => 
//     parseCurrency(row.potential_revenue) > parseCurrency(max?.potential_revenue || '£0') ? row : max, data[0]);
  
//   return `Total weekly opportunity: ${formatCurrency(totalRevenue)}. ${maxDay?.day} has highest potential at ${maxDay?.potential_revenue}.`;
// }

export default App;
