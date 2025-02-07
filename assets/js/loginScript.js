function handleCredentialResponse(response) {
    console.log("Google Credential Response:", response);
    try {
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        const locale = data.locale || "N/A";  // Default to "N/A" if locale is missing

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
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxvqbTdulXeJ2efVoSPEtQeNSeMT2wSr04DYvK_c3u1LLs3FQYAvnkwZn2FSxwOBeJa/exec";
    
    // Create a unique callback function name
    const callbackName = `callback_${Date.now()}`;

    window[callbackName] = function(response) {
        console.log("Login response:", response);
        if (response && response.status === "success") {
            window.location.href = "pages/menu.html";  // Redirect to the menu page
        } else {
            alert(`Failed to log data: ${response ? response.message : "No response received"}`);
        }

        delete window[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
    };

    const queryParams = new URLSearchParams(
        Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, encodeURIComponent(value)])
        )
    );

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `${scriptUrl}?${queryParams.toString()}&callback=${callbackName}`;
    document.body.appendChild(script);
}
  