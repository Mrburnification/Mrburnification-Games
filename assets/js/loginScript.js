function handleCredentialResponse(response) {
    console.log("Google Credential Response:", response);
    try {
        if (!response || !response.credential) throw new Error("Invalid response format.");
    
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        const locale = data.locale || "N/A";
    
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
    const guestData = {
        email: "Guest",
        name: "Guest",
        loginTime: new Date().toISOString(),
        type: "Guest"
    };

    localStorage.setItem("app_playerEmail", guestData.email);
    localStorage.setItem("app_playerName", guestData.name);
    localStorage.setItem("app_loginTime", guestData.loginTime);

    logLoginData(guestData);
}

function logLoginData(data) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxyWGx6i069y-lnmgyKCnL3bOgwXb1Sj0NDNwxS9GHcqcZJ7enRe14-yg2SvPZSbDHigg/exec";
    const callbackName = `callback_${Date.now()}`;

    // Store login data in localStorage before making the request
    localStorage.setItem("app_playerEmail", data.email);
    localStorage.setItem("app_playerName", data.name);
    localStorage.setItem("app_loginTime", data.loginTime);

    window[callbackName] = function(response) {
        console.log("Login response:", response);
        if (response && response.status === "success") {
            // Fix: Use absolute path and ensure it exists
            window.location.href = "/pages/menu.html";  // or "../pages/menu.html" depending on your file structure
        } else {
            alert(`Failed to log data: ${response ? response.message : "No response received"}`);
        }

        delete window[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
    };

    // Remove URL encoding from the data before sending
    const cleanData = {
        ...data,
        email: decodeURIComponent(data.email),
        name: decodeURIComponent(data.name)
    };

    const queryParams = new URLSearchParams();
    Object.entries(cleanData).forEach(([key, value]) => {
        queryParams.append(key, value);
    });

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `${scriptUrl}?${queryParams.toString()}`;
    document.body.appendChild(script);
}