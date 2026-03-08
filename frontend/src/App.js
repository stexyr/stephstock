import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PortfolioTable from "./components/PortfolioTable";
import PortfolioPieChart from "./components/PortfolioPieChart";
import PortfolioManager from "./components/PortfolioManager";
import StockDetail from "./components/StockDetail";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "";

function App() {
  const [portfolio, setPortfolio] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false);

  const fetchPortfolio = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API}/api/portfolio`)
      .then((res) => setPortfolio(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const totalValue = portfolio.reduce(
    (sum, h) => sum + (h.market_value || 0),
    0
  );
  const totalCost = portfolio.reduce(
    (sum, h) => sum + h.shares * (h.avg_cost_usd ?? h.avg_cost),
    0
  );
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>My Stock Portfolio</h1>
          <button
            className="manage-btn"
            onClick={() => setShowManager(!showManager)}
          >
            {showManager ? "Close" : "Manage Portfolio"}
          </button>
        </div>
        <div className="summary">
          <div className="summary-item">
            <span className="label">Total Value</span>
            <span className="value">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Total Gain/Loss</span>
            <span className={`value ${totalGain >= 0 ? "gain" : "loss"}`}>
              {totalGain >= 0 ? "+" : ""}
              ${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2 })} (
              {totalGainPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </header>

      {showManager && (
        <PortfolioManager
          portfolio={portfolio}
          apiBase={API}
          onChanged={fetchPortfolio}
          onClose={() => setShowManager(false)}
        />
      )}

      <main className="main">
        {loading ? (
          <div className="loading">Loading portfolio...</div>
        ) : (
          <>
            <div className="portfolio-overview">
              <div className="table-section">
                <PortfolioTable
                  portfolio={portfolio}
                  selected={selected}
                  onSelect={setSelected}
                />
              </div>
              <div className="pie-section">
                <PortfolioPieChart portfolio={portfolio} />
              </div>
            </div>
            {selected && (
              <StockDetail
                ticker={selected}
                apiBase={API}
                onClose={() => setSelected(null)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
