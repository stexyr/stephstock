import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#e11d48",
];

function PortfolioPieChart({ portfolio }) {
  const withValue = portfolio.filter((h) => h.market_value != null && h.market_value > 0);

  if (withValue.length === 0) {
    return (
      <div className="pie-chart-card">
        <h3>Allocation</h3>
        <p className="no-data">No market data available</p>
      </div>
    );
  }

  const totalValue = withValue.reduce((sum, h) => sum + h.market_value, 0);

  const data = {
    labels: withValue.map((h) => h.ticker),
    datasets: [
      {
        data: withValue.map((h) => h.market_value),
        backgroundColor: withValue.map((_, i) => COLORS[i % COLORS.length]),
        borderColor: "#fff",
        borderWidth: 3,
        hoverBorderColor: "#1a1a2e",
        hoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#3a3d52",
          padding: 12,
          font: { size: 13 },
          generateLabels: (chart) => {
            const dataset = chart.data.datasets[0];
            return chart.data.labels.map((label, i) => {
              const value = dataset.data[i];
              const pct = ((value / totalValue) * 100).toFixed(1);
              return {
                text: `${label}  ${pct}%`,
                fillStyle: dataset.backgroundColor[i],
                strokeStyle: "transparent",
                index: i,
              };
            });
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.raw;
            const pct = ((value / totalValue) * 100).toFixed(1);
            return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="pie-chart-card">
      <h3>Portfolio Allocation</h3>
      <div className="pie-container">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}

export default PortfolioPieChart;
