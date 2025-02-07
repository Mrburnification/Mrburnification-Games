function handleCredentialResponse(response) {
    console.log("1. Starting handleCredentialResponse");
    console.log("Google Credential Response:", response);
    try {
        if (!response || !response.credential) throw new Error("Invalid response format.");
    
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        console.log("2. Decoded Google data:", data);
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
        console.error("Error in handleCredentialResponse:", error);
        alert("Failed to decode login response.");
    }
}

function skipLogin() {
    console.log("1. Starting skipLogin");
    const guestData = {
        email: "Guest",
        name: "Guest",
        loginTime: new Date().toISOString(),
        type: "Guest"
    };

    console.log("2. Guest data:", guestData);
    localStorage.setItem("app_playerEmail", guestData.email);
    localStorage.setItem("app_playerName", guestData.name);
    localStorage.setItem("app_loginTime", guestData.loginTime);

    logLoginData(guestData);
}

function logLoginData(data) {
    console.log("1. Starting logLoginData with data:", data);
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzwdwbzI366EE2yS4XbO3nl3fkoRnjm_VEmiJzDDBqMYxykfM4hFpdw3fwOei6Tk0ZmNg/exec";
    const callbackName = `callback_${Date.now()}`;
    
    console.log("2. Setting localStorage data");
    localStorage.setItem("app_playerEmail", data.email);
    localStorage.setItem("app_playerName", data.name);
    localStorage.setItem("app_loginTime", data.loginTime);

    console.log("3. Creating callback function:", callbackName);
    window[callbackName] = function(response) {
        console.log("4. CALLBACK EXECUTED with response:", response);
        
        try {
            if (response && response.status === "success") {
                console.log("5. Login successful, getting current location");
                const currentLocation = window.location.href;
                console.log("Current location:", currentLocation);
                
                // Get the base URL (remove the file name if present)
                const baseUrl = currentLocation.substring(0, currentLocation.lastIndexOf('/') + 1);
                console.log("Base URL:", baseUrl);
                
                const menuUrl = `${baseUrl}pages/menu.html`;
                console.log("6. Attempting navigation to:", menuUrl);
                
                // Try direct navigation
                window.location.href = menuUrl;
                
                // Fallback navigation after 1 second if we're still here
                setTimeout(() => {
                    if (window.location.href === currentLocation) {
                        console.log("7. Direct navigation failed, trying alternate method");
                        window.location.replace(menuUrl);
                    }
                }, 1000);
            } else {
                console.error("Login response unsuccessful:", response);
                alert(`Login failed: ${response ? response.message : "No response received"}`);
            }
        } catch (error) {
            console.error("Error in callback:", error);
            alert("Error during login process. Check console for details.");
        }

        // Cleanup
        console.log("8. Cleaning up callback");
        delete window[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
    };

    // Add error handling for script load
    const script = document.createElement("script");
    script.id = callbackName;
    
    // Add error handler for script loading
    script.onerror = function(error) {
        console.error("Script loading error:", error);
        alert("Failed to connect to login service. Please try again.");
    };

    // Remove URL encoding from the data before sending
    const cleanData = {
        ...data,
        email: decodeURIComponent(data.email),
        name: decodeURIComponent(data.name)
    };

    console.log("9. Preparing clean data:", cleanData);
    const queryParams = new URLSearchParams();
    Object.entries(cleanData).forEach(([key, value]) => {
        queryParams.append(key, value);
    });

    script.src = `${scriptUrl}?${queryParams.toString()}&callback=${callbackName}`;
    console.log("10. Adding script with URL:", script.src);
    document.body.appendChild(script);

    // Add timeout to detect if callback never executes
    setTimeout(() => {
        if (window[callbackName]) {
            console.error("Callback never executed after 5 seconds");
            alert("Login timed out. Please try again.");
            // Cleanup
            delete window[callbackName];
            const script = document.getElementById(callbackName);
            if (script) document.body.removeChild(script);
        }
    }, 5000);
}