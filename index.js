const {
    makeWASocket,
    AnyMessageContent,
    BinaryInfo,
    delay,
    DisconnectReason,
    downloadAndProcessHistorySyncNotification,
    encodeWAM,
    fetchLatestBaileysVersion,
    getAggregateVotesInPollMessage,
    getHistoryMsg,
    isJidNewsletter,
    Browsers,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    proto,
    useMultiFileAuthState,
    WAMessageContent,
    WAMessageKey
} = require('@whiskeysockets/baileys');
//const art = require('ascii-art');
let isNewLogin = null;
//const app = require('./server');
const baileys = require('@whiskeysockets/baileys')


require('./whatsappState'); // Import shared state
const {
    handleMessage
} = require('./bot'); // Import message handler
const chalk = require('kleur');
const {
    default: P
} = require("pino");
const express = require('express');
const NodeCache = require('node-cache');

const session = require('express-session');
const fs = require('fs');
const path = require('path');

const msgRetryCounterCache = new NodeCache();
const PORT = process.env.PORT || 8000;
const dataFile = path.join(__dirname, 'sharedData.json');
const si = require('systeminformation');
const WebSocket = require('ws');
const logger = P({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
}, P.destination('./wa-logs.txt'));
logger.level = 'debug';


// Store logs in an array, now also keeping HTML-styled logs
const SESSION_FOLDER = './auth5a'

async function startWhatsAppConnection ()  {

const art = require('ascii-art');

fs.readFile('./res/ascii.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }
  console.log(data);
});



    const {
        state,
        saveCreds
    } = await useMultiFileAuthState('auth5a');
    const {
        version,
        isLatest
    } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);


const APP_NAME = 'Alexa'; // Your app name
const ORGANIZATION_NAME = 'AlexaInc'; // Your organization's name
const APP_VERSION = '3.0.0'; // Your app version

const CustomBrowsersMap = {
    ...Browsers, // Spread the original BrowsersMap to keep existing functionality

    // Override the appropriate method
    appropriate: (browser) => {
        // Use custom values for your app, organization, and version
        if (process.platform === 'linux') {
            return [ORGANIZATION_NAME, APP_NAME,  APP_VERSION];
        } else if (process.platform === 'darwin') {
            return [ORGANIZATION_NAME, APP_NAME, APP_VERSION];
        } else if (process.platform === 'win32') {
            return [ORGANIZATION_NAME, APP_NAME, APP_VERSION];
        } else {
            return [ORGANIZATION_NAME, APP_NAME, APP_VERSION]; // Default for unknown platform
        }
    }
};


    const AlexaInc = makeWASocket({
        version,
        logger: P({
            level: "fatal"
        }),
        browser: CustomBrowsersMap.appropriate('Alexa'),
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        // ignore all broadcast messages -- to receive the same
        // comment the line below out
        // shouldIgnoreJid: jid => isJidBroadcast(jid),
        // implement to handle retries & poll updates
    });
    AlexaInc.ev.on('qr',(qr)=>{
        console.log("\n📌 Scan this QR code with WhatsApp:\n");
        console.log(qr);
    })
    AlexaInc.ev.on('creds.update', saveCreds);
    AlexaInc.ev.on('messages.upsert', (m) => handleMessage(AlexaInc, m)); // Call bot.js function

    let isConnected = false;

    AlexaInc.ev.on('connection.update', (update) => {

        const { connection,lastDisconnect, qr, isNewLogin } = update;
        if (qr) {
            console.log("\n🔄 New QR code generated! Please scan it.\n");
            var qrcode = require('qrcode-terminal');
console.log("\n📌 Scan this QR code with WhatsApp:\n");
console.log(qr);
qrcode.generate(qr, {small: true}, function (qrcode) {
    console.log(qrcode)
});
            
        }

        isConnected = connection === 'open';

if (connection === 'open') {


 global.botPhoneNumber = AlexaInc.user.id.split(':')[0];

 if (!global.botPhoneNumber) {
    global.connectionStatus = 'Offline';
 }else{
    global.connectionStatus = 'Online';
 }
            

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

                if (isNewLogin) {
            console.log("🔄 Restarting connection after QR scan...");
            setTimeout(startWhatsAppConnection, 2000); // Restart after 2 sec
        } else                 if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.message;
 console.log(reason);

            if (reason === DisconnectReason.loggedOut) {
                console.log('WhatsApp logged out. Deleting session and restarting...');
                
                // Delete the authentication folder
                if (fs.existsSync(SESSION_FOLDER)) {
                    fs.rmSync(SESSION_FOLDER, { recursive: true, force: true });
                }

                // Restart the bot
                startWhatsAppConnection();
            }} 
    });




//await AlexaInc.start();
}
startWhatsAppConnection();

// Log initialization
function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data));
}

setInterval(() => {
  const data = { number: global.botPhoneNumber , status: global.connectionStatus };
  writeData(data);
  //console.log('Data written to shared file:', data);
}, 5000); // Write data every 5 seconds



// Function to delete logs directory


// Listen for process exit signals
          // Normal exit
process.on('exit', () => {
  // When index.js stops or crashes, set data to null
    const data = { number: null , status: 'Offline' };
  writeData(data);
 // deleteLogsDir();
  
});
process.on("SIGINT", () => {                // Ctrl + C
    console.log("\n⚠️ Process interrupted (SIGINT)");
    const data = { number: null , status: 'Offline' };
  writeData(data);
    //deleteLogsDir();
    process.exit(0);
});
process.on("SIGTERM", () => {               // Kill command
    console.log("\n⚠️ Process terminated (SIGTERM)");
    const data = { number: null , status: 'Offline' };
  writeData(data);
    //deleteLogsDir();
    process.exit(0);
});
process.on("uncaughtException", (err) => {  // Unhandled error
    console.error("❌ Uncaught Exception:", err);
    const data = { number: null , status: 'Offline' };
  writeData(data);
    //deleteLogsDir();
    process.exit(1);
});
process.on('beforeExit', () => {
  // When index.js stops or crashes, set data to null
    const data = { number: null , status: 'Offline' };
  writeData(data);
  //deleteLogsDir();
  console.log('index.js stopped, data set to null');
});   // Just before exit