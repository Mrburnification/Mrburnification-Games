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
    const scriptUrl = "https://script.google.com/macros/s/AKfycby3ZeYhhI7qqXeZ0p_5OV557uVAYei8CSPdafmJUi5WrSUm4vG9ntsnBOwu3IPjGg9rAg/exec";
    const callbackName = `callback_${Date.now()}`;
  
    window[callbackName] = function(response) {
      console.log("Login response:", response);
      if (response && response.status === "success") {
        console.log("Redirecting to menu...");
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
    script.src = `${scriptUrl}?${queryParams.toString()}`;
    document.body.appendChild(script);
  }
  