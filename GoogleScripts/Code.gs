
// current code for this is https://script.google.com/macros/s/AKfycbzwdwbzI366EE2yS4XbO3nl3fkoRnjm_VEmiJzDDBqMYxykfM4hFpdw3fwOei6Tk0ZmNg/exec

function doGet(e) {
  try {
    const spreadsheetId = "1C8l4hR68yJyykjFLZ-pzF9f8mNA5l1iHClGnbGIlCSs";
    const uniqueUsersSheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("Unique_Users");
    const loginHistorySheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("Login_History");

    if (!uniqueUsersSheet || !loginHistorySheet) {
      throw new Error("Sheets 'Unique_Users' or 'Login_History' not found.");
    }

    const email = e.parameter.email;
    if (!email) throw new Error("Missing required field: email.");

    const data = {
      email: email,
      name: e.parameter.name || "",
      picture: e.parameter.picture || "",
      locale: e.parameter.locale || "",
      loginTime: e.parameter.loginTime || new Date().toISOString(),
      type: e.parameter.type || "Unknown"
    };

    const userId = findOrCreateUser(uniqueUsersSheet, data);
    logLogin(loginHistorySheet, userId, data);

    const response = { 
      status: "success", 
      message: "Login processed successfully", 
      userId: userId 
    };

    // Get the callback name from the request
    const callback = e.parameter.callback;
    
    // If there's a callback, wrap the response in it (JSONP)
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(response) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Otherwise return regular JSON
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Error in doGet:", error);
    const errorResponse = { status: "error", message: error.message };
    
    // Handle errors with JSONP if callback is provided
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(errorResponse) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}