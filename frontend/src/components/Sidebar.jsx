import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { to: '/accounts',  label: 'Accounts',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
  { to: '/strategy',  label: 'Strategy',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { to: '/trades',    label: 'Trades',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg> },
  { to: '/ideas',     label: 'Ideas',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6-.3.2-.5.5-.6.8L14 18H10l-.1-2.2c-.1-.3-.3-.6-.6-.8C7.3 13.7 6 11.5 6 9a7 7 0 0 1 6-7z"/><line x1="10" y1="22" x2="14" y2="22"/><line x1="10" y1="19" x2="14" y2="19"/></svg> },
];

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Desktop collapsed state
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sb_collapsed') === 'true');
  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sb_collapsed', next);
  };

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const W = collapsed ? 62 : 196;

  const navLinks = (
    <>
      {NAV.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className="sb-nav-link" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 11px', borderRadius: 8, marginBottom: 3,
          textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
          color: isActive ? '#2563eb' : '#64748b',
          background: isActive ? '#eff6ff' : 'transparent',
          borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
          transition: 'background .15s, color .15s',
        })}>
          <span style={{ width: 17, height: 17, flexShrink: 0, display: 'flex' }}>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}

      <div
        onClick={async () => { await logout(); navigate('/login'); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 11px', borderRadius: 8, marginTop: 14,
          cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
          color: '#64748b', borderLeft: '3px solid transparent',
          transition: 'background .15s, color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
        onTouchStart={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
        onTouchEnd={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
      >
        <span style={{ width: 17, height: 17, flexShrink: 0, display: 'flex' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </span>
        Logout
      </div>
    </>
  );

  const userBlock = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{user?.fullName}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{user?.email}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          DESKTOP SIDEBAR — hidden on mobile via CSS class
          ════════════════════════════════════════════════════════ */}
      <aside className="sb-desktop" style={{
        width: W, minHeight: '100vh', background: '#fff',
        borderRight: '1px solid #e2e8f0', display: 'flex',
        flexDirection: 'column', position: 'sticky', top: 0,
        boxShadow: '1px 0 10px rgba(0,0,0,.05)', zIndex: 10,
        transition: 'width .22s cubic-bezier(.4,0,.2,1)',
        overflow: 'visible', flexShrink: 0,
      }}>
        {/* Logo + toggle */}
        <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9', minHeight: 60, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg,#2563eb,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, boxShadow: '0 2px 8px rgba(37,99,235,.35)', opacity: collapsed ? 0 : 1, transition: 'opacity .2s', pointerEvents: 'none' }}>TJ</div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', opacity: collapsed ? 0 : 1, transition: 'opacity .15s', marginLeft: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', lineHeight: 1.15, whiteSpace: 'nowrap' }}>TradeJournal</div>
            <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap' }}>Track. Analyse. Improve.</div>
          </div>
          <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 7, color: '#64748b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s, color .15s', position: collapsed ? 'absolute' : 'relative', left: collapsed ? '50%' : 'auto', transform: collapsed ? 'translateX(-50%)' : 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          ><HamburgerIcon /></button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} title={collapsed ? label : ''} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '9px 0' : '8px 11px',
              borderRadius: 8, marginBottom: 3,
              textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
              color: isActive ? '#2563eb' : '#64748b',
              background: isActive ? '#eff6ff' : 'transparent',
              borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all .15s ease', whiteSpace: 'nowrap', overflow: 'hidden',
            })}>
              <span style={{ width: 17, height: 17, flexShrink: 0, display: 'flex' }}>{icon}</span>
              {!collapsed && <span style={{ opacity: collapsed ? 0 : 1, transition: 'opacity .15s' }}>{label}</span>}
            </NavLink>
          ))}

          <div onClick={async () => { await logout(); navigate('/login'); }} title={collapsed ? 'Logout' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : '8px 11px', borderRadius: 8, marginTop: 14, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#64748b', borderLeft: '3px solid transparent', transition: 'all .15s', whiteSpace: 'nowrap', overflow: 'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <span style={{ width: 17, height: 17, flexShrink: 0, display: 'flex' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            {!collapsed && 'Logout'}
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9, justifyContent: collapsed ? 'center' : 'flex-start', padding: '7px 8px', borderRadius: 8 }} title={collapsed ? (user?.fullName || '') : ''}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initials}</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{user?.fullName}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{user?.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════
          MOBILE TOP BAR — shown only on mobile via CSS class
          (position:fixed, out of flex flow)
          ════════════════════════════════════════════════════════ */}
      <div className="sb-mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#2563eb,#16a34a)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>TJ</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>TradeJournal</span>
        </div>
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7, color: '#64748b', display: 'flex' }} aria-label="Open menu">
          <HamburgerIcon />
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          MOBILE DRAWER — slide-in, position:fixed
          ════════════════════════════════════════════════════════ */}
      {/* Overlay */}
      <div
        className="sb-mobile-overlay"
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? 'auto' : 'none' }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer */}
      <aside className="sb-mobile-drawer" style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        {/* Header */}
        <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9', minHeight: 60, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg,#2563eb,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, boxShadow: '0 2px 8px rgba(37,99,235,.35)' }}>TJ</div>
          <div style={{ flex: 1, marginLeft: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', lineHeight: 1.15 }}>TradeJournal</div>
            <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 1 }}>Track. Analyse. Improve.</div>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7, color: '#64748b', display: 'flex' }} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navLinks}
        </nav>

        {/* User */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          {userBlock}
        </div>
      </aside>
    </>
  );
}
