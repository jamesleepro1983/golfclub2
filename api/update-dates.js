const { google } = require('googleapis');

const SHEET_ID      = '1hX9tJoCvhKDmEczcVoYOQpwYAiXrWFhHQ1E-gz-47ZE';
const START_DATE_CELL = 'SETTINGS!B2';
const DAYS_TO_SCRAPE_CELL = 'SETTINGS!B3';

// Calculate number of days between two YYYY-MM-DD dates (inclusive)
function daysBetween(from, to) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((new Date(to) - new Date(from)) / msPerDay);
  return Math.max(1, diff + 1); // at least 1 day
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fromDate, toDate } = req.body || {};

  if (!fromDate || !toDate) {
    return res.status(400).json({ error: 'fromDate and toDate are required (YYYY-MM-DD)' });
  }

  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey   = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceEmail || !privateKey) {
    return res.status(500).json({
      error: 'Google Sheets credentials not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to Vercel environment variables.',
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const days   = daysBetween(fromDate, toDate);

    // Update SETTINGS!B2 (Start Play Date) and SETTINGS!B3 (Days to Scrape)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: START_DATE_CELL,    values: [[fromDate]] },
          { range: DAYS_TO_SCRAPE_CELL, values: [[days]]   },
        ],
      },
    });

    return res.status(200).json({ success: true, startDate: fromDate, daysToScrape: days });
  } catch (err) {
    console.error('[update-dates] Google Sheets API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
