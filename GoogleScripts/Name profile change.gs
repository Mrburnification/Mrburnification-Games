// current code for this is https://script.google.com/macros/s/AKfycbxVmWWgBASMpW-qz7JwawWQHZWWxrYpLKoBofANkm0TIRIbWSLDtWDfFsJ7bs8U6Kuuog/exec?


function doGet(e) {
  try {
    // Use your existing spreadsheet ID to open the spreadsheet
    const spreadsheetId = "1C8l4hR68yJyykjFLZ-pzF9f8mNA5l1iHClGnbGIlCSs";
    const uniqueUsersSheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("Unique_Users");

    // Check if the sheet exists
    if (!uniqueUsersSheet) {
      throw new Error("Sheet 'Unique_Users' not found.");
    }

    // Extract parameters from the URL
    const email = e.parameter.email;
    const name = e.parameter.name;
    const picture = e.parameter.picture;

    // Validate inputs
    if (!email || !name || !picture) {
      throw new Error("Missing required parameters (email, name, or picture).");
    }

    // Process the data and update the Google Sheet
    const users = uniqueUsersSheet.getDataRange().getValues(); // Fetch all user data
    let rowIndex = -1;

    // Search for the user by email (assuming email is in the first column)
    for (let i = 0; i < users.length; i++) {
      if (users[i][0] === email) { // Match email in the first column
        rowIndex = i + 1; // Adjust for 1-indexed rows in Google Sheets
        break;
      }
    }

    // If user is found, update their profile
    if (rowIndex !== -1) {
      // Assuming:
      // - Name is in the 3rd column (index 2)
      // - Picture is in the 4th column (index 3)
      uniqueUsersSheet.getRange(rowIndex, 3).setValue(name);      // Update the name in column C
      uniqueUsersSheet.getRange(rowIndex, 4).setValue(picture);   // Update the profile picture in column D

      const response = {
        status: "success",
        message: "Profile updated successfully."
      };

      // Get the callback name from the request (for JSONP)
      const callback = e.parameter.callback;

      if (callback) {
        // If there's a callback, wrap the response in it (JSONP)
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(response) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }

      // Otherwise return regular JSON
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // If user is not found, return an error
      const response = {
        status: "error",
        message: "User not found."
      };

      // Get the callback name from the request (for JSONP)
      const callback = e.parameter.callback;

      if (callback) {
        // If there's a callback, wrap the error response in it (JSONP)
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(response) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }

      // Otherwise return regular JSON
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error("Error in doGet:", error);
    const errorResponse = {
      status: "error",
      message: error.message
    };

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
