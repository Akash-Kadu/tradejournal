import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const googleError = new URLSearchParams(location.search).get('error');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const eyeIcon = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {showPwd
        ? <><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>

      {/* ── Left panel ── */}
      <div className="login-left-panel" style={{ width:340, background:'#fff', padding:'48px 36px', display:'flex', flexDirection:'column', borderRight:'1px solid #e2e8f0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
          <div style={{ width:40, height:40, background:'linear-gradient(135deg,#2563eb,#16a34a)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16 }}>TJ</div>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>TradeJournal</div>
            <div style={{ fontSize:11, color:'#64748b' }}>Track. Analyze. Improve.</div>
          </div>
        </div>

        <div style={{ background:'#f8fafc', borderRadius:12, padding:'16px', marginBottom:36, border:'1px solid #e2e8f0' }}>
          <svg width="100%" height="80" viewBox="0 0 260 80">
            <polyline points="0,70 30,55 60,62 90,40 120,45 150,25 180,30 210,15 250,8" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="0,70 30,55 60,62 90,40 120,45 150,25 180,30 210,15 250,8 250,80 0,80" fill="url(#grad)" opacity=".18"/>
            <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
          </svg>
        </div>

        {[
          { icon:'📊', title:'Powerful Dashboard', desc:'Get a complete overview of your trading performance.' },
          { icon:'📈', title:'Advanced Analytics', desc:'Analyze your trades and identify what works best.' },
          { icon:'🎯', title:'Track Strategies', desc:'Monitor and evaluate your strategies across sessions.' },
          { icon:'📅', title:'Organized Trades', desc:'Keep all your trades organized and easily accessible.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{ display:'flex', gap:12, marginBottom:18 }}>
            <div style={{ width:36, height:36, background:'#eff6ff', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>{title}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Logo for mobile (left panel is hidden) */}
          <div className="login-mobile-logo" style={{ display:'none', alignItems:'center', gap:10, justifyContent:'center', marginBottom:28 }}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#2563eb,#16a34a)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16 }}>TJ</div>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>TradeJournal</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Track. Analyze. Improve.</div>
            </div>
          </div>

          <h1 style={{ textAlign:'center', fontSize:26, fontWeight:700, marginBottom:6 }}>Welcome Back</h1>
          <p style={{ textAlign:'center', color:'#64748b', marginBottom:28, fontSize:14 }}>Log in to your TradeJournal account</p>

          <div style={{ background:'#fff', borderRadius:14, padding:28, border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, color:'#2563eb', fontWeight:600 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Login
            </div>

            {(error || googleError) && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'8px 12px', borderRadius:8, fontSize:13, marginBottom:14 }}>
              {error || (googleError === 'google_cancelled' ? 'Google sign-in was cancelled.' : 'Google sign-in failed. Please try again.')}
            </div>}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>Email</label>
                <div style={{ position:'relative' }}>
                  <svg style={{ position:'absolute', left:10, top:9, color:'#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" required placeholder="Enter your email" value={loginData.email} onChange={e => setLoginData({...loginData, email:e.target.value})} style={{ width:'100%', padding:'8px 10px 8px 32px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none' }}/>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <svg style={{ position:'absolute', left:10, top:9, color:'#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input type={showPwd ? 'text' : 'password'} required placeholder="Enter your password" value={loginData.password} onChange={e => setLoginData({...loginData, password:e.target.value})} style={{ width:'100%', padding:'8px 36px 8px 32px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none' }}/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position:'absolute', right:8, top:7, background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>{eyeIcon}</button>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, fontSize:13 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', color:'#475569' }}><input type="checkbox" /> Remember me</label>
                <span style={{ color:'#2563eb', cursor:'pointer', fontWeight:500 }}>Forgot Password?</span>
              </div>

              <button type="submit" disabled={loading} style={{ width:'100%', padding:'10px', background:'#2563eb', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                {loading ? 'Logging in…' : '→ Login'}
              </button>

              <div style={{ textAlign:'center', color:'#94a3b8', margin:'14px 0', fontSize:12 }}>or</div>

              <button type="button" onClick={googleLogin} style={{ width:'100%', padding:'9px', background:'#fff', color:'#374151', border:'1px solid #e2e8f0', borderRadius:8, fontWeight:600, fontSize:13.5, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C41.1 35.1 44 29.9 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Continue with Google
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', fontSize:13, color:'#64748b', marginTop:20 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
