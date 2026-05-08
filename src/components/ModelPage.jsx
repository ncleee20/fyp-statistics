import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { C, VIEW_DAYS, TOTAL_METRICS, PLATFORMS, fmt, fmtMoney, getColor } from '../lib/constants'

// Distinct colors for individual reel lines
const REEL_COLORS = [
  '#e8a87c','#c084a0','#6db89e','#6aa8d4','#e8c84a',
  '#a084c8','#e87c7c','#84c8a0','#d4a0c8','#84b8d4',
  '#e8a040','#b8d484','#c8a084','#84a0c8','#e8c8a0',
]

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1a1814', border:`1px solid #333`, borderRadius:8, padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,.3)' }}>
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

// Group reels into calendar weeks (1–7=W1, 8–14=W2, 15–21=W3, 22+=W4)
function groupIntoWeeks(reels) {
  const weeks = {}
  reels.forEach(reel => {
    if (!reel.date) return
    const dateObj = new Date(reel.date)
    const day = dateObj.getDate()
    const weekNum = Math.ceil(day / 7)
    const weekKey = `Week ${weekNum}`
    const startDay = (weekNum - 1) * 7 + 1
    const endDay = Math.min(weekNum * 7, new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate())
    const monthName = dateObj.toLocaleString('default', { month: 'long' })
    const year = dateObj.getFullYear()
    const label = `${monthName} ${startDay}–${endDay}`
    if (!weeks[weekKey]) weeks[weekKey] = { label, reels: [] }
    weeks[weekKey].reels.push(reel)
  })
  return weeks
}

// Build combined chart data: X = Day1..Day7, each series = one reel
function buildWeekChart(reels) {
  return VIEW_DAYS.map(d => {
    const point = { day: d.label }
    reels.forEach(reel => {
      const val = Number(reel[d.key]) || 0
      if (val > 0 || d.key === 'views_day1') {
        point[`Reel #${reel.reel_number}`] = val || null
      }
    })
    return point
  })
}

