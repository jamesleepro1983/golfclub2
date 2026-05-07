import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { parseCurrency, formatCurrency } from '../data/golfData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PricingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400">No data available</div>;
  }

  const labels = data.map(row => row.day_of_week);
  const prices = data.map(row => parseCurrency(row.avg_price_gbp));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Avg Price',
        data: prices,
        borderColor: '#126D5B',              // Rich Turquoise
        backgroundColor: 'rgba(64, 255, 185, 0.15)',  // Bright Mint with transparency
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#40FFB9',     // Bright Mint
        pointBorderColor: '#013734',         // Tiber
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#40FFB9',
        pointHoverBorderColor: '#013734',
      },
    ],
  };

  const maxPrice = Math.max(...prices);
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#013734',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => 'Price: ' + formatCurrency(context.raw),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
        max: Math.ceil(maxPrice * 1.5),
        grid: { color: '#E0E8E8' },
        ticks: {
          font: { family: 'Inter' },
          color: '#5C6B6B',
          callback: (value) => '£' + value,
        },
      },
      x: {
        grid: { display: false },
        ticks: { 
          font: { family: 'Inter' },
          color: '#013734'
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default PricingChart;
