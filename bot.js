const fs = require('fs-extra');
const path = require('path');
const si = require('os');
const axios = require('axios');
const sharp = require('sharp');
const { downloadMediaMessage, proto, prepareWAMessageMedia , generateWAMessageFromContent} = require('@whiskeysockets/baileys');
//const {generateWAMessageFromContent} = require('@adiwajshing/baileys')
//const { Button, ButtonMessage } = require('@whiskeysockets/baileys').WA_MESSAGE_TYPE;
const { fileutc } = require('./res/js/fu.js');
const {runSpeedTest} = require('./res/js/speed_test.js')
const FormData = require('form-data');


const chalk = require('kleur');
const TEMP_DIR = path.join(__dirname, 'temp');
//const {ai} = require('./ai')
const { OpenAI } = require("openai");
require('dotenv').config();
const mysql = require("mysql2");
const token = process.env["OPENROUTER_TOKEN"];
const { mediafireDl } = require('./res/mediafire.js')

const DB_HOST = process.env["DB_HOST"];
const DB_UNAME = process.env["DB_UNAME"];
const DB_NAME = process.env["DB_NAME"];
const DB_PASS = process.env["DB_PASS"];
const {isUrl} = require('./res/js/func')



async function convertToSticker(imagePath, stickerPath) {
    await sharp(imagePath)
        .resize({width: 512, height: 512, fit: 'inside', withoutEnlargement: true}) // Resize the image to 512x512 as required for stickers

        .webp({ quality: 100, lossless: true }) // Convert to WebP format
        .toFile(stickerPath);
    console.log(`Image converted to sticker: ${stickerPath}`);
}



function generateRandomToken(length = 15,sender,pushName) {
    const characters = `${sender}img${pushName}`;
    let token = '';
    
    for (let i = 0; i < length; i++) {
        // Randomly select a character from the characters string
        const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
        token += randomChar;
    }
    
    return token;
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: token
});
const util = require('util');


//console.log('🖥️', cpuData)
//console.log('𝐑𝐚𝐦', Math.round(memUsed/1e+9) , 'GB of', memTotal)
const moment = require('moment-timezone')


function getGreeting() {
    const hour = moment().tz("Asia/Colombo").hour();
    return (hour >= 5 && hour < 12) && "Good Morning ☀️" ||
           (hour >= 12 && hour < 17) && "Good Afternoon ☀️" ||
           (hour >= 17 && hour < 20) && "Good Evening 🌆" ||
           "Good Night 🌙";
}

// Create MySQL connection
const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_UNAME,
  password: DB_PASS,
  database: DB_NAME,
  // port:27250
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL");
  }
});


// Store conversation history
const conversations = {};

