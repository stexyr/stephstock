import json
import math
import os
from pathlib import Path

import yfinance as yf
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import EDIT_PASSWORD

app = FastAPI(title="Stock Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React build if it exists (production deployment)
BUILD_DIR = Path(__file__).parent.parent / "frontend" / "build"

ANALYSES_DIR = Path(__file__).parent / "analyses"
ANALYSES_DIR.mkdir(exist_ok=True)

PORTFOLIO_FILE = Path(__file__).parent / "portfolio.json"


def sanitize(val):
    """Replace NaN/Inf with None for JSON safety."""
    if val is None:
        return None
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    if isinstance(val, dict):
        return {k: sanitize(v) for k, v in val.items()}
    if isinstance(val, list):
        return [sanitize(v) for v in val]
    return val


# ---------- Currency helpers ----------

_fx_cache: dict[str, float] = {}


def get_fx_rate(currency: str) -> float:
    """Get exchange rate to convert `currency` to USD. Returns 1.0 for USD."""
    if currency == "USD":
        return 1.0
    if currency == "GBp":
        return get_fx_rate("GBP") / 100.0

    if currency in _fx_cache:
        return _fx_cache[currency]

    try:
        pair = f"{currency}USD=X"
        t = yf.Ticker(pair)
        hist = t.history(period="1d")
        if hist is not None and not hist.empty:
            rate = float(hist["Close"].iloc[-1])
            _fx_cache[currency] = rate
            return rate
    except Exception as e:
        print(f"FX rate error for {currency}: {e}")

    return 1.0


# ---------- Portfolio persistence ----------

def _load_portfolio() -> list:
    if PORTFOLIO_FILE.exists():
        return json.loads(PORTFOLIO_FILE.read_text(encoding="utf-8"))
    from config import PORTFOLIO
    _save_portfolio(PORTFOLIO)
    return PORTFOLIO


def _save_portfolio(data: list):
    PORTFOLIO_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


# ---------- Models ----------

class AnalysisUpdate(BaseModel):
    password: str
    business_model: str
    risks: str
    valuation: str


class StockAdd(BaseModel):
    password: str
    ticker: str
    name: str
    shares: float
    avg_cost: float


class StockRemove(BaseModel):
    password: str
    ticker: str


class StockEdit(BaseModel):
    password: str
    ticker: str
    name: str | None = None
    shares: float | None = None
    avg_cost: float | None = None


# ---------- Portfolio ----------

@app.get("/api/portfolio")
def get_portfolio():
    """Return portfolio with live prices, all converted to USD."""
    portfolio = _load_portfolio()
    _fx_cache.clear()

    result = []
    for h in portfolio:
        ticker = h["ticker"]
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            currency = info.get("currency", "USD")
            price_local = info.get("currentPrice") or info.get("regularMarketPrice")

            if price_local is not None:
                fx_rate = get_fx_rate(currency)
                price_usd = round(price_local * fx_rate, 2)
                avg_cost_usd = round(h["avg_cost"] * fx_rate, 2)
                market_value = round(price_usd * h["shares"], 2)
                gain_pct = round((price_usd / avg_cost_usd - 1) * 100, 2) if avg_cost_usd != 0 else 0
            else:
                price_usd = None
                avg_cost_usd = h["avg_cost"]
                market_value = None
                gain_pct = None
                currency = "USD"

            result.append({
                **h,
                "current_price": price_usd,
                "local_price": price_local,
                "currency": currency,
                "avg_cost_usd": avg_cost_usd,
                "market_value": market_value,
                "gain_pct": gain_pct,
            })
        except Exception as e:
            print(f"Error fetching {ticker}: {e}")
            result.append({
                **h,
                "current_price": None,
                "local_price": None,
                "currency": "USD",
                "avg_cost_usd": h["avg_cost"],
                "market_value": None,
                "gain_pct": None,
            })

    return result


@app.post("/api/portfolio/add")
def add_stock(body: StockAdd):
    if body.password != EDIT_PASSWORD:
        raise HTTPException(status_code=403, detail="Wrong password")
    portfolio = _load_portfolio()
    if any(h["ticker"].upper() == body.ticker.upper() for h in portfolio):
        raise HTTPException(status_code=400, detail="Ticker already in portfolio")
    portfolio.append({
        "ticker": body.ticker.upper(),
        "name": body.name,
        "shares": body.shares,
        "avg_cost": body.avg_cost,
    })
    _save_portfolio(portfolio)
    return {"status": "added", "ticker": body.ticker.upper()}


@app.post("/api/portfolio/remove")
def remove_stock(body: StockRemove):
    if body.password != EDIT_PASSWORD:
        raise HTTPException(status_code=403, detail="Wrong password")
    portfolio = _load_portfolio()
    new_portfolio = [h for h in portfolio if h["ticker"].upper() != body.ticker.upper()]
    if len(new_portfolio) == len(portfolio):
        raise HTTPException(status_code=404, detail="Ticker not found")
    _save_portfolio(new_portfolio)
    return {"status": "removed", "ticker": body.ticker.upper()}


@app.post("/api/portfolio/edit")
def edit_stock(body: StockEdit):
    if body.password != EDIT_PASSWORD:
        raise HTTPException(status_code=403, detail="Wrong password")
    portfolio = _load_portfolio()
    found = False
    for h in portfolio:
        if h["ticker"].upper() == body.ticker.upper():
            if body.name is not None:
                h["name"] = body.name
            if body.shares is not None:
                h["shares"] = body.shares
            if body.avg_cost is not None:
                h["avg_cost"] = body.avg_cost
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Ticker not found")
    _save_portfolio(portfolio)
    return {"status": "updated", "ticker": body.ticker.upper()}


# ---------- Financials ----------

def safe_float(val) -> float | None:
    """Convert to float, return None if NaN/Inf/missing."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


@app.get("/api/stock/{ticker}/financials")
def get_financials(ticker: str):
    """Fetch key financial data from Yahoo Finance."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        currency = info.get("currency", "USD")

        # Income statement (annual)
        income = stock.financials
        revenue = []
        net_income = []
        if income is not None and not income.empty:
            for col in income.columns:
                year = str(col.year) if hasattr(col, "year") else str(col)
                if "Total Revenue" in income.index:
                    v = safe_float(income.loc["Total Revenue", col])
                    if v is not None:
                        revenue.append({"year": year, "value": v})
                if "Net Income" in income.index:
                    v = safe_float(income.loc["Net Income", col])
                    if v is not None:
                        net_income.append({"year": year, "value": v})

        revenue.reverse()
        net_income.reverse()

        # Margins
        quarterly = stock.quarterly_financials
        margins = []
        if quarterly is not None and not quarterly.empty:
            for col in quarterly.columns:
                label = col.strftime("%Y-Q%m") if hasattr(col, "strftime") else str(col)
                rev = safe_float(quarterly.loc["Total Revenue", col]) if "Total Revenue" in quarterly.index else None
                gp = safe_float(quarterly.loc["Gross Profit", col]) if "Gross Profit" in quarterly.index else None
                if rev and gp and rev != 0:
                    margins.append({"period": label, "gross_margin": round(gp / rev * 100, 2)})
            margins.reverse()

        # Cash flow
        cashflow = stock.cashflow
        cf_data = []
        if cashflow is not None and not cashflow.empty:
            for col in cashflow.columns:
                year = str(col.year) if hasattr(col, "year") else str(col)
                operating = None
                for key in ["Operating Cash Flow", "Total Cash From Operating Activities"]:
                    if key in cashflow.index:
                        operating = safe_float(cashflow.loc[key, col])
                        break
                if operating is not None:
                    cf_data.append({"year": year, "operating_cf": operating})
            cf_data.reverse()

        # Price history (1 year)
        hist = stock.history(period="1y")
        price_history = []
        if hist is not None and not hist.empty:
            for date, row in hist.iterrows():
                close = safe_float(row["Close"])
                if close is not None:
                    price_history.append({
                        "date": date.strftime("%Y-%m-%d"),
                        "close": round(close, 2),
                    })

        # Key ratios - sanitize each one
        ratios = sanitize({
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "debt_to_equity": info.get("debtToEquity"),
            "roe": info.get("returnOnEquity"),
            "market_cap": info.get("marketCap"),
            "dividend_yield": info.get("dividendYield"),
        })

        return {
            "ticker": ticker.upper(),
            "name": info.get("shortName", ticker),
            "currency": currency,
            "revenue": revenue,
            "net_income": net_income,
            "margins": margins,
            "cash_flow": cf_data,
            "price_history": price_history,
            "ratios": ratios,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Analysis ----------

def _analysis_path(ticker: str) -> Path:
    return ANALYSES_DIR / f"{ticker.upper().replace(':', '_').replace('.', '_')}.json"


def _default_analysis(ticker: str) -> dict:
    return {
        "ticker": ticker.upper(),
        "business_model": "No analysis yet. Click Edit to add your analysis.",
        "risks": "No analysis yet. Click Edit to add your analysis.",
        "valuation": "No analysis yet. Click Edit to add your analysis.",
    }


@app.get("/api/stock/{ticker}/analysis")
def get_analysis(ticker: str):
    path = _analysis_path(ticker)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return _default_analysis(ticker)


@app.put("/api/stock/{ticker}/analysis")
def update_analysis(ticker: str, body: AnalysisUpdate):
    if body.password != EDIT_PASSWORD:
        raise HTTPException(status_code=403, detail="Wrong password")
    data = {
        "ticker": ticker.upper(),
        "business_model": body.business_model,
        "risks": body.risks,
        "valuation": body.valuation,
    }
    path = _analysis_path(ticker)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data


# ---------- Serve React frontend ----------

if BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=BUILD_DIR / "static"), name="static")

    @app.get("/{full_path:path}")
    async def serve_react(request: Request, full_path: str):
        # Serve the file if it exists in the build folder
        file_path = BUILD_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise serve index.html (React SPA routing)
        return FileResponse(BUILD_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
