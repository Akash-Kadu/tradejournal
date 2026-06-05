import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Toast   from '../components/Toast';
import api     from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── session meta ─────────────────────────────────────────────── */
const SESSION_META = {
  ASIAN:    { label: 'Asian Session',    icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )},
  LONDON:   { label: 'London Session',   icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )},
  NEW_YORK: { label: 'New York Session', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )},
};

/* ── styles ───────────────────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById('sp-styles')) return;
  const s = document.createElement('style');
  s.id = 'sp-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    .sp-wrap { font-family: 'DM Sans', sans-serif; }

    /* ── Currency Toggle ─────────────────────── */
    .sp-currency-bar {
      display: flex; align-items: center; gap: 7px;
      justify-content: flex-end; margin-bottom: 12px;
    }
    .sp-currency-symbol {
      font-size: 13px; font-weight: 500; color: #94a3b8;
      transition: color .25s, font-weight .25s;
      min-width: 16px; text-align: center;
    }
    .sp-currency-symbol.active { color: #1e293b; font-weight: 600; }
    .sp-toggle {
      position: relative; width: 44px; height: 22px; cursor: pointer;
    }
    .sp-toggle input { opacity: 0; width: 0; height: 0; }
    .sp-toggle-track {
      position: absolute; inset: 0; border-radius: 999px;
      background: #cbd5e1; transition: background .3s;
      border: 1px solid #e2e8f0;
    }
    .sp-toggle input:checked + .sp-toggle-track { background: #22c55e; border-color: #22c55e; }
    .sp-toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.18);
      transition: transform .28s cubic-bezier(.34,1.56,.64,1);
      pointer-events: none;
    }
    .sp-toggle input:checked ~ .sp-toggle-thumb { transform: translateX(22px); }

    /* ── Strategy Card ───────────────────────── */
    .sp-card {
      background: #fff;
      border: 1px solid #e8edf3;
      border-radius: 14px;
      padding: 14px 16px 12px;
      margin-bottom: 14px;
      box-shadow: 0 2px 10px rgba(15,23,42,.05);
      opacity: 0;
      transform: translateY(18px);
      animation: spCardIn .45s cubic-bezier(.22,1,.36,1) forwards;
    }
    @keyframes spCardIn {
      to { opacity: 1; transform: none; }
    }

    /* stagger */
    .sp-card:nth-child(1) { animation-delay: .05s; }
    .sp-card:nth-child(2) { animation-delay: .13s; }
    .sp-card:nth-child(3) { animation-delay: .21s; }
    .sp-card:nth-child(4) { animation-delay: .29s; }

    /* header */
    .sp-card-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
    }
    .sp-card-icon {
      width: 28px; height: 28px; border-radius: 8px;
      background: #f0fdf4; color: #16a34a;
      display: flex; align-items: center; justify-content: center;
    }
    .sp-card-name {
      font-size: 14px; font-weight: 600; color: #1e293b; margin: 0;
    }
    .sp-badge {
      font-size: 10px; font-weight: 500; padding: 2px 7px;
      border-radius: 999px; background: #f0fdf4; color: #16a34a;
      letter-spacing: .02em; border: 1px solid #bbf7d0;
    }
    .sp-del-btn {
      margin-left: auto; background: #fff2f2; border: none; border-radius: 7px;
      width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .2s, transform .15s;
    }
    .sp-del-btn:hover { background: #fecaca; transform: scale(1.08); }

    /* ── Sub-cards grid ──────────────────────── */
    .sp-sections {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    @media (max-width: 960px) {
      .sp-sections { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 540px) {
      .sp-sections { grid-template-columns: 1fr; }
    }

    /* sub-card */
    .sp-section {
      border-radius: 11px;
      border: 1.5px solid #e8edf3;
      padding: 11px 12px;
      transition: box-shadow .25s, transform .25s, border-color .25s;
      cursor: default;
    }
    .sp-section:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(15,23,42,.08);
    }

    /* highlighted total summary card */
    .sp-section.sp-section--total {
      border-color: #bbf7d0;
      background: #f8fffe;
      box-shadow: 0 1px 6px rgba(22,163,74,.07);
    }
    .sp-section.sp-section--total:hover {
      box-shadow: 0 5px 16px rgba(22,163,74,.11);
    }

    .sp-sec-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 10px; font-weight: 600; letter-spacing: .05em;
      text-transform: uppercase; color: #94a3b8; margin-bottom: 10px;
    }
    .sp-section--total .sp-sec-title { color: #4ade80; }
    .sp-sec-title-icon {
      width: 20px; height: 20px; border-radius: 5px;
      background: #f1f5f9; display: flex; align-items: center; justify-content: center;
      color: #94a3b8;
    }
    .sp-section--total .sp-sec-title-icon {
      background: #dcfce7; color: #22c55e;
    }

    /* TWL */
    .sp-twl-label {
      font-size: 10px; color: #94a3b8; margin-bottom: 3px; font-weight: 400;
    }
    .sp-twl-nums {
      font-size: 16px; font-weight: 500; color: #1e293b;
      font-family: 'DM Mono', monospace;
      display: flex; align-items: baseline; gap: 3px; margin-bottom: 10px;
    }
    .sp-twl-sep { font-size: 13px; color: #cbd5e1; font-weight: 400; }
    .sp-twl-w   { color: #16a34a; }
    .sp-twl-l   { color: #ef4444; }

    /* stat rows */
    .sp-stat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 5px 0;
      border-top: 1px solid #f1f5f9;
      font-size: 11px;
    }
    .sp-stat-key { color: #64748b; font-weight: 400; }
    .sp-stat-val { font-weight: 500; color: #1e293b; font-family: 'DM Mono', monospace; font-size: 11px; }
    .sp-stat-val.green { color: #16a34a; }
    .sp-stat-val.red   { color: #ef4444; }

    /* earned footer */
    .sp-earned-footer {
      margin-top: 8px;
      text-align: center;
      padding: 7px 6px 3px;
      border-top: 1.5px dashed #e8edf3;
      font-size: 13px; font-weight: 600; color: #16a34a;
      font-family: 'DM Mono', monospace;
    }
    .sp-section--total .sp-earned-footer {
      border-top-color: #bbf7d0;
      font-size: 14px;
    }

    /* currency pill animation */
    .sp-amt {
      display: inline-block;
      transition: opacity .2s, transform .2s;
    }
    .sp-amt.fade-out { opacity: 0; transform: translateY(-4px); }
    .sp-amt.fade-in  { animation: amtIn .25s ease forwards; }
    @keyframes amtIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: none; }
    }

    /* empty state */
    .sp-empty {
      text-align: center; padding: 40px 20px;
      background: #fff; border-radius: 14px;
      border: 1.5px dashed #e2e8f0; color: #94a3b8;
    }
    .sp-empty-icon { font-size: 30px; margin-bottom: 8px; }

    /* FAB */
    .sp-fab {
      display: flex; justify-content: flex-end; margin-top: 8px;
    }

    /* Modal */
    .sp-modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,.35);
      backdrop-filter: blur(3px); display: flex;
      align-items: center; justify-content: center; z-index: 1000;
      animation: overlayIn .2s ease;
    }
    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
    .sp-modal {
      background: #fff; border-radius: 16px; padding: 22px;
      width: 340px; box-shadow: 0 20px 60px rgba(15,23,42,.18);
      animation: modalIn .25s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(.92) translateY(12px); }
      to   { opacity: 1; transform: none; }
    }
    .sp-modal h3 { font-size: 16px; font-weight: 700; margin: 0 0 16px; }
    .sp-modal label { font-size: 11px; font-weight: 600; color: #374151; display: block; margin-bottom: 5px; }
    .sp-modal input {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e5e7eb; border-radius: 9px;
      padding: 8px 11px; font-size: 12px; font-family: inherit;
      outline: none; transition: border-color .2s;
    }
    .sp-modal input:focus { border-color: #16a34a; }
    .sp-modal-footer {
      display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px;
    }

    /* loading shimmer */
    .sp-shimmer {
      border-radius: 14px; overflow: hidden;
      background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      height: 160px; margin-bottom: 14px;
    }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to   { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(s);
};

/* ── helpers ──────────────────────────────────────────────────── */
const DEFAULT_RATE = 84; // fallback INR→USD rate

export default function StrategyPage() {
  const [stats,    setStats]    = useState([]);
  const [modal,    setModal]    = useState(false);
  const [name,     setName]     = useState('');
  const [toast,    setToast]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [usd,      setUsd]      = useState(true);
  const [rate,     setRate]     = useState(DEFAULT_RATE);
  const [fetching, setFetching] = useState(true);
  const { user } = useAuth();

  /* inject styles once */
  useEffect(() => { injectStyles(); }, []);

  /* fetch live USD→INR rate */
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => { if (d?.rates?.INR) setRate(d.rates.INR); })
      .catch(() => {}); // silently use fallback
  }, []);

  const fetchStats = async () => {
    setFetching(true);
    try {
      const r = await api.get('/strategies/stats');
      setStats(r.data.data || []);
    } finally { setFetching(false); }
  };
  useEffect(() => { fetchStats(); }, []);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleAdd = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/strategies', { strategyName: name });
      showToast('Strategy added!');
      setModal(false);
      setName('');
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error adding strategy', 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async srNo => {
    if (!window.confirm('Delete this strategy? This cannot be undone.')) return;
    try {
      await api.delete(`/strategies/${srNo}`);
      showToast('Strategy deleted!');
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting strategy', 'error');
    }
  };

  /* currency formatter */
  const fmt = v => {
    if (v == null) return usd ? '$0' : '₹0';
    const sign = v < 0 ? '-' : '';
    const num = Math.abs(v);
    if (usd) {
      // value stored as USD — show as-is
      return `${sign}$${num >= 1000 ? num.toLocaleString('en-US', { minimumFractionDigits: 2 }) : num.toFixed(2)}`;
    }
    // convert USD → INR by multiplying
    const inr = num * rate;
    return `${sign}₹${inr >= 1000 ? inr.toLocaleString('en-IN', { minimumFractionDigits: 0 }) : inr.toFixed(0)}`;
  };

  /* dynamic color theme based on totalEarned */
  const theme = (earned) => {
    const pos = earned == null || earned >= 0;
    return {
      cardIcon:     { background: pos ? '#f0fdf4' : '#fff2f2', color: pos ? '#16a34a' : '#dc2626' },
      badge:        { background: pos ? '#f0fdf4' : '#fff2f2', color: pos ? '#16a34a' : '#dc2626', border: `1px solid ${pos ? '#bbf7d0' : '#fecaca'}` },
      totalSection: { borderColor: pos ? '#bbf7d0' : '#fecaca', background: pos ? '#f8fffe' : '#fff8f8', boxShadow: pos ? '0 1px 6px rgba(22,163,74,.07)' : '0 1px 6px rgba(220,38,38,.07)' },
      secTitle:     { color: pos ? '#4ade80' : '#f87171' },
      secTitleIcon: { background: pos ? '#dcfce7' : '#fee2e2', color: pos ? '#22c55e' : '#ef4444' },
      earnedTotal:  { color: pos ? '#16a34a' : '#dc2626', borderTopColor: pos ? '#bbf7d0' : '#fecaca' },
      toggleTrack:  pos ? '#22c55e' : '#ef4444',
    };
  };

  return (
    <div className="layout sp-wrap">
      <Sidebar />
      <main className="main-content">

        {/* Page heading */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>
            Welcome back, {user?.name?.split(' ')[0] || ''} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 3, marginBottom: 0 }}>
            Analyze your strategies across different sessions.
          </p>
        </div>

        {/* Currency toggle */}
        <div className="sp-currency-bar" style={{ marginTop: 10 }}>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>
            1$ ≈ ₹{rate.toFixed(1)}
          </span>
          <span className={`sp-currency-symbol${!usd ? ' active' : ''}`}>₹</span>
          <label className="sp-toggle">
            <input type="checkbox" checked={usd} onChange={e => setUsd(e.target.checked)} />
            <div className="sp-toggle-track" />
            <div className="sp-toggle-thumb" />
          </label>
          <span className={`sp-currency-symbol${usd ? ' active' : ''}`}>$</span>
        </div>

        {/* Strategy cards */}
        <div style={{ marginTop: 4 }}>
          {fetching && (
            <>
              <div className="sp-shimmer" />
              <div className="sp-shimmer" style={{ height: 160 }} />
            </>
          )}

          {!fetching && stats.length === 0 && (
            <div className="sp-empty">
              <div className="sp-empty-icon">📊</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No strategies yet</div>
              <div style={{ fontSize: 13 }}>Add your first strategy using the button below.</div>
            </div>
          )}

          {!fetching && stats.map((s, idx) => {
            const t = theme(s.totalEarned);
            return (
            <div key={s.srNo} className="sp-card" style={{ animationDelay: `${idx * 0.08 + 0.04}s` }}>

              {/* Card header */}
              <div className="sp-card-header">
                <div className="sp-card-icon" style={t.cardIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <h3 className="sp-card-name">{s.strategyName}</h3>
                <span className="sp-badge" style={t.badge}>Active</span>
                <button
                  className="sp-del-btn"
                  onClick={() => handleDelete(s.srNo)}
                  title="Delete strategy"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>

              {/* Sub-cards grid */}
              <div className="sp-sections">

                {/* ── Total Summary (highlighted) ── */}
                <div className="sp-section sp-section--total" style={t.totalSection}>
                  <div className="sp-sec-title" style={t.secTitle}>
                    <span className="sp-sec-title-icon" style={t.secTitleIcon}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                      </svg>
                    </span>
                    Total Summary
                  </div>
                  <div className="sp-twl-label">Trades / Win / Loss</div>
                  <div className="sp-twl-nums">
                    <span>{s.totalTrades}</span>
                    <span className="sp-twl-sep">/</span>
                    <span className="sp-twl-w">{s.wins}</span>
                    <span className="sp-twl-sep">/</span>
                    <span className="sp-twl-l">{s.losses}</span>
                  </div>
                  <div className="sp-stat-row">
                    <span className="sp-stat-key">Win Rate</span>
                    <span className="sp-stat-val green">{s.winRate?.toFixed(2)}%</span>
                  </div>
                  <div className="sp-stat-row">
                    <span className="sp-stat-key">Avg RR</span>
                    <span className="sp-stat-val">{s.avgRR?.toFixed(2) ?? '—'}</span>
                  </div>
                  <div className="sp-earned-footer" style={t.earnedTotal}>
                    Earned: {fmt(s.totalEarned)}
                  </div>
                </div>

                {/* ── Session sub-cards ── */}
                {['ASIAN', 'LONDON', 'NEW_YORK'].map(sess => {
                  const ss  = s.sessionStats?.[sess] || {};
                  const meta = SESSION_META[sess];
                  return (
                    <div key={sess} className="sp-section">
                      <div className="sp-sec-title">
                        <span className="sp-sec-title-icon">{meta.icon}</span>
                        {meta.label}
                      </div>
                      <div className="sp-twl-label">Trades / Win / Loss</div>
                      <div className="sp-twl-nums">
                        <span>{ss.trades ?? 0}</span>
                        <span className="sp-twl-sep">/</span>
                        <span className="sp-twl-w">{ss.wins ?? 0}</span>
                        <span className="sp-twl-sep">/</span>
                        <span className="sp-twl-l">{ss.losses ?? 0}</span>
                      </div>
                      <div className="sp-stat-row">
                        <span className="sp-stat-key">Win Rate</span>
                        <span className="sp-stat-val green">{(ss.winRate ?? 0).toFixed(2)}%</span>
                      </div>
                      <div className="sp-stat-row">
                        <span className="sp-stat-key">Average RR</span>
                        <span className="sp-stat-val">{(ss.avgRR ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="sp-earned-footer">
                        Earned: {fmt(ss.earned)}
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
            );
          })}
        </div>

        {/* Add Strategy button */}
        <div className="sp-fab">
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Strategy
          </button>
        </div>

        {/* Add Modal */}
        {modal && (
          <div
            className="sp-modal-overlay"
            onClick={e => e.target === e.currentTarget && setModal(false)}
          >
            <div className="sp-modal">
              <h3>Add Strategy</h3>
              <div className="form-group full">
                <label>Strategy Name</label>
                <input
                  required
                  placeholder="e.g. Breakout Retest"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd(e)}
                  autoFocus
                />
              </div>
              <div className="sp-modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => { setModal(false); setName(''); }}
                >Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleAdd}
                  disabled={loading || !name.trim()}
                >
                  {loading ? 'Saving…' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </main>
    </div>
  );
}
