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
    const scriptUrl = "https://script.google.com/macros/s/AKfycbwScHvZuGY4ZGG-WSBWicapjMKyNQbZhaiGSs8iefv8o-DtvUjSMU8TtY55WBmhkXKmzw/exec";
    
    fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())  // Expect a JSON response
    .then(result => {
        console.log("Login data logged successfully:", result);
        window.location.href = "pages/menu.html";
    })
    .catch(error => {
        console.error("Error logging data:", error);
        alert("Failed to log data. Check console for details.");
    });
}
