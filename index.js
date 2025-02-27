const { makeWASocket, useMultiFileAuthState, proto } = require('@whiskeysockets/baileys');
const { handleMessage } = require('./bot'); // Import message handler
const chalk = require('kleur');
const { default: P } = require("pino");

(async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const AlexaInc = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: "fatal" })
    });

    AlexaInc.ev.on('creds.update', saveCreds);
    AlexaInc.ev.on('messages.upsert', (m) => handleMessage(AlexaInc, m)); // Call bot.js function

    // Add connection update listener to log "Bot is ready" when connected
    AlexaInc.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            //console.log(chalk.green('Bot is ready'));  // Log when the bot is ready and connected

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
    });
})();
