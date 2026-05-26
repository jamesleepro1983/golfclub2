// Golf Dashboard Data - North Foreland Golf Club
// Live data fetched from Google Sheets

// Original Sheet ID
const SHEET_ID = '1hX9tJoCvhKDmEczcVoYOQpwYAiXrWFhHQ1E-gz-47ZE';

// Sheet tab GIDs (from the URL #gid=xxxxx)
const SHEET_GIDS = {
  LOOKER_DATA: '1593898027',
  SLOT_ANALYSIS_CLEAN: '1974967454',
  REVENUE_OPPORTUNITY: '850235511'
};

// Build Google Sheets CSV URL using gid
const getSheetUrlByGid = (gid) => {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}&t=${Date.now()}`;
};

// Parse a single CSV line (handles quoted values with commas)
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.replace(/^"|"$/g, ''));
  
  return result;
};

// Parse CSV text to JSON array with optional row skip
const parseCSV = (csvText, skipRows = 0) => {
  const lines = csvText.trim().split('\n');
  if (lines.length <= skipRows) return [];
  
  // Skip header rows if needed
  const dataLines = lines.slice(skipRows);
  if (dataLines.length === 0) return [];
  
  // Parse header row (first line after skipped rows)
  const headers = parseCSVLine(dataLines[0]);
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < dataLines.length; i++) {
    const values = parseCSVLine(dataLines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    data.push(row);
  }
  
  return data;
};

// Fetch data from Google Sheets by gid
const fetchSheetDataByGid = async (gid, tabName, skipRows = 0) => {
  try {
    const url = getSheetUrlByGid(gid);
    console.log(`Fetching ${tabName} (gid: ${gid}) from:`, url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${tabName}: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log(`Raw CSV for ${tabName}:`, csvText.substring(0, 500));
    
    const parsedData = parseCSV(csvText, skipRows);
    console.log(`Parsed ${tabName} (skipped ${skipRows} rows):`, parsedData);
    
    return parsedData;
  } catch (error) {
    console.error(`Error fetching ${tabName}:`, error);
    return [];
  }
};

// Fetch all dashboard data
export const fetchAllData = async () => {
  console.log('Starting to fetch all data...');
  
  const [lookerData, slotAnalysis, revenueOpportunity] = await Promise.all([
    fetchSheetDataByGid(SHEET_GIDS.LOOKER_DATA, 'LOOKER_DATA', 0),           // No skip - headers on row 1
    fetchSheetDataByGid(SHEET_GIDS.SLOT_ANALYSIS_CLEAN, 'SLOT_ANALYSIS_CLEAN',0),  // Skip 2 rows
    fetchSheetDataByGid(SHEET_GIDS.REVENUE_OPPORTUNITY, 'REVENUE_OPPORTUNITY', 2)   // Skip 2 rows
  ]);

  const result = {
    lookerData: transformLookerData(lookerData),
    slotAnalysis: transformSlotAnalysis(slotAnalysis),
    revenueOpportunity: transformRevenueOpportunity(revenueOpportunity)
  };
  
  console.log('Final transformed data:', result);
  return result;
};

// Transform LOOKER_DATA
const transformLookerData = (data) => {
  if (data.length === 0) return [];
  
  console.log('LOOKER_DATA first row keys:', Object.keys(data[0]));
  
  return data.map(row => ({
    play_date: row.play_date || '',
    day_of_week: row.day_of_week || '',
    course: row.course || '',
    slots_available: parseInt(row.slots_available) || 0,
    avg_price_gbp: row.avg_price_gbp || '£0.00',
    potential_revenue_gbp: row.potential_revenue_gbp || '£0.00',
    morning_slots: parseInt(row.morning_slots) || 0,
    late_am_slots: parseInt(row.late_am_slots) || 0,
    early_pm_slots: parseInt(row.early_pm_slots) || 0,
    late_pm_slots: parseInt(row.late_pm_slots) || 0,
    occupancy_pct: row.occupancy_pct || '0.00%'
  }));
};

// Transform SLOT_ANALYSIS_CLEAN
const transformSlotAnalysis = (data) => {
  if (data.length === 0) return [];
  
  console.log('SLOT_ANALYSIS first row keys:', Object.keys(data[0]));
  
  return data.map(row => ({
    play_date: row['Play Date'] || '',
    day: row['Day'] || '',
    time_band: row['Time Band'] || '',
    available_slots: parseInt(row['Available Slots']) || 0,
    avg_price: row['Average Price (£)'] || '£0.00',
    potential_revenue: row['Potential Revenue (£)'] || '£0.00'
  }));
};

// Transform REVENUE_OPPORTUNITY
const transformRevenueOpportunity = (data) => {
  if (data.length === 0) return [];
  
  console.log('REVENUE_OPPORTUNITY first row keys:', Object.keys(data[0]));
  
  return data
    .filter(row => row['Play Date'] && row['Day']) // Filter out empty rows
    .map(row => ({
      play_date: row['Play Date'] || '',
      day: row['Day'] || '',
      available_slots: parseInt(row['Available Slots']) || 0,
      avg_price: row['Average Price (£)'] || '£0.00',
      potential_revenue: row['Potential Revenue (£)'] || '£0.00'
    }));
};

// Utility functions
export const parseCurrency = (str) => {
  if (!str) return 0;
  return parseFloat(str.replace(/[£,]/g, '')) || 0;
};

export const formatCurrency = (num) => {
  return '£' + num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Calculate KPIs from data
export const calculateKPIs = (lookerData) => {
  if (!lookerData || lookerData.length === 0) {
    return { totalSlots: 0, avgPrice: 0, totalRevenue: 0, avgOccupancy: 0, totalDays: 0 };
  }

  const totalSlots = lookerData.reduce((sum, row) => sum + row.slots_available, 0);
  const avgPrice = parseCurrency(lookerData[0]?.avg_price_gbp || '£0');
  const totalRevenue = lookerData.reduce((sum, row) => sum + parseCurrency(row.potential_revenue_gbp), 0);
  const avgOccupancy = lookerData.reduce((sum, row) => {
    const occ = parseFloat(row.occupancy_pct?.replace('%', '')) || 0;
    return sum + occ;
  }, 0) / lookerData.length;

  return {
    totalSlots,
    avgPrice,
    totalRevenue,
    avgOccupancy,
    totalDays: lookerData.length
  };
};

// Aggregate time band data
export const getTimeBandTotals = (slotAnalysis) => {
  const timeBands = { Morning: 0, 'Late AM': 0, 'Early PM': 0, 'Late PM': 0 };
  
  if (!slotAnalysis) return timeBands;
  
  slotAnalysis.forEach(row => {
    if (timeBands.hasOwnProperty(row.time_band)) {
      timeBands[row.time_band] += row.available_slots;
    }
  });
  
  return timeBands;
};