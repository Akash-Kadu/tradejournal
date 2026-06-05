import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Toast   from '../components/Toast';
import api     from '../services/api';

/* ── Predefined tags ─────────────────────────────────────────── */
const ALL_TAGS = [
  'strategy','reminder','gold','nq','sessions',
  'london','new york','asian','account','to do',
  'experiment','motivation','backtesting'
];

const TAG_COLORS = {
  strategy:    '#dbeafe,#2563eb', reminder:    '#fef9c3,#ca8a04',
  gold:        '#fef3c7,#d97706', nq:          '#ede9fe,#7c3aed',
  sessions:    '#dcfce7,#16a34a', london:      '#e0f2fe,#0284c7',
  'new york':  '#fce7f3,#db2777', asian:       '#fdf4ff,#a21caf',
  account:     '#f1f5f9,#475569', 'to do':     '#fff7ed,#ea580c',
  experiment:  '#ecfdf5,#059669', motivation:  '#fdf2f8,#c026d3',
  backtesting: '#eff6ff,#3b82f6',
};

const tagStyle = tag => {
  const [bg, color] = (TAG_COLORS[tag] || '#f1f5f9,#475569').split(',');
  return { background: bg, color, border: `1px solid ${color}33`, fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', display: 'inline-block' };
};

/* ── Local date format helper ────────────────────────────────── */
const fmtLocal = d => d instanceof Date
  ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  : d;

const today = new Date();

/* ── Inject styles ───────────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById('ip-styles')) return;
  const s = document.createElement('style');
  s.id = 'ip-styles';
  s.textContent = `
    /* ── Card grid ── */
    .ip-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
    @media (max-width: 1100px) { .ip-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 680px)  { .ip-grid { grid-template-columns: 1fr; } }

    /* ── Idea card ── */
    .ip-card {
      background: #fff;
      border: 1.5px solid #b6c8d9;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 300px;
      position: relative;
      cursor: pointer;
      transition: box-shadow .2s, transform .2s;
    }
    .ip-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.14); transform: translateY(-2px); border-color: #7aa8c4; }

    /* Card sections proportioned by height */
    .ip-card-head  { height: 10%; min-height: 28px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; }
    .ip-card-img   { height: 40%; background: #f8fafc; flex-shrink: 0; overflow: hidden; position: relative; }
    .ip-card-body  { height: 40%; padding: 8px 12px; overflow: hidden; flex-shrink: 0; }
    .ip-card-tags  { height: 10%; min-height: 26px; padding: 0 12px; display: flex; align-items: center; gap: 5px; overflow: hidden; border-top: 1px solid #f1f5f9; flex-shrink: 0; flex-wrap: nowrap; }

    .ip-card-title {
      font-size: 13px; font-weight: 700; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1; min-width: 0;
    }
    .ip-card-date  { font-size: 10.5px; color: #94a3b8; white-space: nowrap; margin-left: 8px; font-family: monospace; }
    .ip-card-desc  { font-size: 12px; color: #475569; line-height: 1.55; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; white-space: pre-wrap; }

    /* floating edit/delete buttons */
    .ip-card-actions {
      position: absolute; top: 8px; right: 8px;
      display: flex; gap: 5px;
      opacity: 0; transition: opacity .15s;
      z-index: 5;
    }
    .ip-card:hover .ip-card-actions { opacity: 1; }
    .ip-fab {
      width: 28px; height: 28px; border-radius: 50%;
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.18);
      transition: transform .15s;
    }
    .ip-fab:hover { transform: scale(1.12); }
    .ip-fab-edit   { background: #2563eb; color: #fff; }
    .ip-fab-delete { background: #dc2626; color: #fff; }

    /* multi-image strip */
    .ip-img-strip { display: flex; height: 100%; }
    .ip-img-strip img { flex: 1; object-fit: cover; min-width: 0; border-right: 1px solid #e2e8f0; }
    .ip-img-strip img:last-child { border-right: none; }
    .ip-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }

    /* ── Filter bar ── */
    .ip-filter-bar {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .ip-search {
      flex: 1; min-width: 180px; max-width: 280px;
      padding: 7px 12px 7px 34px; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 13px; font-family: inherit;
      outline: none; background: #fff; color: #0f172a;
      transition: border-color .2s;
    }
    .ip-search:focus { border-color: #2563eb; }
    .ip-search-wrap { position: relative; }
    .ip-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

    .ip-tag-filter-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 13px; border: 1px solid #e2e8f0;
      border-radius: 8px; background: #fff; font-size: 13px;
      font-weight: 600; color: #374151; cursor: pointer;
      transition: border-color .15s, background .15s; position: relative;
    }
    .ip-tag-filter-btn.active { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .ip-tag-filter-badge { min-width: 16px; height: 16px; border-radius: 99px; background: #2563eb; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

    .ip-tag-panel {
      position: absolute; top: calc(100% + 6px); left: 0;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
      box-shadow: 0 8px 28px rgba(0,0,0,.12); z-index: 100;
      padding: 14px; min-width: 300px;
      animation: ipFade .18s ease;
    }
    @keyframes ipFade { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }

    .ip-tag-chip {
      display: inline-flex; align-items: center;
      padding: 4px 11px; border-radius: 99px; font-size: 12px; font-weight: 500;
      border: 1.5px solid #e2e8f0; background: #f8fafc; color: #374151;
      cursor: pointer; transition: all .15s; margin: 3px;
    }
    .ip-tag-chip.sel { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: 700; }

    /* ── Modal ── */
    .ip-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; padding: 20px;
    }
    .ip-modal {
      background: #fff; border-radius: 16px;
      width: 100%; max-width: 640px; max-height: 90vh;
      overflow-y: auto; padding: 28px;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
      animation: ipFade .2s ease;
    }
    .ip-modal h3 { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
    .ip-form-group { margin-bottom: 16px; }
    .ip-form-group label { display: block; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
    .ip-input, .ip-textarea {
      width: 100%; padding: 9px 13px; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 13.5px; font-family: inherit;
      outline: none; color: #0f172a; background: #fff;
      transition: border-color .2s;
    }
    .ip-input:focus, .ip-textarea:focus { border-color: #2563eb; }
    .ip-textarea { resize: vertical; min-height: 100px; }

    /* image upload zone */
    .ip-img-zone {
      border: 2px dashed #e2e8f0; border-radius: 10px;
      padding: 16px; text-align: center; cursor: pointer;
      transition: border-color .2s, background .2s; background: #fafafa;
    }
    .ip-img-zone:hover { border-color: #2563eb; background: #f0f6ff; }
    .ip-img-previews { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .ip-img-preview { position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .ip-img-preview img { width: 100%; height: 100%; object-fit: cover; }
    .ip-img-preview-del {
      position: absolute; top: 2px; right: 2px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #dc2626; color: #fff; border: none;
      cursor: pointer; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    /* tags selector in form */
    .ip-form-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .ip-form-tag {
      padding: 4px 12px; border-radius: 99px; font-size: 12px;
      border: 1.5px solid #e2e8f0; background: #f8fafc; color: #374151;
      cursor: pointer; font-weight: 500; transition: all .15s;
    }
    .ip-form-tag.sel { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: 700; }

    /* ── Expand modal ── */
    .ip-expand-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 300; padding: 20px;
    }
    .ip-expand {
      background: #fff; border-radius: 16px;
      width: 100%; max-width: 760px; max-height: 92vh;
      overflow-y: auto; padding: 30px;
      box-shadow: 0 24px 70px rgba(0,0,0,.25);
      animation: ipFade .2s ease;
    }
    .ip-expand-imgs { display: flex; gap: 8px; margin: 14px 0; flex-wrap: wrap; }
    .ip-expand-imgs img { height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; flex: 1; min-width: 140px; max-width: 100%; }
    .ip-expand-desc { font-size: 14px; color: #374151; line-height: 1.75; white-space: pre-wrap; margin: 14px 0; }
    .ip-expand-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .ip-close-btn {
      float: right; background: #f1f5f9; border: none; border-radius: 8px;
      padding: 6px 14px; font-size: 12.5px; font-weight: 600;
      color: #64748b; cursor: pointer; transition: background .15s;
    }
    .ip-close-btn:hover { background: #e2e8f0; }

    .ip-empty { text-align: center; padding: 60px 20px; color: #94a3b8; font-size: 14px; }
    .ip-empty svg { margin-bottom: 12px; opacity: .4; }
  `;
  document.head.appendChild(s);
};

/* ══════════════════════════════════════════════════════════════ */
export default function IdeasPage() {
  const [ideas,      setIdeas]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState(null);

  // filter state
  const [search,     setSearch]     = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [dateOpen,     setDateOpen]     = useState(false);
  const dateRef = useRef();
  const tagPanelRef = useRef();

  // modal state
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [expandIdea, setExpandIdea] = useState(null);

  // form state
  const [fTitle,    setFTitle]    = useState('');
  const [fDesc,     setFDesc]     = useState('');
  const [fDate,     setFDate]     = useState(fmtLocal(today));
  const [fTags,     setFTags]     = useState([]);
  const [fImages,   setFImages]   = useState([]); // array of base64 strings
  const [saving,    setSaving]    = useState(false);

  const fileInputRef = useRef();

  useEffect(() => { injectStyles(); }, []);

  // close tag panel on outside click
  useEffect(() => {
    const h = e => { if (tagPanelRef.current && !tagPanelRef.current.contains(e.target)) setTagPanelOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // close date panel on outside click
  useEffect(() => {
    const h = e => { if (dateRef.current && !dateRef.current.contains(e.target)) setDateOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchIdeas = useCallback(async () => {
    try {
      const params = {};
      if (startDate && endDate) { params.startDate = startDate; params.endDate = endDate; }
      const r = await api.get('/ideas', { params });
      setIdeas(r.data.data || []);
    } catch (err) { showToast('Failed to load ideas', 'error'); }
  }, [startDate, endDate]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  // ── Image handling ──────────────────────────────────────────
  const handleImagePick = e => {
    const files = Array.from(e.target.files);
    if (fImages.length + files.length > 4) { showToast('Maximum 4 images allowed', 'error'); return; }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setFImages(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = idx => setFImages(prev => prev.filter((_, i) => i !== idx));

  // ── Open add/edit modal ─────────────────────────────────────
  const openAdd = () => {
    setEditing(null); setFTitle(''); setFDesc('');
    setFDate(fmtLocal(today)); setFTags([]); setFImages([]);
    setModal(true);
  };

  const openEdit = (e, idea) => {
    e.stopPropagation();
    setEditing(idea.id);
    setFTitle(idea.title);
    setFDesc(idea.description || '');
    setFDate(idea.ideaDate);
    setFTags(idea.tags || []);
    setFImages(idea.images || []);
    setModal(true);
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!fTitle.trim()) { showToast('Title is required', 'error'); return; }
    if (!fDate)         { showToast('Date is required', 'error'); return; }
    setSaving(true);
    try {
      const body = { title: fTitle, description: fDesc, ideaDate: fDate, tags: fTags, images: fImages };
      if (editing) await api.put(`/ideas/${editing}`, body);
      else         await api.post('/ideas', body);
      showToast(editing ? 'Idea updated!' : 'Idea saved!');
      setModal(false); fetchIdeas();
    } catch (err) { showToast(err.response?.data?.message || 'Error saving idea', 'error'); }
    finally { setSaving(false); }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this idea?')) return;
    try {
      await api.delete(`/ideas/${id}`);
      showToast('Idea deleted!'); fetchIdeas();
    } catch (err) { showToast('Error deleting idea', 'error'); }
  };

  // ── Tag toggle helpers ──────────────────────────────────────
  const toggleFormTag   = tag => setFTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  const toggleFilterTag = tag => setFilterTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);

  // ── Client-side filtering ───────────────────────────────────
  const displayed = ideas.filter(idea => {
    if (search && !idea.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTags.length > 0 && !filterTags.every(t => (idea.tags || []).includes(t))) return false;
    return true;
  });

  const activeFilterCount = filterTags.length + (startDate && endDate ? 1 : 0);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:20, gap:12, flexWrap:'wrap' }}>
          <h1 className="page-title" style={{ margin:0 }}>Ideas</h1>
          <div style={{ flex:1 }}/>
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Idea
          </button>
        </div>

        {/* ── Filter bar ── */}
        <div className="ip-filter-bar">

          {/* Title search */}
          <div className="ip-search-wrap">
            <span className="ip-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input className="ip-search" placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          {/* Date range with quick ranges */}
          <div style={{ position:'relative' }} ref={dateRef}>
            <div onClick={() => setDateOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12.5, color:'#374151', fontWeight:500, minWidth:180 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{startDate && endDate ? `${startDate.slice(5).replace('-','/')} – ${endDate.slice(5).replace('-','/')}` : startDate ? startDate : 'All dates'}</span>
              {(startDate || endDate) && <span onClick={e => { e.stopPropagation(); setStartDate(''); setEndDate(''); }} style={{ marginLeft:4, color:'#94a3b8', fontWeight:700, fontSize:14 }}>×</span>}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            {dateOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, boxShadow:'0 8px 28px rgba(0,0,0,.12)', zIndex:100, padding:14, minWidth:300, animation:'ipFade .18s ease' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Quick Range</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {[
                    { label:'Today',        fn:() => { const d=fmtLocal(new Date()); setStartDate(d); setEndDate(d); }},
                    { label:'This Week',    fn:() => { const n=new Date(); const mon=new Date(n); mon.setDate(n.getDate()-(n.getDay()===0?6:n.getDay()-1)); setStartDate(fmtLocal(mon)); setEndDate(fmtLocal(n)); }},
                    { label:'This Month',   fn:() => { const n=new Date(); setStartDate(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`); setEndDate(fmtLocal(n)); }},
                    { label:'Last 30 Days', fn:() => { const n=new Date(); const s=new Date(); s.setDate(n.getDate()-30); setStartDate(fmtLocal(s)); setEndDate(fmtLocal(n)); }},
                    { label:'Last 3 Months',fn:() => { const n=new Date(); const s=new Date(); s.setMonth(n.getMonth()-3); setStartDate(fmtLocal(s)); setEndDate(fmtLocal(n)); }},
                    { label:'This Year',    fn:() => { const n=new Date(); setStartDate(`${n.getFullYear()}-01-01`); setEndDate(fmtLocal(n)); }},
                    { label:'All Time',     fn:() => { setStartDate(''); setEndDate(''); }},
                  ].map(q => (
                    <span key={q.label} onClick={() => { q.fn(); setDateOpen(false); }} style={{ padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:600, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#374151', cursor:'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.color='#2563eb'; e.currentTarget.style.background='#eff6ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#374151'; e.currentTarget.style.background='#f8fafc'; }}>
                      {q.label}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Custom Range</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ flex:1, padding:'6px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12.5, fontFamily:'inherit', outline:'none' }}/>
                  <span style={{ color:'#94a3b8', fontSize:13 }}>–</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ flex:1, padding:'6px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12.5, fontFamily:'inherit', outline:'none' }}/>
                </div>
              </div>
            )}
          </div>

          {/* Tag filter */}
          <div style={{ position:'relative' }} ref={tagPanelRef}>
            <button className={`ip-tag-filter-btn${filterTags.length > 0 ? ' active' : ''}`} onClick={() => setTagPanelOpen(o => !o)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Tags
              {filterTags.length > 0 && <span className="ip-tag-filter-badge">{filterTags.length}</span>}
            </button>
            {tagPanelOpen && (
              <div className="ip-tag-panel">
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Filter by tag</div>
                <div>
                  {ALL_TAGS.map(tag => (
                    <span key={tag} className={`ip-tag-chip${filterTags.includes(tag) ? ' sel' : ''}`} onClick={() => toggleFilterTag(tag)}>
                      {tag}
                    </span>
                  ))}
                </div>
                {filterTags.length > 0 && (
                  <div style={{ marginTop:10, textAlign:'right' }}>
                    <span onClick={() => setFilterTags([])} style={{ fontSize:12, color:'#64748b', cursor:'pointer', fontWeight:600 }}>Clear</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {filterTags.map(tag => (
            <span key={tag} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:12, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#2563eb', fontWeight:500 }}>
              {tag}
              <span style={{ cursor:'pointer', fontWeight:700, fontSize:13 }} onClick={() => toggleFilterTag(tag)}>×</span>
            </span>
          ))}

          <span style={{ fontSize:12, color:'#94a3b8', marginLeft:'auto' }}>
            {displayed.length} idea{displayed.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Cards grid ── */}
        {displayed.length === 0 ? (
          <div className="ip-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6-.3.2-.5.5-.6.8L14 18H10l-.1-2.2c-.1-.3-.3-.6-.6-.8C7.3 13.7 6 11.5 6 9a7 7 0 0 1 6-7z"/><line x1="10" y1="22" x2="14" y2="22"/><line x1="10" y1="19" x2="14" y2="19"/></svg>
            <div>No ideas yet. Click <strong>Add Idea</strong> to get started.</div>
          </div>
        ) : (
          <div className="ip-grid">
            {displayed.map(idea => (
              <div key={idea.id} className="ip-card" onClick={() => setExpandIdea(idea)}>

                {/* Floating edit / delete buttons */}
                <div className="ip-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="ip-fab ip-fab-edit" onClick={e => openEdit(e, idea)} title="Edit">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="ip-fab ip-fab-delete" onClick={e => handleDelete(e, idea.id)} title="Delete">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>

                {/* 10% — heading */}
                <div className="ip-card-head">
                  <div className="ip-card-title">{idea.title}</div>
                  <div className="ip-card-date">{idea.ideaDate}</div>
                </div>

                {/* 40% — image */}
                <div className="ip-card-img">
                  {idea.images && idea.images.length > 0 ? (
                    <div className="ip-img-strip">
                      {idea.images.slice(0, 4).map((img, i) => (
                        <img key={i} src={img} alt={`img-${i}`}/>
                      ))}
                    </div>
                  ) : (
                    <div className="ip-img-placeholder">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  )}
                </div>

                {/* 40% — text */}
                <div className="ip-card-body">
                  <p className="ip-card-desc">{idea.description || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>No description</span>}</p>
                </div>

                {/* 10% — tags */}
                <div className="ip-card-tags">
                  {(idea.tags || []).length === 0
                    ? <span style={{ fontSize:11, color:'#cbd5e1', fontStyle:'italic' }}>no tags</span>
                    : (idea.tags || []).map(tag => <span key={tag} style={tagStyle(tag)}>{tag}</span>)
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ ADD / EDIT MODAL ══ */}
        {modal && (
          <div className="ip-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
            <div className="ip-modal">
              <h3>{editing ? 'Edit Idea' : 'New Idea'}</h3>

              {/* Title */}
              <div className="ip-form-group">
                <label>Title *</label>
                <input className="ip-input" placeholder="Give your idea a title…" value={fTitle} onChange={e => setFTitle(e.target.value)}/>
              </div>

              {/* Date */}
              <div className="ip-form-group">
                <label>Date *</label>
                <input type="date" className="ip-input" value={fDate} onChange={e => setFDate(e.target.value)}/>
              </div>

              {/* Description */}
              <div className="ip-form-group">
                <label>Description</label>
                <textarea className="ip-textarea" placeholder="Write your idea, notes, observations…" value={fDesc} onChange={e => setFDesc(e.target.value)} rows={5}/>
              </div>

              {/* Images */}
              <div className="ip-form-group">
                <label>Images (up to 4, optional)</label>
                <div className="ip-img-zone" onClick={() => fileInputRef.current.click()}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ display:'block', margin:'0 auto 6px' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <div style={{ fontSize:12.5, color:'#94a3b8' }}>Click to upload images · {fImages.length}/4 added</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleImagePick}/>
                {fImages.length > 0 && (
                  <div className="ip-img-previews">
                    {fImages.map((img, i) => (
                      <div key={i} className="ip-img-preview">
                        <img src={img} alt={`preview-${i}`}/>
                        <button className="ip-img-preview-del" onClick={() => removeImage(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="ip-form-group">
                <label>Tags (select one or more)</label>
                <div className="ip-form-tags">
                  {ALL_TAGS.map(tag => (
                    <span key={tag} className={`ip-form-tag${fTags.includes(tag) ? ' sel' : ''}`} onClick={() => toggleFormTag(tag)}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:6 }}>
                <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Idea'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ EXPAND / VIEW MODAL ══ */}
        {expandIdea && (
          <div className="ip-expand-overlay" onClick={e => e.target === e.currentTarget && setExpandIdea(null)}>
            <div className="ip-expand">
              <button className="ip-close-btn" onClick={() => setExpandIdea(null)}>Close ×</button>
              <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginBottom:4 }}>{expandIdea.ideaDate} · saved {expandIdea.createdAt?.slice(0,16).replace('T',' ')}</div>
              <h2 style={{ fontSize:'1.3rem', fontWeight:800, color:'#0f172a', margin:'4px 0 0' }}>{expandIdea.title}</h2>

              {/* Images */}
              {expandIdea.images && expandIdea.images.length > 0 && (
                <div className="ip-expand-imgs">
                  {expandIdea.images.map((img, i) => <img key={i} src={img} alt={`img-${i}`}/>)}
                </div>
              )}

              {/* Description */}
              <p className="ip-expand-desc">{expandIdea.description || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>No description provided.</span>}</p>

              {/* Tags */}
              {expandIdea.tags && expandIdea.tags.length > 0 && (
                <div className="ip-expand-tags">
                  {expandIdea.tags.map(tag => <span key={tag} style={tagStyle(tag)}>{tag}</span>)}
                </div>
              )}

              {/* Edit/Delete from expand view */}
              <div style={{ display:'flex', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
                <button className="btn btn-outline" onClick={e => { setExpandIdea(null); openEdit(e, expandIdea); }}>Edit</button>
                <button className="btn" style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}
                  onClick={async e => { await handleDelete(e, expandIdea.id); setExpandIdea(null); }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
      </main>
    </div>
  );
}
