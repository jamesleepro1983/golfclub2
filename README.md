# Canterbury Golf Club - Tee Time Analytics Dashboard

A professional SaaS-style dashboard for analyzing golf club tee time availability, pricing, and revenue opportunities.

![Dashboard Preview](./preview.png)

## Features

- **KPI Cards**: Total slots, average price, revenue opportunity, occupancy rate
- **Availability by Day Chart**: Bar chart showing slots per weekday
- **Time-of-Day Distribution**: Doughnut chart for Morning/Late AM/Early PM/Late PM breakdown
- **Revenue Opportunity Chart**: Potential revenue from unfilled slots
- **Visitor Price Trends**: Line chart showing pricing patterns
- **Filterable Data Table**: Filter by day, time band, and availability status
- **Smart Insights**: Auto-generated recommendations under each chart

## Tech Stack

- React 18
- Chart.js + react-chartjs-2
- Tailwind CSS
- Lucide React (icons)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

1. Run `npm run build`
2. Drag the `build` folder to [Netlify Drop](https://app.netlify.com/drop)

### Manual Hosting

Upload the contents of the `build` folder to any static hosting service.

## Project Structure

```
golf-dashboard-react/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── ChartCard.js
│   │   ├── AvailabilityChart.js
│   │   ├── TimeDistributionChart.js
│   │   ├── RevenueChart.js
│   │   ├── PricingChart.js
│   │   └── DataTable.js
│   ├── data/
│   │   └── golfData.js        # Embedded data from Google Sheets
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── README.md
```

## Updating Data

The data is currently embedded in `src/data/golfData.js`. To update:

1. Export new data from Google Sheets as CSV
2. Update the arrays in `golfData.js`
3. Rebuild the app

### For Live Google Sheets Integration

To enable live data fetching, you can:

1. Publish your Google Sheet to web (File → Share → Publish to web)
2. Use the Papa Parse library to fetch CSV data
3. Replace the static data imports with API calls

## Customization

### Colors

Edit the CSS variables in `src/index.css`:

```css
:root {
  --primary: #0F4C3A;
  --accent: #E8B54B;
  /* ... */
}
```

### Data

Modify the data arrays in `src/data/golfData.js` to use your own golf club data.

## License

MIT License - Feel free to use for your golf club analytics needs.
