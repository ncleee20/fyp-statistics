import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts'
import { C, VIEW_DAYS, TOTAL_METRICS, PLATFORMS, fmt, fmtMoney, getColor, parseDate, getMonthKey, getMonthSort, getWeekNum } from '../lib/constants'

const REEL_COLORS = ['#e8c8a0','#d4a870','#c08840','#6db89e','#6aa8d4','#a084c8','#e87c7c','#84c8a0','#e8c84a','#84b8d4']

const DarkTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1a1814', border:'1px solid #333', borderRadius:8, padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,.3)' }}>
      <p style={{ color:'#aaa', fontSize:11, marginBottom:8, letterSpacing:1, textTransform:'uppercase' }}>{label}</p>
      {payload.filter(p => p.value > 0).map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.fill, display:'inline-block', flexShrink:0 }}/>
          <span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{p.name}: {fmt(p.value)} views</span>
        </div>
      ))}
    </div>
  )
}

const LightTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s,p) => s + (p.value||0), 0)
  return (
    <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
      <p style={{ color:C.muted, fontSize:11, marginBottom:6, letterSpacing:1, textTransform:'uppercase' }}>{label}</p>
      <p style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Total: {fmt(total)} views</p>
      {payload.filter(p => p.value > 0).map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:p.fill, display:'inline-block' }}/>
          <span style={{ color:C.muted, fontSize:11 }}>{p.name}: {fmt(p.value)}</span>
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

  const { pastMonthsChartData, currentMonthReels, weekKeys } = useMemo(() => {
    const byMonth = {}
    reels.forEach(r => {
      if (!r.date) return
      const mk = getMonthKey(r.date)
      const ms = getMonthSort(r.date)
      if (!byMonth[mk]) byMonth[mk] = { sort:ms, reels:[] }
      byMonth[mk].reels.push(r)
    })

    // Build per-month chart data separately
    const pastMonthsChartData = Object.entries(byMonth)
      .filter(([,v]) => v.sort < currentMonthSort)
      .sort((a,b) => a[1].sort - b[1].sort)
      .map(([monthKey, v]) => {
        const byDate = {}
        v.reels.forEach(r => {
          if (!byDate[r.date]) byDate[r.date] = []
          byDate[r.date].push(r)
        })
        const maxSlots = Math.max(0, ...Object.values(byDate).map(a => a.length))
        const sortedDates = Object.keys(byDate).sort((a2,b2) => parseDate(a2) - parseDate(b2))
        return { monthKey, dates: sortedDates, slots: maxSlots, byDate }
      })

    const currentMonthReels = byMonth[currentMonthKey]?.reels || []
    const weekNums = [...new Set(currentMonthReels.map(r => getWeekNum(r.date)))].sort((a,b)=>a-b)
    const weekKeys = weekNums.map(n => `Week ${n}`)

    return { pastMonthsChartData, currentMonthReels, weekKeys }
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
    views: weekReels.reduce((s,r) => {
      const latest = Number(r.views_day7)||Number(r.views_day6)||Number(r.views_day5)||
                     Number(r.views_day4)||Number(r.views_day3)||Number(r.views_day2)||Number(r.views_day1)||0
      return s + latest
    }, 0),
    revenue: weekReels.reduce((s,r)=>s+(Number(r.total_revenue)||0),0),
    clicks:  weekReels.reduce((s,r)=>s+(Number(r.total_clicks)||0),0),
    subs:    weekReels.reduce((s,r)=>s+(Number(r.total_subscription)||0),0),
    follows: weekReels.reduce((s,r)=>s+(Number(r.total_follows)||0),0),
  }), [weekReels])

  // Build per-month chart rows
  const perMonthCharts = useMemo(() => {
    return pastMonthsChartData.map(({ monthKey, dates, slots, byDate }) => {
      const rows = dates.map(date => {
        const row = { date }
        const reelsOnDay = byDate[date] || []
        const d = parseDate(date)
        row.label = `${d.toLocaleString('default',{month:'short'})} ${d.getDate()}`
        row._total = reelsOnDay.reduce((s,r) => s+(Number(r.views_day1)||0), 0)
        for (let i = 0; i < slots; i++) {
          const reel = reelsOnDay[i]
          row[`slot${i}`] = reel ? (Number(reel.views_day1)||0) : 0
          row[`reel${i}`] = reel ? reel.reel_number : null
        }
        return row
      })
      return { monthKey, rows, slots }
    })
  }, [pastMonthsChartData])

  // Weekly stacked chart (7-day horizontal)
  const weeklyChartData = useMemo(() => {
    return weekReels.map((reel, i) => {
      const gains = VIEW_DAYS.map((d, di) => {
        const val = Number(reel[d.key]) || 0
        if (val === 0) return 0
        const prev = di === 0 ? 0 : (Number(reel[VIEW_DAYS[di-1].key]) || 0)
        return val - prev
      })
      return {
        reel: `#${reel.reel_number}`,
        reelNum: reel.reel_number,
        date: reel.date,
        gains,
        cumulative: VIEW_DAYS.map(d => Number(reel[d.key])||0),
      }
    })
  }, [weekReels])

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

      {/* ── PAST MONTHS — ONE CHART PER MONTH ── */}
      {perMonthCharts.length > 0 && (
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:20 }}>Monthly Overview — Past Months</div>
          {perMonthCharts.map(({ monthKey, rows, slots }) => (
            <div key={monthKey} style={{ marginBottom:32 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
                {monthKey}
              </div>
              <div className="card" style={{ padding:'24px 16px 16px' }}>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:4, paddingLeft:8 }}>Reels Per Day — View Count Breakdown</div>
                <div style={{ fontSize:11, color:C.muted, paddingLeft:8, marginBottom:20 }}>Each segment = one reel · Height = Day 1 views · Number on top = daily total</div>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={rows} margin={{ top:24, right:10, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:9 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" interval={0}/>
                    <YAxis tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} width={44} tickFormatter={fmt}/>
                    <Tooltip content={<LightTip/>}/>
                    {Array.from({ length: slots }, (_, i) => (
                      <Bar key={i} dataKey={`slot${i}`} name={`Slot ${i+1}`} stackId="a"
                        fill={REEL_COLORS[i % REEL_COLORS.length]}
                        radius={i === slots-1 ? [4,4,0,0] : [0,0,0,0]}>
                        <LabelList dataKey={`slot${i}`} position="inside" style={{ fill:'#1a1814', fontSize:8, fontFamily:"'Jost',sans-serif" }}
                          formatter={(val) => val > 25 ? val : ''}/>
                      </Bar>
                    ))}
                    <Bar dataKey="_total" stackId="b" fill="transparent" radius={0}>
                      <LabelList dataKey="_total" position="top" style={{ fill:C.text, fontSize:9, fontWeight:600, fontFamily:"'Jost',sans-serif" }}
                        formatter={v => v > 0 ? v : ''}/>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', paddingLeft:8, marginTop:8 }}>
                  <span style={{ fontSize:10, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', alignSelf:'center' }}>Reel slot:</span>
                  {Array.from({ length: Math.min(slots, 5) }, (_,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.muted }}>
                      <span style={{ width:11, height:11, borderRadius:2, background:REEL_COLORS[i], display:'inline-block' }}/>
                      Slot {i+1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CURRENT MONTH WEEKLY ── */}
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
              <span style={{ fontSize:11 }}>Views: <b>{fmt(weekTotals.views)}</b></span>
              <span style={{ fontSize:11 }}>Revenue: <b>{fmtMoney(weekTotals.revenue)}</b></span>
              <span style={{ fontSize:11 }}>Clicks: <b>{fmt(weekTotals.clicks)}</b></span>
              <span style={{ fontSize:11 }}>Subscriptions: <b>{fmt(weekTotals.subs)}</b></span>
              <span style={{ fontSize:11 }}>Follows: <b>{fmt(weekTotals.follows)}</b></span>
            </div>
          </div>

          {/* Weekly stacked horizontal chart */}
          <div className="card" style={{ padding:'24px 16px 16px', marginBottom:28 }}>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:4, paddingLeft:8 }}>
              {currentWeek} — {weekLabel} · View Growth Per Reel
            </div>
            <div style={{ fontSize:11, color:C.muted, paddingLeft:8, marginBottom:16 }}>Each segment = views gained that day · Grey = not yet filled</div>
            <ResponsiveContainer width="100%" height={Math.max(200, weekReels.length * 52)}>
              <BarChart data={weeklyChartData} layout="vertical" margin={{ top:0, right:60, left:40, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                <XAxis type="number" tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                <YAxis type="category" dataKey="reel" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} width={40}/>
                <Tooltip content={<DarkTip/>}/>
                {VIEW_DAYS.map((d, di) => (
                  <Bar key={d.key} dataKey={`gains[${di}]`} name={d.label} stackId="a"
                    fill={di < 3 ? REEL_COLORS[di] : '#e2ddd6'}
                    radius={di === 6 ? [0,4,4,0] : [0,0,0,0]}>
                    {di === 6 && (
                      <LabelList
                        dataKey={`gains[${di}]`}
                        position="right"
                        content={(props) => {
                          const { x, y, width, height, index } = props
                          const reel = weeklyChartData[index]
                          if (!reel) return null
                          const total = reel.cumulative[reel.cumulative.findLastIndex(v => v > 0)]
                          if (!total) return null
                          return (
                            <text x={x + width + 6} y={y + height / 2 + 4}
                              fill="#1a1814" fontSize={11} fontFamily="'Jost',sans-serif" fontWeight={600}>
                              {fmt(total)}
                            </text>
                          )
                        }}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Collapsed reels */}
          <div style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
            Reels · {currentWeek} · Click to expand
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {weekReels.map((reel, i) => {
              const rc = REEL_COLORS[i % REEL_COLORS.length]
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
                      <span style={{ fontSize:11 }}>Day 1: <b>{fmt(reel.views_day1)}</b></span>
                      {reel.views_day7 > 0 && <span style={{ fontSize:11 }}>Day 7: <b>{fmt(reel.views_day7)}</b></span>}
                      <span style={{ fontSize:11 }}>Revenue: <b>{fmtMoney(reel.total_revenue)}</b></span>
                      <span style={{ fontSize:11 }}>Clicks: <b>{fmt(reel.total_clicks)}</b></span>
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
                            <div style={{ fontSize:11, marginBottom:3 }}>Clicks: <b>{fmt(reel[`${p.key}_clicks`])}</b></div>
                            <div style={{ fontSize:11, marginBottom:3 }}>Follows: <b>{fmt(reel[`${p.key}_follows`])}</b></div>
                            <div style={{ fontSize:11, marginBottom:3 }}>Subs: <b>{fmt(reel[`${p.key}_subscription`])}</b></div>
                            <div style={{ fontSize:11, marginBottom:3 }}>Tips: <b>{fmtMoney(reel[`${p.key}_tips`])}</b></div>
                            <div style={{ fontSize:11 }}>Revenue: <b>{fmtMoney(reel[`${p.key}_revenue`])}</b></div>
                          </div>
                        ))}
                        <div style={{ padding:'10px 12px', background:'#fff', borderRadius:8, borderTop:`2px solid ${rc}` }}>
                          <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>TOTAL</div>
                          <div style={{ fontSize:11, marginBottom:3 }}>Clicks: <b>{fmt(reel.total_clicks)}</b></div>
                          <div style={{ fontSize:11, marginBottom:3 }}>Follows: <b>{fmt(reel.total_follows)}</b></div>
                          <div style={{ fontSize:11, marginBottom:3 }}>Subs: <b>{fmt(reel.total_subscription)}</b></div>
                          <div style={{ fontSize:11, marginBottom:3 }}>Tips: <b>{fmtMoney(reel.total_tips)}</b></div>
                          <div style={{ fontSize:11 }}>Revenue: <b>{fmtMoney(reel.total_revenue)}</b></div>
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
