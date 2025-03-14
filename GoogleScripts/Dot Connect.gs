// current code for this is https://script.google.com/macros/s/AKfycbyFxBg01iC1DpXbWoODS8dlGmDr0tOmcV4caiDs4EPP-NzCYwq9JioPWVKurKqsIpNJAw/exec?


function doGet(e) {
  const spreadsheetId = "1C8l4hR68yJyykjFLZ-pzF9f8mNA5l1iHClGnbGIlCSs";
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const action = e.parameter.action;

  try {
    if (action === 'check') {
      return handleCheckRequest(e, ss);
    } else if (action === 'submit') {
      return handleSubmitRequest(e, ss);
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

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    error: true,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}