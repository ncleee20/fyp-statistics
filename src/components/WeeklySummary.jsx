import { useMemo } from 'react'
import { C, TOTAL_METRICS, fmt, fmtMoney, getColor } from '../lib/constants'

function groupByWeek(dates) {
  const weeks = []
  for (let i=0;i<dates.length;i+=7) weeks.push(dates.slice(i,i+7))
  return weeks
}

export default function WeeklySummary({ allData, models }) {
  const allDates = useMemo(() => {
    const d = new Set()
    models.forEach(m => (allData[m]||[]).forEach(r => d.add(r.date)))
    return [...d].sort()
  }, [allData, models])

  const weeks = groupByWeek(allDates)

  if (!weeks.length) return (
    <div className="fade-in">
      <h1 className="serif" style={{fontSize:36,fontWeight:400,marginBottom:4}}>Weekly Summary</h1>
      <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:32}}>Performance report by week</p>
      <div style={{color:C.muted,textAlign:'center',padding:48}}>No data yet. Connect your Google Sheet to get started.</div>
    </div>
  )

  return (
    <div className="fade-in">
      <h1 className="serif" style={{fontSize:36,fontWeight:400,marginBottom:4}}>Weekly Summary</h1>
      <p style={{color:C.muted,fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:32}}>Totals per model · by week</p>

      {weeks.map((week,wi)=>{
        const label=`${week[0]} – ${week[week.length-1]}`
        return (
          <div key={wi} style={{marginBottom:36}}>
            <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:'uppercase',marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
              Week {wi+1} &nbsp;·&nbsp; {label}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
              {models.map(model=>{
                const reels=(allData[model]||[]).filter(r=>week.includes(r.date))
                if(!reels.length) return null
                const color=getColor(model)
                const totals={}
                TOTAL_METRICS.forEach(m=>{totals[m.key]=reels.reduce((s,r)=>s+(Number(r[m.key])||0),0)})
                const totalViews=reels.reduce((s,r)=>s+(Number(r.views_day1)||0),0)
                const reelCount=reels.length
                return (
                  <div key={model} className="card" style={{padding:'16px 18px',borderTop:`3px solid ${color}`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:8,height:8,borderRadius:'50%',background:color,display:'inline-block'}}/>
                        <span className="serif" style={{fontSize:16,fontWeight:600,textTransform:'capitalize'}}>{model}</span>
                      </div>
                      <span style={{fontSize:10,color:C.muted}}>{reelCount} reels</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:11,color:C.muted}}>👁 Views (Day 1)</span>
                      <span style={{fontSize:12,fontWeight:600}}>{fmt(totalViews)}</span>
                    </div>
                    {TOTAL_METRICS.map(m=>(
                      <div key={m.key} style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                        <span style={{fontSize:11,color:C.muted}}>{m.icon} {m.label.replace('Total ','')}</span>
                        <span style={{fontSize:12,fontWeight:600}}>
                          {m.key.includes('revenue')||m.key.includes('tips')?fmtMoney(totals[m.key]):fmt(totals[m.key])}
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
  )
}
