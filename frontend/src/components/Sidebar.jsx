import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  accounts:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  strategy:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  trades:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg>,
  ideas:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6-.3.2-.5.5-.6.8L14 18H10l-.1-2.2c-.1-.3-.3-.6-.6-.8C7.3 13.7 6 11.5 6 9a7 7 0 0 1 6-7z"/><line x1="10" y1="22" x2="14" y2="22"/><line x1="10" y1="19" x2="14" y2="19"/></svg>,
  logout:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">TJ</div>
        <div className="sidebar-logo-text">
          <h2>TradeJournal</h2>
          <p>Track. Analyse. Improve.</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {[
          { to: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
          { to: '/accounts',  label: 'Accounts',  icon: icons.accounts },
          { to: '/strategy',  label: 'Strategy',  icon: icons.strategy },
          { to: '/trades',    label: 'Trades',    icon: icons.trades },
          { to: '/ideas',     label: 'Ideas',     icon: icons.ideas },
        ].map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {icon}{label}
          </NavLink>
        ))}

        <div
          className="nav-item"
          style={{ marginTop: 16, cursor: 'pointer' }}
          onClick={handleLogout}
        >
          {icons.logout} Logout
        </div>
      </nav>

      <div className="sidebar-bottom">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-info-text">
            <p>{user?.fullName}</p>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
