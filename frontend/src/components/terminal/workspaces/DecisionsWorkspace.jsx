/**
 * Decisions Workspace — Trading Terminal
 * 
 * Shows decision traces: full journey of each trading decision.
 * Design: matches Trading Terminal style (white bg, Gilroy, black/white).
 * 
 * This belongs to TRADING (not analysis).
 * TA = research & analytics
 * Trading = decisions, execution, positions, portfolio
 */

import { useState, useEffect, useCallback } from 'react';
import { Activity, CheckCircle, XCircle, Clock, Zap, Shield, RefreshCw, TrendingUp, TrendingDown, Play, Square } from 'lucide-react';
import DecisionTimeline from '../timeline/DecisionTimeline';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ─── Step rendering config ───────────────────────────────────
const STEP_META = {
  SIGNAL:           { label: 'Signal',           color: '#3b82f6' },
  RISK_APPROVED:    { label: 'Risk Approved',    color: '#16a34a' },
  RISK_REJECTED:    { label: 'Risk Rejected',    color: '#dc2626' },
  MODE_GATE:        { label: 'Mode Gate',        color: '#7c3aed' },
  R1_SIZING:        { label: 'R1 Sizing',        color: '#0891b2' },
  R2_ADAPTIVE:      { label: 'R2 Adaptive',      color: '#d97706' },
  SAFETY:           { label: 'Safety OK',         color: '#16a34a' },
  EXECUTION:        { label: 'Execution',         color: '#059669' },
  PENDING_CREATED:  { label: 'Pending',           color: '#ca8a04' },
  OPERATOR_CREATED: { label: 'Created by Operator', color: '#d97706' },
};

