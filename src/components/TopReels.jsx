import { useState, useMemo } from 'react'
import { C, MODELS, getColor, fmt, fmtMoney } from '../lib/constants'

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

function getRankBadgeColor(rank) {
  if (rank === 1) return { bg:'#c8a040', text:'#fff' }
  if (rank === 2) return { bg:'#a0a0a0', text:'#fff' }
  if (rank === 3) return { bg:'#b87840', text:'#fff' }
  return { bg:C.bgLight, text:C.muted }
}

export default function TopReels({ allData, models }) {
  // Build all months across all models
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

  // Top 5 reels per model for active month
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
          <button key={mk} onClick={() => setActiveMonth(mk)}
            className={`chip ${currentMonth===mk?'active':''}`}>
            {mk}
          </button>
        ))}
      </div>

      {/* Models */}
      <div style={{display:'flex',flexDirection:'column',gap:40}}>
        {topReelsByModel.map(({ model, top5 }) => {
          const color = getColor(model)
          return (
            <div key={model}>
              {/* Model header */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,paddingBottom:12,borderBottom:`2px solid ${C.border}`}}>
                <span style={{width:12,height:12,borderRadius:'50%',background:color,display:'inline-block'}}/>
                <span className="serif" style={{fontSize:24,fontWeight:600,textTransform:'capitalize'}}>{model}</span>
                <span style={{fontSize:11,color:C.muted,marginLeft:4}}>{currentMonth} · Top {top5.length}</span>
              </div>

              {/* Top 5 grid */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
                {top5.map((reel, i) => {
                  const rank = i + 1
                  const badge = getRankBadgeColor(rank)
                  const latestViews = getLatestViews(reel)
                  const totalRevenue = Number(reel.total_revenue)||0
                  const totalClicks = Number(reel.total_clicks)||0

                  return (
                    <div key={reel.reel_number} className="card hover-lift"
                      style={{overflow:'hidden',borderTop:`3px solid ${color}`}}>

                      {/* Thumbnail */}
                      <div style={{position:'relative',width:'100%',paddingTop:'56.25%',background:C.bgLight,borderBottom:`1px solid ${C.border}`}}>
                        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8}}>
                          <div style={{width:48,height:48,borderRadius:'50%',background:C.border,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontSize:20}}>🎬</span>
                          </div>
                          <span style={{fontSize:10,color:C.muted,letterSpacing:1.5,textTransform:'uppercase'}}>Thumbnail coming soon</span>
                        </div>
                        {/* Rank badge */}
                        <div style={{position:'absolute',top:10,left:10,width:28,height:28,borderRadius:'50%',background:badge.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span style={{fontSize:11,fontWeight:700,color:badge.text}}>#{rank}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{padding:'14px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                          <div>
                            <span className="serif" style={{fontSize:17,fontWeight:600}}>Reel #{reel.reel_number}</span>
                            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{reel.date}</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div className="serif" style={{fontSize:22,fontWeight:400,color}}>{fmt(latestViews)}</div>
                            <div style={{fontSize:10,color:C.muted}}>total views</div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:13,fontWeight:600}}>{fmt(totalClicks)}</div>
                            <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Clicks</div>
                          </div>
                          <div style={{textAlign:'center',borderLeft:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`}}>
                            <div style={{fontSize:13,fontWeight:600}}>{fmt(Number(reel.total_follows)||0)}</div>
                            <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Follows</div>
                          </div>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:13,fontWeight:600,color:C.success}}>{fmtMoney(totalRevenue)}</div>
                            <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase'}}>Revenue</div>
                          </div>
                        </div>

                        {/* View breakdown */}
                        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>
                          {[
                            {label:'D1',val:reel.views_day1},
                            {label:'D7',val:reel.views_day7},
                            {label:'W2',val:reel.views_week2},
                            {label:'W3',val:reel.views_week3},
                          ].map(({label,val}) => {
                            const v = Number(val)||0
                            if (!v) return null
                            return (
                              <span key={label} style={{fontSize:10,padding:'2px 7px',background:C.bgLight,borderRadius:20,border:`1px solid ${C.border}`,color:C.muted}}>
                                {label}: <b style={{color:C.text}}>{fmt(v)}</b>
                              </span>
                            )
                          })}
                        </div>
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
