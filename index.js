const { makeWASocket, useMultiFileAuthState, proto } = require('@whiskeysockets/baileys');
const { handleMessage } = require('./bot'); // Import message handler
const chalk = require('kleur');
const { default: P } = require("pino");
const express = require('express')
const app = express();

app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const AlexaInc = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: "fatal" })
    });

    AlexaInc.ev.on('creds.update', saveCreds);
    AlexaInc.ev.on('messages.upsert', (m) => handleMessage(AlexaInc, m)); // Call bot.js function
let isConnected = false;
    // Add connection update listener to log "Bot is ready" when connected
    AlexaInc.ev.on('connection.update', (update) => {
        const { connection } = update;
        
        
        isConnected = connection === 'open'
        if (connection === 'open') {
            //console.log(chalk.green('Bot is ready'));  // Log when the bot is ready and connected
console.log(AlexaInc.user.id);botPhoneNumber =AlexaInc.user.id.split(':')[0];
            // Ensure process.env["Owner_nb"] has the phone number in the correct format
            const ownerNumber = process.env["Owner_nb"];
            if (ownerNumber) {
                AlexaInc.sendMessage(`${ownerNumber}@s.whatsapp.net`, { text: 'Your bot Alexa is ready to use now' })
                    .then(() => {
                        console.log('bot started without error');
                    })
                    .catch(err => {
                        console.error('bot started but Error sending message to owner:', err);
                    });
            } else {
                console.error('bot started but Error sending message to owner because Owner phone number not found in environment variables');
            }
        }
app.get('/status', (req,res)=>{
    if (!res || typeof res.json !== 'function') {
        console.error("Response object is missing or invalid.");
        return;
    }
    
    res.json({ status: isConnected ? "Online" : "Offline" });
})

app.get('/get-phone-number', (req, res) => {
  if (botPhoneNumber) {
    res.json({ phoneNumber: botPhoneNumber });
  } else {
    res.status(500).json({ error: 'Bot is not yet connected.' });
  }
});


    });
})();

const port = process.env.PORT || 3000;
app.listen(port,() => console.log(`server running port ${port}`))