const STATUS_STYLE = {
  EXECUTED:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  PENDING:     { bg: '#fefce8', text: '#a16207', border: '#fde68a' },
  REJECTED:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  BLOCKED:     { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  IN_PROGRESS: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

// ─── Stats Bar ───────────────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'Total',    value: stats.total_traces, color: '#0f172a' },
    { label: 'Executed',  value: stats.executed,     color: '#16a34a' },
    { label: 'Pending',   value: stats.pending,      color: '#ca8a04' },
    { label: 'Rejected',  value: stats.rejected,     color: '#dc2626' },
    { label: 'Pass Rate', value: `${stats.pass_rate}%`, color: '#3b82f6' },
  ];

  return (
    <div className="flex gap-3 mb-4" data-testid="decisions-stats">
      {items.map(({ label, value, color }) => (
        <div key={label} className="flex-1 bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <div className="text-[22px] font-bold" style={{ color }}>{value}</div>
          <div className="text-[11px] text-neutral-400 uppercase tracking-wide mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Single step in timeline ─────────────────────────────────
function StepRow({ step }) {
  const meta = STEP_META[step.step] || { label: step.step, color: '#64748b' };
  const d = step.data || {};
  
  const details = [];
  if (d.confidence) details.push(`${(d.confidence * 100).toFixed(0)}%`);
  if (d.strategy) details.push(d.strategy);
  if (d.entry_price) details.push(`Entry $${Number(d.entry_price).toLocaleString()}`);
  if (d.stop_price) details.push(`Stop $${Number(d.stop_price).toLocaleString()}`);
  if (d.target_price) details.push(`Target $${Number(d.target_price).toLocaleString()}`);
  if (d.qty) details.push(`Qty ${d.qty}`);
  if (d.r2_multiplier) details.push(`R2 ×${d.r2_multiplier.toFixed(2)}`);
  if (d.reason) details.push(d.reason);
  if (d.mode) details.push(`${d.mode} → ${d.action}`);
  if (d.decision_id) details.push(d.decision_id);

  return (
    <div className="flex items-start gap-3 py-2" data-testid={`step-${step.step.toLowerCase()}`}>
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: meta.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-neutral-900">{meta.label}</span>
          <span className="text-[11px] text-neutral-400">
            {new Date(step.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {details.length > 0 && (
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {details.join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trace Card ──────────────────────────────────────────────
function DecisionCard({ trace, onApprove, onReject, onOpenTimeline }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const isPending = trace.final_status === 'PENDING';
  const ss = STATUS_STYLE[trace.final_status] || STATUS_STYLE.IN_PROGRESS;

  // Find decision_id
  const decStep = trace.steps?.find(s => s.step === 'PENDING_CREATED' || s.step === 'OPERATOR_CREATED');
  const decisionId = decStep?.data?.decision_id;

  const doApprove = async (e) => {
    e.stopPropagation();
    if (!decisionId) return;
    setLoading(true);
    // Save note if present before approving
    if (note.trim() && decisionId) {
      await fetch(`${API_URL}/api/decisions/${decisionId}/note`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() }),
      });
    }
    try { await onApprove(decisionId); } finally { setLoading(false); }
  };
  const doReject = async (e) => {
    e.stopPropagation();
    if (!decisionId) return;
    setLoading(true);
    // Save note if present before rejecting
    if (note.trim() && decisionId) {
      await fetch(`${API_URL}/api/decisions/${decisionId}/note`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() }),
      });
    }
    try { await onReject(decisionId); } finally { setLoading(false); }
  };
  
  const saveNote = async (e) => {
    e.stopPropagation();
    if (!note.trim() || !decisionId) return;
    await fetch(`${API_URL}/api/decisions/${decisionId}/note`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note.trim() }),
    });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div
      className="bg-white border border-neutral-200 rounded-lg overflow-hidden cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={() => setOpen(!open)}
      data-testid={`decision-card-${trace.trace_id}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${trace.side === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {trace.side}
          </span>
          <span className="text-[14px] font-semibold text-neutral-900">{trace.symbol}</span>
          <span className="text-[11px] text-neutral-400">{trace.steps_count} steps · {trace.duration_ms}ms</span>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded"
          style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}
        >
          {trace.final_status}
        </span>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-neutral-100 px-4 pb-4">
          {/* Timeline */}
          <div className="pt-3 space-y-0">
            {trace.steps.map((s, i) => <StepRow key={i} step={s} />)}
          </div>

          {trace.final_reason && (
            <div className="text-[11px] text-neutral-400 mt-2 italic border-t border-neutral-100 pt-2">
              {trace.final_reason}
            </div>
          )}

          {/* Actions row: Notes + Timeline + Approval */}
          {decisionId && (
            <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
              {/* Operator Note */}
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Operator note: why approve/reject?"
                  className="flex-1 px-3 py-1.5 text-[11px] border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                  data-testid="operator-note-input"
                />
                <button
                  onClick={saveNote}
                  className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
                  data-testid="save-note-btn"
                >
                  {noteSaved ? 'Saved' : 'Save'}
                </button>
              </div>
              
              {/* Buttons row */}
              <div className="flex items-center gap-2" data-testid="operator-approval-panel">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenTimeline?.(); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                  data-testid="open-timeline-btn"
                >
                  <Clock size={13} />
                  TIMELINE
                </button>
                {isPending && (
                  <>
                    <button
                      onClick={doApprove}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors border disabled:opacity-50"
                      style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                      data-testid="approve-decision-btn"
                    >
                      <CheckCircle size={14} />
                      {loading ? 'Executing...' : 'APPROVE'}
                    </button>
                    <button
                      onClick={doReject}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors border disabled:opacity-50"
                      style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
                      data-testid="reject-decision-btn"
                    >
                      <XCircle size={14} />
                      {loading ? 'Rejecting...' : 'REJECT'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Daemon control strip ────────────────────────────────────
function DaemonStrip({ daemon, onToggle, onRefresh, onRunOnce }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-200" data-testid="daemon-strip">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${daemon?.is_running ? 'bg-green-500 animate-pulse' : 'bg-neutral-300'}`} />
        <span className="text-[12px] text-neutral-500">
          {daemon?.is_running 
            ? `LIVE · ${daemon.cycles_count} cycles · uptime ${daemon.uptime_sec}s`
            : 'DAEMON STOPPED'
          }
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRunOnce}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
          data-testid="run-once-btn"
        >
          <Zap size={12} /> RUN ONCE
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded border transition-colors ${
            daemon?.is_running
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-green-200 text-green-700 hover:bg-green-50'
          }`}
          data-testid="daemon-toggle-btn"
        >
          {daemon?.is_running ? <><Square size={12} /> STOP</> : <><Play size={12} /> START</>}
        </button>
        <button onClick={onRefresh} className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400" data-testid="refresh-decisions-btn">
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Workspace ──────────────────────────────────────────
export default function DecisionsWorkspace() {
  const [traces, setTraces] = useState([]);
  const [stats, setStats] = useState(null);
  const [daemon, setDaemon] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, sRes, dRes] = await Promise.all([
        fetch(`${API_URL}/api/trace/latest?limit=30`).then(r => r.json()),
        fetch(`${API_URL}/api/trace/stats`).then(r => r.json()),
        fetch(`${API_URL}/api/runtime/daemon/status`).then(r => r.json()),
      ]);
      setTraces(tRes.traces || []);
      setStats(sRes);
      setDaemon(dRes);
    } catch (err) {
      console.error('[Decisions] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const toggleDaemon = async () => {
    const ep = daemon?.is_running ? 'stop' : 'start';
    await fetch(`${API_URL}/api/runtime/daemon/${ep}`, { method: 'POST' });
    fetchData();
  };

  const runOnce = async () => {
    await fetch(`${API_URL}/api/runtime/run-once`, { method: 'POST' });
    setTimeout(fetchData, 1000);
  };

  const handleApprove = async (id) => {
    await fetch(`${API_URL}/api/runtime/decisions/${id}/approve`, { method: 'POST' });
    fetchData();
  };

  const handleReject = async (id) => {
    await fetch(`${API_URL}/api/runtime/decisions/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'OPERATOR_REJECTED' }),
    });
    fetchData();
  };

  // Sprint 4: Timeline view — click card to open full timeline
  const [selectedTrace, setSelectedTrace] = useState(null);

  if (selectedTrace) {
    return (
      <DecisionTimeline 
        trace={selectedTrace} 
        onBack={() => setSelectedTrace(null)} 
      />
    );
  }

  return (
    <div className="h-full bg-white overflow-y-auto" data-testid="decisions-workspace" style={{ fontFamily: 'Gilroy, sans-serif' }}>
      {/* Daemon control strip */}
      <DaemonStrip daemon={daemon} onToggle={toggleDaemon} onRefresh={fetchData} onRunOnce={runOnce} />

      {/* Stats */}
      <div className="p-4 pb-0">
        <StatsBar stats={stats} />
      </div>

      {/* Decisions list */}
      <div className="p-4 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-neutral-400 text-[13px]">Loading decisions...</div>
        ) : traces.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
            <Activity size={24} className="mx-auto text-neutral-300 mb-2" />
            <div className="text-[13px] text-neutral-400">No decisions yet</div>
            <div className="text-[11px] text-neutral-300 mt-1">Start the daemon or use Trade This from Tech Analysis</div>
          </div>
        ) : (
          traces.map(t => (
            <DecisionCard 
              key={t.trace_id} 
              trace={t} 
              onApprove={handleApprove} 
              onReject={handleReject}
              onOpenTimeline={() => setSelectedTrace(t)}
            />
          ))
        )}
      </div>
    </div>
  );
}
