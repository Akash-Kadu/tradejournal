import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Toast   from '../components/Toast';
import api     from '../services/api';

const SESSIONS   = ['ASIAN','LONDON','NEW_YORK'];
const sessionLbl = { ASIAN:'Asian', LONDON:'London', NEW_YORK:'New York' };
const DAYS       = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const dayLbl     = d => d.charAt(0) + d.slice(1).toLowerCase();

const emptyForm = {
  date:'', accountSrNo:'', session:'ASIAN', strategySrNo:'',
  pair:'', qty:'', rr:'', riskPercent:'', buySell:'BUY', resultDollar:''
};

const today     = new Date();
const thirtyAgo = new Date(); thirtyAgo.setDate(today.getDate() - 30);
const fmt8      = d => d instanceof Date ? d.toISOString().split('T')[0] : d;

/* ── Inline styles ────────────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById('tp-styles')) return;
  const s = document.createElement('style');
  s.id = 'tp-styles';
  s.textContent = `
    .tp-toggle-wrap {
      display:flex; align-items:center; gap:6px;
      background:#fff; border:1px solid #e2e8f0; border-radius:99px;
      padding:4px 10px; box-shadow:0 1px 3px rgba(0,0,0,.06);
    }
    .tp-toggle-sym { font-size:13px; font-weight:600; transition:color .2s; }
    .tp-toggle-sym.active { color:#0f172a; }
    .tp-toggle-sym.dim    { color:#94a3b8; }
    .tp-toggle-track {
      width:36px; height:19px; border-radius:99px; background:#16a34a;
      cursor:pointer; position:relative; flex-shrink:0;
    }
    .tp-toggle-thumb {
      width:14px; height:14px; border-radius:50%; background:#fff;
      position:absolute; top:2.5px; transition:left .2s ease;
      box-shadow:0 1px 3px rgba(0,0,0,.2);
    }
    .tp-rate-pill {
      font-size:10.5px; color:#64748b; background:#f8fafc;
      border:1px solid #e2e8f0; border-radius:6px;
      padding:2px 7px; white-space:nowrap;
    }
    .tp-filter-btn {
      display:flex; align-items:center; gap:6px;
      background:#fff; border:1px solid #e2e8f0; border-radius:8px;
      padding:6px 12px; font-size:12.5px; font-weight:600;
      color:#374151; cursor:pointer; white-space:nowrap;
      transition:background .15s, border-color .15s; position:relative;
    }
    .tp-filter-btn:hover { background:#f8fafc; border-color:#cbd5e1; }
    .tp-filter-btn.active { border-color:#2563eb; color:#2563eb; background:#eff6ff; }
    .tp-filter-badge {
      min-width:16px; height:16px; border-radius:99px;
      background:#2563eb; color:#fff; font-size:10px;
      font-weight:700; display:flex; align-items:center; justify-content:center; padding:0 4px;
    }
    .tp-filter-panel {
      position:absolute; top:calc(100% + 6px); right:0;
      background:#fff; border:1px solid #e2e8f0; border-radius:12px;
      box-shadow:0 8px 28px rgba(0,0,0,.12); z-index:100;
      padding:14px; min-width:320px; animation:tpFadeDown .18s ease;
    }
    @keyframes tpFadeDown {
      from { opacity:0; transform:translateY(-6px); }
      to   { opacity:1; transform:none; }
    }
    .tp-filter-section { margin-bottom:12px; }
    .tp-filter-section:last-child { margin-bottom:0; }
    .tp-filter-label { font-size:10.5px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
    .tp-chips { display:flex; flex-wrap:wrap; gap:5px; }
    .tp-chip {
      padding:3px 10px; border-radius:99px; font-size:12px; font-weight:500;
      border:1.5px solid #e2e8f0; background:#f8fafc; color:#374151;
      cursor:pointer; transition:all .15s;
    }
    .tp-chip.sel { border-color:#2563eb; background:#eff6ff; color:#2563eb; font-weight:600; }
    .tp-filter-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid #f1f5f9; }
    .tp-date-wrap {
      display:flex; align-items:center; gap:6px;
      background:#fff; border:1px solid #e2e8f0; border-radius:8px;
      padding:6px 12px; font-size:12.5px; cursor:pointer; position:relative;
    }
    .tp-date-panel {
      position:absolute; top:calc(100% + 6px); left:0;
      background:#fff; border:1px solid #e2e8f0; border-radius:12px;
      box-shadow:0 8px 28px rgba(0,0,0,.12); z-index:100;
      padding:12px 14px; min-width:300px; animation:tpFadeDown .18s ease;
    }
    .tp-quick-btns { display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap; }
    .tp-quick-btn {
      padding:4px 12px; border-radius:99px; font-size:12px; font-weight:600;
      border:1.5px solid #e2e8f0; background:#f8fafc; color:#374151;
      cursor:pointer; transition:all .15s;
    }
    .tp-quick-btn:hover { border-color:#2563eb; background:#eff6ff; color:#2563eb; }
    .tp-date-inputs { display:flex; align-items:center; gap:8px; }
    .tp-date-inputs input {
      border:1.5px solid #e2e8f0; border-radius:8px; padding:6px 10px;
      font-size:12.5px; font-family:inherit; outline:none; flex:1; transition:border-color .2s;
    }
    .tp-date-inputs input:focus { border-color:#2563eb; }

    /* ── Bulk action bar ── */
    .tp-bulk-bar {
      display:flex; align-items:center; gap:10px;
      background:#1e293b; color:#fff;
      padding:10px 16px; border-radius:10px;
      margin-bottom:10px; font-size:13px;
      animation:tpFadeDown .2s ease;
    }
    .tp-bulk-bar-count {
      font-weight:700; color:#94a3b8; font-size:12px;
    }
    .tp-bulk-del-btn {
      display:flex; align-items:center; gap:6px;
      background:#dc2626; color:#fff; border:none;
      padding:6px 14px; border-radius:7px; font-size:12.5px;
      font-weight:600; font-family:inherit; cursor:pointer;
      transition:background .15s;
    }
    .tp-bulk-del-btn:hover { background:#b91c1c; }
    .tp-bulk-cancel-btn {
      background:transparent; color:#94a3b8; border:1px solid #334155;
      padding:6px 12px; border-radius:7px; font-size:12.5px;
      font-weight:600; font-family:inherit; cursor:pointer;
      transition:color .15s, border-color .15s;
    }
    .tp-bulk-cancel-btn:hover { color:#fff; border-color:#64748b; }

    /* ── Checkbox ── */
    .tp-cb {
      width:15px; height:15px; accent-color:#2563eb; cursor:pointer; flex-shrink:0;
    }
    /* selected row highlight */
    tr.tp-row-sel { background:#eff6ff !important; }
  `;
  document.head.appendChild(s);
};

/* ── Currency Toggle ──────────────────────────────────────────── */
function CurrencyToggle({ currency, onChange, usdRate }) {
  const isUSD = currency === 'USD';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span className="tp-rate-pill">1$ ≈ ₹{usdRate.toFixed(1)}</span>
      <div className="tp-toggle-wrap">
        <span className={`tp-toggle-sym ${!isUSD ? 'active' : 'dim'}`}>₹</span>
        <div className="tp-toggle-track" onClick={() => onChange(isUSD ? 'INR' : 'USD')}>
          <div className="tp-toggle-thumb" style={{ left: isUSD ? 20 : 3 }}/>
        </div>
        <span className={`tp-toggle-sym ${isUSD ? 'active' : 'dim'}`}>$</span>
      </div>
    </div>
  );
}

/* ── Filter Panel ─────────────────────────────────────────────── */
function FilterPanel({ accounts, strategies, filters, onChange, onClear, onClose }) {
  const accountOptions  = accounts.map(a => ({ value: String(a.srNo), label: a.accountId }));
  const strategyOptions = strategies.map(s => ({ value: String(s.srNo), label: s.strategyName }));
  const sessionOptions  = SESSIONS.map(s => ({ value: s, label: sessionLbl[s] }));
  const dayOptions      = DAYS.map(d => ({ value: d, label: dayLbl(d) }));

  const toggle = (key, val) => {
    const cur = filters[key] || [];
    onChange(key, cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]);
  };

  const Section = ({ label, optKey, options }) => (
    <div className="tp-filter-section">
      <div className="tp-filter-label">{label}</div>
      <div className="tp-chips">
        {options.map(o => (
          <span key={o.value}
            className={`tp-chip${(filters[optKey]||[]).includes(o.value) ? ' sel' : ''}`}
            onClick={() => toggle(optKey, o.value)}>
            {o.label}
          </span>
        ))}
      </div>
    </div>
  );

  const totalActive = Object.values(filters).reduce((n, arr) => n + (arr?.length || 0), 0);

  return (
    <div className="tp-filter-panel">
      <Section label="Account"  optKey="accounts"   options={accountOptions}/>
      <Section label="Strategy" optKey="strategies" options={strategyOptions}/>
      <Section label="Session"  optKey="sessions"   options={sessionOptions}/>
      <Section label="Day"      optKey="days"       options={dayOptions}/>
      <div className="tp-filter-actions">
        {totalActive > 0 && (
          <button onClick={onClear} style={{ padding:'5px 12px', border:'1px solid #e2e8f0', borderRadius:7, background:'#fff', fontSize:12, fontWeight:600, color:'#64748b', cursor:'pointer' }}>
            Clear all
          </button>
        )}
        <button onClick={onClose} style={{ padding:'5px 14px', border:'none', borderRadius:7, background:'#2563eb', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Apply
        </button>
      </div>
    </div>
  );
}

/* ── Date Range Picker ────────────────────────────────────────── */
function DateRangePicker({ startDate, endDate, onStart, onEnd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const setThisWeek  = () => { const d = new Date(); const day = d.getDay(); const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); onStart(fmt8(mon)); onEnd(fmt8(d)); };
  const setThisMonth = () => { const d = new Date(); onStart(fmt8(new Date(d.getFullYear(), d.getMonth(), 1))); onEnd(fmt8(d)); };
  const setLast30    = () => { const d = new Date(); const s = new Date(); s.setDate(d.getDate() - 30); onStart(fmt8(s)); onEnd(fmt8(d)); };
  const setLast3M    = () => { const d = new Date(); const s = new Date(); s.setMonth(d.getMonth() - 3); onStart(fmt8(s)); onEnd(fmt8(d)); };

  const displayStart = startDate ? startDate.slice(5).replace('-','/') : '—';
  const displayEnd   = endDate   ? endDate.slice(5).replace('-','/')   : '—';

  return (
    <div style={{ position:'relative' }} ref={ref}>
      <div className="tp-date-wrap" onClick={() => setOpen(o => !o)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span style={{ fontSize:12.5, color:'#374151', fontWeight:500 }}>{displayStart} – {displayEnd}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {open && (
        <div className="tp-date-panel">
          <div className="tp-quick-btns">
            <span className="tp-quick-btn" onClick={setThisWeek}>This Week</span>
            <span className="tp-quick-btn" onClick={setThisMonth}>This Month</span>
            <span className="tp-quick-btn" onClick={setLast30}>Last 30 Days</span>
            <span className="tp-quick-btn" onClick={setLast3M}>Last 3 Months</span>
          </div>
          <div className="tp-date-inputs">
            <input type="date" value={startDate} onChange={e => onStart(e.target.value)}/>
            <span style={{ color:'#94a3b8', fontSize:13 }}>–</span>
            <input type="date" value={endDate} onChange={e => onEnd(e.target.value)}/>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
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
  const [sortField,  setSortField]  = useState('date');
  const [sortAsc,    setSortAsc]    = useState(false);
  const [currency,   setCurrency]   = useState('USD');
  const [usdRate,    setUsdRate]    = useState(84);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters,    setFilters]    = useState({ accounts:[], strategies:[], sessions:[], days:[] });

  // ── Multi-select state ──
  const [selected,     setSelected]     = useState(new Set()); // Set of srNo
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filterRef = useRef();

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => { if (d.rates?.INR) setUsdRate(d.rates.INR); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = e => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchTrades = useCallback(async () => {
    const r = await api.get('/trades', { params: { startDate, endDate } });
    setTrades(r.data.data || []);
    setSelected(new Set()); // clear selection on refresh
  }, [startDate, endDate]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  useEffect(() => {
    api.get('/accounts').then(r   => setAccounts(r.data.data   || []));
    api.get('/strategies').then(r => setStrategies(r.data.data || []));
  }, []);

  const handleDateChange = val => {
    const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const d = new Date(val);
    setForm(f => ({ ...f, date: val, day: days[d.getDay()] }));
  };

  const showToast = (message, type = 'success') => setToast({ message, type });
  const openAdd   = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit  = t => {
    setEditing(t.srNo);
    setForm({
      date: t.date, accountSrNo: t.accountSrNo, session: t.session,
      strategySrNo: t.strategySrNo, pair: t.pair || '',
      qty: t.qty, rr: t.rr, riskPercent: t.riskPercent,
      buySell: t.buySell, resultDollar: t.resultDollar
    });
    setModal(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setLoading(true);
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
      setModal(false); fetchTrades();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving trade', 'error');
    } finally { setLoading(false); }
  };

  // ── Single delete ──
  const handleDelete = async srNo => {
    if (!window.confirm('Delete this trade?')) return;
    try {
      await api.delete(`/trades/${srNo}`);
      showToast('Trade deleted!'); fetchTrades();
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  // ── Bulk delete ──
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} selected trade${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      // delete one by one sequentially so account balances update correctly
      for (const srNo of selected) {
        await api.delete(`/trades/${srNo}`);
      }
      showToast(`${selected.size} trade${selected.size > 1 ? 's' : ''} deleted!`);
      fetchTrades();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting trades', 'error');
      fetchTrades(); // refresh even on partial failure
    } finally { setBulkDeleting(false); }
  };

  // ── Checkbox helpers ──
  const toggleOne = srNo => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(srNo) ? next.delete(srNo) : next.add(srNo);
      return next;
    });
  };

  const toggleAll = () => {
    // toggle based on visible (sorted/filtered) rows
    if (selected.size === sorted.length && sorted.length > 0) {
      setSelected(new Set()); // deselect all
    } else {
      setSelected(new Set(sorted.map(t => t.srNo))); // select all visible
    }
  };

  const clearSelection = () => setSelected(new Set());

  // ── Currency helpers ──
  const sym  = currency === 'USD' ? '$' : '₹';
  const conv = v => { if (v == null) return 0; return currency === 'USD' ? v : v * usdRate; };
  const fmtM = v => {
    const cv   = conv(v);
    const sign = cv < 0 ? '-' : '';
    const abs  = Math.abs(cv);
    const str  = abs >= 1000
      ? abs.toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
      : abs.toFixed(2);
    return `${sign}${sym}${str}`;
  };

  // ── Filtering ──
  const activeFiltersCount = Object.values(filters).reduce((n, arr) => n + arr.length, 0);
  const filtered = trades.filter(t => {
    if (filters.accounts.length   && !filters.accounts.includes(String(t.accountSrNo)))    return false;
    if (filters.strategies.length && !filters.strategies.includes(String(t.strategySrNo))) return false;
    if (filters.sessions.length   && !filters.sessions.includes(t.session))                return false;
    if (filters.days.length       && !filters.days.includes(t.day))                        return false;
    return true;
  });

  // ── Sorting ──
  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortField] ?? 0, vb = b[sortField] ?? 0;
    if (sortField === 'date') return sortAsc ? new Date(va) - new Date(vb) : new Date(vb) - new Date(va);
    return sortAsc ? va - vb : vb - va;
  });

  const allVisibleSelected = sorted.length > 0 && selected.size === sorted.length;
  const someSelected       = selected.size > 0 && !allVisibleSelected;

  const toggleSort = field => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };
  const sortIcon = field => sortField === field
    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3"><polyline points={sortAsc ? '6 15 12 9 18 15' : '6 9 12 15 18 9'}/></svg>
    : null;

  const cls  = v => v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
  const sign = v => v > 0 ? '+' : '';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:16, gap:10, flexWrap:'wrap' }}>
          <h1 className="page-title" style={{ margin:0, flexShrink:0 }}>Trades</h1>
          <DateRangePicker startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate}/>
          <div style={{ flex:1 }}/>
          <CurrencyToggle currency={currency} onChange={setCurrency} usdRate={usdRate}/>

          {/* Sort */}
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <select value={sortField} onChange={e => setSortField(e.target.value)}
              style={{ padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12.5, fontFamily:'inherit', outline:'none', background:'#fff', color:'#374151', fontWeight:500 }}>
              <option value="date">Sort: Date</option>
              <option value="resultDollar">Sort: Result $</option>
              <option value="resultPercent">Sort: Result %</option>
              <option value="rr">Sort: RR</option>
            </select>
            <button className="icon-btn" onClick={() => setSortAsc(!sortAsc)} title="Toggle sort direction"
              style={{ background:'#fff', border:'1px solid #e2e8f0' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                {sortAsc ? <><path d="M12 5v14"/><path d="M5 12l7-7 7 7"/></> : <><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></>}
              </svg>
            </button>
          </div>

          {/* Filter */}
          <div style={{ position:'relative' }} ref={filterRef}>
            <button className={`tp-filter-btn${activeFiltersCount > 0 ? ' active' : ''}`} onClick={() => setFilterOpen(o => !o)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filter
              {activeFiltersCount > 0 && <span className="tp-filter-badge">{activeFiltersCount}</span>}
            </button>
            {filterOpen && (
              <FilterPanel
                accounts={accounts} strategies={strategies} filters={filters}
                onChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
                onClear={() => setFilters({ accounts:[], strategies:[], sessions:[], days:[] })}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>

          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Trade
          </button>
        </div>

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {Object.entries(filters).map(([key, vals]) =>
              vals.map(v => {
                const labelMap = {
                  accounts:   accounts.find(a => String(a.srNo)===v)?.accountId,
                  strategies: strategies.find(s => String(s.srNo)===v)?.strategyName,
                  sessions:   sessionLbl[v],
                  days:       dayLbl(v),
                };
                return (
                  <span key={`${key}-${v}`} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:12, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#2563eb', fontWeight:500 }}>
                    {labelMap[key] || v}
                    <span style={{ cursor:'pointer', opacity:.7, fontWeight:700, fontSize:14, lineHeight:1 }}
                      onClick={() => setFilters(f => ({ ...f, [key]: f[key].filter(x => x !== v) }))}>×</span>
                  </span>
                );
              })
            )}
            <span style={{ padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer', fontWeight:500 }}
              onClick={() => setFilters({ accounts:[], strategies:[], sessions:[], days:[] })}>
              Clear all
            </span>
          </div>
        )}

        {/* ── Bulk action bar — appears when rows are selected ── */}
        {selected.size > 0 && (
          <div className="tp-bulk-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="tp-bulk-bar-count">{selected.size} trade{selected.size > 1 ? 's' : ''} selected</span>
            <div style={{ flex:1 }}/>
            <button className="tp-bulk-del-btn" onClick={handleBulkDelete} disabled={bulkDeleting}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              {bulkDeleting ? 'Deleting…' : `Delete ${selected.size} trade${selected.size > 1 ? 's' : ''}`}
            </button>
            <button className="tp-bulk-cancel-btn" onClick={clearSelection}>Cancel</button>
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────── */}
        <div className="card">
          <div style={{ padding:'8px 14px', borderBottom:'1px solid #f1f5f9', fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:8 }}>
            Showing <strong style={{ color:'#0f172a' }}>{sorted.length}</strong> of {trades.length} trades
            {selected.size > 0 && (
              <span style={{ marginLeft:4, color:'#2563eb', fontWeight:600 }}>· {selected.size} selected</span>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {/* Select-all checkbox */}
                  <th style={{ width:36, textAlign:'center' }}>
                    <input
                      type="checkbox"
                      className="tp-cb"
                      checked={allVisibleSelected}
                      ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                      title="Select all visible"
                    />
                  </th>
                  <th>Sr No</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('date')}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>Date {sortIcon('date')}</span>
                  </th>
                  <th>Day</th>
                  <th>Account ID</th>
                  <th>Session</th>
                  <th>Strategy</th>
                  <th>Pair</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('qty')}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>Qty {sortIcon('qty')}</span>
                  </th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('rr')}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>RR {sortIcon('rr')}</span>
                  </th>
                  <th>Risk %</th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('resultPercent')}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>Result % {sortIcon('resultPercent')}</span>
                  </th>
                  <th style={{ cursor:'pointer' }} onClick={() => toggleSort('resultDollar')}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>Result {sym} {sortIcon('resultDollar')}</span>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr><td colSpan={14} style={{ textAlign:'center', color:'#94a3b8', padding:36 }}>No trades found.</td></tr>
                )}
                {sorted.map((t, i) => (
                  <tr key={t.srNo} className={selected.has(t.srNo) ? 'tp-row-sel' : ''}>
                    {/* Row checkbox */}
                    <td style={{ textAlign:'center' }}>
                      <input
                        type="checkbox"
                        className="tp-cb"
                        checked={selected.has(t.srNo)}
                        onChange={() => toggleOne(t.srNo)}
                      />
                    </td>
                    <td style={{ color:'#94a3b8' }}>{i + 1}</td>
                    <td style={{ fontWeight:500 }}>{t.date}</td>
                    <td style={{ color:'#64748b' }}>{dayLbl(t.day)}</td>
                    <td style={{ fontFamily:'DM Mono, monospace', fontSize:12 }}>{t.accountId}</td>
                    <td>
                      <span style={{ fontSize:12.5 }}>
                        {t.session === 'ASIAN' ? '🌙' : t.session === 'LONDON' ? '🕐' : '☀️'} {sessionLbl[t.session]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span className={`badge ${t.buySell === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{t.buySell}</span>
                        {t.strategy}
                      </div>
                    </td>
                    <td style={{ fontFamily:'inherit', fontSize:13.5 }}>
                      {t.pair || <span style={{ color:'#cbd5e1' }}>—</span>}
                    </td>
                    <td>{t.qty}</td>
                    <td>{t.rr?.toFixed(2)}</td>
                    <td>{t.riskPercent?.toFixed(2)}%</td>
                    <td className={cls(t.resultPercent)}>{sign(t.resultPercent)}{t.resultPercent?.toFixed(2)}%</td>
                    <td className={cls(t.resultDollar)} style={{ fontFamily:'DM Mono, monospace', fontWeight:600, fontSize:12.5 }}>
                      {fmtM(t.resultDollar)}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="icon-btn" onClick={() => openEdit(t)} title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="icon-btn del" onClick={() => handleDelete(t.srNo)} title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Add/Edit Modal ─────────────────────────────────────── */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
            <div className="modal" style={{ width:520 }}>
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
                    <label>Pair</label>
                    <input type="text" placeholder="e.g. XAUUSD, NAS100" value={form.pair}
                      onChange={e => setForm({...form, pair: e.target.value.toUpperCase()})}/>
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
                    <input type="number" required min="1" placeholder="e.g. 5" value={form.qty}
                      onChange={e => setForm({...form, qty: e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label>RR (Risk:Reward)</label>
                    <input type="number" required step="0.01" placeholder="e.g. 2.5" value={form.rr}
                      onChange={e => setForm({...form, rr: e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label>Risk %</label>
                    <input type="number" required step="0.01" placeholder="e.g. 1.0" value={form.riskPercent}
                      onChange={e => setForm({...form, riskPercent: e.target.value})}/>
                  </div>
                  <div className="form-group full">
                    <label>Result in USD (negative for loss)</label>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#64748b', fontWeight:600, fontSize:13.5 }}>$</span>
                      <input type="number" required step="0.01" placeholder="e.g. 1750 or -200"
                        value={form.resultDollar}
                        onChange={e => setForm({...form, resultDollar: e.target.value})}
                        style={{ paddingLeft:22 }}/>
                    </div>
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
