const COMPETITORS = [
  {
    name: "Amazon Echo Dot",
    url: "https://www.amazon.com/Echo-Dot-5th-Gen-Charcoal/dp/B09B8V1LZ3",
    selector: ".a-price-whole", 
    category: "Smart Speakers"
  },
  {
    name: "Google Nest Mini",
    url: "https://store.google.com/product/nest_mini",
    selector: "[data-price]",
    category: "Smart Speakers"
  },
  {
    name: "Apple HomePod Mini",
    url: "https://apple.com/homepod-mini",
    selector: ".price",
    category: "Smart Speakers",
  },
  {
    name: "Sonos One (Gen 2)",
    url: "https://sonos.com/products/one",
    selector: ".product-price",
    category: "Smart Speakers",
  },
  {
    name: "JBL Link Portable",
    url: "https://jbl.com/link-portable",
    selector: ".price-current",
    category: "Smart Speakers",
  },
  
  // Wireless Earbuds Category
  {
    name: "Apple AirPods Pro (2nd Gen)",
    url: "https://apple.com/airpods-pro",
    selector: ".price",
    category: "Wireless Earbuds",
  },
  {
    name: "Samsung Galaxy Buds Pro",
    url: "https://samsung.com/galaxy-buds-pro",
    selector: ".price-display",
    category: "Wireless Earbuds",
  },
  {
    name: "Sony WF-1000XM4",
    url: "https://sony.com/wf-1000xm4",
    selector: ".price-value",
    category: "Wireless Earbuds",
  },
  {
    name: "Bose QuietComfort Earbuds",
    url: "https://bose.com/quietcomfort-earbuds",
    selector: ".price-container",
    category: "Wireless Earbuds",
  },
];

const PRICE_CHANGE_THRESHOLD = 5; 
const EMAIL_ALERT = "suyashp271@gmail.com"; 


function checkAllCompetitorPrices() {
  console.log("Starting competitor price check...");
  
  const sheet = getOrCreateSheet("Competitor Prices");
  const logSheet = getOrCreateSheet("Price History");
  
  let alerts = [];
  let totalChecked = 0;
  let priceChanges = 0;
  
  for (let competitor of COMPETITORS) {
    try {
      const currentPrice = getCurrentPrice(competitor);
      const previousPrice = getPreviousPrice(sheet, competitor.name);

      updateCurrentPrice(sheet, competitor, currentPrice);
      
      logPriceHistory(logSheet, competitor.name, currentPrice);

      if (previousPrice && currentPrice) {
        const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
        
        if (Math.abs(changePercent) >= PRICE_CHANGE_THRESHOLD) {
          alerts.push({
            competitor: competitor.name,
            oldPrice: previousPrice,
            newPrice: currentPrice,
            change: changePercent.toFixed(1)
          });
          priceChanges++;
        }
      }
      
      totalChecked++;
      
    } catch (error) {
      console.error(`Error checking ${competitor.name}: ${error.message}`);
    }
    

    Utilities.sleep(2000);
  }
  
  if (alerts.length > 0) {
    sendPriceAlerts(alerts);
  }
  
  updateDashboard(totalChecked, priceChanges, alerts.length);
  
  console.log(`Completed: ${totalChecked} competitors checked, ${priceChanges} price changes detected`);
}

function getCurrentPrice(competitor) {

  const basePrice = getBasePriceForDemo(competitor.name);
  const randomVariation = (Math.random() - 0.5) * 20; 
  const currentPrice = Math.max(10, basePrice + randomVariation); 
  
  return Math.round(currentPrice * 100) / 100; 
}


function getBasePriceForDemo(productName) {
  const basePrices = {
    "Amazon Echo Dot": 49.99,
    "Google Nest Mini": 29.99,
    "Apple HomePod Mini": 99.99,
    "Sonos One": 199.99,
    "JBL Link Portable": 149.99
  };
  
  return basePrices[productName] || 50.00;
}


function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    setupSheetHeaders(sheet, sheetName);
  }
  
  return sheet;
}


