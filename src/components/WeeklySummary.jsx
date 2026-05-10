import { useMemo } from 'react'
import { C, TOTAL_METRICS, fmt, fmtMoney, getColor } from '../lib/constants'

// Parse MM-DD-YYYY
function parseDate(dateStr) {
  if (!dateStr) return new Date(0)
  const s = String(dateStr).trim()
  const parts = s.split('-')
  if (parts.length === 3 && parts[2].length === 4) {
    return new Date(`${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`)
  }
  return new Date(s)
}

function getMonthKey(dateStr) {
  const d = parseDate(dateStr)
  return `${d.toLocaleString('default',{month:'long'})} ${d.getFullYear()}`
}

function getMonthSort(dateStr) {
  const d = parseDate(dateStr)
  return d.getFullYear()*100 + d.getMonth()
}

function getWeekOfMonth(dateStr) {
  const d = parseDate(dateStr)
  return Math.ceil(d.getDate() / 7)
}

function getWeekRange(weekNum, year, month) {
  const startDay = (weekNum - 1) * 7 + 1
  const endDay = Math.min(weekNum * 7, new Date(year, month + 1, 0).getDate())
  return { startDay, endDay }
}

export default function WeeklySummary({ allData, models }) {
  const structured = useMemo(() => {
    // Build: { monthKey: { sort, monthDate, weeks: { weekNum: { model: reels[] } } } }
    const months = {}

    models.forEach(model => {
      const reels = allData[model] || []
      reels.forEach(r => {
        if (!r.date) return
        const mk = getMonthKey(r.date)
        const ms = getMonthSort(r.date)
        const wk = getWeekOfMonth(r.date)
        const d  = parseDate(r.date)

        if (!months[mk]) months[mk] = { sort:ms, year:d.getFullYear(), month:d.getMonth(), weeks:{} }
        if (!months[mk].weeks[wk]) months[mk].weeks[wk] = {}
        if (!months[mk].weeks[wk][model]) months[mk].weeks[wk][model] = []
        months[mk].weeks[wk][model].push(r)
      })
    })

    return Object.entries(months)
      .sort((a,b) => a[1].sort - b[1].sort)
      .map(([monthKey, v]) => ({
        monthKey,
        year: v.year,
        month: v.month,
        weeks: Object.entries(v.weeks)
          .sort((a,b) => Number(a[0]) - Number(b[0]))
          .map(([weekNum, modelData]) => ({
            weekNum: Number(weekNum),
            modelData,
          }))
      }))
  }, [allData, models])

  if (!structured.length) return (
    <div className="fade-in">
      <h1 className="serif" style={{fontSize:36,fontWeight:400,marginBottom:4}}>Weekly Summary</h1>
      <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:32}}>Totals per model · by week</p>
      <div style={{color:C.muted,textAlign:'center',padding:48}}>No data yet. Connect your Google Sheet to get started.</div>
    </div>
  )

  return (
    <div className="fade-in">
      <h1 className="serif" style={{fontSize:36,fontWeight:400,marginBottom:4}}>Weekly Summary</h1>
      <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:32}}>Totals per model · by week</p>

      {structured.map(({ monthKey, year, month, weeks }) => (
        <div key={monthKey} style={{marginBottom:48}}>
          {/* Month header */}
          <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',Georgia,serif",fontWeight:600,marginBottom:20,paddingBottom:10,borderBottom:`2px solid ${C.border}`}}>
            {monthKey}
          </div>

          {weeks.map(({ weekNum, modelData }) => {
            const { startDay, endDay } = getWeekRange(weekNum, year, month)
            const monthShort = new Date(year, month, 1).toLocaleString('default',{month:'long'})
            const weekLabel = `${monthShort} ${startDay}–${endDay}`

            return (
              <div key={weekNum} style={{marginBottom:32}}>
                {/* Week header */}
                <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:'uppercase',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontWeight:600,color:C.text}}>Week {weekNum}</span>
                  <span>·</span>
                  <span>{weekLabel}</span>
                </div>

                {/* Model cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
                  {models.map(model => {
                    const reels = modelData[model] || []
                    if (!reels.length) return null
                    const color = getColor(model)

                    // Latest views per reel summed
                    const totalViews = reels.reduce((s,r) => {
                      const latest = Number(r.views_day7)||Number(r.views_day6)||Number(r.views_day5)||
                                     Number(r.views_day4)||Number(r.views_day3)||Number(r.views_day2)||
                                     Number(r.views_day1)||0
                      return s + latest
                    }, 0)

                    const totals = {}
                    TOTAL_METRICS.forEach(m => {
                      totals[m.key] = reels.reduce((s,r) => s+(Number(r[m.key])||0), 0)
                    })

                    return (
                      <div key={model} className="card" style={{padding:'16px 18px',borderTop:`3px solid ${color}`}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:color,display:'inline-block'}}/>
                            <span className="serif" style={{fontSize:16,fontWeight:600,textTransform:'capitalize'}}>{model}</span>
                          </div>
                          <span style={{fontSize:10,color:C.muted}}>{reels.length} reels</span>
                        </div>

                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <span style={{fontSize:11,color:C.muted}}>👁 Views (latest)</span>
                          <span style={{fontSize:12,fontWeight:600}}>{fmt(totalViews)}</span>
                        </div>
                        {TOTAL_METRICS.map(m => (
                          <div key={m.key} style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                            <span style={{fontSize:11,color:C.muted}}>{m.icon} {m.label.replace('Total ','')}</span>
                            <span style={{fontSize:12,fontWeight:600}}>
                              {m.key.includes('revenue')||m.key.includes('tips') ? fmtMoney(totals[m.key]) : fmt(totals[m.key])}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
