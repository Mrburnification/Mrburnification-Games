function handleCredentialResponse(response) {
    console.log("Google Credential Response:", response);
    try {
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        const locale = data.locale || "N/A";  // Default to "N/A" if locale is missing

        // alert(`Login Successful!\n\nName: ${data.name}\nEmail: ${data.email}\nLocale: ${locale}`);

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
    const scriptUrl = "https://script.google.com/macros/s/AKfycbycb1SogL4ecCKYf9GKADHNwc9vm-hd4B46mNEPhc3ExtJgVgwmXtz4QjS25MhjDuweiA/exec";
    
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
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
    };

    // Build the full URL with query parameters for JSONP
    const queryParams = new URLSearchParams({
        ...data,
        callback: callbackName
    });

    // Create the <script> element
    const script = document.createElement("script");
    script.id = callbackName;  // Assign an ID for easy cleanup
    script.src = `${scriptUrl}?${queryParams.toString()}`;
    document.body.appendChild(script);  // Add the script to the DOM
}
