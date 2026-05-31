import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { to: '/accounts',  label: 'Accounts',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
  { to: '/strategy',  label: 'Strategy',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { to: '/trades',    label: 'Trades',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg> },
  { to: '/ideas',     label: 'Ideas',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6-.3.2-.5.5-.6.8L14 18H10l-.1-2.2c-.1-.3-.3-.6-.6-.8C7.3 13.7 6 11.5 6 9a7 7 0 0 1 6-7z"/><line x1="10" y1="22" x2="14" y2="22"/><line x1="10" y1="19" x2="14" y2="19"/></svg> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U';

  return (
    <aside style={{
      width: 185,
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      background: '#fff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '1px 0 8px rgba(0,0,0,.04)',
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 20px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid #f1f5f9' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#2563eb,#16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 13,
        }}>TJ</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', lineHeight: 1.1 }}>TradeJournal</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Track. Analyse. Improve.</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 9px' }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8.5px 11px',
            borderRadius: 7, marginBottom: 3,
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 500,
            color: isActive ? '#2563eb' : '#64748b',
            background: isActive ? '#eff6ff' : 'transparent',
            borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
            transition: 'all .15s ease',
          })}>
            <span style={{ width: 16, height: 16, flexShrink: 0 }}>{icon}</span>
            {label}
          </NavLink>
        ))}

        <div
          onClick={async () => { await logout(); navigate('/login'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8.5px 11px', borderRadius: 7, marginTop: 14,
            cursor: 'pointer', fontSize: 15, fontWeight: 500,
            color: '#64748b', borderLeft: '3px solid transparent',
            transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ width: 16, height: 16 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          Logout
        </div>
      </nav>

      {/* User */}
      <div style={{ padding: '11px 9px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName}</div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