function ai(message, thread_id, callback) {
  const query1 = 'SELECT `conventions` FROM `conversation_history` WHERE `id` = ?';

  db.execute(query1, [thread_id], (err, results) => {
    if (err) {
      console.error('Error fetching conversations:', err);
      return callback('Database error', null);
    }

    let conversations = [];

    if (results.length > 0) {
      try {
        const abc =  results[0].conventions
        //console.log(abc);    
        if (typeof abc === 'string') {
      conversations = JSON.parse(abc);
    } else if (Array.isArray(abc)) {
      conversations = abc || [];
    }
      } catch (e) {
        console.error('Error parsing conventions data:', e);
      }
    } else {
      conversations = [
        { role: "system", content: "I am Alexxa, a WhatsApp chatbot created by Hansaka." }
      ];
    }

    // Add user message
    conversations.push({ role: "user", content: message });

    // Retry function for OpenRouter API call
    function callAPIWithRetry(retries = 5) {
      return new Promise((resolve, reject) => {
        function attempt(remainingRetries) {
          client.chat.completions.create({
            messages: conversations,
            model: "mistralai/mistral-small-24b-instruct-2501:free",
            user: thread_id,
            temperature: 1,
            max_tokens: 2048, // Reduced max tokens to avoid overloading
            top_p: 1
          }).then(response => {
            if (!response || !response.choices || response.choices.length === 0) {
              console.error('Invalid or empty response from OpenRouter:', response);
              if (remainingRetries > 0) {
                console.log(`Retrying... (${remainingRetries} attempts left)`);
                setTimeout(() => attempt(remainingRetries - 1), 2000); // Wait 2s before retrying
              } else {
                reject("Invalid or empty response from OpenRouter");
              }
            } else {
              resolve(response.choices[0].message);
            }
          }).catch(apiErr => {
            console.error("Error calling OpenRouter API:", apiErr);
            if (remainingRetries > 0) {
              console.log(`Retrying... (${remainingRetries} attempts left)`);
              setTimeout(() => attempt(remainingRetries - 1), 2000);
            } else {
              reject("Error calling OpenRouter API");
            }
          });
        }
        attempt(retries);
      });
    }

    // Call API with retries
    callAPIWithRetry()
      .then(botResponse => {
        conversations.push(botResponse);
        const pushed = JSON.stringify(conversations);

        if (results.length > 0) {
          const query2 = 'UPDATE `conversation_history` SET `conventions` = ? WHERE `id` = ?';
          db.execute(query2, [pushed, thread_id], (updateErr) => {
            if (updateErr) {
              console.error('Error updating conversation:', updateErr);
              return callback('Error updating conversation', null);
            }
            console.log('Conversation updated successfully');
            callback(null, botResponse.content);
          });
        } else {
          const query3 = 'INSERT INTO `conversation_history`(`id`, `conventions`) VALUES (?, ?)';
          db.execute(query3, [thread_id, pushed], (insertErr) => {
            if (insertErr) {
              console.error('Error inserting conversation:', insertErr);
              return callback('Error inserting conversation', null);
            }
            console.log('Conversation inserted successfully');
            callback(null, botResponse.content);
          });
        }
      })
      .catch(error => {
        console.error(error);
        callback(error, null);
      });
  });
}





// Ensure temp folder exists
fs.ensureDirSync(TEMP_DIR);

