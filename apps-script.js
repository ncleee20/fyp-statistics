// ============================================================
// FYP STATISTICS — Apps Script
// Reads all "FYP STATISTICS-[MODEL]" tabs and serves as JSON
// Deploy as Web App: Execute as Me, Anyone can access
// ============================================================

const MODELS = ['JOSIE', 'EMMA', 'LOLA', 'AKASHA', 'MYLA', 'GRACE', 'MIA', 'MORA', 'BELLA', 'MILA']
const SHEET_PREFIX = 'FYP STATISTICS-'

function doGet(e) {
  const result = {}

  MODELS.forEach(model => {
    const sheetName = SHEET_PREFIX + model
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
    if (!sheet) return

    const allData = sheet.getDataRange().getValues()
    // Row 4 (index 3) has the actual column headers
    // Rows 5+ (index 4+) have data

    const reels = []

    for (let i = 4; i < allData.length; i++) {
      const row = allData[i]
      const date = row[0]
      const reelNum = row[1]

      // Skip empty rows
      if (!date || !reelNum) continue

      // Parse money values like "$25" → 25
      const parseMoney = (val) => {
        if (!val && val !== 0) return 0
        return parseFloat(String(val).replace(/[$,]/g, '')) || 0
      }

      const parseNum = (val) => {
        if (!val && val !== 0) return 0
        return parseInt(val) || 0
      }

      // Format date
      let dateStr = ''
      if (date instanceof Date) {
        dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      } else {
        dateStr = String(date)
      }

      reels.push({
        date:        dateStr,
        reel_number: parseNum(reelNum),
        type:        String(row[2] || ''),

        // VIEWS — columns E to M (index 4–12)
        views_day1:  parseNum(row[4]),
        views_day2:  parseNum(row[5]),
        views_day3:  parseNum(row[6]),
        views_day4:  parseNum(row[7]),
        views_day5:  parseNum(row[8]),
        views_day6:  parseNum(row[9]),
        views_day7:  parseNum(row[10]),
        views_week2: parseNum(row[11]),
        views_week3: parseNum(row[12]),

        // FANSLY FYP — columns N to R (index 13–17)
        fyp_clicks:       parseNum(row[13]),
        fyp_follows:      parseNum(row[14]),
        fyp_subscription: parseNum(row[15]),
        fyp_tips:         parseMoney(row[16]),
        fyp_revenue:      parseMoney(row[17]),

        // FANSLY SUGGESTION — columns S to W (index 18–22)
        sug_clicks:       parseNum(row[18]),
        sug_follows:      parseNum(row[19]),
        sug_subscription: parseNum(row[20]),
        sug_tips:         parseMoney(row[21]),
        sug_revenue:      parseMoney(row[22]),

        // FANSLY SEARCH — columns X to AB (index 23–27)
        sea_clicks:       parseNum(row[23]),
        sea_follows:      parseNum(row[24]),
        sea_subscription: parseNum(row[25]),
        sea_tips:         parseMoney(row[26]),
        sea_revenue:      parseMoney(row[27]),

        // TOTAL — columns AC to AG (index 28–32)
        total_clicks:       parseNum(row[28]),
        total_follows:      parseNum(row[29]),
        total_subscription: parseNum(row[30]),
        total_tips:         parseMoney(row[31]),
        total_revenue:      parseMoney(row[32]),
      })
    }

    result[model.toLowerCase()] = reels
  })

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
}
