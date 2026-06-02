import { useState, useMemo } from 'react'
import { C, getColor, fmt, fmtMoney } from '../lib/constants'

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

function getLatestViews(reel) {
  return Number(reel.views_week3)||Number(reel.views_week2)||
         Number(reel.views_day7)||Number(reel.views_day6)||Number(reel.views_day5)||
         Number(reel.views_day4)||Number(reel.views_day3)||Number(reel.views_day2)||
         Number(reel.views_day1)||0
}

const RANK_COLORS = ['#c8a040','#a0a0a0','#b87840','#8a8178','#8a8178']
const RANK_LABELS = ['1st','2nd','3rd','4th','5th']

export default function TopReels({ allData, models }) {
  const allMonths = useMemo(() => {
    const months = {}
    models.forEach(model => {
      const reels = allData[model] || []
      reels.forEach(r => {
        if (!r.date) return
        const mk = getMonthKey(r.date)
        const ms = getMonthSort(r.date)
        if (!months[mk]) months[mk] = ms
      })
    })
    return Object.entries(months)
      .sort((a,b) => a[1] - b[1])
      .map(([mk]) => mk)
  }, [allData, models])

  const [activeMonth, setActiveMonth] = useState(() => allMonths[allMonths.length-1] || '')
  const currentMonth = allMonths.includes(activeMonth) ? activeMonth : allMonths[allMonths.length-1]

  const topReelsByModel = useMemo(() => {
    return models.map(model => {
      const reels = (allData[model] || []).filter(r => getMonthKey(r.date) === currentMonth)
      const sorted = [...reels].sort((a,b) => getLatestViews(b) - getLatestViews(a))
      return { model, top5: sorted.slice(0, 5) }
    }).filter(({ top5 }) => top5.length > 0)
  }, [allData, models, currentMonth])

  if (!allMonths.length) return (
    <div className="fade-in">
      <h1 className="serif" style={{fontSize:36,fontWeight:400,marginBottom:4}}>Top Reels</h1>
      <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:32}}>Top 5 per model · by month</p>
      <div style={{color:C.muted,textAlign:'center',padding:48}}>No data yet. Connect your Google Sheet to get started.</div>
    </div>
  )

  return (
    <div className="fade-in">
      <h1 className="serif" style={{fontSize:36,fontWeight:400,marginBottom:4}}>Top Reels</h1>
      <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:24}}>Top 5 per model · ranked by total views</p>

      {/* Month tabs */}
      <div style={{display:'flex',gap:8,marginBottom:32,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:'uppercase',marginRight:4}}>MONTH</span>
        {allMonths.map(mk => (
          <button key={mk} onClick={() => setActiveMonth(mk)} className={`chip ${currentMonth===mk?'active':''}`}>
            {mk}
          </button>
        ))}
      </div>

      {/* Models */}
      <div style={{display:'flex',flexDirection:'column',gap:32}}>
        {topReelsByModel.map(({ model, top5 }) => {
          const color = getColor(model)
          return (
            <div key={model}>
              {/* Model header */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,paddingBottom:10,borderBottom:`2px solid ${C.border}`}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:color,display:'inline-block'}}/>
                <span className="serif" style={{fontSize:22,fontWeight:600,textTransform:'capitalize'}}>{model}</span>
                <span style={{fontSize:11,color:C.muted}}>{currentMonth}</span>
              </div>

              {/* Top 5 list */}
              <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',background:C.bgCard}}>
                {top5.map((reel, i) => {
                  const latestViews = getLatestViews(reel)
                  return (
                    <div key={reel.reel_number}
                      style={{display:'grid',gridTemplateColumns:'40px 1fr 100px 100px 100px 100px 100px',gap:12,padding:'12px 20px',borderBottom:i<top5.length-1?`1px solid ${C.border}`:'none',alignItems:'center'}}>
                      {/* Rank */}
                      <div style={{width:28,height:28,borderRadius:'50%',background:RANK_COLORS[i],display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontSize:10,fontWeight:700,color:'#fff'}}>{RANK_LABELS[i]}</span>
                      </div>
                      {/* Reel info */}
                      <div>
                        <span className="serif" style={{fontSize:16,fontWeight:600}}>Reel #{reel.reel_number}</span>
                        <span style={{fontSize:11,color:C.muted,marginLeft:8}}>{reel.date}</span>
                      </div>
                      {/* Views */}
                      <div style={{textAlign:'right'}}>
                        <div className="serif" style={{fontSize:18,fontWeight:400,color}}>{fmt(latestViews)}</div>
                        <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Views</div>
                      </div>
                      {/* Clicks */}
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:14,fontWeight:600}}>{fmt(Number(reel.total_clicks)||0)}</div>
                        <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Clicks</div>
                      </div>
                      {/* Follows */}
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:14,fontWeight:600}}>{fmt(Number(reel.total_follows)||0)}</div>
                        <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Follows</div>
                      </div>
                      {/* Subs */}
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:14,fontWeight:600}}>{fmt(Number(reel.total_subscription)||0)}</div>
                        <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Subs</div>
                      </div>
                      {/* Revenue */}
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:14,fontWeight:600,color:C.success}}>{fmtMoney(Number(reel.total_revenue)||0)}</div>
                        <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Revenue</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
