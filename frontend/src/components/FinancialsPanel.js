import React from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#5b5e76", font: { weight: 600 } } },
  },
  scales: {
    x: { ticks: { color: "#8b8fa3" }, grid: { color: "#e8eaef" } },
    y: { ticks: { color: "#8b8fa3" }, grid: { color: "#e8eaef" } },
  },
};

function formatB(val) {
  if (val == null) return "—";
  const abs = Math.abs(val);
  if (abs >= 1e12) return (val / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (val / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (val / 1e6).toFixed(1) + "M";
  return val.toLocaleString();
}

function FinancialsPanel({ data }) {
  if (!data) return <div className="loading">No data available.</div>;

  const revenueChart = {
    labels: data.revenue.map((d) => d.year),
    datasets: [
      {
        label: "Revenue",
        data: data.revenue.map((d) => d.value),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
      {
        label: "Net Income",
        data: data.net_income.map((d) => d.value),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
      },
    ],
  };

  const priceChart = {
    labels: data.price_history.map((d) => d.date),
    datasets: [
      {
        label: "Price",
        data: data.price_history.map((d) => d.close),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  const priceOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        ticks: {
          ...chartOptions.scales.x.ticks,
          maxTicksLimit: 12,
        },
      },
    },
  };

  const marginChart =
    data.margins.length > 0
      ? {
          labels: data.margins.map((d) => d.period),
          datasets: [
            {
              label: "Gross Margin %",
              data: data.margins.map((d) => d.gross_margin),
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              fill: true,
              tension: 0.3,
            },
          ],
        }
      : null;

  const cfChart =
    data.cash_flow.length > 0
      ? {
          labels: data.cash_flow.map((d) => d.year),
          datasets: [
            {
              label: "Operating Cash Flow",
              data: data.cash_flow.map((d) => d.operating_cf),
              backgroundColor: "rgba(139, 92, 246, 0.7)",
            },
          ],
        }
      : null;

  const r = data.ratios;

  return (
    <div className="financials-panel">
      <div className="ratios-bar">
        <div className="ratio">
          <span className="ratio-label">P/E</span>
          <span className="ratio-value">{r.pe_ratio?.toFixed(1) ?? "—"}</span>
        </div>
        <div className="ratio">
          <span className="ratio-label">Fwd P/E</span>
          <span className="ratio-value">
            {r.forward_pe?.toFixed(1) ?? "—"}
          </span>
        </div>
        <div className="ratio">
          <span className="ratio-label">P/B</span>
          <span className="ratio-value">{r.pb_ratio?.toFixed(1) ?? "—"}</span>
        </div>
        <div className="ratio">
          <span className="ratio-label">D/E</span>
          <span className="ratio-value">
            {r.debt_to_equity?.toFixed(1) ?? "—"}
          </span>
        </div>
        <div className="ratio">
          <span className="ratio-label">ROE</span>
          <span className="ratio-value">
            {r.roe != null ? (r.roe * 100).toFixed(1) + "%" : "—"}
          </span>
        </div>
        <div className="ratio">
          <span className="ratio-label">Mkt Cap</span>
          <span className="ratio-value">{formatB(r.market_cap)}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Stock Price (1Y)</h3>
          <div className="chart-container">
            <Line data={priceChart} options={priceOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Revenue & Net Income</h3>
          <div className="chart-container">
            <Bar
              data={revenueChart}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.dataset.label}: ${formatB(ctx.raw)}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {marginChart && (
          <div className="chart-card">
            <h3>Gross Margin Trend</h3>
            <div className="chart-container">
              <Line data={marginChart} options={chartOptions} />
            </div>
          </div>
        )}

        {cfChart && (
          <div className="chart-card">
            <h3>Operating Cash Flow</h3>
            <div className="chart-container">
              <Bar
                data={cfChart}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: (ctx) =>
                          `${ctx.dataset.label}: ${formatB(ctx.raw)}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialsPanel;
