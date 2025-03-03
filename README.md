# Alexa v3 - WhatsApp Bot

Welcome to **Alexa v3**, powered by **Baileys API**!

## Bot Status
Status: **Checking...**

<div id="status" style="font-weight: bold; color: red;">Checking...</div>

---

## Developer: Hansaka
© 2025 AlexaInc Sri Lanka. All rights reserved.

---

### Admin Login

- [Admin Login](login.html)

---

### Send WhatsApp Message

Click the button below to send a message to the bot via WhatsApp.

<button class="whatsapp-button" onclick="sendMessage()">WhatsApp</button>

---

## HTML & JavaScript Code

This code is part of the project that manages the status, sends WhatsApp messages, and checks login status.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot - Baileys API</title>

    <style>
        /* Your CSS here */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f4; display: flex; flex-direction: column; align-items: center; }
        .whatsapp-button { background-color: #25D366; color: white; font-size: 16px; padding: 8px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; transition: background-color 0.3s ease; display: inline-block; width: auto; max-width: 250px; }
        .whatsapp-button:hover { background-color: #128C7E; }
    </style>
</head>
<body>

    <!-- Navigation Bar -->
   <!--- <div class="navbar">
        <h1 onclick="location.href='./';">Alexa v3</h1>
        <button id="loginButton" class="login-button" onclick="window.location.href='login.html'">Admin Login</button>
    </div> --->

    <div class="content">
        <h2>Welcome to Alexa v3</h2>
        <p>Powered by Baileys API</p>
        <p>Status: <span id="status">Checking...</span></p>

        <div class="image-container">
            <img src="https://pngimg.com/uploads/anime_girl/anime_girl_PNG33.png" alt="Anime Girl">
        </div>

        <p>Message to bot</p>
        <button class="whatsapp-button" onclick="sendMessage()">WhatsApp</button>
    </div>

    <script>
        async function checkStatus() {
            try {
                const response = await fetch('https://sexual-devin-alexainc-07fc300c.koyeb.app/status');
                const data = await response.json();
                document.getElementById('status').textContent = data.status;
                document.getElementById('status').style.color = data.status === "Online" ? "green" : "red";
            } catch (error) {
                document.getElementById('status').textContent = "Offline";
            }
        }

        checkStatus();
        setInterval(checkStatus, 5000); // Refresh status every 5 seconds

        // Fetch the bot's phone number
        async function getPhoneNumber() {
            try {
                const response = await fetch('https://sexual-devin-alexainc-07fc300c.koyeb.app/get-phone-number');
                const data = await response.json();
                return data.phoneNumber;
            } catch (error) {
                console.error('Failed to fetch phone number:', error);
                return null;
            }
        }

        // Send WhatsApp message function
        async function sendMessage() {
            const phoneNumber = await getPhoneNumber();
            if (phoneNumber) {
                const message = 'Hello, I want to talk to Alexa!';
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            } else {
                alert('Unable to retrieve bot phone number.');
            }
        }

        // Function to check if the admin is logged in
        async function checkLoginStatus() {
            try {
                const response = await fetch('https://sexual-devin-alexainc-07fc300c.koyeb.app/is-logged-in');
                const data = await response.json();
                
                const loginButton = document.getElementById('loginButton');
                if (data.isLoggedIn) {
                    loginButton.textContent = 'Cpanel'; // Change button text if logged in
                    loginButton.onclick = function() { window.location.href = '/control'; };
                } else {
                    loginButton.textContent = 'Admin Login';
                    loginButton.onclick = function() { window.location.href = 'login.html'; };
                }
            } catch (error) {
                console.error("Error checking login status:", error);
            }
        }

        checkLoginStatus();
    </script>

</body>
</html>

