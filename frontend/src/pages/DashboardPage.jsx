import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import Sidebar    from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api        from '../services/api';

const today       = new Date();
const startOfYear = new Date(today.getFullYear(), 0, 1); // Jan 1 of current year = YTD
const fmt8         = d => d.toISOString().split('T')[0];
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HDR   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ── Colour helpers ──────────────────────────────────────────────── */
const BE_THRESHOLD = 10;
function calCellBg(pnl, maxAbs) {
  if (pnl == null || maxAbs === 0) return '#f8fafc';
  if (Math.abs(pnl) <= BE_THRESHOLD) return 'rgba(148,163,184,0.18)';
  const i = Math.min(0.85, 0.18 + 0.67 * (Math.abs(pnl) / maxAbs));
  return pnl > 0 ? `rgba(22,163,74,${i})` : `rgba(220,38,38,${i})`;
}
function calCellTxt(pnl, maxAbs) {
  if (Math.abs(pnl) <= BE_THRESHOLD) return '#64748b';
  const i = maxAbs === 0 ? 0 : Math.abs(pnl) / maxAbs;
  return i > 0.45 ? '#fff' : (pnl > 0 ? '#166534' : '#991b1b');
}
function dayLabel(pnl) {
  if (pnl == null) return null;
  if (Math.abs(pnl) <= BE_THRESHOLD) return 'BE';
  return pnl > 0 ? 'Win' : 'Loss';
}
function calCellBorder(pnl, maxAbs) {
  if (pnl == null || maxAbs === 0) return '1px solid #e8edf2';
  if (Math.abs(pnl) <= BE_THRESHOLD) return '1px solid #b8c4ce';
  const i = Math.min(0.95, 0.4 + 0.55 * (Math.abs(pnl) / maxAbs));
  return pnl > 0 ? `1px solid rgba(15,118,44,${i})` : `1px solid rgba(180,20,20,${i})`;
}

/* ── Sparkline ───────────────────────────────────────────────────── */
function Sparkline({ data = [], color = '#16a34a', h = 38 }) {
  if (data.length < 2) return <div style={{ height: h }} />;
  const vals = data.map(d => d.val ?? d.cumulativePnl ?? 0);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const W = 100;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${h - ((v - mn) / rng) * h}`).join(' ');
  const areaClose = `${(vals.length - 1) / (vals.length - 1) * W},${h} 0,${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${areaClose}`} fill={`url(#sg${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Donut ───────────────────────────────────────────────────────── */
function Donut({ pct = 0, size = 52 }) {
  const r = 16, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 42 42">
      <circle cx="21" cy="21" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5"/>
      <circle cx="21" cy="21" r={r} fill="none" stroke="#16a34a" strokeWidth="5"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        strokeDashoffset={c * 0.25} strokeLinecap="round"
        transform="rotate(-90 21 21)"
        style={{ transition: 'stroke-dasharray .6s ease' }}/>
    </svg>
  );
}

/* ── W/L/BE bar ──────────────────────────────────────────────────── */
function WLBar({ w = 0, l = 0, be = 0 }) {
  const t = w + l + be || 1;
  return (
    <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 6, gap: 1 }}>
      <div style={{ width: `${(w/t)*100}%`, background: '#16a34a', borderRadius: 3, transition: 'width .6s' }}/>
      <div style={{ width: `${(l/t)*100}%`, background: '#dc2626', borderRadius: 3, transition: 'width .6s' }}/>
      <div style={{ width: `${(be/t)*100}%`, background: '#94a3b8', borderRadius: 3, transition: 'width .6s' }}/>
    </div>
  );
}