function setupSheetHeaders(sheet, sheetName) {
  if (sheetName === "Competitor Prices") {
    sheet.getRange(1, 1, 1, 6).setValues([
      ["Product Name", "Category", "Current Price", "Previous Price", "% Change", "Last Updated"]
    ]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    sheet.getRange(1, 1, 1, 6).setBackground("#4285f4");
    sheet.getRange(1, 1, 1, 6).setFontColor("white");
  } else if (sheetName === "Price History") {
    sheet.getRange(1, 1, 1, 4).setValues([
      ["Timestamp", "Product Name", "Price", "Notes"]
    ]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    sheet.getRange(1, 1, 1, 4).setBackground("#34a853");
    sheet.getRange(1, 1, 1, 4).setFontColor("white");
  } else if (sheetName === "Dashboard") {
    sheet.getRange(1, 1, 1, 2).setValues([["Metric", "Value"]]);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold");
    sheet.getRange(1, 1, 1, 2).setBackground("#ea4335");
    sheet.getRange(1, 1, 1, 2).setFontColor("white");
  }
}


function getPreviousPrice(sheet, competitorName) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === competitorName) {
      return data[i][2]; 
    }
  }
  
  return null;
}


function updateCurrentPrice(sheet, competitor, currentPrice) {
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === competitor.name) {
      rowIndex = i;
      break;
    }
  }
  
  const previousPrice = rowIndex >= 0 ? data[rowIndex][2] : null;
  const changePercent = previousPrice ? (((currentPrice - previousPrice) / previousPrice) * 100).toFixed(1) + "%" : "New";
  
  if (rowIndex >= 0) {
    sheet.getRange(rowIndex + 1, 1, 1, 6).setValues([[
      competitor.name,
      competitor.category,
      currentPrice,
      previousPrice,
      changePercent,
      new Date()
    ]]);
  } else {
    sheet.appendRow([
      competitor.name,
      competitor.category,
      currentPrice,
      null,
      "New",
      new Date()
    ]);
  }
}


function logPriceHistory(sheet, productName, price) {
  sheet.appendRow([
    new Date(),
    productName,
    price,
    "Automated check"
  ]);
}

function sendPriceAlerts(alerts) {
  let emailBody = "🚨 COMPETITOR PRICE ALERTS\n\n";
  emailBody += "The following significant price changes were detected:\n\n";
  
  alerts.forEach(alert => {
    const direction = parseFloat(alert.change) > 0 ? "📈 INCREASE" : "📉 DECREASE";
    emailBody += `${direction}: ${alert.competitor}\n`;
    emailBody += `  Previous: $${alert.oldPrice}\n`;
    emailBody += `  Current: $${alert.newPrice}\n`;
    emailBody += `  Change: ${alert.change}%\n\n`;
  });
  
  emailBody += `Checked at: ${new Date()}\n`;
  emailBody += "This is an automated alert from your Competitor Price Tracker.";
  
  try {
    MailApp.sendEmail({
      to: EMAIL_ALERT,
      subject: ` ${alerts.length} Competitor Price Changes Detected`,
      body: emailBody
    });
    console.log(`Alert email sent for ${alerts.length} price changes`);
  } catch (error) {
    console.error("Failed to send email alert:", error.message);
  }
}

function updateDashboard(totalChecked, priceChanges, alertCount) {
  const sheet = getOrCreateSheet("Dashboard");
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  const dashboardData = [
    ["Last Check", new Date()],
    ["Competitors Monitored", totalChecked],
    ["Price Changes Detected", priceChanges],
    ["Alerts Sent", alertCount],
    ["System Status", " Operational"]
  ];
  
  sheet.getRange(2, 1, dashboardData.length, 2).setValues(dashboardData);
}

function setupDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkAllCompetitorPrices') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  ScriptApp.newTrigger('checkAllCompetitorPrices')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  
  console.log("Daily trigger set up successfully for 9:00 AM");
}

function runTest() {
  console.log("Running manual test...");
  checkAllCompetitorPrices();
  console.log("Test completed. Check your sheets and email for results.");
}
