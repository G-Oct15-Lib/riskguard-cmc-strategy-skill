"use client";

import {
  Activity,
  BarChart3,
  Braces,
  Database,
  Download,
  FileJson,
  Gauge,
  LineChart,
  Play,
  ShieldCheck,
  Target,
  TrendingUp
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ASSETS, RISK_PROFILES, StrategyRequest, StrategyResponse, TIMEFRAMES } from "@/lib/types";

type FormState = Pick<
  StrategyRequest,
  "asset" | "timeframe" | "riskProfile" | "maxDrawdownPct" | "startingEquity" | "feeBps" | "slippageBps" | "lookbackBars"
>;

const INITIAL_FORM: FormState = {
  asset: "BNB",
  timeframe: "4h",
  riskProfile: "balanced",
  maxDrawdownPct: 18,
  startingEquity: 10_000,
  feeBps: 10,
  slippageBps: 8,
  lookbackBars: 700
};

export default function Home() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [report, setReport] = useState<StrategyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const generateStrategy = useCallback(async (nextForm: FormState) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextForm)
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as StrategyResponse;
      if (requestId !== requestIdRef.current) return;
      setForm(payload.request);
      setReport(payload);
      setRunCount((current) => current + 1);
      setLastGeneratedAt(payload.spec.generatedAt);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Unable to generate strategy.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void generateStrategy(INITIAL_FORM);
  }, [generateStrategy]);

  const strategyJson = useMemo(() => JSON.stringify(report?.spec ?? {}, null, 2), [report]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFormAndGenerate<K extends keyof FormState>(key: K, value: FormState[K]) {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    void generateStrategy(nextForm);
  }

  function downloadSpec() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report.spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.spec.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">BNB HACK · Track 2 Strategy Skills</p>
          <h1>RiskGuard CMC Strategy Skill</h1>
        </div>
        <div className="status-pill" title="Track 2 deliverable is a backtestable strategy spec.">
          <ShieldCheck size={18} />
          Backtestable spec
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="control-panel" aria-label="Strategy controls">
          <PanelTitle icon={<Target size={18} />} label="Strategy Inputs" />

          <Field label="Asset">
            <SegmentedControl
              options={ASSETS}
              value={form.asset}
              onChange={(value) => updateFormAndGenerate("asset", value)}
            />
          </Field>

          <Field label="Timeframe">
            <SegmentedControl
              options={TIMEFRAMES}
              value={form.timeframe}
              onChange={(value) => updateFormAndGenerate("timeframe", value)}
            />
          </Field>

          <Field label="Risk Profile">
            <SegmentedControl
              options={RISK_PROFILES}
              value={form.riskProfile}
              onChange={(value) => updateFormAndGenerate("riskProfile", value)}
            />
          </Field>

          <div className="number-grid">
            <NumberField
              label="Max DD %"
              value={form.maxDrawdownPct}
              min={5}
              max={45}
              onChange={(value) => updateForm("maxDrawdownPct", value)}
            />
            <NumberField
              label="Equity"
              value={form.startingEquity}
              min={1000}
              max={1000000}
              step={1000}
              onChange={(value) => updateForm("startingEquity", value)}
            />
            <NumberField
              label="Fee bps"
              value={form.feeBps}
              min={0}
              max={100}
              onChange={(value) => updateForm("feeBps", value)}
            />
            <NumberField
              label="Slippage bps"
              value={form.slippageBps}
              min={0}
              max={250}
              onChange={(value) => updateForm("slippageBps", value)}
            />
            <NumberField
              label="Lookback"
              value={form.lookbackBars}
              min={100}
              max={1000}
              step={20}
              onChange={(value) => updateForm("lookbackBars", value)}
            />
          </div>

          <button className="primary-button" onClick={() => generateStrategy(form)} disabled={isLoading}>
            <Play size={18} />
            {isLoading ? "Generating..." : "Generate Strategy"}
          </button>

          <p className={`run-status ${isLoading ? "loading" : report ? "complete" : ""}`} aria-live="polite">
            {isLoading
              ? "Generating strategy report..."
              : report
                ? `Generated #${runCount} at ${formatTime(lastGeneratedAt ?? report.spec.generatedAt)}`
                : "Waiting for first strategy report..."}
          </p>

          {error ? <p className="error-text">{error}</p> : null}
        </aside>

        <section className="results-panel" aria-label="Strategy report">
          <div className="report-header">
            <div>
              <p className="eyebrow">Generated Report</p>
              <h2>{report ? `${report.spec.asset}/${report.spec.timeframe} ${report.spec.parameters.riskPerTradePct}% Risk` : "Loading strategy report"}</h2>
              {report ? (
                <p className="report-meta">
                  Updated {formatTime(report.spec.generatedAt)} · {report.dataset.sourceLabel}
                </p>
              ) : null}
            </div>
            <button className="secondary-button" onClick={downloadSpec} disabled={!report}>
              <Download size={17} />
              Export JSON
            </button>
          </div>

          {report ? (
            <>
              <div className="metric-grid">
                <Metric icon={<TrendingUp size={18} />} label="Return" value={`${report.metrics.totalReturnPct}%`} tone="green" />
                <Metric icon={<Activity size={18} />} label="Win Rate" value={`${report.metrics.winRatePct}%`} />
                <Metric icon={<Gauge size={18} />} label="Max DD" value={`${report.metrics.maxDrawdownPct}%`} tone={report.metrics.maxDrawdownPct <= report.spec.parameters.maxDrawdownPct ? "green" : "red"} />
                <Metric icon={<BarChart3 size={18} />} label="Sharpe" value={String(report.metrics.sharpeRatio)} />
                <Metric icon={<LineChart size={18} />} label="Profit Factor" value={String(report.metrics.profitFactor)} />
                <Metric icon={<FileJson size={18} />} label="Trades" value={String(report.metrics.trades)} />
              </div>

              <div className="two-column">
                <section className="panel-section">
                  <PanelTitle icon={<LineChart size={18} />} label="Equity Curve" />
                  <EquityChart report={report} />
                </section>

                <section className="panel-section">
                  <PanelTitle icon={<Database size={18} />} label="Data Source" />
                  <dl className="data-list">
                    <div>
                      <dt>Provider</dt>
                      <dd>{report.dataset.sourceLabel}</dd>
                    </div>
                    <div>
                      <dt>Candles</dt>
                      <dd>{report.dataset.candleCount}</dd>
                    </div>
                    <div>
                      <dt>Window</dt>
                      <dd>
                        {formatDate(report.dataset.firstCandle)} to {formatDate(report.dataset.lastCandle)}
                      </dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{report.dataset.fallbackReason ?? "CoinMarketCap API data loaded"}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              <section className="panel-section">
                <PanelTitle icon={<ShieldCheck size={18} />} label="Risk Narrative" />
                <div className="summary-list">
                  {report.summary.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </section>

              <section className="panel-section">
                <PanelTitle icon={<Activity size={18} />} label="Recent Trades" />
                <TradeTable report={report} />
              </section>

              <section className="panel-section">
                <PanelTitle icon={<Braces size={18} />} label="Strategy Spec JSON" />
                <pre className="json-preview">{strategyJson}</pre>
              </section>
            </>
          ) : (
            <div className="loading-panel">Preparing backtest...</div>
          )}
        </section>
      </section>
    </main>
  );
}

function PanelTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="panel-title">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={option === value ? "active" : ""}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Metric({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "green" | "red";
}) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EquityChart({ report }: { report: StrategyResponse }) {
  const points = report.equityCurve;
  const min = Math.min(...points.map((point) => point.equity));
  const max = Math.max(...points.map((point) => point.equity));
  const spread = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point.equity - min) / spread) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Equity curve">
        <line x1="0" y1="82" x2="100" y2="82" className="chart-grid" />
        <line x1="0" y1="50" x2="100" y2="50" className="chart-grid" />
        <line x1="0" y1="18" x2="100" y2="18" className="chart-grid" />
        <polyline points={path} className="equity-line" />
      </svg>
      <div className="chart-labels">
        <span>${Math.round(min).toLocaleString()}</span>
        <span>${Math.round(max).toLocaleString()}</span>
      </div>
    </div>
  );
}

function TradeTable({ report }: { report: StrategyResponse }) {
  const trades = report.trades.slice(-8).reverse();

  if (!trades.length) {
    return <p className="empty-state">No trades generated for this parameter set.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Exit</th>
            <th>Reason</th>
            <th>Entry</th>
            <th>Exit Price</th>
            <th>PnL</th>
            <th>Bars</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={`${trade.entryTime}-${trade.exitTime}-${trade.reason}`}>
              <td>{formatDate(trade.exitTime)}</td>
              <td>{trade.reason}</td>
              <td>{trade.entryPrice}</td>
              <td>{trade.exitPrice}</td>
              <td className={trade.pnl >= 0 ? "profit" : "loss"}>{trade.pnl}</td>
              <td>{trade.barsHeld}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit"
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}