export default function ModelPage({ model, reels, onBack }) {
  const color = getColor(model)

  const weeks = useMemo(() => groupIntoWeeks(reels), [reels])
  const weekKeys = Object.keys(weeks).sort((a,b) => parseInt(a.replace('Week ','')) - parseInt(b.replace('Week ','')))
  const [activeWeek, setActiveWeek] = useState(() => weekKeys[weekKeys.length - 1] || 'Week 1')
  const currentWeek = weekKeys.includes(activeWeek) ? activeWeek : weekKeys[weekKeys.length - 1]
  const currentReels = useMemo(() =>
    (weeks[currentWeek]?.reels || []).sort((a,b) => new Date(a.date) - new Date(b.date)),
    [weeks, currentWeek]
  )
  const currentLabel = weeks[currentWeek]?.label || ''

  // Build the combined multi-line chart data for this week
  const chartData = useMemo(() => buildWeekChart(currentReels), [currentReels])

  // All-time totals
  const allTimeTotals = useMemo(() => {
    const t = {}
    TOTAL_METRICS.forEach(m => { t[m.key] = reels.reduce((s,r) => s+(Number(r[m.key])||0), 0) })
    t.views = reels.reduce((s,r) => s+(Number(r.views_day1)||0), 0)
    return t
  }, [reels])

  // Weekly totals
  const weekTotals = useMemo(() => {
    const t = {}
    TOTAL_METRICS.forEach(m => { t[m.key] = currentReels.reduce((s,r) => s+(Number(r[m.key])||0), 0) })
    t.views = currentReels.reduce((s,r) => s+(Number(r.views_day1)||0), 0)
    return t
  }, [currentReels])

  return (
    <div className="fade-in">
      {/* Back */}
      <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:24, padding:0 }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
        <span style={{ width:14, height:14, borderRadius:'50%', background:color, display:'inline-block' }}/>
        <h1 className="serif" style={{ fontSize:38, fontWeight:400, textTransform:'capitalize' }}>{model}</h1>
      </div>
      <p style={{ color:C.muted, fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:24 }}>
        FYP STATISTICS · {reels.length} reels · {weekKeys.length} weeks
      </p>

      {/* All-time summary strip */}
      <div className="card" style={{ padding:'14px 20px', marginBottom:28, display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', flexShrink:0 }}>ALL TIME</span>
        {[
          { icon:'👁', label:'Views', value:fmt(allTimeTotals.views) },
          { icon:'🔗', label:'Clicks', value:fmt(allTimeTotals.total_clicks) },
          { icon:'👥', label:'Follows', value:fmt(allTimeTotals.total_follows) },
          { icon:'⭐', label:'Subs', value:fmt(allTimeTotals.total_subscription) },
          { icon:'💸', label:'Tips', value:fmtMoney(allTimeTotals.total_tips) },
          { icon:'💰', label:'Revenue', value:fmtMoney(allTimeTotals.total_revenue) },
          { icon:'🎬', label:'Reels', value:reels.length },
        ].map(s => (
          <span key={s.label} style={{ fontSize:12 }}>
            {s.icon} <b>{s.value}</b> <span style={{ color:C.muted }}>{s.label}</span>
          </span>
        ))}
      </div>

      {/* Week tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginRight:4, flexShrink:0 }}>WEEK</span>
        {weekKeys.map(wk => (
          <button key={wk} onClick={() => setActiveWeek(wk)} className={`chip ${currentWeek === wk ? 'active' : ''}`}>
            {wk}
          </button>
        ))}
      </div>

      {/* Week header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, padding:'12px 18px', background:C.bgLight, borderRadius:8, border:`1px solid ${C.border}`, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontWeight:600, fontSize:15 }}>{currentWeek} <span style={{ color:C.muted, fontWeight:400 }}>·</span> <span style={{ color:C.muted, fontWeight:400, fontSize:13 }}>{currentLabel}</span></div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{currentReels.length} reels this week</div>
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <span style={{ fontSize:11 }}>👁 <b>{fmt(weekTotals.views)}</b> <span style={{ color:C.muted }}>views</span></span>
          <span style={{ fontSize:11 }}>🔗 <b>{fmt(weekTotals.total_clicks)}</b> <span style={{ color:C.muted }}>clicks</span></span>
          <span style={{ fontSize:11 }}>👥 <b>{fmt(weekTotals.total_follows)}</b> <span style={{ color:C.muted }}>follows</span></span>
          <span style={{ fontSize:11 }}>⭐ <b>{fmt(weekTotals.total_subscription)}</b> <span style={{ color:C.muted }}>subs</span></span>
          <span style={{ fontSize:11 }}>💰 <b>{fmtMoney(weekTotals.total_revenue)}</b> <span style={{ color:C.muted }}>revenue</span></span>
        </div>
      </div>

      {currentReels.length > 0 ? (
        <>
          {/* ── COMBINED MULTI-LINE CHART ── */}
          <div style={{ background:'#12121e', borderRadius:14, padding:'28px 20px 20px', marginBottom:28, border:'1px solid #2a2a3a' }}>
            <div style={{ marginBottom:4, paddingLeft:8 }}>
              <div style={{ fontSize:13, color:'#e0ddd8', fontWeight:500, letterSpacing:0.5 }}>
                {currentWeek} — Views per Reel across Days
              </div>
              <div style={{ fontSize:11, color:'#666', marginTop:3 }}>
                Each line = a reel · X = Day · Y = Views
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData} margin={{ top:20, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                <XAxis dataKey="day" tick={{ fill:'#666', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#666', fontSize:11 }} axisLine={false} tickLine={false} width={44} tickFormatter={fmt}/>
                <Tooltip content={<Tip/>}/>
                <Legend wrapperStyle={{ fontSize:11, color:'#999', paddingTop:16 }}/>
                {currentReels.map((reel, i) => (
                  <Line
                    key={reel.reel_number}
                    type="monotone"
                    dataKey={`Reel #${reel.reel_number}`}
                    stroke={REEL_COLORS[i % REEL_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r:5, fill:REEL_COLORS[i % REEL_COLORS.length], strokeWidth:2, stroke:'#12121e' }}
                    activeDot={{ r:7 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── PER REEL DETAILS ── */}
          <div style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>
            Reel Breakdown · {currentWeek}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {currentReels.map((reel, i) => {
              const reelColor = REEL_COLORS[i % REEL_COLORS.length]
              return (
                <div key={i} className="card" style={{ padding:'16px 18px', borderLeft:`4px solid ${reelColor}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:reelColor, display:'inline-block' }}/>
                        <span className="serif" style={{ fontSize:17, fontWeight:600 }}>Reel #{reel.reel_number}</span>
                        <span style={{ fontSize:11, color:C.muted }}>· {reel.date}</span>
                      </div>
                      {/* Day by day views */}
                      <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                        {VIEW_DAYS.map(d => {
                          const val = Number(reel[d.key]) || 0
                          if (!val) return null
                          return (
                            <span key={d.key} style={{ fontSize:11, padding:'2px 8px', background:C.bgLight, borderRadius:12, border:`1px solid ${C.border}` }}>
                              <span style={{ color:C.muted }}>{d.label}: </span>
                              <b>{fmt(val)}</b>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:10, color:C.muted }}>Day 1 → Day 7</div>
                      <div style={{ fontSize:13, fontWeight:600, color:reelColor }}>
                        {fmt(reel.views_day1)} → {reel.views_day7 ? fmt(reel.views_day7) : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Platform stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:8 }}>
                    {PLATFORMS.map(p => (
                      <div key={p.key} style={{ padding:'8px 10px', background:C.bgLight, borderRadius:6, borderTop:`2px solid ${p.color}` }}>
                        <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:6, fontWeight:600 }}>{p.label}</div>
                        <div style={{ fontSize:10, marginBottom:2 }}>🔗 <b>{fmt(reel[`${p.key}_clicks`])}</b> clicks</div>
                        <div style={{ fontSize:10, marginBottom:2 }}>👥 <b>{fmt(reel[`${p.key}_follows`])}</b> follows</div>
                        <div style={{ fontSize:10, marginBottom:2 }}>⭐ <b>{fmt(reel[`${p.key}_subscription`])}</b> subs</div>
                        <div style={{ fontSize:10, marginBottom:2 }}>💸 <b>{fmtMoney(reel[`${p.key}_tips`])}</b> tips</div>
                        <div style={{ fontSize:10 }}>💰 <b>{fmtMoney(reel[`${p.key}_revenue`])}</b> rev</div>
                      </div>
                    ))}
                    {/* Total */}
                    <div style={{ padding:'8px 10px', background:'#f7f0f5', borderRadius:6, borderTop:`2px solid ${reelColor}` }}>
                      <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:6, fontWeight:600 }}>TOTAL</div>
                      <div style={{ fontSize:10, marginBottom:2 }}>🔗 <b>{fmt(reel.total_clicks)}</b> clicks</div>
                      <div style={{ fontSize:10, marginBottom:2 }}>👥 <b>{fmt(reel.total_follows)}</b> follows</div>
                      <div style={{ fontSize:10, marginBottom:2 }}>⭐ <b>{fmt(reel.total_subscription)}</b> subs</div>
                      <div style={{ fontSize:10, marginBottom:2 }}>💸 <b>{fmtMoney(reel.total_tips)}</b> tips</div>
                      <div style={{ fontSize:10 }}>💰 <b>{fmtMoney(reel.total_revenue)}</b> rev</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div style={{ color:C.muted, textAlign:'center', padding:48, background:C.bgLight, borderRadius:10 }}>
          No reels logged for this week yet.
        </div>
      )}
    </div>
  )
}