async function handleMessage(AlexaInc, { messages, type }) {

     AlexaInc.sendListMsg = (jid, text = '', footer = '', title = '' , butText = '', sects = [], quoted) => {
        let sections = sects
        var listMes = {
        text: text,
        footer: footer,
        title: title,
        buttonText: butText,
        sections
        }
        AlexaInc.sendMessage(jid, listMes, { quoted: quoted })
        }                  
      
    if (type === 'notify') {
        const msg = messages[0];
       // console.warn(messages[0])
let sender = msg.key.remoteJid; // Default sender

// Check if the message is from a group or a broadcast list
if (sender.endsWith('@g.us') || sender.endsWith('@broadcast')) {
    sender = msg.key.participant; // Assign participant ID instead
}

        if (!msg.key.fromMe) {
                AlexaInc.readMessages([msg.key]);
            let messageText = null;

// Check for conversation or extendedTextMessage first (for text messages)
messageText = msg.message?.conversation ||
              msg.message?.extendedTextMessage?.text ||
              // Check for media message captions (image, video, document)
              msg.message?.imageMessage?.caption ||
              msg.message?.videoMessage?.caption ||
              msg.message?.documentMessage?.caption ||
              // Handle cases where there are no captions (sticker, audio, etc.)
              null;
  const messageonlyText = msg.message?.conversation ||
              msg.message?.extendedTextMessage?.text

        const args = messageText.trim().split(/ +/).slice(1);
        const text = q = args.join(" ")
       // console.log(args)
 //console.log(msg.message.messageContextInfo);

           if (messageText) {
             console.log(chalk.red().bold(msg.pushName) +chalk.yellow().bold(`[${sender}]`)+ ': ' + chalk.blue().bold(messageText));

    // Check if the message has any text to process
    const firstWord = messageText.trim().split(/\s+/)[0].toLowerCase();

              if (msg.key.remoteJid == 'status@broadcast') {

    } else if (firstWord.startsWith(".") || firstWord.startsWith("/") || firstWord.startsWith("\\")) {
        let command = firstWord.slice(1);; // Assign as command


    const cpuData = await si.cpus()[0].model;
const memTotal = Math.round(await si.totalmem()/1e+9) +' GB' ;
const memUsed = Math.round(((await si.totalmem()- await si.freemem())/1e+9)*100)/100; 

            // command handle
            switch (command){
            case"menu":{
 const roleuser =   ( sender = process.env['Owner_nb']+'@s.whatsapp.net') && "Owner" || "User"

 const menu = `

╭━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃               🎀  𝒜𝐿𝐸𝒳𝒜  🎀
┃━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃
┃🖥️ : ${cpuData}
┃   𝐑𝐚𝐦 :${memUsed}  GB of , ${memTotal}
┃
┃    *Hello*, *${msg.pushName}* *${getGreeting()}*
┃
┃ *✧ʟɪᴍɪᴛ: *
┃ *✧ʀᴏʟᴇ: ${roleuser}*
┃ *✧ʟᴇᴠᴇʟ:* 
┃ *✧ᴄᴀʟᴇɴᴅᴀʀ:* *${moment.tz('Asia/Colombo').format('dddd')}*, *${moment.tz('Asia/Colombo').format('MMMM Do YYYY')}* 
┃ *✧ᴛɪᴍᴇ:* *${moment.tz('Asia/Colombo').format('HH:mm:ss')}*
┃ 
┃ 
┃     *📜 COMMANDS LIST*
┃  .help - Get this menu
┃  .ping - Check bot status
┃  .weather <city> - Get weather info
┃  .sticker - Convert image to sticker
┃  .owner  - Chat with Owner
┃ 
┃     ↣𝐘𝐨𝐮𝐭𝐮𝐛𝐞↢ 
┃
┃
┃━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃               🎀  𝒜𝐿𝐸𝒳𝒜  🎀
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯


`

                AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/alexa.jpeg'},caption: menu},{ quoted: msg });

            break}



case"ping":{

AlexaInc.sendMessage(msg.key.remoteJid,{text:'testing ping.......'},{ quoted: msg })

const str = await runSpeedTest();
 const repmg = `
Speed test results
  🛜 : ${str.ping}
  ⬇ :${str.download_speed}
  ⬆ :${str.upload_speed}  

 `
AlexaInc.sendMessage(msg.key.remoteJid,{text:repmg},{ quoted: msg })
  break}


case"owner":{

const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Hansaka
TEL;TYPE=celltype=VOICE;waid=94740970377:+94 74 0970 377
TEL;TYPE=celltype=VOICE;waid=94763545014:+94 76 3545 014
END:VCARD`;
await AlexaInc.sendMessage(msg.key.remoteJid, { contacts: { 
            displayName: 'Jeff', 
            contacts: [{ vcard }]}}
            );

  break
}

case"sticker":{
              AlexaInc.sendMessage(msg.key.remoteJid,{text:'preparing your sticker'}, {quoted:msg});
              AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '🔄', key: msg.key}})
                try {
                    const messageType = Object.keys(msg.message)[0]; // "imageMessage", "videoMessage", etc.
                    const fileType = messageType.replace("Message", ""); // "image", "video", "document"
                    
                    const mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error("Media buffer is empty");
                    }

                    // Generate a unique filename
                    const fileName = `${generateRandomToken(20,sender,msg.pushName)}`; 
                    const filePath = path.join(TEMP_DIR, `${fileName}.jpeg`);
                    console.log(`image saved${filePath}`)
                    // Save media to the temp folder
                    await fs.writeFile(filePath, mediaBuffer);
                    //console.log(`Media saved at: ${filePath}`);

                    // Upload media
    const imagePath = path.join(TEMP_DIR, `${fileName}.jpeg`); // Path to the image you want to send as a sticker
    const stickerPath = path.join(TEMP_DIR, `${fileName}.webp`); // Path for the output sticker
await convertToSticker(imagePath, stickerPath);
const stickerBuffer = await fs.readFileSync(stickerPath);

    const stickermessage = {
        sticker: {
            url: stickerPath,
        },
    };
    await AlexaInc.sendMessage(msg.key.remoteJid, stickermessage);
    AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '✅', key: msg.key}})
                    // Delete the file after upload
                    await fs.unlink(imagePath);
                    await fs.unlink(stickerPath);
                    //console.log(`Temporary file deleted: ${filePath}`);

                } catch (error) {
                  AlexaInc.sendMessage(msg.key.remoteJid, 'sorry sticker image fail');
    AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '☹️', key: msg.key}})
                    console.error("Error processing media:", error);
                }

  break
}


// case 'test':{

// //let sender = msg.key.remoteJid; // The recipient's JID

// let sections = [
//     {
//         title: "Choose an Option", // Section Title
//         rows: [
//             {
//                 title: "📥 Download MP3",
//                 rowId: "#download_mp3",
//                 description: "Download audio file"
//             },
//             {
//                 title: "📥 Download MP4",
//                 rowId: "#download_mp4",
//                 description: "Download video file"
//             },
//             {
//                 title: "🔎 Search YouTube",
//                 rowId: "#ytsearch",
//                 description: "Search for YouTube videos"
//             },
//             {
//                 title: "🎵 Get Song Lyrics",
//                 rowId: "#lyrics",
//                 description: "Find lyrics of any song"
//             },
//             {
//                 title: "📌 Help & Commands",
//                 rowId: "#help",
//                 description: "Get a list of available commands"
//             }
//         ]
//     }
// ];

// // Sending the list message
// AlexaInc.sendListMsg(
//     msg.key.remoteJid, 
//     "Please select an option from the list below:",  // Main text
//     "Bot Assistant",  // Footer text
//     "Available Features", // Title
//     "Click to Choose", // Button text
//     sections, 
//     msg // Quoted message (optional)
// );

//   break
// }

// case 'medeafire' :{

// if (!text) throw '*Enter a Link Query!*'
// if (!isUrl(args[0]) && !args[0].includes('mediafire.com')) throw '*The link you provided is not valid*'
// const baby1 = await mediafireDl(text);
// console.log(baby1);
// //if (baby1[0].size.split('MB')[0] >= 5000) return AlexaInc.sendMessage(msg.key.remoteJid,{text:`*file over.limit* ${util.format(baby1)} `});
// // const result4 = `*▊▊▊MEDIAFIRE DL▊▊▊*
                
// // *Name* : ${baby1[0].nama}
// // *Size* : ${baby1[0].size}
// // *Mime* : ${baby1[0].mime}
// // *Link* : ${baby1 [0].link}\n
// // _whoa wait alexa is processing..._

// // *🎀 𝒜𝐿𝐸𝒳𝒜 🎀*`
// // AlexaInc.sendMessage(msg.key.remoteJid, {text: result4} , {quoted:msg});
// // AlexaInc.sendMessage(msg.key.remoteJid, { document : { url : baby1[0].link}, fileName : baby1[0].nama, mimetype: baby1[0].mime }, { quoted : m }).catch ((err) => m.reply('*Failed to download File*'))


//   break
// }

default :{
  const rep = `
    Invalid Command used 
    to view command list send .menu or /menu
  `
  AlexaInc.sendMessage(msg.key.remoteJid, {text:rep}, {quoted: msg});
  AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '☹️', key: msg.key}})
}

            }
            // end command handle



}else {
ai(messageText, sender, (err, reply) => {
  if (err) {
    console.error("Error:", err);
  } else {    
    //console.log('Chatbot Response:', reply);
    AlexaInc.sendMessage(msg.key.remoteJid,{text:`${reply}`},{ quoted: msg });
    AlexaInc.readMessages([msg.key]);
  }
});};

              //console.log(msg);
               
// if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.documentMessage) {
//                 console.log(`Received media from ${sender}, saving to temp folder...`);

//                 try {
//                     const messageType = Object.keys(msg.message)[0]; // "imageMessage", "videoMessage", etc.
//                     const fileType = messageType.replace("Message", ""); // "image", "video", "document"
                    
//                     const mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
//                     if (!mediaBuffer || mediaBuffer.length === 0) {
//                         throw new Error("Media buffer is empty");
//                     }

//                     // Generate a unique filename
//                     const fileName = `${generateRandomToken(20,sender,msg.pushName);}.jpeg`; 
//                     const filePath = path.join(TEMP_DIR, fileName);

//                     // Save media to the temp folder
//                     await fs.writeFile(filePath, mediaBuffer);
//                     //console.log(`Media saved at: ${filePath}`);

//                     // Upload media
//                     const upload= await fileutc(filePath, fileType);
//                     console.log(`Media uploaded: ${upload.secure_url}`); 

//                     // Delete the file after upload
//                     await fs.unlink(filePath);
//                     //console.log(`Temporary file deleted: ${filePath}`);

//                 } catch (error) {
//                     console.error("Error processing media:", error);
//                 }
//             }



            




    }
        }
    }
}

module.exports = { handleMessage };
