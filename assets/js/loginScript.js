function handleCredentialResponse(response) {
    console.log("Google Credential Response:", response); // Add this line
    try {
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        alert(`Login Successful!\n\nName: ${data.name}\nEmail: ${data.email}`);
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
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyV1MQXcB79yRGbBtD_d_7IXU5LOCSegwuFwfQfcy-fytb3KtC-z8lVH4qEEps1YTjD7A/exec";
    
    fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors", // Bypass CORS preflight
      headers: { "Content-Type": "text/plain" }, // Avoid triggering preflight
      body: JSON.stringify(data)
    })
    .then(() => {
      console.log("Login data logged successfully");
      window.location.href = "pages/menu.html";
    })
    .catch(error => {
      console.error("Error logging data:", error);
      alert("Failed to log data. Check console for details.");
    });
}