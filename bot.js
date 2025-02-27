const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { downloadMediaMessage, proto } = require('@whiskeysockets/baileys');
//const { Button, ButtonMessage } = require('@whiskeysockets/baileys').WA_MESSAGE_TYPE;
const { fileutc } = require('./res/fu.js');
const {runSpeedTest} = require('./res/speed_test.js')
const FormData = require('form-data');
const chalk = require('kleur');
const TEMP_DIR = path.join(__dirname, 'temp');
//const {ai} = require('./ai')
const { OpenAI } = require("openai");
require('dotenv').config();
const mysql = require("mysql2");
const token = process.env["OPENROUTER_TOKEN"];

const DB_HOST = process.env["DB_HOST"];
const DB_UNAME = process.env["DB_UNAME"];
const DB_NAME = process.env["DB_NAME"];
const DB_PASS = process.env["DB_PASS"];

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: token
});
const util = require('util');

// Create MySQL connection
const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_UNAME,
  password: DB_PASS,
  database: DB_NAME,
  port:27250
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
        conversations = abc || [];
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
    if (type === 'notify') {
        const msg = messages[0];
        const sender = msg.key.remoteJid;


        if (!msg.key.fromMe) {
            let messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || null;




            if (messageText) {

              //console.log(msg);
                console.log(chalk.red().bold(msg.pushName) +chalk.yellow().bold(`[${sender}]`)+ ': ' + chalk.blue().bold(messageText));


            const firstWord = messageText.trim().split(/\s+/)[0].toLowerCase();
            if (firstWord.startsWith(".") || firstWord.startsWith("/") || firstWord.startsWith("\\")) {
        let command = firstWord.slice(1);; // Assign as command

            // command handle
            switch (command){
            case"menu":
                       const buttons = [
                { buttonId: 'button1', buttonText: { displayText: 'Option 1' }, type: 1 },
                { buttonId: 'button2', buttonText: { displayText: 'Option 2' }, type: 1 },
            ];

            const buttonMessage = {
                text: 'Choose an option:',
                footer: 'Powered by WhatsApp Bot',
                buttons,
                headerType: 1,
            };
              const menu = `🚀 ALEXXA BOT MENU 🚀
                          👤 Bot Name: Alexxa
                          💬 Creator: Hansaka

                          📜 COMMANDS LIST
                          🔹 .hi - Say hello
                          🔹 .help - Get this menu
                          🔹 .ping - Check bot status
                          🔹 .time - Get current time
                          🔹 .weather <city> - Get weather info
                          🔹 .sticker - Convert image to sticker
                          🔹 .ai <message> - Chat with AI

                          🔒 Authority

                          🔹 Only Admins can use moderation commands
                          🔹 General users can use AI and fun commands
`

                AlexaInc.sendMessage(msg.key.remoteJid, buttonMessage,{ quoted: msg });
            break



case"ping":

AlexaInc.sendMessage(msg.key.remoteJid,{text:'testing ping.......'},{ quoted: msg })
const str = await runSpeedTest();
 const repmg = `
Speed test results
  🛜 : ${str.ping}
  ⬇ :${str.download_speed}
  ⬆ :${str.upload_speed}  

 `
AlexaInc.sendMessage(msg.key.remoteJid,{text:repmg},{ quoted: msg })
  break




            }
            // end command handle



    }else{
ai(messageText, sender, (err, reply) => {
  if (err) {
    console.error("Error:", err);
  } else {
    //console.log('Chatbot Response:', reply);
    AlexaInc.sendMessage(msg.key.remoteJid,{text:`${reply}`},{ quoted: msg });
  }
});
        
    }




                


                // const airm = await ai(messageText,sender)
                // AlexaInc.sendMessage(msg.key.remoteJid,{text:`${airm}`});

                // const sndr = sender;
                // if (sndr!=='18002428478@s.whatsapp.net') {
                //                     AlexaInc.sendMessage('18002428478@s.whatsapp.net',{text :`${messageText}`});
                // }




            } else if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.documentMessage) {
                console.log(`Received media from ${sender}, saving to temp folder...`);

                try {
                    const messageType = Object.keys(msg.message)[0]; // "imageMessage", "videoMessage", etc.
                    const fileType = messageType.replace("Message", ""); // "image", "video", "document"
                    
                    const mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
                    if (!mediaBuffer || mediaBuffer.length === 0) {
                        throw new Error("Media buffer is empty");
                    }

                    // Generate a unique filename
                    const fileName = `${Date.now()}_${fileType}.bin`; 
                    const filePath = path.join(TEMP_DIR, fileName);

                    // Save media to the temp folder
                    await fs.writeFile(filePath, mediaBuffer);
                    //console.log(`Media saved at: ${filePath}`);

                    // Upload media
                    const upload= await fileutc(filePath, fileType);
                    console.log(`Media uploaded: ${upload.secure_url}`); 

                    // Delete the file after upload
                    await fs.unlink(filePath);
                    //console.log(`Temporary file deleted: ${filePath}`);

                } catch (error) {
                    console.error("Error processing media:", error);
                }
            }
        }
    }
}

module.exports = { handleMessage };
