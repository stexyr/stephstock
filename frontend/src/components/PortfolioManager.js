import React, { useState } from "react";
import axios from "axios";

function PortfolioManager({ portfolio, apiBase, onChanged, onClose }) {
  const [password, setPassword] = useState("");
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearForm = () => {
    setTicker("");
    setName("");
    setShares("");
    setAvgCost("");
  };

  const handleAdd = async () => {
    setError("");
    setSuccess("");
    if (!password) return setError("Password required");
    if (!ticker || !name || !shares || !avgCost)
      return setError("All fields required");
    try {
      await axios.post(`${apiBase}/api/portfolio/add`, {
        password,
        ticker: ticker.toUpperCase(),
        name,
        shares: parseFloat(shares),
        avg_cost: parseFloat(avgCost),
      });
      setSuccess(`Added ${ticker.toUpperCase()}`);
      clearForm();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add");
    }
  };

  const handleRemove = async (t) => {
    setError("");
    setSuccess("");
    if (!password) return setError("Enter password first");
    try {
      await axios.post(`${apiBase}/api/portfolio/remove`, {
        password,
        ticker: t,
      });
      setSuccess(`Removed ${t}`);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to remove");
    }
  };

  return (
    <div className="portfolio-manager">
      <div className="manager-header">
        <h2>Manage Portfolio</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      <div className="password-row">
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter edit password"
        />
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="add-stock-form">
        <h3>Add Stock</h3>
        <div className="form-row">
          <input
            placeholder="Ticker (e.g. AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
          />
          <input
            placeholder="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
          />
          <input
            type="number"
            placeholder="Avg Cost ($)"
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
          />
          <button className="save-btn" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>

      <div className="current-holdings">
        <h3>Current Holdings</h3>
        <div className="holdings-list">
          {portfolio.map((h) => (
            <div key={h.ticker} className="holding-item">
              <span className="holding-ticker">{h.ticker}</span>
              <span className="holding-name">{h.name}</span>
              <span>{h.shares} shares @ ${h.avg_cost.toFixed(2)}</span>
              <button
                className="remove-btn"
                onClick={() => handleRemove(h.ticker)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PortfolioManager;
