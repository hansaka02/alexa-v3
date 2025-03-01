const {
    makeWASocket,
    useMultiFileAuthState,
    proto
} = require('@whiskeysockets/baileys');
const {
    handleMessage
} = require('./bot'); // Import message handler
const chalk = require('kleur');
const {
    default: P
} = require("pino");
const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const si = require('systeminformation');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store logs in an array, now also keeping HTML-styled logs
let consoleLogs = [];

// Override console.log to capture logs
const originalLog = console.log;
console.log = (...args) => {
    const logMessage = args.join(' ');
    const coloredLog = logMessage
        .replace(/\x1b\[32m/g, '<span style="color: green;">')  // Handle green
        .replace(/\x1b\[33m/g, '<span style="color: yellow;">') // Handle yellow
        .replace(/\x1b\[31m/g, '<span style="color: red;">')    // Handle red
        .replace(/\x1b\[0m/g, '</span>');                        // Reset styling

    consoleLogs.push(coloredLog); // Store the HTML-styled logs

    // Log to console and file
    originalLog(...args);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${logMessage}\n`;
    fs.appendFileSync(path.join(__dirname, 'server.log'), logEntry); // Save to file
};

// Log initialization
console.log("Server starting...");

(async () => {
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState('auth');
    const AlexaInc = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({
            level: "fatal"
        })
    });

    AlexaInc.ev.on('creds.update', saveCreds);
    AlexaInc.ev.on('messages.upsert', (m) => handleMessage(AlexaInc, m)); // Call bot.js function

    let isConnected = false;

    AlexaInc.ev.on('connection.update', (update) => {
        const { connection } = update;
        isConnected = connection === 'open';
        if (connection === 'open') {
            console.log(AlexaInc.user.id);
            botPhoneNumber = AlexaInc.user.id.split(':')[0];
            const ownerNumber = process.env["Owner_nb"];
            if (ownerNumber) {
                AlexaInc.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    text: 'Your bot Alexa is ready to use now'
                })
                    .then(() => console.log('Bot started without error'))
                    .catch(err => console.error('Error sending message to owner:', err));
            } else {
                console.error('Error: Owner phone number not found');
            }
        }
    });

    app.get('/status', (req, res) => {
        res.json({ status: "Online" });
    });

    app.get('/get-phone-number', (req, res) => {
        if (botPhoneNumber) {
            res.json({ phoneNumber: botPhoneNumber });
        } else {
            res.status(500).json({ error: 'Bot not connected.' });
        }
    });

})();

// Setup session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// API to get logs
app.get('/get-console-logs', (req, res) => {
    res.json({ logs: consoleLogs });
});

// Login and logout APIs
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isLogged = true;
        console.log(`Admin logged in: ${username}`);
        return res.json({ success: true });
    }
    console.log(`Failed login attempt: ${username}`);
    res.status(401).json({ success: false, message: "Invalid credentials" });
});

app.post('/logout', (req, res) => {
    console.log('Admin logged out');
    req.session.destroy(() => res.json({ success: true }));
});

// Check authentication
function isAuthenticated(req, res, next) {
    if (req.session.isLogged) {
        return next();
    }
    res.status(401).json({ success: false, message: "Unauthorized" })

}

// Route to check if user is logged in
app.get('/is-logged-in', (req, res) => {
    if (req.session.isLogged) {
        res.json({ isLoggedIn: true });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Serve control panel
app.get('/control', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/sysstats', async (req, res) => {
  try {
    const cpuData = await si.currentLoad();
    const memData = await si.mem();
    const netData = await si.networkStats();

    // CPU usage in percentage (0-100)
    const cpuUsage = cpuData.currentLoad;

    // Memory usage in percentage (0-100)
    const memUsage = (memData.used / memData.total) * 100;

    // networkStats() returns an array (one element per network interface).
    // We'll use the first interface (netData[0]) or you can sum them if needed.
    const downloadSpeed = netData[0].rx_sec; // bytes/sec
    const uploadSpeed   = netData[0].tx_sec; // bytes/sec

    res.json({
      cpu: cpuUsage,
      memory: memUsage,
      downloadSpeed,
      uploadSpeed
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve system stats' });
  }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
