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
        console.log("4. Received response:", response);
        if (response && response.status === "success") {
            console.log("5. Login successful, attempting navigation to menu.html");
            
            // Try different path variations
            const menuPaths = [
                "./pages/menu.html",
                "../pages/menu.html",
                "/pages/menu.html",
                "pages/menu.html"
            ];

            const currentPath = window.location.pathname;
            console.log("Current path:", currentPath);

            // Try the first path
            console.log("6. Attempting navigation to:", menuPaths[0]);
            window.location.href = menuPaths[0];

            // Fallback check after a short delay
            setTimeout(() => {
                if (window.location.pathname === currentPath) {
                    console.log("7. First navigation attempt failed, trying alternatives");
                    for (let i = 1; i < menuPaths.length; i++) {
                        console.log(`Trying alternative path: ${menuPaths[i]}`);
                        window.location.href = menuPaths[i];
                    }
                }
            }, 500);
        } else {
            console.error("Login failed:", response);
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

    console.log("8. Sending clean data:", cleanData);
    const queryParams = new URLSearchParams();
    Object.entries(cleanData).forEach(([key, value]) => {
        queryParams.append(key, value);
    });

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `${scriptUrl}?${queryParams.toString()}`;
    console.log("9. Adding script with URL:", script.src);
    document.body.appendChild(script);
}