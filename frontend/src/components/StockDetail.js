import React, { useState, useEffect } from "react";
import axios from "axios";
import FinancialsPanel from "./FinancialsPanel";
import AnalysisPanel from "./AnalysisPanel";

function StockDetail({ ticker, apiBase, onClose }) {
  const [tab, setTab] = useState("financials");
  const [financials, setFinancials] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Encode ticker for URL (handles dots in "0700.HK", "UTG.L")
  const encodedTicker = encodeURIComponent(ticker);

  useEffect(() => {
    setLoading(true);
    setTab("financials");
    Promise.all([
      axios.get(`${apiBase}/api/stock/${encodedTicker}/financials`),
      axios.get(`${apiBase}/api/stock/${encodedTicker}/analysis`),
    ])
      .then(([fin, ana]) => {
        setFinancials(fin.data);
        setAnalysis(ana.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ticker, apiBase, encodedTicker]);

  return (
    <div className="stock-detail">
      <div className="detail-header">
        <h2>{financials?.name || ticker}</h2>
        <div className="tab-bar">
          <button
            className={tab === "financials" ? "active" : ""}
            onClick={() => setTab("financials")}
          >
            Financials
          </button>
          <button
            className={tab === "analysis" ? "active" : ""}
            onClick={() => setTab("analysis")}
          >
            Analysis
          </button>
        </div>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading data for {ticker}...</div>
      ) : tab === "financials" ? (
        <FinancialsPanel data={financials} />
      ) : (
        <AnalysisPanel
          ticker={encodedTicker}
          analysis={analysis}
          apiBase={apiBase}
          onUpdate={setAnalysis}
        />
      )}
    </div>
  );
}

export default StockDetail;
