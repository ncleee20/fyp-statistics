import { useState, useEffect, useCallback, useMemo } from 'react'
import { C, MODELS, getColor, fmt, fmtMoney, makeDemo } from './lib/constants'
import { getUsers, saveUsers, getSession, saveSession, clearSession, getSheetUrl, saveSheetUrl, getExtraModels, saveExtraModels } from './lib/store'
import LoginScreen from './components/LoginScreen'
import UserManagement from './components/UserManagement'
import WeeklySummary from './components/WeeklySummary'
import ModelPage from './components/ModelPage'

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getSession())
  const [users, setUsersState]        = useState(() => getUsers())
  const [extraModels, setExtraModels] = useState(() => getExtraModels())
  const [allData, setAllData]         = useState({})
  const [isDemo, setIsDemo]           = useState(true)
  const [loading, setLoading]         = useState(false)
  const [fetchError, setFetchError]   = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [page, setPage]               = useState('dashboard')
  const [showConnect, setShowConnect] = useState(false)
  const [showAddModel, setShowAddModel] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [addModelErr, setAddModelErr]   = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [urlInput, setUrlInput]         = useState(() => getSheetUrl())

  const isAdmin     = currentUser?.role === 'admin'
  const models      = useMemo(() => [...MODELS, ...extraModels], [extraModels])
  const activeModel = page.startsWith('model:') ? page.replace('model:', '') : null

  // Current month key e.g. "May 2026"
  const now = new Date()
  const currentMonthKey = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`

  // On startup — load demo if no URL saved, otherwise auto-fetch saved URL
  useEffect(() => {
    const savedUrl = getSheetUrl()
    if (!savedUrl) {
      setAllData(makeDemo())
    } else {
      fetchSheet(savedUrl)
    }
  }, []) // eslint-disable-line

  const fetchSheet = useCallback(async (url) => {
    if (!url) return
    setLoading(true); setFetchError('')
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Could not fetch. Check the URL.')
      const text = await res.text()
      let parsed
      try { parsed = JSON.parse(text) } catch { throw new Error('Not valid JSON. Use the Apps Script Web App URL.') }
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Unexpected format.')
      setAllData(parsed)
      const newOnes = Object.keys(parsed).filter(m => !models.includes(m.toLowerCase())).map(m => m.toLowerCase())
      if (newOnes.length) { const u = [...extraModels, ...newOnes]; setExtraModels(u); saveExtraModels(u) }
      setIsDemo(false); setLastUpdated(new Date().toLocaleTimeString()); setShowConnect(false)
    } catch (e) { setFetchError(e.message) }
    setLoading(false)
  }, [models, extraModels])

  useEffect(() => {
    const url = getSheetUrl(); if (!url) return
    const iv = setInterval(() => fetchSheet(url), 60000)
    return () => clearInterval(iv)
  }, [fetchSheet])

  // Current month totals per model for dashboard list
  const modelStats = useMemo(() => {
    return models.map(model => {
      const reels = allData[model] || []
      const currentReels = reels.filter(r => {
        const s = String(r.date).trim(); const parts = s.split('-'); const d = parts.length===3 && parts[2].length===4 ? new Date(`${parts[2]}-${parts[0]}-${parts[1]}`) : new Date(s)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      return {
        model,
        views: currentReels.reduce((s,r) => {
          const latest = Number(r.views_day7)||Number(r.views_day6)||Number(r.views_day5)||
                         Number(r.views_day4)||Number(r.views_day3)||Number(r.views_day2)||
                         Number(r.views_day1)||0
          return s + latest
        }, 0),
        revenue: currentReels.reduce((s,r) => s+(Number(r.total_revenue)||0), 0),
        clicks:  currentReels.reduce((s,r) => s+(Number(r.total_clicks)||0), 0),
        subs:    currentReels.reduce((s,r) => s+(Number(r.total_subscription)||0), 0),
        follows: currentReels.reduce((s,r) => s+(Number(r.total_follows)||0), 0),
        reels:   currentReels.length,
      }
    })
  }, [allData, models])

  const handleConnect = () => { saveSheetUrl(urlInput); fetchSheet(urlInput) }
  const handleLogin   = (user) => { setCurrentUser(user); saveSession(user) }
  const handleLogout  = () => { clearSession(); setCurrentUser(null); setPage('dashboard'); setShowUserMenu(false) }
  const setUsers      = (u) => { setUsersState(u); saveUsers(u) }
  const addModel = () => {
    const name = newModelName.trim().toLowerCase()
    if (!name) return
    if (models.includes(name)) { setAddModelErr('Already exists.'); return }
    const u = [...extraModels, name]; setExtraModels(u); saveExtraModels(u)
    setNewModelName(''); setShowAddModel(false); setAddModelErr('')
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text }}>

      {/* NAV */}
      <nav style={{ background:C.bgCard, borderBottom:`1px solid ${C.border}`, padding:'0 28px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', height:54, flexWrap:'wrap' }}>
          <div className="serif" style={{ fontSize:15, letterSpacing:1, marginRight:28, paddingRight:28, borderRight:`1px solid ${C.border}`, height:'100%', display:'flex', alignItems:'center', flexShrink:0 }}>
            <span style={{ fontWeight:600 }}>FYP</span><span style={{ color:C.muted, fontWeight:300 }}> STATISTICS</span>
          </div>
          <button className={`nav-link ${page==='dashboard'?'active':''}`} style={{ marginRight:20 }} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button className={`nav-link ${page==='weekly'?'active':''}`} style={{ marginRight:20 }} onClick={() => setPage('weekly')}>Weekly</button>
          {isAdmin && <button className={`nav-link ${page==='users'?'active':''}`} style={{ marginRight:20 }} onClick={() => setPage('users')}>Users</button>}
          <div style={{ display:'flex', flexWrap:'wrap', gap:3, flex:1, padding:'4px 0 4px 8px', overflow:'hidden' }}>
            {models.map(m => (
              <button key={m} className={`model-dot ${activeModel===m?'active':''}`} onClick={() => setPage(`model:${m}`)}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:getColor(m), display:'inline-block', flexShrink:0 }} />{m}
              </button>
            ))}
            {isAdmin && <button className="model-dot" onClick={() => setShowAddModel(true)} style={{ border:`1px dashed ${C.border}`, color:C.muted }}>+ add</button>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto', flexShrink:0 }}>
            {isDemo && <span style={{ fontSize:10, color:'#b8a060', background:'#fdf6e3', border:'1px solid #e8d89a', padding:'3px 10px', borderRadius:20, letterSpacing:1, textTransform:'uppercase' }}>Demo</span>}
            {!isDemo && lastUpdated && <span style={{ fontSize:10, color:C.success }}>↻ {lastUpdated}</span>}
            {isAdmin && <button className="btn-outline" onClick={() => setShowConnect(s => !s)} style={{ padding:'6px 14px' }}>⚙ Connect Sheet</button>}
            <div style={{ position:'relative' }}>
              <button onClick={() => setShowUserMenu(s => !s)} style={{ display:'flex', alignItems:'center', gap:8, background:C.bgLight, border:`1px solid ${C.border}`, borderRadius:20, padding:'5px 12px 5px 8px', cursor:'pointer' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:C.text, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:600 }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize:11 }}>{currentUser.name}</span>
                <span className={currentUser.role==='admin'?'tag-admin':'tag-viewer'}>{currentUser.role}</span>
              </button>
              {showUserMenu && (
                <div className="card slide-up" style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:180, padding:8, zIndex:100, boxShadow:'0 8px 32px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding:'8px 12px', borderBottom:`1px solid ${C.border}`, marginBottom:6 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{currentUser.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>@{currentUser.username}</div>
                  </div>
                  {isAdmin && <button onClick={() => { setPage('users'); setShowUserMenu(false) }} style={{ display:'block', width:'100%', textAlign:'left', background:'none', border:'none', padding:'7px 12px', fontSize:12, color:C.text, borderRadius:4, cursor:'pointer' }}>👥 Manage Users</button>}
                  <button onClick={handleLogout} style={{ display:'block', width:'100%', textAlign:'left', background:'none', border:'none', padding:'7px 12px', fontSize:12, color:C.danger, borderRadius:4, cursor:'pointer' }}>→ Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showUserMenu && <div style={{ position:'fixed', inset:0, zIndex:49 }} onClick={() => setShowUserMenu(false)} />}

      {/* CONNECT PANEL */}
      {showConnect && isAdmin && (
        <div style={{ background:C.bgLight, borderBottom:`1px solid ${C.border}`, padding:'18px 28px' }} className="fade-in">
          <div style={{ maxWidth:780 }}>
            <div style={{ fontSize:11, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Connect Google Sheet via Apps Script</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.9 }}>
              Paste your <b style={{ color:C.text }}>Apps Script Web App URL</b>. Reads all <b style={{ color:C.text }}>FYP STATISTICS-[MODEL]</b> tabs automatically.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <input className="input-field" placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput} onChange={e => setUrlInput(e.target.value)} style={{ flex:1 }} />
              <button className="btn-primary" onClick={handleConnect} disabled={loading}>{loading ? 'Connecting…' : 'Connect →'}</button>
              <button className="btn-outline" onClick={() => setShowConnect(false)}>✕</button>
            </div>
            {fetchError && <div style={{ color:C.danger, fontSize:12, marginTop:8 }}>⚠ {fetchError}</div>}
            <div style={{ fontSize:11, color:C.muted, marginTop:10 }}>Auto-refreshes every 60 seconds.</div>
          </div>
        </div>
      )}

      {/* ADD MODEL MODAL */}
      {showAddModel && isAdmin && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowAddModel(false)}>
          <div className="card slide-up" style={{ padding:32, width:360 }} onClick={e => e.stopPropagation()}>
            <div className="serif" style={{ fontSize:22, marginBottom:6 }}>Add Model</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Must match the tab name suffix e.g. for <b>FYP STATISTICS-ELLIE</b> enter <b>ellie</b></div>
            <input className="input-field" placeholder="e.g. ellie" value={newModelName}
              onChange={e => { setNewModelName(e.target.value); setAddModelErr('') }}
              onKeyDown={e => e.key==='Enter' && addModel()} autoFocus style={{ marginBottom:10 }} />
            {addModelErr && <div style={{ color:C.danger, fontSize:12, marginBottom:10 }}>{addModelErr}</div>}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button className="btn-primary" onClick={addModel} style={{ flex:1 }}>Add Model</button>
              <button className="btn-outline" onClick={() => { setShowAddModel(false); setAddModelErr('') }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main style={{ padding:'32px 28px 60px', maxWidth:1400, margin:'0 auto' }}>

        {activeModel && <ModelPage model={activeModel} reels={allData[activeModel] || []} onBack={() => setPage('dashboard')} />}
        {page==='weekly' && <WeeklySummary allData={allData} models={models} />}
        {page==='users' && isAdmin && <UserManagement users={users} setUsers={setUsers} currentUser={currentUser} />}
        {page==='users' && !isAdmin && <div style={{ color:C.muted, padding:40, textAlign:'center' }}>Access denied.</div>}

        {page==='dashboard' && (
          <div className="fade-in">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
              <div>
                <h1 className="serif" style={{ fontSize:40, fontWeight:400, letterSpacing:-1, marginBottom:4 }}>FYP Statistics</h1>
                <p style={{ color:C.muted, fontSize:11, letterSpacing:2, textTransform:'uppercase' }}>{currentMonthKey} · All Models</p>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-outline" onClick={() => setPage('weekly')}>Weekly Report →</button>
                {isAdmin && <button className="btn-primary" onClick={() => setShowAddModel(true)}>+ Add Model</button>}
              </div>
            </div>

            {/* Table header */}
            <div style={{ background:C.bgLight, border:`1px solid ${C.border}`, borderRadius:'10px 10px 0 0', padding:'10px 20px', display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr 1fr', gap:12 }}>
              {['Model', 'Views', 'Revenue', 'Clicks', 'Subscriptions', 'Follows', 'Reels'].map(h => (
                <div key={h} style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', fontWeight:600 }}>{h}</div>
              ))}
            </div>

            {/* Table rows */}
            <div style={{ border:`1px solid ${C.border}`, borderTop:'none', borderRadius:'0 0 10px 10px', overflow:'hidden', background:C.bgCard }}>
              {modelStats.map((s, i) => {
                const color = getColor(s.model)
                return (
                  <div key={s.model} onClick={() => setPage(`model:${s.model}`)}
                    style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr 1fr', gap:12, padding:'14px 20px', borderBottom: i < modelStats.length-1 ? `1px solid ${C.border}` : 'none', cursor:'pointer', transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bgLight}
                    onMouseLeave={e => e.currentTarget.style.background = C.bgCard}>
                    {/* Model name */}
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block', flexShrink:0 }} />
                      <span className="serif" style={{ fontSize:16, fontWeight:600, textTransform:'capitalize' }}>{s.model}</span>
                    </div>
                    <div className="serif" style={{ fontSize:18, fontWeight:400 }}>{fmt(s.views)}</div>
                    <div className="serif" style={{ fontSize:18, fontWeight:400, color:C.success }}>{fmtMoney(s.revenue)}</div>
                    <div className="serif" style={{ fontSize:18, fontWeight:400 }}>{fmt(s.clicks)}</div>
                    <div className="serif" style={{ fontSize:18, fontWeight:400 }}>{fmt(s.subs)}</div>
                    <div className="serif" style={{ fontSize:18, fontWeight:400 }}>{fmt(s.follows)}</div>
                    <div style={{ fontSize:13, color:C.muted, alignSelf:'center' }}>{s.reels} reels</div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop:12, fontSize:11, color:C.muted, textAlign:'right' }}>
              Showing {currentMonthKey} totals · Click a model to view full profile
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
