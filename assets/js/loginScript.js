// Login functionality
function handleCredentialResponse(response) {
    // Decode the JWT token to get user data
    const data = JSON.parse(atob(response.credential.split(".")[1]));

    // Store user data in localStorage
    localStorage.setItem("playerEmail", data.email);
    localStorage.setItem("playerName", data.name);
    localStorage.setItem("playerPicture", data.picture); // Store profile picture URL
    localStorage.setItem("playerLocale", data.locale); // Store user's language/locale
    localStorage.setItem("loginTime", new Date().toISOString()); // Store login timestamp

    // Send login data to Google Sheets
    logLoginData({
        email: data.email,
        name: data.name,
        picture: data.picture,
        locale: data.locale,
        loginTime: new Date().toISOString(),
        type: "Google"
    });

    // Redirect to menu
    window.location.href = "pages/menu.html";
}

function skipLogin() {
    // Store guest data
    localStorage.setItem("playerEmail", "Guest");
    localStorage.setItem("playerName", "Guest");
    localStorage.setItem("loginTime", new Date().toISOString());

    // Log guest login
    logLoginData({
        email: "Guest",
        name: "Guest",
        loginTime: new Date().toISOString(),
        type: "Guest"
    });

    // Redirect to menu
    window.location.href = "pages/menu.html";
}

function logLoginData(data) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyV1MQXcB79yRGbBtD_d_7IXU5LOCSegwuFwfQfcy-fytb3KtC-z8lVH4qEEps1YTjD7A/exec";
  
    fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(result => {
      console.log("Login data logged:", result);
      window.location.href = "pages/menu.html"; // Redirect after logging
    })
    .catch(error => {
      console.error("Error logging data:", error);
      alert("Failed to log data. Check console for details.");
    });
  }
  