import { useState, useEffect, useCallback, useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { C, MODELS, getColor, fmt, fmtMoney, makeDemo } from './lib/constants'
import { getUsers, saveUsers, getSession, saveSession, clearSession, getSheetUrl, saveSheetUrl, getExtraModels, saveExtraModels } from './lib/store'
import LoginScreen from './components/LoginScreen'
import UserManagement from './components/UserManagement'
import WeeklySummary from './components/WeeklySummary'
import ModelPage from './components/ModelPage'

export default function App() {
  const [currentUser, setCurrentUser] = useState(()=>getSession())
  const [users, setUsersState]        = useState(()=>getUsers())
  const [extraModels, setExtraModels] = useState(()=>getExtraModels())
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
  const [urlInput, setUrlInput]         = useState(()=>getSheetUrl())

  const isAdmin     = currentUser?.role === 'admin'
  const models      = useMemo(()=>[...MODELS,...extraModels],[extraModels])
  const activeModel = page.startsWith('model:') ? page.replace('model:','') : null

  // Load demo on first render
  useEffect(()=>{ if(!getSheetUrl()) setAllData(makeDemo()) },[])

  const fetchSheet = useCallback(async(url)=>{
    if(!url) return
    setLoading(true); setFetchError('')
    try {
      const res = await fetch(url)
      if(!res.ok) throw new Error('Could not fetch. Check the URL is correct and publicly accessible.')
      const text = await res.text()
      let parsed
      try { parsed = JSON.parse(text) } catch { throw new Error('Response is not valid JSON. Make sure you are using the Apps Script Web App URL.') }

      // parsed should be { josie: [...], emma: [...], ... }
      if(typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Unexpected data format. Check the Apps Script code.')

      setAllData(parsed)
      // Discover new models
      const newOnes = Object.keys(parsed).filter(m=>!models.includes(m.toLowerCase())).map(m=>m.toLowerCase())
      if(newOnes.length) {
        const updated=[...extraModels,...newOnes]
        setExtraModels(updated); saveExtraModels(updated)
      }
      setIsDemo(false)
      setLastUpdated(new Date().toLocaleTimeString())
      setShowConnect(false)
    } catch(e){ setFetchError(e.message) }
    setLoading(false)
  },[models,extraModels])

  // Auto-refresh every 60s
  useEffect(()=>{
    const url=getSheetUrl()
    if(!url) return
    const iv=setInterval(()=>fetchSheet(url),60000)
    return()=>clearInterval(iv)
  },[fetchSheet])

  // Summary totals across all models (latest date per model)
  const summary = useMemo(()=>{
    let views=0,revenue=0,clicks=0,subs=0,reels=0
    models.forEach(m=>{
      const data=allData[m]||[]
      const dates=[...new Set(data.map(r=>r.date))].sort()
      const latest=dates[dates.length-1]
      const latestReels=data.filter(r=>r.date===latest)
      views   += latestReels.reduce((s,r)=>s+(Number(r.views_day1)||0),0)
      revenue += latestReels.reduce((s,r)=>s+(Number(r.total_revenue)||0),0)
      clicks  += latestReels.reduce((s,r)=>s+(Number(r.total_clicks)||0),0)
      subs    += latestReels.reduce((s,r)=>s+(Number(r.total_subscription)||0),0)
      reels   += latestReels.length
    })
    return { views, revenue, clicks, subs, reels }
  },[allData,models])

  const handleConnect=()=>{ saveSheetUrl(urlInput); fetchSheet(urlInput) }
  const handleLogin=(user)=>{ setCurrentUser(user); saveSession(user) }
  const handleLogout=()=>{ clearSession(); setCurrentUser(null); setPage('dashboard'); setShowUserMenu(false) }
  const setUsers=(u)=>{ setUsersState(u); saveUsers(u) }
  const addModel=()=>{
    const name=newModelName.trim().toLowerCase()
    if(!name) return
    if(models.includes(name)){setAddModelErr('Model already exists.');return}
    const updated=[...extraModels,name]
    setExtraModels(updated); saveExtraModels(updated)
    setNewModelName(''); setShowAddModel(false); setAddModelErr('')
  }

  if(!currentUser) return <LoginScreen onLogin={handleLogin}/>

  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text}}>

      {/* NAV */}
      <nav style={{background:C.bgCard,borderBottom:`1px solid ${C.border}`,padding:'0 28px',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',height:54,flexWrap:'wrap'}}>
          <div className="serif" style={{fontSize:15,letterSpacing:1,marginRight:28,paddingRight:28,borderRight:`1px solid ${C.border}`,height:'100%',display:'flex',alignItems:'center',flexShrink:0}}>
            <span style={{fontWeight:600}}>FYP</span><span style={{color:C.muted,fontWeight:300}}> STATISTICS</span>
          </div>
          <button className={`nav-link ${page==='dashboard'?'active':''}`} style={{marginRight:20}} onClick={()=>setPage('dashboard')}>Dashboard</button>
          <button className={`nav-link ${page==='weekly'?'active':''}`} style={{marginRight:20}} onClick={()=>setPage('weekly')}>Weekly</button>
          {isAdmin&&<button className={`nav-link ${page==='users'?'active':''}`} style={{marginRight:20}} onClick={()=>setPage('users')}>Users</button>}
          <div style={{display:'flex',flexWrap:'wrap',gap:3,flex:1,padding:'4px 0 4px 8px',overflow:'hidden'}}>
            {models.map(m=>(
              <button key={m} className={`model-dot ${activeModel===m?'active':''}`} onClick={()=>setPage(`model:${m}`)}>
                <span style={{width:7,height:7,borderRadius:'50%',background:getColor(m),display:'inline-block',flexShrink:0}}/>{m}
              </button>
            ))}
            {isAdmin&&<button className="model-dot" onClick={()=>setShowAddModel(true)} style={{border:`1px dashed ${C.border}`,color:C.muted}}>+ add</button>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginLeft:'auto',flexShrink:0}}>
            {isDemo&&<span style={{fontSize:10,color:'#b8a060',background:'#fdf6e3',border:'1px solid #e8d89a',padding:'3px 10px',borderRadius:20,letterSpacing:1,textTransform:'uppercase'}}>Demo</span>}
            {!isDemo&&lastUpdated&&<span style={{fontSize:10,color:C.success}}>↻ {lastUpdated}</span>}
            {isAdmin&&<button className="btn-outline" onClick={()=>setShowConnect(s=>!s)} style={{padding:'6px 14px'}}>⚙ Connect Sheet</button>}
            <div style={{position:'relative'}}>
              <button onClick={()=>setShowUserMenu(s=>!s)} style={{display:'flex',alignItems:'center',gap:8,background:C.bgLight,border:`1px solid ${C.border}`,borderRadius:20,padding:'5px 12px 5px 8px',cursor:'pointer'}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:C.text,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:600}}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span style={{fontSize:11}}>{currentUser.name}</span>
                <span className={currentUser.role==='admin'?'tag-admin':'tag-viewer'}>{currentUser.role}</span>
              </button>
              {showUserMenu&&(
                <div className="card slide-up" style={{position:'absolute',right:0,top:'calc(100% + 8px)',width:180,padding:8,zIndex:100,boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}}>
                  <div style={{padding:'8px 12px',borderBottom:`1px solid ${C.border}`,marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:500}}>{currentUser.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>@{currentUser.username}</div>
                  </div>
                  {isAdmin&&<button onClick={()=>{setPage('users');setShowUserMenu(false)}} style={{display:'block',width:'100%',textAlign:'left',background:'none',border:'none',padding:'7px 12px',fontSize:12,color:C.text,borderRadius:4,cursor:'pointer'}}>👥 Manage Users</button>}
                  <button onClick={handleLogout} style={{display:'block',width:'100%',textAlign:'left',background:'none',border:'none',padding:'7px 12px',fontSize:12,color:C.danger,borderRadius:4,cursor:'pointer'}}>→ Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showUserMenu&&<div style={{position:'fixed',inset:0,zIndex:49}} onClick={()=>setShowUserMenu(false)}/>}

      {/* CONNECT PANEL */}
      {showConnect&&isAdmin&&(
        <div style={{background:C.bgLight,borderBottom:`1px solid ${C.border}`,padding:'18px 28px'}} className="fade-in">
          <div style={{maxWidth:780}}>
            <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Connect Google Sheet via Apps Script</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.9}}>
              Paste your <b style={{color:C.text}}>Apps Script Web App URL</b>. The script reads all <b style={{color:C.text}}>FYP STATISTICS-[MODEL]</b> tabs automatically.<br/>
              See <b style={{color:C.text}}>apps-script.js</b> in the project for the exact script to paste into Extensions → Apps Script.
            </div>
            <div style={{display:'flex',gap:10}}>
              <input className="input-field" placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput} onChange={e=>setUrlInput(e.target.value)} style={{flex:1}}/>
              <button className="btn-primary" onClick={handleConnect} disabled={loading}>{loading?'Connecting…':'Connect →'}</button>
              <button className="btn-outline" onClick={()=>setShowConnect(false)}>✕</button>
            </div>
            {fetchError&&<div style={{color:C.danger,fontSize:12,marginTop:8}}>⚠ {fetchError}</div>}
            <div style={{fontSize:11,color:C.muted,marginTop:10}}>Auto-refreshes every 60 seconds once connected.</div>
          </div>
        </div>
      )}

      {/* ADD MODEL MODAL */}
      {showAddModel&&isAdmin&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowAddModel(false)}>
          <div className="card slide-up" style={{padding:32,width:360}} onClick={e=>e.stopPropagation()}>
            <div className="serif" style={{fontSize:22,marginBottom:6}}>Add Model</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:20}}>
              Name must match the model's tab suffix.<br/>
              e.g. for <b>FYP STATISTICS-ELLIE</b> enter <b>ellie</b>
            </div>
            <input className="input-field" placeholder="e.g. ellie" value={newModelName}
              onChange={e=>{setNewModelName(e.target.value);setAddModelErr('')}}
              onKeyDown={e=>e.key==='Enter'&&addModel()} autoFocus style={{marginBottom:10}}/>
            {addModelErr&&<div style={{color:C.danger,fontSize:12,marginBottom:10}}>{addModelErr}</div>}
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <button className="btn-primary" onClick={addModel} style={{flex:1}}>Add Model</button>
              <button className="btn-outline" onClick={()=>{setShowAddModel(false);setAddModelErr('')}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main style={{padding:'32px 28px 60px',maxWidth:1400,margin:'0 auto'}}>

        {activeModel&&<ModelPage model={activeModel} reels={allData[activeModel]||[]} onBack={()=>setPage('dashboard')}/>}
        {page==='weekly'&&<WeeklySummary allData={allData} models={models}/>}
        {page==='users'&&isAdmin&&<UserManagement users={users} setUsers={setUsers} currentUser={currentUser}/>}
        {page==='users'&&!isAdmin&&<div style={{color:C.muted,padding:40,textAlign:'center'}}>Access denied.</div>}

        {page==='dashboard'&&(
          <div className="fade-in">
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
              <div>
                <h1 className="serif" style={{fontSize:40,fontWeight:400,letterSpacing:-1,marginBottom:4}}>FYP Statistics</h1>
                <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase'}}>All models · Fansly performance tracker</p>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button className="btn-outline" onClick={()=>setPage('weekly')}>Weekly Report →</button>
                {isAdmin&&<button className="btn-primary" onClick={()=>setShowAddModel(true)}>+ Add Model</button>}
              </div>
            </div>

            {/* Summary cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:14,marginBottom:32}}>
              {[
                {label:"Today's Views",    value:fmt(summary.views),          icon:'👁'},
                {label:'Subscriptions',    value:fmt(summary.subs),           icon:'⭐'},
                {label:"Today's Revenue",  value:fmtMoney(summary.revenue),   icon:'💰'},
                {label:'Clicks',           value:fmt(summary.clicks),         icon:'🔗'},
                {label:'Reels Today',      value:summary.reels,               icon:'🎬'},
                {label:'Models Tracked',   value:models.length,               icon:'👤'},
              ].map(s=>(
                <div key={s.label} className="card" style={{padding:'18px 20px'}}>
                  <div style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>{s.icon} {s.label}</div>
                  <div className="serif" style={{fontSize:30,fontWeight:400}}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{height:1,background:C.border,marginBottom:28}}/>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase',marginBottom:18}}>Models · Click to view full profile</div>

            {/* Model grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
              {models.map(model=>{
                const reels=allData[model]||[]
                const dates=[...new Set(reels.map(r=>r.date))].sort()
                const latestD=dates[dates.length-1]
                const prevD=dates[dates.length-2]
                const latestReels=reels.filter(r=>r.date===latestD)
                const prevReels=reels.filter(r=>r.date===prevD)
                const lViews=latestReels.reduce((s,r)=>s+(Number(r.views_day1)||0),0)
                const pViews=prevReels.reduce((s,r)=>s+(Number(r.views_day1)||0),0)
                const viewChg=pViews?(((lViews-pViews)/pViews)*100).toFixed(1):null
                const color=getColor(model)
                const totalRev=reels.reduce((s,r)=>s+(Number(r.total_revenue)||0),0)
                const totalSubs=reels.reduce((s,r)=>s+(Number(r.total_subscription)||0),0)

                // Sparkline: daily view totals last 7 dates
                const sparkData=dates.slice(-7).map(d=>({
                  date:d,
                  views:reels.filter(r=>r.date===d).reduce((s,r)=>s+(Number(r.views_day1)||0),0)
                }))

                return (
                  <div key={model} className="card hover-lift" onClick={()=>setPage(`model:${model}`)}
                    style={{padding:'20px 20px 16px',borderTop:`3px solid ${color}`,cursor:'pointer'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:10,height:10,borderRadius:'50%',background:color,display:'inline-block'}}/>
                        <span className="serif" style={{fontSize:20,fontWeight:600,textTransform:'capitalize'}}>{model}</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        {viewChg!==null&&<div style={{fontSize:11,color:Number(viewChg)>=0?C.success:C.danger}}>{Number(viewChg)>=0?'▲':'▼'} {Math.abs(viewChg)}%</div>}
                        <div style={{fontSize:10,color:C.muted}}>{reels.length} reels</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px 14px',marginBottom:14}}>
                      <div style={{fontSize:11}}><span style={{color:C.muted}}>👁 Today: </span><span style={{fontWeight:500}}>{fmt(lViews)}</span></div>
                      <div style={{fontSize:11}}><span style={{color:C.muted}}>🎬 Reels: </span><span style={{fontWeight:500}}>{latestReels.length} today</span></div>
                      <div style={{fontSize:11}}><span style={{color:C.muted}}>⭐ Subs: </span><span style={{fontWeight:500}}>{fmt(totalSubs)}</span></div>
                      <div style={{fontSize:11}}><span style={{color:C.muted}}>💰 Rev: </span><span style={{fontWeight:500}}>{fmtMoney(totalRev)}</span></div>
                    </div>
                    <ResponsiveContainer width="100%" height={64}>
                      <AreaChart data={sparkData} margin={{top:0,right:0,left:0,bottom:0}}>
                        <defs>
                          <linearGradient id={`sp-${model}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="views" stroke={color} fill={`url(#sp-${model})`} strokeWidth={1.5} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{fontSize:10,color:C.muted,letterSpacing:1,textTransform:'uppercase',marginTop:4}}>Views Day 1 · Last 7 days</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
