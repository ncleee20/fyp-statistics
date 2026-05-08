import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { C, VIEW_DAYS, TOTAL_METRICS, PLATFORMS, fmt, fmtMoney, getColor, parseDate, getMonthKey, getMonthSort, getWeekNum } from '../lib/constants'

const REEL_COLORS = ['#e8a87c','#c084a0','#6db89e','#6aa8d4','#e8c84a','#a084c8','#e87c7c','#84c8a0','#d4a0c8','#84b8d4','#e8a040','#b8d484','#c8a084','#84a0c8','#e8c8a0']

const DarkTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1a1814', border:'1px solid #333', borderRadius:8, padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,.3)' }}>
      <p style={{ color:'#aaa', fontSize:11, marginBottom:8, letterSpacing:1, textTransform:'uppercase' }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block', flexShrink:0 }}/>
          <span style={{ color:'#ccc', fontSize:11 }}>{p.name}:</span>
          <span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const LightTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
      <p style={{ color:C.muted, fontSize:11, marginBottom:6, letterSpacing:1, textTransform:'uppercase' }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:p.color, display:'inline-block' }}/>
          <span style={{ color:C.muted, fontSize:12 }}>{p.name}:</span>
          <span style={{ color:C.text, fontSize:13, fontWeight:600 }}>
            {p.name === 'Revenue' ? fmtMoney(p.value) : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ModelPage({ model, reels, onBack }) {
  const color = getColor(model)
  const now = new Date()
  const currentMonthKey = `${now.toLocaleString('default',{month:'long'})} ${now.getFullYear()}`
  const currentMonthSort = now.getFullYear()*100 + now.getMonth()

  const { pastMonthsChart, currentMonthReels, weekKeys } = useMemo(() => {
    const byMonth = {}
    reels.forEach(r => {
      if (!r.date) return
      const mk = getMonthKey(r.date)
      const ms = getMonthSort(r.date)
      if (!byMonth[mk]) byMonth[mk] = { sort:ms, reels:[] }
      byMonth[mk].reels.push(r)
    })

    const pastMonthsChart = Object.entries(byMonth)
      .filter(([,v]) => v.sort < currentMonthSort)
      .sort((a,b) => a[1].sort - b[1].sort)
      .map(([month, v]) => ({
        month: month.split(' ')[0].substring(0,3),
        views:   v.reels.reduce((s,r) => s+(Number(r.views_day1)||0), 0),
        revenue: v.reels.reduce((s,r) => s+(Number(r.total_revenue)||0), 0),
        clicks:  v.reels.reduce((s,r) => s+(Number(r.total_clicks)||0), 0),
      }))

    const currentMonthReels = byMonth[currentMonthKey]?.reels || []
    const weekNums = [...new Set(currentMonthReels.map(r => getWeekNum(r.date)))].sort((a,b)=>a-b)
    const weekKeys = weekNums.map(n => `Week ${n}`)

    return { pastMonthsChart, currentMonthReels, weekKeys }
  }, [reels, currentMonthKey, currentMonthSort])

  const [activeWeek, setActiveWeek] = useState(() => weekKeys[weekKeys.length-1] || 'Week 1')
  const [expandedReel, setExpandedReel] = useState(null)

  const currentWeek = weekKeys.includes(activeWeek) ? activeWeek : weekKeys[weekKeys.length-1]
  const weekNum = parseInt((currentWeek || 'Week 1').replace('Week ',''))

  const weekReels = useMemo(() =>
    currentMonthReels.filter(r => getWeekNum(r.date) === weekNum)
      .sort((a,b) => parseDate(a.date) - parseDate(b.date)),
    [currentMonthReels, weekNum]
  )

  const startDay = (weekNum-1)*7+1
  const endDay = Math.min(weekNum*7, new Date(now.getFullYear(), now.getMonth()+1, 0).getDate())
  const weekLabel = `${now.toLocaleString('default',{month:'long'})} ${startDay}–${endDay}`

  const weekTotals = useMemo(() => ({
    views:   weekReels.reduce((s,r)=>s+(Number(r.views_day1)||0),0),
    revenue: weekReels.reduce((s,r)=>s+(Number(r.total_revenue)||0),0),
    clicks:  weekReels.reduce((s,r)=>s+(Number(r.total_clicks)||0),0),
    subs:    weekReels.reduce((s,r)=>s+(Number(r.total_subscription)||0),0),
    follows: weekReels.reduce((s,r)=>s+(Number(r.total_follows)||0),0),
  }), [weekReels])

  const weekChartData = useMemo(() =>
    VIEW_DAYS.map(d => {
      const point = { day: d.label }
      weekReels.forEach(r => { point[`#${r.reel_number}`] = Number(r[d.key])||null })
      return point
    }), [weekReels]
  )

  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:24, padding:0 }}>
        ← Back
      </button>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
        <span style={{ width:14, height:14, borderRadius:'50%', background:color, display:'inline-block' }}/>
        <h1 className="serif" style={{ fontSize:38, fontWeight:400, textTransform:'capitalize' }}>{model}</h1>
      </div>
      <p style={{ color:C.muted, fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:32 }}>
        FYP STATISTICS · {reels.length} total reels
      </p>

      {/* PAST MONTHS BAR CHART */}
      {pastMonthsChart.length > 0 && (
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>Monthly Overview — Past Months</div>
          <div className="card" style={{ padding:'22px 16px 16px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pastMonthsChart} margin={{ top:10, right:10, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} width={44} tickFormatter={fmt}/>
                <Tooltip content={<LightTip/>}/>
                <Legend wrapperStyle={{ fontSize:11, paddingTop:12 }}/>
                <Bar dataKey="views"   name="Views"   fill={color}   radius={[4,4,0,0]} opacity={0.9}/>
                <Bar dataKey="clicks"  name="Clicks"  fill="#6aa8d4" radius={[4,4,0,0]} opacity={0.9}/>
                <Bar dataKey="revenue" name="Revenue" fill="#5a9e7a" radius={[4,4,0,0]} opacity={0.9}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CURRENT MONTH WEEKLY */}
      <div style={{ fontSize:11, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>
        {currentMonthKey} — Weekly Breakdown
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginRight:4, flexShrink:0 }}>WEEK</span>
        {weekKeys.map(wk => (
          <button key={wk} onClick={() => setActiveWeek(wk)} className={`chip ${currentWeek===wk?'active':''}`}>{wk}</button>
        ))}
        {!weekKeys.length && <span style={{ fontSize:12, color:C.muted }}>No data for {currentMonthKey} yet</span>}
      </div>

      {weekReels.length > 0 && (
        <>
          {/* Week summary */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', background:C.bgLight, borderRadius:8, border:`1px solid ${C.border}`, marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{currentWeek} <span style={{ color:C.muted, fontWeight:400, fontSize:13 }}>· {weekLabel}</span></div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{weekReels.length} reels</div>
            </div>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:11 }}>👁 <b>{fmt(weekTotals.views)}</b></span>
              <span style={{ fontSize:11 }}>💰 <b>{fmtMoney(weekTotals.revenue)}</b></span>
              <span style={{ fontSize:11 }}>🔗 <b>{fmt(weekTotals.clicks)}</b></span>
              <span style={{ fontSize:11 }}>⭐ <b>{fmt(weekTotals.subs)}</b></span>
              <span style={{ fontSize:11 }}>👥 <b>{fmt(weekTotals.follows)}</b></span>
            </div>
          </div>

          {/* Dark multi-line chart */}
          <div style={{ background:'#12121e', borderRadius:14, padding:'28px 20px 20px', marginBottom:28, border:'1px solid #2a2a3a' }}>
            <div style={{ fontSize:13, color:'#e0ddd8', fontWeight:500, marginBottom:3, paddingLeft:8 }}>
              {currentWeek} — {weekLabel} · Views per Reel
            </div>
            <div style={{ fontSize:11, color:'#666', paddingLeft:8, marginBottom:16 }}>Each line = a reel · X = Day · Y = Views</div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={weekChartData} margin={{ top:10, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                <XAxis dataKey="day" tick={{ fill:'#666', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#666', fontSize:11 }} axisLine={false} tickLine={false} width={44} tickFormatter={fmt}/>
                <Tooltip content={<DarkTip/>}/>
                <Legend wrapperStyle={{ fontSize:11, color:'#999', paddingTop:16 }}/>
                {weekReels.map((r,i) => (
                  <Line key={r.reel_number} type="monotone" dataKey={`#${r.reel_number}`}
                    stroke={REEL_COLORS[i%REEL_COLORS.length]} strokeWidth={2}
                    dot={{ r:5, fill:REEL_COLORS[i%REEL_COLORS.length], strokeWidth:2, stroke:'#12121e' }}
                    activeDot={{ r:7 }} connectNulls={false}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Collapsed reels */}
          <div style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
            Reels · {currentWeek} · Click to expand
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {weekReels.map((reel, i) => {
              const rc = REEL_COLORS[i%REEL_COLORS.length]
              const isOpen = expandedReel === reel.reel_number
              return (
                <div key={reel.reel_number} className="card" style={{ overflow:'hidden', borderLeft:`4px solid ${rc}` }}>
                  <div onClick={() => setExpandedReel(isOpen ? null : reel.reel_number)}
                    style={{ padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', gap:12, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:9, height:9, borderRadius:'50%', background:rc, display:'inline-block' }}/>
                      <span className="serif" style={{ fontSize:16, fontWeight:600 }}>Reel #{reel.reel_number}</span>
                      <span style={{ fontSize:11, color:C.muted }}>· {reel.date}</span>
                    </div>
                    <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontSize:11 }}>👁 <b>{fmt(reel.views_day1)}</b> <span style={{ color:C.muted }}>day 1</span></span>
                      {reel.views_day7 > 0 && <span style={{ fontSize:11 }}>👁 <b>{fmt(reel.views_day7)}</b> <span style={{ color:C.muted }}>day 7</span></span>}
                      <span style={{ fontSize:11 }}>💰 <b>{fmtMoney(reel.total_revenue)}</b></span>
                      <span style={{ fontSize:11 }}>🔗 <b>{fmt(reel.total_clicks)}</b></span>
                      <span style={{ fontSize:14, color:C.muted, marginLeft:4 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop:`1px solid ${C.border}`, padding:'16px 18px', background:C.bgLight }} className="fade-in">
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                        {VIEW_DAYS.map(d => {
                          const val = Number(reel[d.key])||0
                          if (!val) return null
                          return (
                            <span key={d.key} style={{ fontSize:11, padding:'3px 10px', background:'#fff', borderRadius:20, border:`1px solid ${C.border}` }}>
                              <span style={{ color:C.muted }}>{d.label}: </span><b>{fmt(val)}</b>
                            </span>
                          )
                        })}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
                        {PLATFORMS.map(p => (
                          <div key={p.key} style={{ padding:'10px 12px', background:'#fff', borderRadius:8, borderTop:`2px solid ${p.color}` }}>
                            <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>{p.label}</div>
                            <div style={{ fontSize:11, marginBottom:3 }}>🔗 <b>{fmt(reel[`${p.key}_clicks`])}</b></div>
                            <div style={{ fontSize:11, marginBottom:3 }}>👥 <b>{fmt(reel[`${p.key}_follows`])}</b></div>
                            <div style={{ fontSize:11, marginBottom:3 }}>⭐ <b>{fmt(reel[`${p.key}_subscription`])}</b></div>
                            <div style={{ fontSize:11, marginBottom:3 }}>💸 <b>{fmtMoney(reel[`${p.key}_tips`])}</b></div>
                            <div style={{ fontSize:11 }}>💰 <b>{fmtMoney(reel[`${p.key}_revenue`])}</b></div>
                          </div>
                        ))}
                        <div style={{ padding:'10px 12px', background:'#fff', borderRadius:8, borderTop:`2px solid ${rc}` }}>
                          <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>TOTAL</div>
                          <div style={{ fontSize:11, marginBottom:3 }}>🔗 <b>{fmt(reel.total_clicks)}</b></div>
                          <div style={{ fontSize:11, marginBottom:3 }}>👥 <b>{fmt(reel.total_follows)}</b></div>
                          <div style={{ fontSize:11, marginBottom:3 }}>⭐ <b>{fmt(reel.total_subscription)}</b></div>
                          <div style={{ fontSize:11, marginBottom:3 }}>💸 <b>{fmtMoney(reel.total_tips)}</b></div>
                          <div style={{ fontSize:11 }}>💰 <b>{fmtMoney(reel.total_revenue)}</b></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
