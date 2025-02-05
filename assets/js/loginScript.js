function handleCredentialResponse(response) {
    // Decode the JWT token to get user data
    const data = JSON.parse(atob(response.credential.split(".")[1]));

    // Store user data in localStorage
    localStorage.setItem("playerEmail", data.email);
    localStorage.setItem("playerName", data.name);
    localStorage.setItem("playerPicture", data.picture);
    localStorage.setItem("playerLocale", data.locale);
    localStorage.setItem("loginTime", new Date().toISOString());

    // Send login data to Google Sheets
    logLoginData({
        email: data.email,
        name: data.name,
        picture: data.picture,
        locale: data.locale,
        loginTime: new Date().toISOString(),
        type: "Google"
    });
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
}

function logLoginData(data) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyV1MQXcB79yRGbBtD_d_7IXU5LOCSegwuFwfQfcy-fytb3KtC-z8lVH4qEEps1YTjD7A/exec";
    
    // Don't redirect immediately - wait for the fetch to complete
    return fetch(scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            // Add additional CORS headers
            "Accept": "application/json"
        },
        // Prevent redirect until data is logged
        redirect: "follow",
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log("Login data logged successfully:", result);
        // Only redirect after successful logging
        window.location.href = "pages/menu.html";
    })
    .catch(error => {
        console.error("Error logging data:", error);
        alert("Failed to log data: " + error.message);
        // You might still want to redirect on error, depending on your requirements
        // window.location.href = "pages/menu.html";
    });
}