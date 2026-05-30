import React from 'react';
import Sidebar from '../components/Sidebar';

export default function IdeasPage() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <h1 className="page-title">Ideas</h1>
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Ideas Coming Soon</div>
          <div style={{ fontSize: 13.5 }}>Use this space to capture trade ideas, setups, and market observations.</div>
        </div>
      </main>
    </div>
  );
}
