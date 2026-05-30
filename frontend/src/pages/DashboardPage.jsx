import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Sidebar    from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api        from '../services/api';

const today     = new Date();
const thirtyAgo = new Date(); thirtyAgo.setDate(today.getDate() - 30);
const fmt8 = d => d.toISOString().split('T')[0];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Colour intensity: profit=green, loss=red, darker = bigger
function cellColor(pnl, maxAbs) {
  if (pnl === 0 || maxAbs === 0) return '#f8fafc';
  const intensity = Math.min(0.9, 0.15 + 0.75 * (Math.abs(pnl) / maxAbs));
  if (pnl > 0) return `rgba(22,163,74,${intensity})`;
  return `rgba(220,38,38,${intensity})`;
}

function cellTextColor(pnl, maxAbs) {
  const intensity = maxAbs === 0 ? 0 : Math.abs(pnl) / maxAbs;
  return intensity > 0.45 ? '#fff' : (pnl >= 0 ? '#166534' : '#991b1b');
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [startDate, setStartDate] = useState(fmt8(thirtyAgo));
  const [endDate,   setEndDate]   = useState(fmt8(today));
  const [data,      setData]      = useState(null);
  const [calYear,   setCalYear]   = useState(today.getFullYear());
  const [calMonth,  setCalMonth]  = useState(today.getMonth());
  const [selected,  setSelected]  = useState(null); // clicked calendar day
  const [chartMode, setChartMode] = useState('Days');

  const fetchDashboard = useCallback(async () => {
    try {
      const r = await api.get('/dashboard', { params: { startDate, endDate } });
      setData(r.data.data);
    } catch {}
  }, [startDate, endDate]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const calMap = {};
  (data?.calendarData || []).forEach(d => { calMap[d.date] = d; });

  const maxAbs = Math.max(...(data?.calendarData || []).map(d => Math.abs(d.netPnl || 0)), 1);

  // Build calendar grid for calYear / calMonth
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Growth chart data: weekly aggregation if chartMode=Weeks
  const growthRaw = data?.growthData || [];
  const growthChart = chartMode === 'Days'
    ? growthRaw.map(g => ({ date: g.date.slice(5), val: g.cumulativePnl }))
    : (() => {
        const weeks = {};
        growthRaw.forEach(g => {
          const d = new Date(g.date);
          const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
          const key = fmt8(weekStart);
          weeks[key] = g.cumulativePnl;
        });
        return Object.entries(weeks).map(([k, v]) => ({ date: k.slice(5), val: v }));
      })();

  const fmt = v => v == null ? '₹0' : `₹${v >= 0 ? '' : '-'}${Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const fmtDollar = v => v == null ? '$0' : `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  const cls = v => v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#64748b';

  // Day summary for selected cell
  const todayStr = fmt8(today);
  const selectedKey = selected
    ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selected).padStart(2, '0')}`
    : null;
  const selectedDay = selectedKey ? calMap[selectedKey] : null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700 }}>Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize:13.5, color:'#64748b', marginTop:3 }}>Here's your trading performance overview.</p>
          </div>
          {/* Date range picker */}
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, padding:'7px 14px', fontSize:13, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border:'none', outline:'none', fontSize:13, fontFamily:'inherit' }}/>
            <span style={{ color:'#94a3b8' }}>–</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border:'none', outline:'none', fontSize:13, fontFamily:'inherit' }}/>
          </div>
        </div>

        {/* ── Stat cards row ───────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:18 }}>
          {/* Net P&L */}
          <StatCard label="Net P&L" value={fmt(data?.netPnl)} color={cls(data?.netPnl)} sub={`vs 30 days`} />
          {/* Trades */}
          <StatCard label="Trades" value={data?.totalTrades ?? 0} sub="Total" />
          {/* W/L/BE */}
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>W / L / BE</div>
            <div style={{ fontSize:19, fontWeight:700 }}>
              <span style={{ color:'#16a34a' }}>{data?.wins ?? 0}</span>
              <span style={{ color:'#94a3b8', fontWeight:400 }}> / </span>
              <span style={{ color:'#dc2626' }}>{data?.losses ?? 0}</span>
              <span style={{ color:'#94a3b8', fontWeight:400 }}> / </span>
              <span style={{ color:'#94a3b8' }}>{data?.bes ?? 0}</span>
            </div>
            <div style={{ fontSize:11.5, color:'#64748b', marginTop:4 }}>Total</div>
          </div>
          {/* Win Rate */}
          <div className="card" style={{ padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>Win Rate</div>
              <div style={{ fontSize:19, fontWeight:700 }}>{data?.winRate?.toFixed(1) ?? 0}%</div>
            </div>
            <svg width="42" height="42" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="16" fill="none" stroke="#e2e8f0" strokeWidth="5"/>
              <circle cx="21" cy="21" r="16" fill="none" stroke="#16a34a" strokeWidth="5"
                strokeDasharray={`${(data?.winRate ?? 0) * 1.005} 100`}
                strokeDashoffset="25" strokeLinecap="round" transform="rotate(-90 21 21)"/>
            </svg>
          </div>
          {/* RR */}
          <StatCard label="RR (Risk Reward)" value={data?.avgRR?.toFixed(2) ?? '0.00'} sub="avg R" color="#2563eb"/>
          {/* Right stats */}
          <div className="card" style={{ padding:'14px 16px', gridColumn:'span 1' }}>
            <div style={{ fontSize:11.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>Summary</div>
            <div style={{ fontSize:12, display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ color:'#64748b' }}>Days Win %</span>
              <span style={{ color:'#16a34a', fontWeight:600 }}>{data?.daysWinPercent?.toFixed(1) ?? 0}% ({data?.daysWin ?? 0}/{data?.totalTradingDays ?? 0})</span>
            </div>
            <div style={{ fontSize:12, display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ color:'#64748b' }}>Best Win</span>
              <span style={{ color:'#16a34a', fontWeight:600 }}>{fmt(data?.biggestWin)}</span>
            </div>
            <div style={{ fontSize:12, display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'#64748b' }}>Worst Loss</span>
              <span style={{ color:'#dc2626', fontWeight:600 }}>{fmt(data?.biggestLoss)}</span>
            </div>
          </div>
        </div>

        {/* ── Second row: total win/loss + avg ─────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
          <StatCard label="Total Win" value={fmt(data?.totalWin)} color="#16a34a"/>
          <StatCard label="Total Loss" value={fmt(data?.totalLoss)} color="#dc2626"/>
          <StatCard label="Avg Win" value={fmt(data?.avgWin)} color="#16a34a"/>
          <StatCard label="Avg Loss" value={fmt(data?.avgLoss)} color="#dc2626"/>
        </div>

        {/* ── Calendar + Summary ───────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:18 }}>

          {/* Calendar */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <button className="icon-btn" onClick={() => { const d = new Date(calYear, calMonth - 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontWeight:600, fontSize:14 }}>{MONTH_NAMES[calMonth]} {calYear}</span>
              <button className="icon-btn" onClick={() => { const d = new Date(calYear, calMonth + 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {/* Legend */}
              <div style={{ marginLeft:'auto', display:'flex', gap:12, fontSize:12, color:'#64748b' }}>
                {[['#16a34a','Win'],['#dc2626','Loss'],['#94a3b8','BE']].map(([c,l]) => (
                  <span key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block' }}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="cal-grid">
              {DAY_HEADERS.map(h => <div key={h} className="cal-day-header">{h}</div>)}
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} className="cal-cell empty" />;
                const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const d   = calMap[key];
                const bg  = d ? cellColor(d.netPnl, maxAbs) : '#f8fafc';
                const tc  = d ? cellTextColor(d.netPnl, maxAbs) : '#94a3b8';
                const isToday = key === todayStr;
                return (
                  <div
                    key={idx}
                    className={`cal-cell${isToday ? ' today' : ''}${selected === day ? ' selected' : ''}`}
                    style={{ background: bg, borderColor: isToday ? '#2563eb' : selected === day ? '#2563eb' : 'transparent' }}
                    onClick={() => setSelected(selected === day ? null : day)}
                  >
                    <div className="day-num" style={{ color: tc, opacity:.8 }}>{day}</div>
                    {d && <>
                      <div className="day-pnl" style={{ color: tc, fontSize:11.5 }}>
                        {d.netPnl >= 0 ? '+' : ''}{fmt(d.netPnl)}
                      </div>
                      <div className="day-r" style={{ color: tc, opacity:.85, fontSize:10.5 }}>
                        {d.totalR >= 0 ? '+' : ''}{d.totalR?.toFixed(2)} R
                      </div>
                    </>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary panel */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontWeight:600, fontSize:14 }}>Summary</span>
              {selectedDay && (
                <button className="icon-btn" onClick={() => setSelected(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>

            {!selectedDay ? (
              <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', marginTop:40 }}>
                Click a day on the calendar to see its summary
              </div>
            ) : (
              <>
                <div style={{ fontSize:11.5, color:'#64748b', marginBottom:6 }}>
                  {MONTH_NAMES[calMonth]} {selected}, {calYear}
                </div>
                <div style={{ fontSize:26, fontWeight:700, color: cls(selectedDay.netPnl), marginBottom:4 }}>
                  {selectedDay.netPnl >= 0 ? '+' : ''}{fmt(selectedDay.netPnl)}
                </div>
                <div style={{ fontSize:13, color:'#64748b', marginBottom:14 }}>
                  {selectedDay.totalR >= 0 ? '+' : ''}{selectedDay.totalR?.toFixed(2)} R
                  &nbsp;·&nbsp;
                  <span style={{ color: selectedDay.netPnl >= 0 ? '#16a34a' : '#dc2626' }}>
                    {selectedDay.netPnl >= 0 ? 'Win' : 'Loss'}
                  </span>
                </div>
                {[
                  ['Win / Loss / BE', `${selectedDay.wins} / ${selectedDay.losses} / ${selectedDay.bes}`],
                  ['Win Rate',        `${selectedDay.winRate?.toFixed(2)}%`],
                  ['Trades',          selectedDay.tradeCount],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #f1f5f9', padding:'8px 0', fontSize:13 }}>
                    <span style={{ color:'#64748b' }}>{k}</span>
                    <span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <button
                  className="btn btn-outline"
                  style={{ width:'100%', marginTop:16, justifyContent:'center' }}
                  onClick={() => navigate('/trades')}
                >
                  View Trades
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Growth Chart ─────────────────────────────────────────────── */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <span style={{ fontWeight:600, fontSize:14 }}>Growth (P&amp;L Over Time)</span>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {['Days','Weeks'].map(m => (
                <button key={m} onClick={() => setChartMode(m)} style={{ padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:12.5, background: chartMode === m ? '#2563eb' : '#f1f5f9', color: chartMode === m ? '#fff' : '#64748b' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthChart} margin={{ top:5, right:10, left:10, bottom:0 }}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v) => [fmt(v), 'Cumulative P&L']} labelStyle={{ fontSize:12 }} contentStyle={{ borderRadius:8, border:'1px solid #e2e8f0', fontSize:12 }}/>
              <Area type="monotone" dataKey="val" stroke="#2563eb" strokeWidth={2} fill="url(#pnlGrad)" dot={false} activeDot={{ r:4 }}/>
            </AreaChart>
          </ResponsiveContainer>

          {/* Bottom summary bar */}
          <div style={{ display:'flex', gap:24, marginTop:16, borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
            {[
              ['Starting Balance', fmt(data?.startingBalance ?? 0)],
              ['Ending Balance',   fmt(data?.endingBalance ?? 0)],
              ['Net P&L',          fmt(data?.netPnl ?? 0)],
              ['Change',           `↑ ${data?.changePercent?.toFixed(1) ?? 0}%`],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize:11.5, color:'#64748b', marginBottom:3 }}>{k}</div>
                <div style={{ fontWeight:700, fontSize:14, color: k === 'Net P&L' ? cls(data?.netPnl) : '#0f172a' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding:'14px 16px' }}>
      <div style={{ fontSize:11.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color: color || '#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:4 }}>{sub}</div>}
    </div>
  );
}
