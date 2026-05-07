import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { parseCurrency, formatCurrency } from '../data/golfData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400">No data available</div>;
  }

  const labels = data.map(row => row.day);
  const revenue = data.map(row => parseCurrency(row.potential_revenue));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Potential Revenue',
        data: revenue,
        backgroundColor: '#40FFB9',  // Bright Mint
        hoverBackgroundColor: '#2DD4A0',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

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
          label: (context) => formatCurrency(context.raw) + ' potential',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#E0E8E8' },
        ticks: {
          font: { family: 'Inter' },
          color: '#5C6B6B',
          callback: (value) => '£' + value.toLocaleString(),
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

  return <Bar data={chartData} options={options} />;
};

export default RevenueChart;
