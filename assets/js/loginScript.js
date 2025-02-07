function handleCredentialResponse(response) {
    console.log("Starting Google login");
    try {
        if (!response || !response.credential) throw new Error("Invalid response format.");
    
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        console.log("Decoded Google data:", data);
        
        // Store user data in localStorage first
        localStorage.setItem("app_playerEmail", data.email);
        localStorage.setItem("app_playerName", data.name);
        localStorage.setItem("app_loginTime", new Date().toISOString());

        // Send data to Google Sheet
        const scriptUrl = "https://script.google.com/macros/s/AKfycbzwdwbzI366EE2yS4XbO3nl3fkoRnjm_VEmiJzDDBqMYxykfM4hFpdw3fwOei6Tk0ZmNg/exec";
        
        const queryParams = new URLSearchParams({
            email: data.email,
            name: data.name,
            picture: data.picture || "",
            locale: data.locale || "N/A",
            loginTime: new Date().toISOString(),
            type: "Google"
        });

        // Fire and forget the Google Sheet update
        fetch(`${scriptUrl}?${queryParams.toString()}`)
            .catch(error => console.error("Error sending data to sheet:", error));

        // Navigate immediately after storing local data
        console.log("Navigating to menu page");
        window.location.href = "pages/menu.html";
    
    } catch (error) {
        console.error("Error in login:", error);
        alert("Failed to process login. Please try again.");
    }
}

function skipLogin() {
    console.log("Starting guest login");
    const guestData = {
        email: "Guest",
        name: "Guest",
        loginTime: new Date().toISOString(),
        type: "Guest"
    };

    // Store guest data in localStorage
    localStorage.setItem("app_playerEmail", guestData.email);
    localStorage.setItem("app_playerName", guestData.name);
    localStorage.setItem("app_loginTime", guestData.loginTime);

    // Send guest data to Google Sheet
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzZ3jnQYp-JimIE3A0neoqs_nligugjN3bhGIWYP0760vb4hhlcRN3NvEi0NVeocri5CA/exec";
    
    const queryParams = new URLSearchParams(guestData);

    // Fire and forget the Google Sheet update
    fetch(`${scriptUrl}?${queryParams.toString()}`)
        .catch(error => console.error("Error sending data to sheet:", error));

    // Navigate immediately
    console.log("Navigating to menu page");
    window.location.href = "pages/menu.html";
}

function logLoginData(data) {
    console.log("1. Starting logLoginData with data:", data);
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzZ3jnQYp-JimIE3A0neoqs_nligugjN3bhGIWYP0760vb4hhlcRN3NvEi0NVeocri5CA/exec";
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
                console.log("5. Login successful, attempting navigation");
                
                // Force navigation to menu page
                const menuPath = window.location.href.replace(/[^/]*$/, '') + 'pages/menu.html';
                console.log("Navigating to:", menuPath);
                
                // Try immediate navigation
                window.location.replace(menuPath);
                
                // Fallback: try regular navigation after a short delay
                setTimeout(() => {
                    if (document.location.pathname.indexOf('menu.html') === -1) {
                        console.log("Fallback navigation");
                        window.location.href = menuPath;
                    }
                }, 100);
            } else {
                console.error("Login response unsuccessful:", response);
                alert(`Login failed: ${response ? response.message : "No response received"}`);
            }
        } catch (error) {
            console.error("Error in callback:", error);
            alert("Error during login process. Check console for details.");
        }

        // Cleanup
        delete window[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
    };

    // Clean the data
    const cleanData = {
        ...data,
        email: decodeURIComponent(data.email),
        name: decodeURIComponent(data.name)
    };

    // Create query string with callback parameter
    const queryParams = new URLSearchParams(cleanData);
    queryParams.append('callback', callbackName);

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `${scriptUrl}?${queryParams.toString()}`;
    console.log("4. Adding script with URL:", script.src);
    
    // Add error handling
    script.onerror = function(error) {
        console.error("Script loading error:", error);
        alert("Failed to connect to login service. Please try again.");
        
        // Cleanup on error
        delete window[callbackName];
        document.body.removeChild(script);
    };

    document.body.appendChild(script);

    // Add timeout
    setTimeout(() => {
        if (window[callbackName]) {
            console.error("Login request timed out");
            alert("Login request timed out. Please try again.");
            delete window[callbackName];
            if (document.getElementById(callbackName)) {
                document.body.removeChild(document.getElementById(callbackName));
            }
        }
    }, 10000);
}