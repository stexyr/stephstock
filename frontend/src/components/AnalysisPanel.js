import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function AnalysisPanel({ ticker, analysis, apiBase, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    business_model: analysis?.business_model || "",
    risks: analysis?.risks || "",
    valuation: analysis?.valuation || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await axios.put(
        `${apiBase}/api/stock/${ticker}/analysis`,
        { password, ...form }
      );
      onUpdate(res.data);
      setEditing(false);
      setPassword("");
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "Wrong password."
          : "Failed to save."
      );
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="analysis-panel editing">
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

        <div className="editor-section">
          <h3>Business Model</h3>
          <textarea
            value={form.business_model}
            onChange={(e) =>
              setForm({ ...form, business_model: e.target.value })
            }
            rows={6}
            placeholder="Describe the business model (Markdown supported)..."
          />
        </div>

        <div className="editor-section">
          <h3>Risks</h3>
          <textarea
            value={form.risks}
            onChange={(e) => setForm({ ...form, risks: e.target.value })}
            rows={6}
            placeholder="List key risks (Markdown supported)..."
          />
        </div>

        <div className="editor-section">
          <h3>Valuation</h3>
          <textarea
            value={form.valuation}
            onChange={(e) => setForm({ ...form, valuation: e.target.value })}
            rows={6}
            placeholder="Valuation analysis (Markdown supported)..."
          />
        </div>

        <div className="editor-actions">
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="cancel-btn" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
      <button className="edit-btn" onClick={() => setEditing(true)}>
        Edit Analysis
      </button>

      <div className="analysis-section">
        <h3>Business Model</h3>
        <div className="markdown-content">
          <ReactMarkdown>{analysis?.business_model || ""}</ReactMarkdown>
        </div>
      </div>

      <div className="analysis-section">
        <h3>Risks</h3>
        <div className="markdown-content">
          <ReactMarkdown>{analysis?.risks || ""}</ReactMarkdown>
        </div>
      </div>

      <div className="analysis-section">
        <h3>Valuation</h3>
        <div className="markdown-content">
          <ReactMarkdown>{analysis?.valuation || ""}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPanel;
