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
    const scriptUrl = "https://script.google.com/macros/s/AKfycbwkkncCeapJ0SUwIoJY5HgH31ZI5nWAhj0oa_kxXAxS3Zpa8rCG_cuo4O2vXfv3xgXH7g/exec";
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
  