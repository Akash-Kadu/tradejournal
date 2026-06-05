import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Toast   from '../components/Toast';
import api     from '../services/api';

const STATUS_OPTIONS = ['FUNDED','PHASE_1','PHASE_2','BREACHED'];
const statusLabel = s => ({ FUNDED:'Funded', PHASE_1:'Phase 1', PHASE_2:'Phase 2', BREACHED:'Breached' }[s] || s);
const statusClass = s => ({ FUNDED:'badge-funded', PHASE_1:'badge-phase1', PHASE_2:'badge-phase2', BREACHED:'badge-breached' }[s] || '');

const emptyForm = { propFirm:'', accountId:'', accountStatus:'FUNDED', accountSize:'', currentBalance:'' };

export default function AccountsPage() {
  const [accounts, setAccounts]   = useState([]);
  const [toast, setToast]         = useState(null);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [filterProp, setFilterProp]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading]     = useState(false);

  const fetchAccounts = useCallback(async () => {
    const params = {};
    if (filterProp)   params.propFirm = filterProp;
    if (filterStatus) params.status   = filterStatus;
    const r = await api.get('/accounts', { params });
    setAccounts(r.data.data || []);
  }, [filterProp, filterStatus]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const showToast = (message, type='success') => setToast({ message, type });

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = a => {
    setEditing(a.srNo);
    setForm({ propFirm:a.propFirm, accountId:a.accountId, accountStatus:a.accountStatus, accountSize:a.accountSize, currentBalance:a.currentBalance });
    setModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { ...form, accountId: Number(form.accountId), accountSize: Number(form.accountSize), currentBalance: Number(form.currentBalance) };
      if (editing) await api.put(`/accounts/${editing}`, body);
      else         await api.post('/accounts', body);
      showToast(editing ? 'Account updated!' : 'Account added!');
      setModal(false);
      fetchAccounts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving account', 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async srNo => {
    if (!window.confirm('Delete this account? This cannot be undone.')) return;
    try {
      await api.delete(`/accounts/${srNo}`);
      showToast('Account deleted!');
      fetchAccounts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting account', 'error');
    }
  };

  const clearFilter = () => { setFilterProp(''); setFilterStatus(''); };

  const fmt = (v, prefix='$') => v == null ? '—' : `${prefix}${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits:0, maximumFractionDigits:2 })}`;
  const sign = v => v > 0 ? '+' : v < 0 ? '-' : '';
  const cls  = v => v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <h1 className="page-title">Accounts</h1>

        {/* toolbar */}
        <div className="toolbar">
          <input className="search-input" placeholder="Search by prop firm…" value={filterProp} onChange={e => setFilterProp(e.target.value)} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:'8px 11px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13.5, fontFamily:'inherit', outline:'none' }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={clearFilter}>Clear</button>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openAdd}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Account
            </button>
          </div>
        </div>

        {/* table */}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sr No</th><th>Prop Firm</th><th>Account ID</th><th>Account Status</th>
                  <th>Account Size ($)</th><th>Current Balance ($)</th><th>Change $</th><th>Change %</th><th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign:'center', color:'#94a3b8', padding:'32px' }}>No accounts found. Add your first account!</td></tr>
                )}
                {accounts.map((a, i) => (
                  <tr key={a.srNo}>
                    <td style={{ color:'#64748b' }}>{i + 1}</td>
                    <td style={{ fontWeight:600 }}>{a.propFirm}</td>
                    <td style={{ fontFamily:'DM Mono, monospace', fontSize:13 }}>{a.accountId}</td>
                    <td><span className={`badge ${statusClass(a.accountStatus)}`}>{statusLabel(a.accountStatus)}</span></td>
                    <td>${a.accountSize?.toLocaleString()}</td>
                    <td className={cls(a.changeDollar)}>${a.currentBalance?.toLocaleString()}</td>
                    <td className={cls(a.changeDollar)}>{sign(a.changeDollar)}{fmt(a.changeDollar)}</td>
                    <td className={cls(a.changePercent)}>{sign(a.changePercent)}{Math.abs(a.changePercent ?? 0).toFixed(2)}%</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="icon-btn" onClick={() => openEdit(a)} title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="icon-btn del" onClick={() => handleDelete(a.srNo)} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* modal */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
            <div className="modal">
              <h3>{editing ? 'Edit Account' : 'Add Account'}</h3>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Prop Firm</label>
                    <input required placeholder="e.g. FTMO" value={form.propFirm} onChange={e => setForm({...form, propFirm:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label>Account ID</label>
                    <input required type="number" placeholder="e.g. 564982" value={form.accountId} onChange={e => setForm({...form, accountId:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label>Account Status</label>
                    <select value={form.accountStatus} onChange={e => setForm({...form, accountStatus:e.target.value})}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Account Size ($)</label>
                    <input required type="number" step="0.01" placeholder="e.g. 25000" value={form.accountSize} onChange={e => setForm({...form, accountSize:e.target.value})}/>
                  </div>
                  <div className="form-group full">
                    <label>Current Balance ($)</label>
                    <input required type="number" step="0.01" placeholder="e.g. 28750" value={form.currentBalance} onChange={e => setForm({...form, currentBalance:e.target.value})}/>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
      </main>
    </div>
  );
}
