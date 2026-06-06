import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [regData, setRegData] = useState({ fullName:'', email:'', password:'', confirmPassword:'' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    if (!agreed) { setError('Please agree to Terms of Service'); return; }
    setLoading(true);
    try {
      await register(regData.fullName, regData.email, regData.password, regData.confirmPassword);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

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
            <polyline points="0,70 30,55 60,62 90,40 120,45 150,25 180,30 210,15 250,8" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="0,70 30,55 60,62 90,40 120,45 150,25 180,30 210,15 250,8 250,80 0,80" fill="url(#grad2)" opacity=".18"/>
            <defs><linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
          </svg>
        </div>

        {[
          { icon:'🚀', title:'Start Free Today', desc:'No credit card required. Set up in under 2 minutes.' },
          { icon:'📊', title:'Powerful Dashboard', desc:'Get a complete overview of your trading performance.' },
          { icon:'📈', title:'Advanced Analytics', desc:'Analyze your trades and identify what works best.' },
          { icon:'🎯', title:'Track Strategies', desc:'Monitor and evaluate your strategies across sessions.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{ display:'flex', gap:12, marginBottom:18 }}>
            <div style={{ width:36, height:36, background:'#f0fdf4', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
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

          {/* Logo for mobile */}
          <div className="login-mobile-logo" style={{ display:'none', alignItems:'center', gap:10, justifyContent:'center', marginBottom:28 }}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#2563eb,#16a34a)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16 }}>TJ</div>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>TradeJournal</div>
              <div style={{ fontSize:11, color:'#64748b' }}>Track. Analyze. Improve.</div>
            </div>
          </div>

          <h1 style={{ textAlign:'center', fontSize:26, fontWeight:700, marginBottom:6 }}>Create Account</h1>
          <p style={{ textAlign:'center', color:'#64748b', marginBottom:28, fontSize:14 }}>Join TradeJournal and start tracking your trades</p>

          <div style={{ background:'#fff', borderRadius:14, padding:28, border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, color:'#16a34a', fontWeight:600 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Register
            </div>

            {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'8px 12px', borderRadius:8, fontSize:13, marginBottom:14 }}>{error}</div>}

            <form onSubmit={handleRegister}>
              {[
                { label:'Full Name',        key:'fullName',        type:'text',     placeholder:'Enter your full name' },
                { label:'Email',            key:'email',           type:'email',    placeholder:'Enter your email' },
                { label:'Password',         key:'password',        type:'password', placeholder:'Create a password (min 6 chars)' },
                { label:'Confirm Password', key:'confirmPassword', type:'password', placeholder:'Confirm your password' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom:13 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:5 }}>{label}</label>
                  <input
                    type={type}
                    required
                    placeholder={placeholder}
                    value={regData[key]}
                    onChange={e => setRegData({...regData, [key]:e.target.value})}
                    style={{ width:'100%', padding:'8px 11px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none' }}
                  />
                </div>
              ))}

              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#475569', cursor:'pointer', marginBottom:18, marginTop:4 }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}/>
                I agree to the <span style={{ color:'#2563eb' }}>Terms of Service</span> and <span style={{ color:'#2563eb' }}>Privacy Policy</span>
              </label>

              <button type="submit" disabled={loading} style={{ width:'100%', padding:'10px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                {loading ? 'Registering…' : '+ Create Account'}
              </button>

              <div style={{ textAlign:'center', color:'#94a3b8', margin:'14px 0', fontSize:12 }}>or</div>

              <button type="button" style={{ width:'100%', padding:'9px', background:'#fff', color:'#374151', border:'1px solid #e2e8f0', borderRadius:8, fontWeight:600, fontSize:13.5, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C41.1 35.1 44 29.9 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Continue with Google
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', fontSize:13, color:'#64748b', marginTop:20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
