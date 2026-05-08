export const C = {
  bg:'#f0ede8', bgCard:'#ffffff', bgLight:'#f7f5f1',
  border:'#e2ddd6', text:'#1a1814', muted:'#8a8178',
  danger:'#c0645a', success:'#5a9e7a',
}

export const MODELS = ['josie','emma','lola','akasha','myla','grace','mia','mora','bella','mila']

export const MODEL_COLORS = {
  josie:'#e8a87c', emma:'#c084a0', lola:'#6db89e', akasha:'#e8c84a',
  myla:'#a084c8', grace:'#6aa8d4', mia:'#e87c7c', mora:'#84b8d4',
  bella:'#d4a0c8', mila:'#e8a040',
}

export const getColor = (name) => MODEL_COLORS[name?.toLowerCase()] || '#8a8178'

// View growth days for the sparkline chart per reel
export const VIEW_DAYS = [
  { key:'views_day1', label:'Day 1' },
  { key:'views_day2', label:'Day 2' },
  { key:'views_day3', label:'Day 3' },
  { key:'views_day4', label:'Day 4' },
  { key:'views_day5', label:'Day 5' },
  { key:'views_day6', label:'Day 6' },
  { key:'views_day7', label:'Day 7' },
]

// Summary metrics from TOTAL columns
export const TOTAL_METRICS = [
  { key:'total_clicks',       label:'Total Clicks',        icon:'🔗' },
  { key:'total_follows',      label:'Total Follows',       icon:'👥' },
  { key:'total_subscription', label:'Total Subscriptions', icon:'⭐' },
  { key:'total_tips',         label:'Total Tips',          icon:'💸' },
  { key:'total_revenue',      label:'Total Revenue',       icon:'💰' },
]

// Platform breakdown
export const PLATFORMS = [
  { key:'fyp', label:'Fansly FYP',        color:'#e8a87c' },
  { key:'sug', label:'Fansly Suggestion', color:'#c084a0' },
  { key:'sea', label:'Fansly Search',     color:'#6db89e' },
]

export const fmt = (n) => {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M'
  if (n >= 1000) return (n/1000).toFixed(1)+'k'
  return Number(n).toLocaleString()
}

export const fmtMoney = (n) => {
  if (!n && n !== 0) return '—'
  if (n === 0) return '$0'
  return '$'+Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})
}

export const DEFAULT_USERS = [
  { id:'1', name:'Admin', username:'admin', password:'admin123', role:'admin', createdAt: new Date().toISOString().split('T')[0] },
]

// Generate demo reel data matching exact sheet structure
export function makeDemo() {
  const result = {}
  const dates = ['2026-03-19','2026-03-20','2026-03-21','2026-03-22','2026-03-23','2026-03-24','2026-03-25',
                 '2026-03-26','2026-03-27','2026-03-28','2026-03-29','2026-03-30']
  let reelNum = 100

  MODELS.forEach(model => {
    const reels = []
    dates.forEach(date => {
      const perDay = Math.floor(Math.random()*2)+1
      for (let r=0; r<perDay; r++) {
        const d1 = Math.floor(Math.random()*150)+20
        reels.push({
          date, reel_number: reelNum++, type:'Social Media Reel',
          views_day1: d1,
          views_day2: Math.floor(d1*1.1 + Math.random()*20),
          views_day3: Math.floor(d1*1.2 + Math.random()*30),
          views_day4: Math.floor(d1*1.25+ Math.random()*20),
          views_day5: Math.floor(d1*1.3 + Math.random()*25),
          views_day6: Math.floor(d1*1.35+ Math.random()*20),
          views_day7: Math.floor(d1*1.4 + Math.random()*30),
          views_week2: Math.floor(d1*1.5 + Math.random()*40),
          views_week3: Math.floor(d1*1.6 + Math.random()*50),
          fyp_clicks: Math.floor(Math.random()*15),
          fyp_follows: Math.floor(Math.random()*8),
          fyp_subscription: Math.floor(Math.random()*3),
          fyp_tips: Math.floor(Math.random()*30),
          fyp_revenue: Math.floor(Math.random()*50),
          sug_clicks: Math.floor(Math.random()*10),
          sug_follows: Math.floor(Math.random()*5),
          sug_subscription: Math.floor(Math.random()*2),
          sug_tips: Math.floor(Math.random()*20),
          sug_revenue: Math.floor(Math.random()*30),
          sea_clicks: Math.floor(Math.random()*5),
          sea_follows: Math.floor(Math.random()*3),
          sea_subscription: Math.floor(Math.random()*1),
          sea_tips: Math.floor(Math.random()*10),
          sea_revenue: Math.floor(Math.random()*15),
          total_clicks: 0, total_follows: 0, total_subscription: 0, total_tips: 0, total_revenue: 0,
        })
      }
    })
    // Compute totals
    reels.forEach(r => {
      r.total_clicks       = r.fyp_clicks + r.sug_clicks + r.sea_clicks
      r.total_follows      = r.fyp_follows + r.sug_follows + r.sea_follows
      r.total_subscription = r.fyp_subscription + r.sug_subscription + r.sea_subscription
      r.total_tips         = r.fyp_tips + r.sug_tips + r.sea_tips
      r.total_revenue      = r.fyp_revenue + r.sug_revenue + r.sea_revenue
    })
    result[model] = reels
  })
  return result
}
