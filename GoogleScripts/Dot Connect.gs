// current code for this is https://script.google.com/macros/s/AKfycby7kDY1s_gjB0Zq0X5YZUCwWS1TXior3xeErIR789QyvnxoxEh-wai4N0cp7cJrRbJ_ng/exec


function doGet(e) {
  const spreadsheetId = "1C8l4hR68yJyykjFLZ-pzF9f8mNA5l1iHClGnbGIlCSs";
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const action = e.parameter.action;
  const email = e.parameter.email;

  try {
    if (action === 'check') {
      return handleCheckRequest(e, ss);
    } else if (action === 'submit') {
      return handleSubmitRequest(e, ss);
    } else if (action === 'checkDaily') {
      return checkDailyChallenge(email);
    } else if (action === 'submitDaily') {
      const score = e.parameter.score;
      return submitDailyChallenge(email, score);
    }
    return createErrorResponse('Invalid action parameter');
  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function handleCheckRequest(e, ss) {
  const sheet = ss.getSheetByName("Dot_Connect");
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const today = new Date().toISOString().split('T')[0];
  const userEmail = e.parameter.email;
  const gameName = e.parameter.game;

  const existingEntry = data.find(row => 
    row[headers.indexOf('email')] === userEmail && 
    row[headers.indexOf('Date')].toISOString().split('T')[0] === today && 
    row[headers.indexOf('Challenge Complete')] === "TRUE"
  );

  return ContentService.createTextOutput(JSON.stringify({
    available: !existingEntry,
    bestScore: existingEntry ? existingEntry[headers.indexOf('Final Score')] : null
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleSubmitRequest(e, ss) {
  const sheet = ss.getSheetByName("Dot_Connect");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const newRow = headers.map(header => {
    switch(header) {
      case 'email': return e.parameter.email;
      case 'Challenge Complete': return "TRUE";
      case 'Date': return new Date().toISOString();
      case 'Final Score': return parseFloat(e.parameter.finalScore);
      case 'Total Time': return parseFloat(e.parameter.totalTime);
      case 'Total Length': return parseFloat(e.parameter.totalLength);
      default: 
        if(header.startsWith('Time to ')) {
          const index = parseInt(header.split(' ')[2]) - 1;
          return parseFloat(e.parameter.segmentTimes.split(',')[index]) || 0;
        }
        return '';
    }
  });

  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkDailyChallenge(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DailyChallenges');
  const today = new Date().toDateString();
  
  // Find if user has played today
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email && data[i][1] === today) {
      return ContentService.createTextOutput(JSON.stringify({
        hasPlayed: true,
        score: data[i][2]
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    hasPlayed: false
  })).setMimeType(ContentService.MimeType.JSON);
}

function submitDailyChallenge(email, score) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DailyChallenges');
  const today = new Date().toDateString();
  
  // Add new row with player's daily challenge attempt
  sheet.appendRow([email, today, score]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    error: true,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}