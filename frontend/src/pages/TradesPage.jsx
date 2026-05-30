import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Toast   from '../components/Toast';
import api     from '../services/api';

const SESSIONS   = ['ASIAN','LONDON','NEW_YORK'];
const sessionLbl = { ASIAN:'Asian', LONDON:'London', NEW_YORK:'New York' };
const DAYS       = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const dayLbl     = d => d.charAt(0) + d.slice(1).toLowerCase();

const emptyForm = {
  date:'', accountSrNo:'', session:'ASIAN', strategySrNo:'',
  qty:'', rr:'', riskPercent:'', buySell:'BUY', resultDollar:''
};

// Default date range: last 30 days
const today    = new Date();
const thirtyAgo = new Date(); thirtyAgo.setDate(today.getDate() - 30);
const fmt8     = d => d.toISOString().split('T')[0];

export default function TradesPage() {
  const [trades,     setTrades]     = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [startDate,  setStartDate]  = useState(fmt8(thirtyAgo));
  const [endDate,    setEndDate]    = useState(fmt8(today));
  const [sortField,  setSortField]  = useState('resultDollar');
  const [sortAsc,    setSortAsc]    = useState(false);

  const fetchTrades = useCallback(async () => {
    const r = await api.get('/trades', { params: { startDate, endDate } });
    setTrades(r.data.data || []);
  }, [startDate, endDate]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  useEffect(() => {
    api.get('/accounts').then(r  => setAccounts(r.data.data  || []));
    api.get('/strategies').then(r => setStrategies(r.data.data || []));
  }, []);

  // Auto-fill day when date changes
  const handleDateChange = val => {
    const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const d = new Date(val);
    setForm(f => ({ ...f, date: val, day: days[d.getDay()] }));
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = t => {
    setEditing(t.srNo);
    setForm({
      date: t.date, accountSrNo: t.accountSrNo, session: t.session,
      strategySrNo: t.strategySrNo, qty: t.qty, rr: t.rr,
      riskPercent: t.riskPercent, buySell: t.buySell, resultDollar: t.resultDollar
    });
    setModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        ...form,
        accountSrNo:  Number(form.accountSrNo),
        strategySrNo: Number(form.strategySrNo),
        qty:          Number(form.qty),
        rr:           Number(form.rr),
        riskPercent:  Number(form.riskPercent),
        resultDollar: Number(form.resultDollar),
      };
      if (editing) await api.put(`/trades/${editing}`, body);
      else         await api.post('/trades', body);
      showToast(editing ? 'Trade updated!' : 'Trade added!');
      setModal(false);
      fetchTrades();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving trade', 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async srNo => {
    if (!window.confirm('Delete this trade?')) return;
    try {
      await api.delete(`/trades/${srNo}`);
      showToast('Trade deleted!');
      fetchTrades();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error', 'error');
    }
  };

  // Sorting
  const sorted = [...trades].sort((a, b) => {
    const va = a[sortField] ?? 0, vb = b[sortField] ?? 0;
    return sortAsc ? va - vb : vb - va;
  });

  const toggleSort = field => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const cls  = v => v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
  const sign = v => v > 0 ? '+' : '';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:18, gap:12, flexWrap:'wrap' }}>
          <h1 className="page-title" style={{ margin:0 }}>Trades</h1>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {/* Date range */}
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 12px', fontSize:13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border:'none', outline:'none', fontSize:13, fontFamily:'inherit' }}/>
              <span style={{ color:'#94a3b8' }}>–</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border:'none', outline:'none', fontSize:13, fontFamily:'inherit' }}/>
            </div>
            {/* Sort */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13, color:'#64748b' }}>Sort by</span>
              <select value={sortField} onChange={e => setSortField(e.target.value)} style={{ padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                <option value="resultDollar">Result ₹</option>
                <option value="resultPercent">Result %</option>
                <option value="rr">RR</option>
                <option value="date">Date</option>
              </select>
              <button className="icon-btn" onClick={() => setSortAsc(!sortAsc)} title="Toggle sort direction">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  {sortAsc
                    ? <><path d="M11 5l-7 7 7 7"/><path d="M13 5l7 7-7 7"/></>
                    : <><path d="M11 19l-7-7 7-7"/><path d="M13 19l7-7-7-7"/></>
                  }
                </svg>
              </button>
            </div>
            <button className="btn btn-primary" onClick={openAdd}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Trade
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('date')}>Date</th>
                  <th>Day</th>
                  <th>Account ID</th>
                  <th>Session</th>
                  <th>Strategy</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('qty')}>Qty</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('rr')}>RR</th>
                  <th>Risk %</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('resultPercent')}>Result %</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('resultDollar')}>Result ₹</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr><td colSpan={12} style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>No trades found for this range.</td></tr>
                )}
                {sorted.map((t, i) => (
                  <tr key={t.srNo}>
                    <td style={{ color:'#64748b' }}>{i + 1}</td>
                    <td>{t.date}</td>
                    <td>{dayLbl(t.day)}</td>
                    <td style={{ fontFamily:'DM Mono, monospace', fontSize:12.5 }}>{t.accountId}</td>
                    <td>
                      <span style={{ fontSize:13 }}>
                        {t.session === 'ASIAN' ? '🌙' : t.session === 'LONDON' ? '🕐' : '☀️'} {sessionLbl[t.session]}
                      </span>
                    </td>
                    <td style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span className={`badge ${t.buySell === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{t.buySell}</span>
                      {t.strategy}
                    </td>
                    <td>{t.qty}</td>
                    <td>{t.rr?.toFixed(2)}</td>
                    <td>{t.riskPercent?.toFixed(2)}%</td>
                    <td className={cls(t.resultPercent)}>{sign(t.resultPercent)}{t.resultPercent?.toFixed(2)}%</td>
                    <td className={cls(t.resultDollar)}>₹{sign(t.resultDollar)}{Math.abs(t.resultDollar ?? 0).toLocaleString('en-IN')}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="icon-btn" onClick={() => openEdit(t)} title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="icon-btn del" onClick={() => handleDelete(t.srNo)} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
            <div className="modal" style={{ width: 520 }}>
              <h3>{editing ? 'Edit Trade' : 'Add Trade'}</h3>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" required value={form.date} onChange={e => handleDateChange(e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label>Account</label>
                    <select required value={form.accountSrNo} onChange={e => setForm({...form, accountSrNo: e.target.value})}>
                      <option value="">Select account</option>
                      {accounts.map(a => <option key={a.srNo} value={a.srNo}>{a.propFirm} – {a.accountId}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Session</label>
                    <select value={form.session} onChange={e => setForm({...form, session: e.target.value})}>
                      {SESSIONS.map(s => <option key={s} value={s}>{sessionLbl[s]}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Strategy</label>
                    <select required value={form.strategySrNo} onChange={e => setForm({...form, strategySrNo: e.target.value})}>
                      <option value="">Select strategy</option>
                      {strategies.map(s => <option key={s.srNo} value={s.srNo}>{s.strategyName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Buy / Sell</label>
                    <select value={form.buySell} onChange={e => setForm({...form, buySell: e.target.value})}>
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Qty</label>
                    <input type="number" required min="1" placeholder="e.g. 5" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label>RR (Risk:Reward)</label>
                    <input type="number" required step="0.01" placeholder="e.g. 2.5" value={form.rr} onChange={e => setForm({...form, rr: e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label>Risk %</label>
                    <input type="number" required step="0.01" placeholder="e.g. 1.0" value={form.riskPercent} onChange={e => setForm({...form, riskPercent: e.target.value})}/>
                  </div>
                  <div className="form-group full">
                    <label>Result $ (negative for loss)</label>
                    <input type="number" required step="0.01" placeholder="e.g. 1750 or -200" value={form.resultDollar} onChange={e => setForm({...form, resultDollar: e.target.value})}/>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
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
