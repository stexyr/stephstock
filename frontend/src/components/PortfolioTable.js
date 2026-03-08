import React from "react";

function PortfolioTable({ portfolio, selected, onSelect }) {
  return (
    <div className="portfolio-table">
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Company</th>
            <th>Shares</th>
            <th>Avg Cost (USD)</th>
            <th>Price (USD)</th>
            <th>Market Value</th>
            <th>Gain/Loss</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map((h) => (
            <tr
              key={h.ticker}
              className={`stock-row ${selected === h.ticker ? "active" : ""}`}
              onClick={() => onSelect(h.ticker === selected ? null : h.ticker)}
            >
              <td className="ticker">
                {h.ticker}
                {h.currency && h.currency !== "USD" && (
                  <span className="currency-badge">{h.currency}</span>
                )}
              </td>
              <td>{h.name}</td>
              <td>{h.shares}</td>
              <td>
                {h.avg_cost_usd != null
                  ? `$${h.avg_cost_usd.toFixed(2)}`
                  : `$${h.avg_cost.toFixed(2)}`}
              </td>
              <td>{h.current_price ? `$${h.current_price.toFixed(2)}` : "—"}</td>
              <td>
                {h.market_value
                  ? `$${h.market_value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}`
                  : "—"}
              </td>
              <td className={h.gain_pct != null && h.gain_pct >= 0 ? "gain" : "loss"}>
                {h.gain_pct != null
                  ? `${h.gain_pct >= 0 ? "+" : ""}${h.gain_pct}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PortfolioTable;
