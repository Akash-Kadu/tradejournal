import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Toast   from '../components/Toast';
import api     from '../services/api';
import { useAuth } from '../context/AuthContext';

const sessionIcons = {
  ASIAN:    '🌙',
  LONDON:   '🕐',
  NEW_YORK: '☀️',
};
const sessionLabel = { ASIAN:'Asian Session', LONDON:'London Session', NEW_YORK:'New York Session' };

export default function StrategyPage() {
  const [stats,   setStats]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [name,    setName]    = useState('');
  const [toast,   setToast]   = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchStats = async () => {
    const r = await api.get('/strategies/stats');
    setStats(r.data.data || []);
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

  const fmt = v => v == null ? '₹0' : `₹${Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Welcome back 👋</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 3 }}>Analyze your strategies across different sessions.</p>
        </div>

        <div style={{ marginTop: 22 }}>
          {stats.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              No strategies yet. Add your first strategy below!
            </div>
          )}

          {stats.map(s => (
            <div key={s.srNo} className="card strategy-card">
              {/* header */}
              <div className="strategy-card-header">
                <span style={{ fontSize: 20 }}>📈</span>
                <h3>{s.strategyName}</h3>
                <span className="badge badge-active">Active</span>
                <button
                  className="icon-btn del"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => handleDelete(s.srNo)}
                  title="Delete strategy"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>

              {/* sections grid */}
              <div className="strategy-sections">

                {/* Total Summary */}
                <div className="strategy-section">
                  <div className="sec-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Total Summary
                  </div>
                  <div className="twl">
                    Trades / Win / Loss<br />
                    <span style={{ fontSize: 17 }}>{s.totalTrades}</span>
                    {' / '}<span className="w">{s.wins}</span>
                    {' / '}<span className="l">{s.losses}</span>
                  </div>
                  <div className="row"><span className="key">Win Rate</span><span className="val pos">{s.winRate?.toFixed(2)}%</span></div>
                  <div className="row"><span className="key">Avg RR</span><span className="val">{s.avgRR?.toFixed(2)}</span></div>
                  <div className="earned">{fmt(s.totalEarned)}</div>
                </div>

                {/* Per-session columns */}
                {['ASIAN', 'LONDON', 'NEW_YORK'].map(sess => {
                  const ss = s.sessionStats?.[sess] || {};
                  return (
                    <div key={sess} className="strategy-section">
                      <div className="sec-title">
                        {sessionIcons[sess]} {sessionLabel[sess]}
                      </div>
                      <div className="twl">
                        Trades / Win / Loss<br />
                        <span style={{ fontSize: 17 }}>{ss.trades ?? 0}</span>
                        {' / '}<span className="w">{ss.wins ?? 0}</span>
                        {' / '}<span className="l">{ss.losses ?? 0}</span>
                      </div>
                      <div className="row"><span className="key">Win Rate</span><span className="val pos">{(ss.winRate ?? 0).toFixed(2)}%</span></div>
                      <div className="row"><span className="key">Average RR</span><span className="val">{(ss.avgRR ?? 0).toFixed(2)}</span></div>
                      <div className="row"><span className="key">Earned (₹)</span><span className="val pos">{fmt(ss.earned)}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add Strategy FAB */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Strategy
          </button>
        </div>

        {/* Add Modal */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
            <div className="modal" style={{ width: 360 }}>
              <h3>Add Strategy</h3>
              <form onSubmit={handleAdd}>
                <div className="form-group full">
                  <label>Strategy Name</label>
                  <input
                    required
                    placeholder="e.g. Breakout Retest"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}
