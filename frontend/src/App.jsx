import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage  from './pages/AccountsPage';
import StrategyPage  from './pages/StrategyPage';
import TradesPage    from './pages/TradesPage';
import IdeasPage     from './pages/IdeasPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:14,color:'#64748b'}}>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/accounts"  element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
          <Route path="/strategy"  element={<ProtectedRoute><StrategyPage /></ProtectedRoute>} />
          <Route path="/trades"    element={<ProtectedRoute><TradesPage /></ProtectedRoute>} />
          <Route path="/ideas"     element={<ProtectedRoute><IdeasPage /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
