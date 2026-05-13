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

export const VIEW_DAYS = [
  { key:'views_day1',  label:'Day 1'    },
  { key:'views_day2',  label:'Day 2'    },
  { key:'views_day3',  label:'Day 3'    },
  { key:'views_day4',  label:'Day 4'    },
  { key:'views_day5',  label:'Day 5'    },
  { key:'views_day6',  label:'Day 6'    },
  { key:'views_day7',  label:'Day 7'    },
  { key:'views_week2', label:'2nd Week' },
  { key:'views_week3', label:'3rd Week' },
]

export const TOTAL_METRICS = [
  { key:'total_clicks',       label:'Total Clicks',        icon:'🔗' },
  { key:'total_follows',      label:'Total Follows',       icon:'👥' },
  { key:'total_subscription', label:'Total Subscriptions', icon:'⭐' },
  { key:'total_tips',         label:'Total Tips',          icon:'💸' },
  { key:'total_revenue',      label:'Total Revenue',       icon:'💰' },
]

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

// Parse MM-DD-YYYY date string into a JS Date object
export function parseDate(dateStr) {
  if (!dateStr) return new Date(0)
  const s = String(dateStr).trim()
  // Handle MM-DD-YYYY
  const parts = s.split('-')
  if (parts.length === 3) {
    const [a, b, c] = parts
    if (c.length === 4) {
      // MM-DD-YYYY
      return new Date(`${c}-${a.padStart(2,'0')}-${b.padStart(2,'0')}`)
    }
  }
  return new Date(s)
}

// Get month key from MM-DD-YYYY string e.g. "May 2026"
export function getMonthKey(dateStr) {
  const d = parseDate(dateStr)
  return `${d.toLocaleString('default',{month:'long'})} ${d.getFullYear()}`
}

// Get sort key from MM-DD-YYYY string
export function getMonthSort(dateStr) {
  const d = parseDate(dateStr)
  return d.getFullYear()*100 + d.getMonth()
}

// Get week number (1-4) from MM-DD-YYYY string
export function getWeekNum(dateStr) {
  const d = parseDate(dateStr)
  return Math.ceil(d.getDate()/7)
}

export const DEFAULT_USERS = [
  { id:'1', name:'Admin', username:'admin', password:'admin123', role:'admin', createdAt: new Date().toISOString().split('T')[0] },
]

// Demo data
export function makeDemo() {
  const result = {}
  const dates = ['05-01-2026','05-02-2026','05-03-2026','05-04-2026','05-05-2026','05-06-2026','05-07-2026',
                 '05-08-2026','05-09-2026','05-10-2026','05-11-2026','05-12-2026','05-13-2026','05-14-2026',
                 '04-01-2026','04-08-2026','04-15-2026','04-22-2026',
                 '03-01-2026','03-15-2026','02-01-2026','02-15-2026']
  let reelNum = 600

  MODELS.forEach(model => {
    const reels = []
    dates.forEach(date => {
      const perDay = Math.floor(Math.random()*2)+1
      for (let r=0; r<perDay; r++) {
        const d1 = Math.floor(Math.random()*150)+20
        const reel = {
          date, reel_number: reelNum++, type:'Social Media Reel',
          views_day1: d1,
          views_day2: Math.floor(d1*1.1+Math.random()*20),
          views_day3: Math.floor(d1*1.2+Math.random()*30),
          views_day4: Math.floor(d1*1.25+Math.random()*20),
          views_day5: Math.floor(d1*1.3+Math.random()*25),
          views_day6: Math.floor(d1*1.35+Math.random()*20),
          views_day7: Math.floor(d1*1.4+Math.random()*30),
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
          total_clicks:0, total_follows:0, total_subscription:0, total_tips:0, total_revenue:0,
        }
        reel.total_clicks       = reel.fyp_clicks + reel.sug_clicks + reel.sea_clicks
        reel.total_follows      = reel.fyp_follows + reel.sug_follows + reel.sea_follows
        reel.total_subscription = reel.fyp_subscription + reel.sug_subscription + reel.sea_subscription
        reel.total_tips         = reel.fyp_tips + reel.sug_tips + reel.sea_tips
        reel.total_revenue      = reel.fyp_revenue + reel.sug_revenue + reel.sea_revenue
        reels.push(reel)
      }
    })
    result[model] = reels
  })
  return result
}
