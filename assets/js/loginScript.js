function handleCredentialResponse(response) {
    console.log("Google Credential Response:", response);
    try {
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        const locale = data.locale ? data.locale : "N/A"; // Default to "N/A" if locale is missing

        alert(`Login Successful!\n\nName: ${data.name}\nEmail: ${data.email}\nLocale: ${locale}`);

        // Send the data to Google Sheets
        logLoginData({
            email: data.email,
            name: data.name,
            picture: data.picture,
            locale: locale,
            loginTime: new Date().toISOString(),
            type: "Google"
        });

    } catch (error) {
        console.error("Error handling credential response:", error);
        alert("Failed to decode login response.");
    }
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
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyPG4E-X0fY6ZNFmHjgfMAcEAj6qwTlg3M2RS-aCYMlZEvFXWZ6KSvP3mbuOdYrzDaT9w/exec";
    
    // Create a unique callback function name
    const callbackName = `callback_${Date.now()}`;
    
    // Attach the callback function to the window object
    window[callbackName] = function(response) {
        console.log("Login data logged successfully:", response);
        if (response.status === "success") {
            window.location.href = "pages/menu.html";  // Redirect on success
        } else {
            alert(`Failed to log data: ${response.message}`);
        }
        
        // Clean up the script tag and callback function after it executes
        delete window[callbackName];
        document.body.removeChild(script);
    };

    // Build the full URL with query parameters for JSONP
    const queryParams = new URLSearchParams({
        ...data,
        callback: callbackName
    });

    // Create the <script> element
    const script = document.createElement("script");
    script.src = `${scriptUrl}?${queryParams.toString()}`;
    document.body.appendChild(script);  // Add the script to the DOM
}
