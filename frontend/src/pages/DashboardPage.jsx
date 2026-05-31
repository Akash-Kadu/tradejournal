import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import Sidebar    from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api        from '../services/api';

const today     = new Date();
const thirtyAgo = new Date(); thirtyAgo.setDate(today.getDate() - 30);
const fmt8      = d => d instanceof Date ? d.toISOString().split('T')[0] : d;
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HDR   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function calCellBg(pnl, maxAbs) {
  if (!pnl || maxAbs === 0) return '#f8fafc';
  const i = Math.min(0.85, 0.15 + 0.7 * (Math.abs(pnl) / maxAbs));
  return pnl > 0 ? `rgba(22,163,74,${i})` : `rgba(220,38,38,${i})`;
}
function calCellTxt(pnl, maxAbs) {
  const i = maxAbs === 0 ? 0 : Math.abs(pnl) / maxAbs;
  return i > 0.45 ? '#fff' : (pnl >= 0 ? '#166534' : '#991b1b');
}

function Sparkline({ data = [], color = '#16a34a', h = 36 }) {
  if (data.length < 2) return <div style={{ height: h }} />;
  const vals = data.map(d => d.val ?? 0);
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
  const W = 100;
  const pts = vals.map((v, i) => `${(i/(vals.length-1))*W},${h-((v-mn)/rng)*h}`).join(' ');
  const area = `${pts} ${W},${h} 0,${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg${color.replace(/[^a-z0-9]/gi,'')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Donut({ pct = 0, size = 52 }) {
  const r = 16, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 42 42">
      <circle cx="21" cy="21" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5"/>
      <circle cx="21" cy="21" r={r} fill="none" stroke="#16a34a" strokeWidth="5"
        strokeDasharray={`${(pct/100)*c} ${c}`} strokeDashoffset={c*0.25}
        strokeLinecap="round" transform="rotate(-90 21 21)"
        style={{ transition: 'stroke-dasharray .6s ease' }}/>
    </svg>
  );
}

function WLBar({ w=0, l=0, be=0 }) {
  const t = w+l+be||1;
  return (
    <div style={{ display:'flex', height:5, borderRadius:3, overflow:'hidden', marginTop:6, gap:1 }}>
      <div style={{ width:`${(w/t)*100}%`, background:'#16a34a', borderRadius:3, transition:'width .6s' }}/>
      <div style={{ width:`${(l/t)*100}%`, background:'#dc2626', borderRadius:3, transition:'width .6s' }}/>
      <div style={{ width:`${(be/t)*100}%`, background:'#94a3b8', borderRadius:3, transition:'width .6s' }}/>
    </div>
  );
}

function AnimNum({ value, prefix='', suffix='', decimals=0, color }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (value == null) return;
    const start = prev.current, end = value, dur = 600, t0 = performance.now();
    const step = ts => {
      const p = Math.min((ts-t0)/dur,1), ease = 1-Math.pow(1-p,3);
      setDisplay(start+(end-start)*ease);
      if (p<1) requestAnimationFrame(step); else { setDisplay(end); prev.current=end; }
    };
    requestAnimationFrame(step);
  }, [value]);
  const fmt = v => { const a=Math.abs(v); return a>=1000 ? a.toLocaleString('en-IN',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}) : a.toFixed(decimals); };
  return <span style={{ color: color||(display>=0?'#16a34a':'#dc2626') }}>{display<0?'-':''}{prefix}{fmt(display)}{suffix}</span>;
}

/* Currency toggle button */
function CurrencyToggle({ currency, onChange }) {
  const isUSD = currency === 'USD';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fff', border:'1px solid #e2e8f0', borderRadius:99, padding:'4px 10px', fontSize:12, fontWeight:600, boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
      <span style={{ color: isUSD ? '#94a3b8' : '#0f172a' }}>₹ INR</span>
      <div
        onClick={() => onChange(isUSD ? 'INR' : 'USD')}
        style={{
          width:38, height:20, borderRadius:99, background: '#16a34a',
          cursor:'pointer', position:'relative', transition:'background .2s',
        }}
      >
        <div style={{
          width:16, height:16, borderRadius:'50%', background:'#fff',
          position:'absolute', top:2,
          left: isUSD ? 20 : 2,
          transition:'left .2s ease',
          boxShadow:'0 1px 3px rgba(0,0,0,.2)',
        }}/>
      </div>
      <span style={{ color: isUSD ? '#0f172a' : '#94a3b8' }}>$ USD</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [startDate, setStartDate] = useState(fmt8(thirtyAgo));
  const [endDate,   setEndDate]   = useState(fmt8(today));
  const [data,      setData]      = useState(null);
  const [calYear,   setCalYear]   = useState(today.getFullYear());
  const [calMonth,  setCalMonth]  = useState(today.getMonth());
  const [selected,  setSelected]  = useState(null);
  const [chartMode, setChartMode] = useState('Days');
  const [loaded,    setLoaded]    = useState(false);
  const [currency,  setCurrency]  = useState('INR');
  const [usdRate,   setUsdRate]   = useState(83.5); // fallback rate

  /* Fetch exchange rate */
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => { if (d.rates?.INR) setUsdRate(d.rates.INR); })
      .catch(() => {});
  }, []);

  const fetchDash = useCallback(async () => {
    setLoaded(false);
    try {
      const r = await api.get('/dashboard', { params: { startDate, endDate } });
      setData(r.data.data);
      setTimeout(() => setLoaded(true), 50);
    } catch {}
  }, [startDate, endDate]);

  useEffect(() => { fetchDash(); }, [fetchDash]);

  /* Money conversion */
  const conv  = v => v == null ? 0 : currency === 'USD' ? v / usdRate : v;
  const sym   = currency === 'USD' ? '$' : '₹';
  const fmtM  = v => {
    const cv = conv(v);
    const sign = cv < 0 ? '-' : '';
    const abs = Math.abs(cv);
    const str = abs >= 1000 ? abs.toLocaleString(currency==='USD'?'en-US':'en-IN',{minimumFractionDigits:0,maximumFractionDigits:2}) : abs.toFixed(2);
    return `${sign}${sym}${str}`;
  };
  const cls = v => v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#64748b';

  /* Calendar helpers */
  const calMap = {};
  (data?.calendarData || []).forEach(d => { calMap[d.date] = d; });
  const maxAbs = Math.max(...(data?.calendarData || []).map(d => Math.abs(d.netPnl||0)), 1);
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];

  /* Date range check for calendar */
  const rangeStart = new Date(startDate + 'T00:00:00');
  const rangeEnd   = new Date(endDate   + 'T00:00:00');
  const inRange = (day) => {
    if (!day) return false;
    const d = new Date(`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}T00:00:00`);
    return d >= rangeStart && d <= rangeEnd;
  };

  /* Growth chart - fill every date in range */
  const growthRaw = data?.growthData || [];
  const growthMap = {};
  growthRaw.forEach(g => { growthMap[g.date] = g.cumulativePnl; });

  const filledGrowth = [];
  if (startDate && endDate) {
    let cur = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    let cumPnl = 0;
    while (cur <= end) {
      const key = fmt8(cur);
      if (growthMap[key] !== undefined) cumPnl = growthMap[key];
      filledGrowth.push({ date: key.slice(5), fullDate: key, val: conv(cumPnl) });
      cur.setDate(cur.getDate() + 1);
    }
  }

  const growthChart = chartMode === 'Days'
    ? filledGrowth
    : (() => {
        const w = {};
        filledGrowth.forEach(g => {
          const d = new Date(g.fullDate+'T00:00:00'); const s = new Date(d); s.setDate(d.getDate()-d.getDay());
          w[fmt8(s)] = g.val;
        });
        return Object.entries(w).map(([k,v]) => ({ date: k.slice(5), val: v }));
      })();

  const selectedKey = selected
    ? `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`
    : null;
  const selDay = selectedKey ? calMap[selectedKey] : null;

  const gMin = Math.min(...growthChart.map(d=>d.val), 0);
  const gMax = Math.max(...growthChart.map(d=>d.val), 0);
  const gRange = gMax - gMin || 1;
  const zeroPct = `${((gMax/gRange)*100).toFixed(1)}%`;

  const fadeIn = { opacity:loaded?1:0, transform:loaded?'translateY(0)':'translateY(10px)', transition:'opacity .4s ease, transform .4s ease' };

  /* How many x-axis labels to show */
  const xInterval = growthChart.length > 60 ? Math.floor(growthChart.length/20) : growthChart.length > 30 ? 2 : 0;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc', fontFamily:"'DM Sans',sans-serif" }}>
      <Sidebar />
      <main style={{ flex:1, padding:'20px 22px', overflowY:'auto', minWidth:0 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Here's your trading performance overview.</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <CurrencyToggle currency={currency} onChange={setCurrency}/>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, padding:'6px 12px', fontSize:12.5, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{ border:'none', outline:'none', fontSize:12.5, fontFamily:'inherit', background:'transparent' }}/>
              <span style={{ color:'#94a3b8' }}>–</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{ border:'none', outline:'none', fontSize:12.5, fontFamily:'inherit', background:'transparent' }}/>
            </div>
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1.2fr', gap:10, marginBottom:14, ...fadeIn }}>

          {/* Net P&L */}
          <div className="stat-hover" style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.05)', transition:'box-shadow .2s, transform .2s' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Net P&L</div>
            <div style={{ fontSize:19, fontWeight:700 }}>
              <AnimNum value={conv(data?.netPnl)} prefix={sym} decimals={0}/>
            </div>
            <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:2 }}>vs 30 days</div>
            <Sparkline data={growthChart} color={data?.netPnl>=0?'#16a34a':'#dc2626'} h={32}/>
          </div>

          {/* Trades */}
          <div className="stat-hover" style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.05)', transition:'box-shadow .2s, transform .2s' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Trades</div>
            <div style={{ fontSize:19, fontWeight:700, color:'#0f172a' }}>{data?.totalTrades??0}</div>
            <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:2 }}>Total</div>
            <WLBar w={data?.wins} l={data?.losses} be={data?.bes}/>
          </div>

          {/* W/L/BE */}
          <div className="stat-hover" style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.05)', transition:'box-shadow .2s, transform .2s' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>W / L / BE</div>
            <div style={{ fontSize:17, fontWeight:700 }}>
              <span style={{ color:'#16a34a' }}>{data?.wins??0}</span>
              <span style={{ color:'#94a3b8', fontWeight:400 }}> / </span>
              <span style={{ color:'#dc2626' }}>{data?.losses??0}</span>
              <span style={{ color:'#94a3b8', fontWeight:400 }}> / </span>
              <span style={{ color:'#94a3b8' }}>{data?.bes??0}</span>
            </div>
            <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:2 }}>Total</div>
            <WLBar w={data?.wins} l={data?.losses} be={data?.bes}/>
          </div>

          {/* Win Rate */}
          <div className="stat-hover" style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.05)', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'box-shadow .2s, transform .2s' }}>
            <div>
              <div style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Win Rate</div>
              <div style={{ fontSize:19, fontWeight:700, color:'#0f172a' }}>{data?.winRate?.toFixed(1)??0}%</div>
              <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:2 }}>↑ {data?.winRate?.toFixed(1)??0}%</div>
            </div>
            <Donut pct={data?.winRate??0}/>
          </div>

          {/* RR */}
          <div className="stat-hover" style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.05)', transition:'box-shadow .2s, transform .2s' }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>RR (Risk Reward)</div>
            <div style={{ fontSize:19, fontWeight:700, color:'#0f172a' }}>{data?.avgRR?.toFixed(2)??'0.00'} R</div>
            <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:2 }}>avg R</div>
            <Sparkline data={growthChart} color="#2563eb" h={32}/>
          </div>

          {/* Summary stats */}
          <div className="stat-hover" style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.05)', transition:'box-shadow .2s, transform .2s' }}>
            {[
              ['Days Win %', `${data?.daysWinPercent?.toFixed(1)??0}% (${data?.daysWin??0}/${data?.totalTradingDays??0})`, '#16a34a'],
              ['Total Win / Loss', `${fmtM(data?.totalWin)} / ${fmtM(data?.totalLoss)}`, null],
              ['Avg Win / Loss', `${fmtM(data?.avgWin)} / ${fmtM(data?.avgLoss)}`, null],
              ['Biggest Win', fmtM(data?.biggestWin), '#16a34a'],
              ['Biggest Loss', fmtM(data?.biggestLoss), '#dc2626'],
            ].map(([k,v,c]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:11 }}>
                <span style={{ color:'#64748b' }}>{k}</span>
                <span style={{ fontWeight:600, color:c||'#0f172a' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Calendar + Right Panel ──────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:12, ...fadeIn, transitionDelay:'.1s' }}>

          {/* Calendar */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'13px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
              <button onClick={() => { const d=new Date(calYear,calMonth-1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 6px', borderRadius:6, color:'#64748b', fontSize:16, lineHeight:1 }}>‹</button>
              <span style={{ fontWeight:600, fontSize:13 }}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={() => { const d=new Date(calYear,calMonth+1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 6px', borderRadius:6, color:'#64748b', fontSize:16, lineHeight:1 }}>›</button>
              <div style={{ marginLeft:'auto', display:'flex', gap:10, fontSize:10.5, color:'#64748b' }}>
                {[['#16a34a','Win'],['#dc2626','Loss'],['#94a3b8','BE']].map(([c,l]) => (
                  <span key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:c, display:'inline-block' }}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, marginBottom:5 }}>
              {DAY_HDR.map(h => <div key={h} style={{ textAlign:'center', fontSize:10.5, fontWeight:600, color:'#94a3b8', padding:'2px 0' }}>{h}</div>)}
            </div>

            {/* Cells — 10% smaller, gap 5px, only show in range */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5 }}>
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} style={{ minHeight:52, background:'#f8fafc', borderRadius:5 }}/>;
                const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const withinRange = inRange(day);
                const d   = calMap[key];
                const bg  = (withinRange && d) ? calCellBg(d.netPnl, maxAbs) : withinRange ? '#f8fafc' : '#fafafa';
                const tc  = (withinRange && d) ? calCellTxt(d.netPnl, maxAbs) : '#cbd5e1';
                const isToday = key === fmt8(today);
                return (
                  <div key={idx}
                    onClick={() => withinRange && d && setSelected(selected===day?null:day)}
                    style={{
                      minHeight:52, borderRadius:5, padding:'4px 5px',
                      background:bg,
                      cursor:(withinRange && d) ? 'pointer' : 'default',
                      border: isToday ? '2px solid #2563eb' : selected===day ? '2px solid #2563eb' : '2px solid transparent',
                      transition:'transform .15s, box-shadow .15s',
                      opacity: withinRange ? 1 : 0.4,
                    }}
                    onMouseEnter={e => { if(withinRange&&d){ e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.12)'; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}
                  >
                    <div style={{ fontSize:10.5, fontWeight:600, color:tc, opacity:.85 }}>{day}</div>
                    {withinRange && d && <>
                      <div style={{ fontSize:10.5, fontWeight:700, color:tc, marginTop:2, lineHeight:1.2 }}>
                        {d.netPnl>=0?'+':''}{fmtM(d.netPnl)}
                      </div>
                      <div style={{ fontSize:9.5, color:tc, opacity:.85 }}>
                        {d.totalR>=0?'+':''}{d.totalR?.toFixed(2)} R
                      </div>
                    </>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Summary + Growth chart */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Summary panel */}
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontWeight:600, fontSize:13 }}>Summary</span>
                {selDay && <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18, lineHeight:1 }}>×</button>}
              </div>
              {!selDay ? (
                <div style={{ color:'#94a3b8', fontSize:12, textAlign:'center', padding:'24px 0' }}>
                  Click a day on the<br/>calendar to see its summary
                </div>
              ) : (
                <div style={{ animation:'fadeIn .25s ease' }}>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>{MONTHS[calMonth]} {selected}, {calYear}</div>
                  <div style={{ fontSize:24, fontWeight:700, color:cls(selDay.netPnl), marginBottom:2 }}>
                    {selDay.netPnl>=0?'+':''}{fmtM(selDay.netPnl)}
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>
                    {selDay.totalR>=0?'+':''}{selDay.totalR?.toFixed(2)} R ·{' '}
                    <span style={{ color:cls(selDay.netPnl), fontWeight:600 }}>
                      {selDay.netPnl>0?'Win':selDay.netPnl<0?'Loss':'BE'}
                    </span>
                  </div>
                  {[
                    ['Win / Loss / BE', `${selDay.wins} / ${selDay.losses} / ${selDay.bes}`],
                    ['Win Rate', `${selDay.winRate?.toFixed(2)}%`],
                    ['Total Win', fmtM(selDay.wins>0?Math.max(selDay.netPnl,0):0)],
                    ['Total Loss', selDay.losses>0?fmtM(Math.min(selDay.netPnl,0)):'₹0'],
                    ['Net P&L', `${selDay.netPnl>=0?'+':''}${fmtM(selDay.netPnl)}`],
                    ['Trades', selDay.tradeCount],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #f1f5f9', padding:'6px 0', fontSize:12 }}>
                      <span style={{ color:'#64748b' }}>{k}</span>
                      <span style={{ fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <button onClick={()=>navigate('/trades')}
                    style={{ width:'100%', marginTop:12, padding:'7px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:7, cursor:'pointer', fontFamily:'inherit', fontSize:12.5, fontWeight:600, color:'#2563eb' }}>
                    View Trades
                  </button>
                </div>
              )}
            </div>

            {/* Growth chart */}
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,.05)', flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontWeight:600, fontSize:12.5 }}>Growth (P&L Over Time)</span>
                <div style={{ display:'flex', gap:3 }}>
                  {['Days','Weeks'].map(m => (
                    <button key={m} onClick={()=>setChartMode(m)} style={{
                      padding:'3px 9px', borderRadius:6, border:'none', cursor:'pointer',
                      fontFamily:'inherit', fontWeight:600, fontSize:11,
                      background:chartMode===m?'#2563eb':'#f1f5f9',
                      color:chartMode===m?'#fff':'#64748b', transition:'all .15s',
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={growthChart} margin={{ top:5, right:5, left:0, bottom:20 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gMax>=0?'#16a34a':'#dc2626'} stopOpacity={0.3}/>
                      <stop offset={zeroPct} stopColor={gMax>=0?'#16a34a':'#dc2626'} stopOpacity={0.05}/>
                      <stop offset={zeroPct} stopColor="#dc2626" stopOpacity={0.05}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="date"
                    tick={{ fontSize:8, fill:'#94a3b8' }}
                    axisLine={false} tickLine={false}
                    interval={xInterval}
                    angle={-45}
                    textAnchor="end"
                    height={40}/>
                  <YAxis tick={{ fontSize:8, fill:'#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${sym}${Math.abs(v)>=1000?`${(v/1000).toFixed(0)}k`:v}`}
                    width={45}/>
                  <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="3 3"/>
                  <Tooltip
                    formatter={v=>[fmtM(currency==='USD'?v:v), 'Cumulative P&L']}
                    contentStyle={{ borderRadius:8, border:'1px solid #e2e8f0', fontSize:11 }}
                    labelStyle={{ fontSize:11 }}/>
                  <Area type="monotone" dataKey="val"
                    stroke={data?.netPnl>=0?'#16a34a':'#dc2626'}
                    strokeWidth={2} fill="url(#growthGrad)"
                    dot={false} activeDot={{ r:3 }} animationDuration={800}/>
                </AreaChart>
              </ResponsiveContainer>

              {/* Bottom balance bar */}
              <div style={{ display:'flex', gap:14, marginTop:8, paddingTop:8, borderTop:'1px solid #f1f5f9', flexWrap:'wrap' }}>
                {[
                  ['Starting Balance', `${sym}0`],
                  ['Ending Balance',   fmtM(data?.endingBalance??0)],
                  ['Net P&L',          fmtM(data?.netPnl??0)],
                  ['Change',           `↑ ${data?.changePercent?.toFixed(1)??0}%`],
                ].map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontSize:10, color:'#64748b', marginBottom:2 }}>{k}</div>
                    <div style={{ fontWeight:700, fontSize:12, color:k==='Net P&L'?cls(data?.netPnl):'#0f172a' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .stat-hover:hover { box-shadow: 0 4px 14px rgba(0,0,0,.1) !important; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