/* ── Animated number ─────────────────────────────────────────────── */
function AnimNum({ value, prefix = '', suffix = '', decimals = 0, color }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (value == null) return;
    const start = prev.current, end = value, dur = 600;
    const t0 = performance.now();
    const step = ts => {
      const p = Math.min((ts - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(step);
      else { setDisplay(end); prev.current = end; }
    };
    requestAnimationFrame(step);
  }, [value]);
  const fmt = v => {
    const abs = Math.abs(v);
    return abs >= 1000
      ? abs.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : abs.toFixed(decimals);
  };
  const sign = display < 0 ? '-' : '';
  return (
    <span style={{ color: color || (display >= 0 ? '#16a34a' : '#dc2626') }}>
      {sign}{prefix}{fmt(display)}{suffix}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [startDate, setStartDate] = useState(fmt8(startOfYear));  // default: YTD
  const [endDate,   setEndDate]   = useState(fmt8(today));
  const [data,      setData]      = useState(null);
  const [calYear,   setCalYear]   = useState(today.getFullYear());
  const [calMonth,  setCalMonth]  = useState(today.getMonth());
  const [selected,  setSelected]  = useState(today.getDate());
  const [chartMode, setChartMode] = useState('Days');
  const [loaded,    setLoaded]    = useState(false);
  const [showUSD,   setShowUSD]   = useState(true);
  const [usdRate,   setUsdRate]   = useState(84); // fallback rate

  /* fetch live USD/INR rate */
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => { if (d?.rates?.INR) setUsdRate(d.rates.INR); })
      .catch(() => {}); // keep fallback
  }, []);

  /* breakeven = between -10 and +10 */
  const isBE = pnl => pnl != null && pnl >= -10 && pnl <= 10;

  /* ── Calendar cell dimensions ────────────────────────────────────────
     CELL_H : height of each calendar cell in pixels — change here only
     Cell WIDTH is auto, controlled by grid: repeat(7, minmax(0, Xfr))  */
  const CELL_H = 61; /* ← SET CALENDAR CELL HEIGHT HERE (pixels) */

  const fetchDash = useCallback(async () => {
    setLoaded(false);
    try {
      const r = await api.get('/dashboard', { params: { startDate, endDate } });
      setData(r.data.data);
      setTimeout(() => setLoaded(true), 50);
    } catch {}
  }, [startDate, endDate]);

  useEffect(() => { fetchDash(); }, [fetchDash]);

  /* helpers */
  const calMap = {};
  (data?.calendarData || []).forEach(d => { calMap[d.date] = d; });
  const maxAbs = Math.max(...(data?.calendarData || []).map(d => Math.abs(d.netPnl || 0)), 1);
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const growthRaw = (data?.growthData || []).filter(g => {
    const d = g.date;
    return d >= startDate && d <= endDate;
  });
  const growthChart = chartMode === 'Days'
    ? growthRaw.map(g => ({ date: g.date.slice(5), val: g.cumulativePnl }))
    : (() => {
        const w = {};
        growthRaw.forEach(g => {
          const d = new Date(g.date); const s = new Date(d); s.setDate(d.getDate() - d.getDay());
          w[fmt8(s)] = g.cumulativePnl;
        });
        return Object.entries(w).map(([k, v]) => ({ date: k.slice(5), val: v }));
      })();

  const selectedKey = selected
    ? `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`
    : null;

  /* today's key — for default summary */
  const todayKey  = fmt8(today);
  const todayData = calMap[todayKey];
  const selDay    = selectedKey ? calMap[selectedKey] : (todayData ?? null);
  const selDate   = selected
    ? new Date(calYear, calMonth, selected)
    : today;
  const noTradesToday = !todayData;

  /* range helper for calendar greying */
  const isInRange = (yr, mo, dy) => {
  const key = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
  return key >= startDate && key <= endDate;
};

  const fmtR = v => {
    if (v == null) return showUSD ? '$0' : '₹0';
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (showUSD) {
      const usd = abs / usdRate;
      const fmt = usd >= 1000 ? usd.toLocaleString('en-US', {minimumFractionDigits:0,maximumFractionDigits:0}) : usd.toFixed(2);
      return `${sign}$${fmt}`;
    }
    const fmt = abs >= 1000 ? abs.toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:0}) : abs.toFixed(0);
    return `${sign}₹${fmt}`;
  };
  const sym  = showUSD ? '$' : '₹';
  const cls  = v => v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#64748b';
  const sign = v => v > 0 ? '+' : '';

  /* growth chart gradient — green above 0, red below */
  const gMin = Math.min(...growthChart.map(d => d.val), 0);
  const gMax = Math.max(...growthChart.map(d => d.val), 0);
  const gRange = gMax - gMin || 1;
  const zeroPct = `${((gMax / gRange) * 100).toFixed(1)}%`;

  const fadeIn = { opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity .4s ease, transform .4s ease' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '12px 22px', overflowY: 'auto', minWidth: 0 }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Here's your trading performance overview.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* ₹ / $ toggle — matches design */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '5px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              {/* live rate */}
              <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>1$ ≈ ₹{usdRate.toFixed(1)}</span>
              <div style={{ width: 1, height: 14, background: '#e2e8f0' }}/>
              {/* ₹ label */}
              <span style={{ fontSize: 16, color: showUSD ? '#c8d0da' : '#475569', fontWeight: 600, transition: 'color .2s', lineHeight: 1 }}>₹</span>
              {/* pill toggle */}
              <button onClick={() => setShowUSD(p => !p)} style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                padding: 0, position: 'relative', flexShrink: 0,
                background: showUSD ? '#2563eb' : '#d1d9e6',
                transition: 'background .25s ease',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,.15)',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: showUSD ? 22 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,.22)', transition: 'left .22s cubic-bezier(.4,0,.2,1)',
                  display: 'block',
                }}/>
              </button>
              {/* $ label */}
              <span style={{ fontSize: 15, color: showUSD ? '#475569' : '#c8d0da', fontWeight: 600, transition: 'color .2s', lineHeight: 1 }}>$</span>
            </div>

            {/* Date range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, padding: '6px 12px', fontSize: 12.5, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 12.5, fontFamily: 'inherit', background: 'transparent' }}/>
              <span style={{ color: '#94a3b8' }}>–</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 12.5, fontFamily: 'inherit', background: 'transparent' }}/>
            </div>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr 1fr 2.6fr', gap: 10, marginBottom: 12, ...fadeIn }}>

          {/* Net P&L */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 13px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'box-shadow .25s, transform .2s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,.11)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)';  e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Net P&L</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: cls(data?.netPnl) }}>
              {(data?.netPnl ?? 0) >= 0 ? '+' : ''}{fmtR(data?.netPnl ?? 0)}
            </div>
            <div style={{ fontSize: 10, marginTop: 2, color: (data?.changePercent ?? 0) >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {(data?.changePercent ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(data?.changePercent ?? 0).toFixed(1)}% vs range
            </div>
            <Sparkline data={growthChart} color={data?.netPnl >= 0 ? '#16a34a' : '#dc2626'} h={28}/>
          </div>

          {/* Trades + W/L/BE — merged, Trades col smaller */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 13px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'stretch', transition: 'box-shadow .25s, transform .2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,.11)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)';  e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ flex: 0.65 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Trades</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{data?.totalTrades ?? 0}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Total</div>
            </div>
            <div style={{ width: 1, background: '#e2e8f0', margin: '2px 13px' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>W / L / BE</div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>
                <span style={{ color: '#16a34a' }}>{data?.wins ?? 0}</span>
                <span style={{ color: '#cbd5e1', fontWeight: 400 }}> / </span>
                <span style={{ color: '#dc2626' }}>{data?.losses ?? 0}</span>
                <span style={{ color: '#cbd5e1', fontWeight: 400 }}> / </span>
                <span style={{ color: '#94a3b8' }}>{data?.bes ?? 0}</span>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Total</div>
              <WLBar w={data?.wins} l={data?.losses} be={data?.bes}/>
            </div>
          </div>

          {/* Win Rate */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 13px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'box-shadow .25s, transform .2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,.11)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)';  e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Win Rate</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#16a34a' }}>{data?.winRate?.toFixed(1) ?? 0}%</div>
                <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2, fontWeight: 600 }}>↑ {data?.winRate?.toFixed(1) ?? 0}%</div>
              </div>
              <Donut pct={data?.winRate ?? 0} size={46}/>
            </div>
            <Sparkline data={growthChart} color="#16a34a" h={24}/>
          </div>

          {/* RR */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 13px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'box-shadow .25s, transform .2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,.11)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)';  e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>RR (Risk Reward)</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{data?.avgRR?.toFixed(2) ?? '0.00'} R</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>avg R</div>
            <Sparkline data={growthChart} color="#2563eb" h={28}/>
          </div>

          {/* Stats merged card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '11px 13px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'stretch', transition: 'box-shadow .25s, transform .2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,.11)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)';  e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ flex: 1.6 }}>
              {[
                ['Days Win %', `${data?.daysWinPercent?.toFixed(1) ?? 0}% (${data?.daysWin ?? 0}/${data?.totalTradingDays ?? 0})`, '#16a34a'],
                ['Total Win / Loss', `${fmtR(data?.totalWin)} / -${fmtR(Math.abs(data?.totalLoss ?? 0))}`, null],
                ['Avg Win / Loss', `${fmtR(data?.avgWin)} / -${fmtR(Math.abs(data?.avgLoss ?? 0))}`, null],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', flexShrink: 0, display: 'inline-block' }}/>
                    {k}
                  </span>
                  <span style={{ fontWeight: 600, color: c || '#0f172a', fontSize: 11 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ width: 1, background: '#e2e8f0', margin: '2px 16px' }}/>
            <div style={{ flex: 1 }}>
              {[
                ['Biggest Win', fmtR(data?.biggestWin), '#16a34a'],
                ['Biggest Loss', `-${fmtR(Math.abs(data?.biggestLoss ?? 0))}`, '#dc2626'],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0, display: 'inline-block' }}/>
                    {k}
                  </span>
                  <span style={{ fontWeight: 600, color: c, fontSize: 11.5 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calendar + Right Panel ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 12, ...fadeIn, transitionDelay: '.1s', alignItems: 'stretch' }}>

          {/* Calendar */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'box-shadow .25s', display: 'flex', flexDirection: 'column' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.09)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}>
            {/* Calendar header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Trading Calendar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <button onClick={() => { const d = new Date(calYear, calMonth-1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 7px', borderRadius: 6, color: '#64748b', fontSize: 17, lineHeight: 1, transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>‹</button>
                <span style={{ fontWeight: 600, fontSize: 13.5, minWidth: 96, textAlign: 'center' }}>{MONTHS[calMonth]} {calYear}</span>
                <button onClick={() => { const d = new Date(calYear, calMonth+1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 7px', borderRadius: 6, color: '#64748b', fontSize: 17, lineHeight: 1, transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>›</button>
                <select onChange={e => {
                    const v = e.target.value; if (!v) return;
                    const now = new Date();
                    const pad = n => String(n).padStart(2,'0');
                    const fmt = dt => dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());
                    const en = fmt(now); let s = en;
                    if      (v==='all') s = '2000-01-01';
                    else if (v==='ytd') s = now.getFullYear()+'-01-01';
                    else if (v==='1yr') { const dt=new Date(now); dt.setFullYear(dt.getFullYear()-1); s=fmt(dt); }
                    else if (v==='6m')  { const dt=new Date(now); dt.setMonth(dt.getMonth()-6); s=fmt(dt); }
                    else if (v==='3m')  { const dt=new Date(now); dt.setMonth(dt.getMonth()-3); s=fmt(dt); }
                    else if (v==='1m')  { const dt=new Date(now); dt.setDate(1); s=fmt(dt); }
                    else if (v==='cw')  { const dt=new Date(now); dt.setDate(dt.getDate()-dt.getDay()); s=fmt(dt); }
                    setStartDate(s); setEndDate(en); e.target.value='';
                  }} defaultValue=""
                  style={{ appearance:'none', WebkitAppearance:'none', border:'1px solid #e2e8f0', borderRadius:7, padding:'4px 24px 4px 9px', fontSize:11.5, fontWeight:600, color:'#475569', cursor:'pointer', outline:'none', background:'#f8fafc' }}>
                  <option value="" disabled>Quick ▾</option>
                  <option value="cw">This Week</option>
                  <option value="1m">This Month</option>
                  <option value="3m">Past 3 Months</option>
                  <option value="6m">6 Months</option>
                  <option value="1yr">1 Year</option>
                  <option value="ytd">YTD</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: '#64748b', flexShrink: 0 }}>
                {[['#16a34a','Win'],['#dc2626','Loss'],['#94a3b8','BE']].map(([c,l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 0.81fr))', gap: 5, marginBottom: 3 }}>
              {DAY_HDR.map(h => <div key={h} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#94a3b8', padding: '3px 0' }}>{h}</div>)}
            </div>

            {/* Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 0.81fr))', gap: 5, flex: 1, gridAutoRows: '1fr' }}>
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} style={{ background: '#f8fafc', borderRadius: 7, border: '1px solid #e8edf2', height: CELL_H /* ← cell height */ }}/>;
                const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const d   = calMap[key];
                const inRange = isInRange(calYear, calMonth, day);
                const bg  = d && inRange ? calCellBg(d.netPnl, maxAbs) : '#f8fafc';
                const tc  = d && inRange ? calCellTxt(d.netPnl, maxAbs) : '#c4cdd6';
                const bdr = inRange && d ? calCellBorder(d.netPnl, maxAbs) : inRange ? '1px solid #dde3ea' : '1px solid #eef1f4';
                const isToday  = key === fmt8(today);
                const isSel    = selected === day;
                return (
                  <div key={idx}
                    onClick={() => { if (inRange && d) setSelected(isSel ? null : day); }}
                    style={{
                      borderRadius: 7, padding: '5px 6px',
                      background: bg, cursor: d && inRange ? 'pointer' : 'default',
                      border: isToday ? '2px solid #2563eb' : isSel ? '2px solid #2563eb' : bdr,
                      opacity: inRange ? 1 : 0,
                      pointerEvents: inRange ? 'auto' : 'none',
                      transition: 'transform .18s ease, box-shadow .18s ease',
                      position: 'relative', height: CELL_H, /* ← cell height — set CELL_H above */
                    }}
                    onMouseEnter={e => { if (d && inRange) { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,.14)'; e.currentTarget.style.zIndex='2'; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.zIndex='auto'; }}
                  >
                    {/* Row 1: day number + trade count badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: tc, opacity: .85 }}>{day}</div>
                      {d && inRange && d.tradeCount > 0 && (
                        <div style={{ fontSize: 8.5, fontWeight: 700, color: tc, opacity: .7, background: 'rgba(0,0,0,.09)', borderRadius: 3, padding: '1px 3px', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                          {d.tradeCount} trade{d.tradeCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    {/* Row 2: P&L */}
                    {d && inRange && <div style={{ fontSize: 11, fontWeight: 700, color: tc, marginTop: 2 }}>
                      {d.netPnl >= 0 ? '+' : ''}{fmtR(d.netPnl)}
                    </div>}
                    {/* Row 3: R value */}
                    {d && inRange && <div style={{ fontSize: 10, color: tc, opacity: .85 }}>
                      {d.totalR >= 0 ? '+' : ''}{d.totalR?.toFixed(2)} R
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Summary + Growth chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Summary panel */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '13px 15px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'box-shadow .25s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.09)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>Summary</span>
                {selected && <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 17, lineHeight: 1, transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='#475569'}
                  onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>×</button>}
              </div>

              {/* No selection and no today trades */}
              {!selDay && !selected ? (
                <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '14px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📅</div>
                  No Trades Today, click on<br/>another day to see summary...
                </div>
              ) : !selDay ? (
                <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '14px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📅</div>
                  No trades on this day
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, animation: 'fadeIn .25s ease' }}>
                  {/* Left col */}
                  <div style={{ minWidth: 115 }}>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 4 }}>
                      {selDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 23, fontWeight: 700, color: cls(selDay.netPnl), lineHeight: 1.1 }}>
                      {selDay.netPnl >= 0 ? '+' : ''}{fmtR(selDay.netPnl)}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {selDay.totalR >= 0 ? '+' : ''}{selDay.totalR?.toFixed(2)} R
                      <span style={{
                        background: Math.abs(selDay.netPnl) <= 10 ? '#f1f5f9' : selDay.netPnl > 0 ? '#dcfce7' : '#fee2e2',
                        color: cls(selDay.netPnl), fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 20,
                      }}>
                        {dayLabel(selDay.netPnl)}
                      </span>
                    </div>
                    <button onClick={() => navigate('/trades')}
                      style={{ marginTop: 10, padding: '5px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#2563eb', width: '100%', transition: 'background .15s, border-color .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#2563eb'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                      View Trades
                    </button>
                  </div>
                  <div style={{ width: 1, background: '#f1f5f9', flexShrink: 0 }}/>
                  {/* Right col */}
                  <div style={{ flex: 1 }}>
                    {[
                      ['Win / Loss / BE', `${selDay.wins ?? 0} / ${selDay.losses ?? 0} / ${selDay.bes ?? 0}`, null],
                      ['Win Rate', `${selDay.winRate?.toFixed(2) ?? 0}%`, (selDay.winRate ?? 0) >= 50 ? '#16a34a' : '#dc2626'],
                      ['Total Win',  fmtR(selDay.totalWin  ?? 0), '#16a34a'],
                      ['Total Loss', selDay.losses > 0 ? `-${fmtR(Math.abs(selDay.totalLoss ?? 0))}` : `${sym}0`, '#dc2626'],
                      ['Net P&L', `${selDay.netPnl >= 0 ? '+' : ''}${fmtR(selDay.netPnl)}`, cls(selDay.netPnl)],
                      ['Trades', selDay.tradeCount ?? 0, null],
                    ].map(([k, v, c]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', padding: '4.5px 0', fontSize: 12 }}>
                        <span style={{ color: '#64748b' }}>{k}</span>
                        <span style={{ fontWeight: 600, color: c || '#0f172a' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Growth chart */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', flex: 1, transition: 'box-shadow .25s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.09)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Growth (P&L Over Time)</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {['Days','Weeks'].map(m => (
                    <button key={m} onClick={() => setChartMode(m)} style={{
                      padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontWeight: 600, fontSize: 11.5,
                      background: chartMode === m ? '#2563eb' : '#f1f5f9',
                      color: chartMode === m ? '#fff' : '#64748b',
                      transition: 'all .18s',
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={185}>
                <AreaChart data={growthChart} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gMax >= 0 ? '#16a34a' : '#dc2626'} stopOpacity={0.28}/>
                      <stop offset={zeroPct} stopColor={gMax >= 0 ? '#16a34a' : '#dc2626'} stopOpacity={0.05}/>
                      <stop offset={zeroPct} stopColor="#dc2626" stopOpacity={0.05}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.22}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    interval={0} angle={growthChart.length > 14 ? -35 : 0} textAnchor={growthChart.length > 14 ? 'end' : 'middle'}
                    height={growthChart.length > 14 ? 36 : 20}/>
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickCount={6}
                    tickFormatter={v => {
                      if (showUSD) { const u = v/usdRate; return `$${Math.abs(u)>=1000?`${(u/1000).toFixed(0)}k`:u.toFixed(0)}`; }
                      return `₹${Math.abs(v)>=1000?`${(v/1000).toFixed(0)}k`:v}`;
                    }}/>
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 3"/>
                  <Tooltip
                    formatter={v => [fmtR(v), 'Cumulative P&L']}
                    contentStyle={{ borderRadius: 9, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                    labelStyle={{ fontSize: 12, fontWeight: 600 }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}/>
                  <Area type="monotone" dataKey="val" stroke={data?.netPnl >= 0 ? '#16a34a' : '#dc2626'}
                    strokeWidth={2.5} fill="url(#growthGrad)"
                    dot={{ r: 3, fill: data?.netPnl >= 0 ? '#16a34a' : '#dc2626', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={900}/>
                </AreaChart>
              </ResponsiveContainer>

              {/* Bottom bar */}
              <div style={{ display: 'flex', gap: 0, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                {[
                  ['Starting Balance', fmtR(data?.startingBalance ?? 0), null],
                  ['Ending Balance',   fmtR(data?.endingBalance ?? 0), null],
                  ['Net P&L',          fmtR(data?.netPnl ?? 0), cls(data?.netPnl)],
                  ['Change',           `${(data?.changePercent ?? 0) >= 0 ? '↑' : '↓'} ${Math.abs(data?.changePercent ?? 0).toFixed(1)}%`, cls(data?.netPnl)],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ flex: 1 }}>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: c || '#0f172a' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
