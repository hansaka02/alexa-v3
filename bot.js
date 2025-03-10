const fs = require('fs-extra');
const  YtDl  = require('./res/ytdl');  // Import downloadVideo from ytdl file
const USER_DATA_FILE = './users.json';
const yts = require('yt-search');
const{weatherof} = require('./res/js/weather.js')
const hangmanFile = "./hangman.json";
const questionsFile = './dailyQuestions.json';
const QresponsesFile = './dailyqresp.json';
const path = require('path');
const si = require('os');
const axios = require('axios');
const sharp = require('sharp');
const { downloadMediaMessage, proto, prepareWAMessageMedia , generateWAMessageFromContent} = require('@whiskeysockets/baileys');
const { generateLinkPreview } = require("link-preview-js");
//const {generateWAMessageFromContent} = require('@adiwajshing/baileys')
//const { Button, ButtonMessage } = require('@whiskeysockets/baileys').WA_MESSAGE_TYPE;
const { fileutc } = require('./res/js/fu.js');
const {runSpeedTest} = require('./res/js/speed_test.js')
const FormData = require('form-data');
const {websearch_query} = require('./res/web/web')

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
const DB_PORT = process.env["DB_PORT"] || 3306 ;
const {isUrl} = require('./res/js/func')
const hngmnwrds = [
  "apple", "banana", "mountain", "ocean", "computer", "city", "dog", "cat", "book", 
  "window", "coffee", "phone", "table", "chair", "cloud", "rain", "snow", "butterfly",
  "elephant", "pizza", "icecream", "flower", "chocolate", "guitar", "piano", "camera", 
  "jungle", "beach", "sunglasses", "umbrella", "garden", "airport", "hospital", "school", 
  "universe", "planet", "sun", "moon", "star", "television", "sandwich"
];

// Function to load the Hangman data from the JSON file
function loadHangmanData() {
  if (!fs.existsSync(hangmanFile)) fs.writeFileSync(hangmanFile, "{}");
  return JSON.parse(fs.readFileSync(hangmanFile));
}
let hangmanData = loadHangmanData();
// Function to save the Hangman data to the JSON file
function saveHangmanData(data) {
  fs.writeFileSync(hangmanFile, JSON.stringify(data, null, 2));
}
function loadquestionsss() {
  if (!fs.existsSync(questionsFile)) fs.writeFileSync(questionsFile, "{}");
  return JSON.parse(fs.readFileSync(questionsFile));
}
let questionsss = loadquestionsss();

function saveQuestionsData(data) {
  fs.writeFileSync(questionsFile, JSON.stringify(data, null, 2));
}

function loadQanAdata() {
  if (!fs.existsSync(QresponsesFile)) fs.writeFileSync(QresponsesFile, "{}");
  return JSON.parse(fs.readFileSync(QresponsesFile));
}
let QanAdata = loadQanAdata();
// Function to save the Hangman data to the JSON file
function saveQanAdata(data) {
  fs.writeFileSync(QresponsesFile, JSON.stringify(data, null, 2));
}

// Function to get the leaderboard
function getLeaderboard(hangmanData) {
  const leaderboard = Object.keys(hangmanData)
      .map(user => ({
          user: user,
          wins: hangmanData[user].wins || 0,
          name: hangmanData[user].name
      }))
      .sort((a, b) => b.wins - a.wins);

  let leaderboardText = "🏆 *Hangman Leaderboard*\n";
  if (leaderboard.length > 0) {
      leaderboard.forEach((entry, index) => {
          leaderboardText += `${index + 1}. ${entry.name} - Wins: ${entry.wins}\n`;
      });
  } else {
      leaderboardText = "No players have won yet!";
  }

  return leaderboardText;
}


function loadUsers() {
  try {
      const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
      return JSON.parse(data);
  } catch (error) {
      //console.error("Error loading user data:", error);
      return { users: {} };  // Return an empty object if file doesn't exist
  }
}

// Save user data to JSON file
function saveUsers(data) {
  fs.writeFileSync(USER_DATA_FILE, JSON.stringify(data, null, 4), 'utf8');
  //console.log("User data saved:", data);
}

function getLevel(userId) {
  const data = loadUsers();

  if (!data.users[userId]) {
      data.users[userId] = { level: 1, xp: 0, xp_needed: 100 };
  }

  return data.users[userId].level;
}



function addXP(userId) {
  const data = loadUsers();

  // If the user doesn't exist, create a new entry
  if (!data.users[userId]) {
      data.users[userId] = { level: 1, xp: 0, xp_needed: 100 };
  }

  // Add 5 XP to the user
  data.users[userId].xp += 5;

  // Check if the user needs to level up
  while (data.users[userId].xp >= data.users[userId].xp_needed) {
      // Level up
      data.users[userId].xp -= data.users[userId].xp_needed;
      data.users[userId].level += 1;
      // Increase xp_needed for next level (e.g., 20% more XP needed per level)
      data.users[userId].xp_needed = Math.floor(data.users[userId].xp_needed * 1.2);
  }

  saveUsers(data);
  return `XP: ${data.users[userId].xp}/${data.users[userId].xp_needed} | Level: ${data.users[userId].level}`;
}








function generateWeatherSummary(temperature, windspeed, winddirection) {
    // Define the temperature description
    let temperatureDesc;
    if (temperature < 0) {
        temperatureDesc = "It's freezing cold!";
    } else if (temperature >= 0 && temperature <= 15) {
        temperatureDesc = "It's chilly.";
    } else if (temperature > 15 && temperature <= 25) {
        temperatureDesc = "The weather is mild.";
    } else if (temperature > 25 && temperature <= 35) {
        temperatureDesc = "It's quite warm.";
    } else {
        temperatureDesc = "It's hot outside!";
    }

    // Define the wind description
    let windDesc;
    if (windspeed < 10) {
        windDesc = "There's a light breeze.";
    } else if (windspeed >= 10 && windspeed <= 30) {
        windDesc = "The wind is moderate.";
    } else {
        windDesc = "It's very windy!";
    }

    // Define the wind direction description
    let windDirectionDesc;
    if (winddirection >= 0 && winddirection <= 45) {
        windDirectionDesc = "The wind is coming from the north-east.";
    } else if (winddirection > 45 && winddirection <= 135) {
        windDirectionDesc = "The wind is coming from the east.";
    } else if (winddirection > 135 && winddirection <= 225) {
        windDirectionDesc = "The wind is coming from the south-east.";
    } else if (winddirection > 225 && winddirection <= 315) {
        windDirectionDesc = "The wind is coming from the south-west.";
    } else {
        windDirectionDesc = "The wind is coming from the west.";
    }

    // Combine all parts into a final summary
    const weatherSummary = `*Weather* *Summary:*
*-* *Temperature:* *${temperature}°C (${temperatureDesc})*
*-* *Wind Speed:* *${windspeed}* *km/h* *(${windDesc})*
*-* *Wind* *Direction:* *${windDirectionDesc}* *(Direction:* *${winddirection}°)*`;

    return weatherSummary;
}


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
  port:DB_PORT
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

function ai(thread_id_name, message, thread_id, callback) {
  const query1 = 'SELECT `conventions` FROM `conversation_history` WHERE `id` = ?';

  db.execute(query1, [thread_id], (err, results) => {
    if (err) {
      console.error('Error fetching conversations:', err);
      return callback('Database error', null);
    }

    let conversations = [];
// 
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
        
      ];
    }

    // Add user message
let systemHeader = [                    {
                        role: 'system',
                        content: 
                       `- *assistant name is alexa, a WhatsApp chatbot created by Hansaka.* \n\n assistant name must be alexa its not virtual assistant or chatbot. when a user send greeting message reply hello ${thread_id_name}.I am your virtual assistant. how can I help you today?.\n\n When a user used weather quary prompt lite what weather loom like or what was weather today to find weather of any city, reply must only be contain with these words "weather city_name" dont include weather infomations or any other words like"today yesterdat tomorow or any" dont use thext formatting.\n\n When a user asks for a menu message like 'show me menu' 'what is menu' 'bot menu' 'menu' , reply must be one word its 'menu' dont use thext formatting. \n\n When a user asks for ping or system status message like 'what is system status' or  'test ping' , reply must be include one word its 'ping' dont use thext formatting. \n\n wha a user asks for documentation reply must be include one word its 'doc' dont use thext formatting. \n\n All text formatting must follow WhatsApp text formatting standards:. \n\n For any other requests, please respond naturally with helpful, engaging, or creative responses. \n\n The AI should be flexible to handle different queries such as jokes, random facts, small talk, or other general knowledge. \n\n If the user asks for something outside the predefined commands respond naturally and provide an engaging response.`

                    } , {role:"assistant", content:"what is your name ?"},{role:"user",content: `${thread_id_name} is my name remember it`}] ;


    //conversations.push(systemHeader);
     conversations.push({ role: "user", content: message });

// If the length of the conversations array is greater than 16, slice to the last 15
let conversations123;

if (conversations.length > 12) {
  conversations123 = conversations.slice(conversations.length - 11); // Keep only the last 14 messages from history
} else {
  conversations123 = [...conversations]; // Use all conversations if length is <= 16
}

// Combine the system header and the last 7 message from user and last 7 message from assistant into the aipostmg array

    let aipostmg = [...systemHeader, ...conversations123];
    //console.log(aipostmg);
//console.log(aipostmg);
    // Retry function for OpenRouter API call
    function callAPIWithRetry(retries = 5) {
      return new Promise((resolve, reject) => {
        function attempt(remainingRetries) {
          client.chat.completions.create({
            messages: aipostmg ,
            model: process.env.CHAT_MODEL,
            user: thread_id,
            temperature: 1.0,
            max_tokens: 1500, // Reduced max tokens to avoid overloading
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
            //console.log(botResponse)
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
       // console.warn(messages[0])
let sender = msg.key.remoteJid; // Default sender
let senderabfff = msg.key.remoteJid;
const senderdef = msg.key.remoteJid;
// Check if the message is from a group or a broadcast list
if (sender.endsWith('@g.us') || sender.endsWith('@broadcast')) {
    senderabfff = msg.key.participant;
    sender = `${msg.key.participant}@${senderdef}`; // Assign participant ID instead
}
addXP(senderabfff);

const cpuData = await si.cpus()[0].model;
const memTotal = Math.round(await si.totalmem()/1e+9) +' GB' ;
const memUsed = Math.round(((await si.totalmem()- await si.freemem())/1e+9)*100)/100; 
const roleuser = (process.env['Owner_nb'] + '@s.whatsapp.net') === sender ? 'Owner' : 'User';
let menu = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃                        🎀  𝒜𝐿𝐸𝒳𝒜 - 𝓥3 🎀                         ┃
┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃
┃🖥️ : ${cpuData}
┃💾 𝐑𝐚𝐦 : ${memUsed} GB of ${memTotal}
┃
┃  𝗛𝗲𝗹𝗹𝗼, *${msg.pushName}* ${getGreeting()} 🌙
┃
┃ ✧ ʟɪᴍɪᴛ: *no limit enjoy* 
┃ ✧ ʀᴏʟᴇ: *${roleuser}*  
┃ ✧ ʟᴇᴠᴇʟ: *${getLevel(senderabfff)}*
┃ ✧ ᴅᴀʏ: *${moment.tz('Asia/Colombo').format('dddd')}*,  
┃ ✧ ᴅᴀᴛᴇ: *${moment.tz('Asia/Colombo').format('MMMM Do YYYY')}*  
┃ ✧ ᴛɪᴍᴇ: *${moment.tz('Asia/Colombo').format('HH:mm:ss')}*
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                     📜  𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗟𝗜𝗦𝗧                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃ 🛠 *Utility Commands:*  
┃ ➥ .menu - Get this menu  
┃ ➥ .ping - Check bot status  
┃ ➥ .weather <city> - Get weather info  
┃ ➥ .owner  - Chat with Owner  
┃
┃ 🖼 *Sticker & Image Commands:*  
┃ ➥ .sticker - Convert image to sticker  
┃
┃ 🌐 *Web & Search Commands:*  
┃ ➥ .web - Search on the web  
┃ ➥ .browse - Search on the web  
┃ ➥ .search - Search on the web  
┃
┃ 🎥 *YouTube Commands:*  
┃ ➥ .yts - Search YouTube  
┃ ➥ .ytdl - Download MP3 from YouTube  
┃
┃ 🔞 *NSFW Commands:*  
┃ ➥ .anal                ➥ .ass  
┃ ➥ .boobs            ➥ .gonewild  
┃ ➥ .hanal              ➥ .hass  
┃ ➥ .hboobs          ➥ .hentai  
┃ ➥ .hkitsune        ➥ .hmidriff  
┃ ➥ .hneko             ➥ .hthigh  
┃ ➥ .neko               ➥ .paizuri  
┃ ➥ .pgif                 ➥ .pussy  
┃ ➥ .tentacle          ➥ .thigh  
┃ ➥ .yaoi  
┃
┃ 🌸 *SFW Commands:*  
┃ ➥ .coffee  
┃ ➥ .food  
┃ ➥ .holo  
┃ ➥ .kanna  
┃ 
┃ 🪀 *Games*     
┃
┃             _*Hangman*_
┃
┃        ➥ .hangman - to start hangman
┃        ➥ .guess - to guess letter
┃        ➥ .endhangman - to end game
┃        ➥ .hangmanlb - get hangman leaderboard   
┃
┃             _*DailyGiveaway*_
┃
┃        ➥ .dailyqa - to start Q&A
┃        ➥ .answer - send answer number
┃
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                         🎀  𝒜𝐿𝐸𝒳𝒜 - 𝓥3 🎀                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                © 2025 Hansaka @ AlexaInc                  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;





















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




       // console.log(args)
 //console.log(msg.message.messageContextInfo);

           if (messageText) {
                      const args = messageText.trim().split(/ +/).slice(1);
        const text = q = args.join(" ")
             console.log(chalk.red().bold(msg.pushName) +chalk.yellow().bold(`[${sender}]`)+ ': ' + chalk.blue().bold(messageText));

    // Check if the message has any text to process
    const firstWord = messageText.trim().split(/\s+/)[0].toLowerCase();

              if (msg.key.remoteJid == 'status@broadcast') {

    } else if (firstWord.startsWith(".") || firstWord.startsWith("/") || firstWord.startsWith("\\")) {
        let command = firstWord.slice(1);; // Assign as command



            // command handle
            switch (command){
            case"menu":{




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
                  AlexaInc.sendMessage(msg.key.remoteJid, {text:'sorry sticker image fail'});
    AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '☹️', key: msg.key}})
                    console.error("Error processing media:", error);
                }

  break
}


 case 'search': case 'browse':case 'web':{

websearch_query(text).then(async (response) =>{
    //console.log(response)
    const resultweb = await response.join('\n\n\n\t\t');
  AlexaInc.sendMessage(msg.key.remoteJid , {text:resultweb,  },{quoted:msg})
})
  break
 }

case 'weather': {
    if (!text) {
        AlexaInc.sendMessage(msg.key.remoteJid, { text: 'Please enter city after command' }, { quoted: msg });
    }
    try {
        // Await the weather data
        const fetchmg = await weatherof(args);
        const summary = generateWeatherSummary(fetchmg.temperature, fetchmg.windspeed, fetchmg.winddirection);
        // Check if the city is invalid
        if (fetchmg === 'invalid city') {
            // If the city is invalid, send a message back saying "invalid city"
            AlexaInc.sendMessage(msg.key.remoteJid, { 
                text: 'Invalid city name. Please recheck the city name and try again.' 
            }, { quoted: msg });
        } else {
            // If the city is valid, send the weather information
            const repmsg = `
*City* *-* *${args}*
*Time* *-* *${moment.tz('Asia/Colombo').format('HH:mm')}* *UTC* *+5.30*
${summary}
  `;
        
            // Send the weather information to the user
            AlexaInc.sendMessage(msg.key.remoteJid, {
                image: { url: './res/img/unnamed.jpeg' },
                caption: repmsg
            }, { quoted: msg });
        }
    } catch (error) {
        // Handle errors
        console.error(error);  // Log the error for debugging
        AlexaInc.sendMessage(msg.key.remoteJid, { react: { text: '☹️', key: msg.key } });
        AlexaInc.sendMessage(msg.key.remoteJid, { text: error.message || error }, { quoted: msg });
    }
    break;
}

case 'setqst':{

  if (roleuser === 'Owner') {
    saveQuestionsData(text);
  }
break
}

case 'yts':{
if (!text) {
  AlexaInc.sendMessage(msg.key.remoteJid,{text:'please send with what you want to search'})
          AlexaInc.sendMessage(msg.key.remoteJid, { react: { text: '☹️', key: msg.key } });
}else{
 searchYouTubeMusic(text);
}
async function searchYouTubeMusic(query) {
  try {
    const results = await yts(query);  // Search YouTube for the query
    const videos = results.videos;

    AlexaInc.sendMessage(msg.key.remoteJid, {text:`Found ${videos.length} results for "${query}" Here is some results:\n`},{quoted:msg})
//AlexaInc.sendMessage(msg.key.remoteJid,{text:videoresult},{quoted:msg})

    let preparemsttt = " ";
    //console.log(`Found ${videos.length} results for "${query}":\n`);
    AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '✅', key: msg.key}})
    // Display the top 5 results
    videos.slice(0, 4).forEach((video,index) => {
const line = '_'.repeat(54)
const videoresult = `${index+1}. Title: ${video.title}
   URL: ${video.url}
   Duration: ${video.timestamp}
${line}\n\n


`
preparemsttt += videoresult


    });

    AlexaInc.sendMessage(msg.key.remoteJid,{text:`${preparemsttt}\n
    if you seach about song\nyou can download it
.ytdl link/of/song
command like this 
you can coppy link from above
Hansaka@AlexxaInc © All Right Reserved`},{quoted:msg})
  } catch (error) {
    return('Error searching YouTube :', error);
  }
}

break
}

case 'ytdl': case 'dlyt':{

if (!text) { AlexaInc.sendMessage(msg.key.remoteJid,{text:'url not provided here is ex:- .ytdl https://www.youtube.com/watch?v=abc4jso0A3k '},{quoted:msg})} else {handleDownload(text)}

function extractVideoId(url) {
    // Improved regex to capture video ID from YouTube URLs
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/[^\n\s]+\/|(?:[^\/\n\s]+\/|(?:v|e(?:mbed)?)\/|(?:watch\?v=|(?:e(?:mbed)?\/)?)|(?:\?v%3D|v%3D))([a-zA-Z0-9_-]{11}))|(?:youtu\.be\/([a-zA-Z0-9_-]{11})))/;

    const match = url.match(regex);

    if (match && (match[1] || match[2])) {
        return match[1] || match[2]; // Return the video ID
    } else {
       //console.error('Invalid YouTube URL');
        return null; // Invalid URL
    }
}
async function handleDownload(url) {
    const videoId = extractVideoId(url); // Extract the video ID from the URL
    
    if (!videoId) {
        AlexaInc.sendMessage(msg.key.remoteJid, { text: 'Invalid URL Provided. Here is an example: https://www.youtube.com/watch?v=abc4jso0A3k' }, { quoted: msg });
        return;
    }

    try {
        const result = await YtDl(videoId); // Call downloadVideo function

        if (result[0].downloaded) {
            const { caption, videoPath } = result[0];
            
            // Ensure the file path is correct
            const videoFilePath = `./temp/${videoId}.mp3`;

            // Check if the file exists using fs-extra
            const fileExists = await fs.pathExists(videoFilePath);
            if (!fileExists) {
                AlexaInc.sendMessage(msg.key.remoteJid, { text: 'Downloaded video file not found.' }, { quoted: msg });
                return;
            }

            // Read the file as a Buffer using fs-extra
            const videoBuffer = await fs.readFile(videoFilePath);

            // Prepare the media object using bailey's API format
            const mediaMessage = {
                document: {url:`./temp/${videoId}.mp3`},
                caption: `${caption}\nRes:${text}\n\nThis is just a audio file\n\n~~~Hansaka@AlexxaInc © Reserved~~~`,
                mimetype:'audio/mpeg'
                //gifPlayback: false
            };

            // Send the video using sendMessage
            AlexaInc.sendMessage(msg.key.remoteJid, mediaMessage, { quoted: msg });
            //console.log('Video sent:', videoPath);

            //await fs.remove(videoFilePath);  // Deletes the file
            //console.log('Video file deleted:', videoFilePath);

        } else {
            AlexaInc.sendMessage(msg.key.remoteJid, { text: 'Failed to download video. Check if the URL is correct.' }, { quoted: msg });
            console.error('Failed to download video');
        }
    } catch (error) {
        console.error('Error downloading video:', error);
        AlexaInc.sendMessage(msg.key.remoteJid, { text: 'Error downloading video. Please try again later.' }, { quoted: msg });
    }finally {
        // Delete the file regardless of success or failure
        const videoFilePath = `./temp/${videoId}.mp3`;
        await fs.remove(videoFilePath);
        //console.log('Video file deleted:', videoFilePath);
    }
}

  break
}

case 'anal': case 'ass': case 'boobs': case 'gonewild': case 'hanal': case 'hass': case 'hboobs': case 'hentai': case 'hkitsune': case 'hmidriff': case 'hneko': case 'hthigh': case 'neko': case 'paizuri': case 'pgif': case 'pussy': case 'tentacle': case 'thigh': case 'yaoi':
{

  axios.get(`https://api.night-api.com/images/nsfw/${command}`, {
    headers: {
        authorization: process.env.NIGHTAPI_AUTH
    }
})
.then(function (response) {
    const imageUrl = response.data.content.url;
    const imagesavepath = `./temp/${response.data.content.id}`;
    const writer = fs.createWriteStream(path.join(__dirname, imagesavepath));

    axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
    }).then((imageResponse) => {
        imageResponse.data.pipe(writer);
        writer.on('finish', () => {

          AlexaInc.sendMessage(msg.key.remoteJid,    { 
            image: {
                url: imagesavepath
            },
            viewOnce: true,
            caption: `🤤`
        },{quoted:msg});

        fs.remove(imagesavepath)
        .then(() => {
            console.log('Image deleted successfully');
        })
        .catch(err => {
            console.log('Error deleting the image:', err);
        });

        } );
    }).catch(err => {console.log('Error downloading the image:', err)});
})
.catch(function (error) {
    AlexaInc.sendMessage(msg.key.remoteJid,{text:'Cant send now i will send later'},{quoted:msg});
}  );

  break
}

case 'coffee': case 'food': case 'holo': case 'kanna':
  {

    axios.get(`https://api.night-api.com/images/sfw/${command}`, {
      headers: {
          authorization: process.env.NIGHTAPI_AUTH
      }
  })
  .then(function (response) {
      const imageUrl = response.data.content.url;
      const imagesavepath = `./temp/${response.data.content.id}`;
      const writer = fs.createWriteStream(path.join(__dirname, imagesavepath));
  
      axios({
          url: imageUrl,
          method: 'GET',
          responseType: 'stream'
      }).then((imageResponse) => {
          imageResponse.data.pipe(writer);
          writer.on('finish', () => {
  
            AlexaInc.sendMessage(msg.key.remoteJid,    { 
              image: {
                  url: imagesavepath
              },
              caption: `Your ${command} is ready`
          },{quoted:msg});
  
          fs.remove(imagesavepath)
          .then(() => {
              console.log('Image deleted successfully');
          })
          .catch(err => {
              console.log('Error deleting the image:', err);
          });
  
          } );
      }).catch(err => {console.log('Error downloading the image:', err)});
  })
  .catch(function (error) {
      AlexaInc.sendMessage(msg.key.remoteJid,{text:'Cant send now i will send later'},{quoted:msg});
  }  );
  
    break
  };

case 'dailyqa':{
  if (!QanAdata[sender]) {

      
      QanAdata[sender] = {
          name: msg.pushName,
          qstasked: 0,
          answered: 0,
          answeres:[],
          incorrect: 0,
          correct: 0,
      };
      const qstasked = QanAdata[sender].qstasked
      QanAdata[sender].qstasked++;
      saveQanAdata(QanAdata);

      const qtan = questionsss[qstasked+1]

      const preparedquestion = `${qtan.question}\n1. ${qtan.a1}\n2. ${qtan.a2}\n3. ${qtan.a3}\n4. ${qtan.a4}`
      AlexaInc.sendMessage(msg.key.remoteJid,{ text: `🎮 *Q&A challange Started!*\n questions: 20\nUse: .answer <number>` },{ quoted: msg });
      AlexaInc.sendMessage(msg.key.remoteJid,{ text: preparedquestion },{ quoted: msg });

     
    
      break;
  }else{AlexaInc.sendMessage(msg.key.remoteJid,{ text: "⚠️ You already played daily q&a game! try again yesterday."},{ quoted: msg });}


  break
}

case 'answer':{

  if (!QanAdata[sender]){ AlexaInc.sendMessage(msg.key.remoteJid,{ text: "Q&A session curently not activated use `.dailyqa` to active"},{ quoted: msg });}
 else{
    QanAdata[sender].answered++
    const qstasked = QanAdata[sender].qstasked;


  if(QanAdata[sender].answered >= 20){
    QanAdata[sender].answered = 20
    saveQanAdata(QanAdata);
    AlexaInc.sendMessage(msg.key.remoteJid,{ text: "⚠️ You are done wait Hansaka will anounce the winner. Correct count"+QanAdata[sender].correct},{ quoted: msg });
  }else if (QanAdata[sender].answered <= 20){

    const qtan = questionsss[qstasked+1]

    const preparedquestion = `${qtan.question}\n1. ${qtan.a1}\n2. ${qtan.a2}\n1. ${qtan.a3}\n1. ${qtan.a4}`
    AlexaInc.sendMessage(msg.key.remoteJid,{ text: preparedquestion },{ quoted: msg });
   
    QanAdata[sender].qstasked++
    QanAdata[sender].answeres.push(text)
  

    console.log(`answer is :${questionsss[qstasked].ca} user say:${args[0]}`)
    if (questionsss[qstasked].ca==text ) {
      QanAdata[sender].correct++
    }else{QanAdata[sender].incorrect++};

  saveQanAdata(QanAdata);


  }
 }
  break
}
  case "hangman": {
    // Starting a new Hangman game
    if (hangmanData[sender]) {
      if (hangmanData[sender].word) {
        AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption: "⚠️ You already have an active game! Use `.guess <letter>` to continue."},{ quoted: msg });


        
      }else{
        let word = hngmnwrds[Math.floor(Math.random() * hngmnwrds.length)];
        hangmanData[sender] = {
            word: word,
            name: msg.pushName,
            guessed: [],
            incorrect: 0,
            maxIncorrect: 6,
            wins: hangmanData[sender]?.wins || 0 // Ensure wins persist
        };
    
        saveHangmanData(hangmanData);
    
        let hiddenWord = "_ ".repeat(word.length).trim();
        AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption: `🎮 *Hangman Started!*\n🔹 Word: ${hiddenWord}\n🔹 Lives: 6\nUse: .guess <letter>` },{ quoted: msg });


       
      }
        break;
    }

    let word = hngmnwrds[Math.floor(Math.random() * hngmnwrds.length)];
    hangmanData[sender] = {
        word: word,
        name: msg.pushName,
        guessed: [],
        incorrect: 0,
        maxIncorrect: 6,
        wins: hangmanData[sender]?.wins || 0 // Ensure wins persist
    };

    saveHangmanData(hangmanData);

    let hiddenWord = "_ ".repeat(word.length).trim();
    AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption: `🎮 *Hangman Started!*\n🔹 Word: ${hiddenWord}\n🔹 Lives: 6\nUse: .guess <letter>` },{ quoted: msg });

    break;
}

case "guess": {
    // Check if the user has an active game
    if (!hangmanData[sender].word) {
      AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:  "❌ You don't have an active game! Start a new game with `.hangman`" },{ quoted: msg });


        break;
    }

    let game = hangmanData[sender];
    let guess = args[0]?.toLowerCase();

    if (!guess || guess.length !== 1) {
      AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:  "⚠️ Send a single letter!" },{ quoted: msg });


        break;
    }

    if (game.guessed.includes(guess)) {
      AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:  "🔄 You already guessed that!" },{ quoted: msg });

        break;
    }

    game.guessed.push(guess);

    if (game.word.includes(guess)) {
        let revealed = game.word.split("").map(letter => game.guessed.includes(letter) ? letter : "_").join(" ");
        saveHangmanData(hangmanData);

        if (!revealed.includes("_")) {
            // Player wins, increase their win count
            hangmanData[sender].wins++; // Increment win count
            saveHangmanData(hangmanData); // Save the updated data with win count
            AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:  `🎉 You won! The word was: *${game.word}*` },{ quoted: msg });
            // Log game data before deletion
            console.log("Game Data Before Deletion:", hangmanData[sender]);

            // Allow the player to start a new game after winning
            AlexaInc.sendMessage(msg.key.remoteJid, { text: "🎮 You can start a new game by typing .hangman" }, { quoted: msg });

            // Explicitly delete only the game-related data (NOT the win count)
            delete hangmanData[sender].guessed;
            delete hangmanData[sender].incorrect;
            delete hangmanData[sender].word;  // Delete word to start a new game
            saveHangmanData(hangmanData);
        } else {
          AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:  `✅ Correct!\n🔹 Word: ${revealed}` },{ quoted: msg });
            
           
        }
    } else {
        game.incorrect++;
        saveHangmanData(hangmanData);

        if (game.incorrect >= game.maxIncorrect) {
          AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:   `💀 Game Over now you death! The word was: *${game.word}*` },{ quoted: msg });
            
      
            // Log game data before deletion
            console.log("Game Data Before Deletion:", hangmanData[sender]);

            // Allow the player to start a new game after losing
            AlexaInc.sendMessage(msg.key.remoteJid, { text: "🎮 You can revive by typing .hangman" }, { quoted: msg });

            // Explicitly delete only the game-related data (NOT the win count)
            delete hangmanData[sender].guessed;
            delete hangmanData[sender].incorrect;
            delete hangmanData[sender].word;  // Delete word to start a new game
            saveHangmanData(hangmanData);
        } else {
          AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:   `❌ Wrong! Lives left: ${game.maxIncorrect - game.incorrect}`  },{ quoted: msg });
            
        }
    }
    break;
}

case "endhangman": {
    // End an active Hangman game
    if (!hangmanData[sender]) {
      
        AlexaInc.sendMessage(msg.key.remoteJid, { text: "❌ No active game to end!" }, { quoted: msg });
        break;
    }

    // Reset game data but keep win count
    delete hangmanData[sender].guessed;
    delete hangmanData[sender].incorrect;
    delete hangmanData[sender].word;  // Delete word to start a new game
    saveHangmanData(hangmanData);
    AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:   "🛑 Hangman game ended."  },{ quoted: msg });
           
    break;
}

case "hangmanlb": {
    // Display the leaderboard
    let leaderboardText = getLeaderboard(hangmanData);
    AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/hangman.jpeg'},caption:   leaderboardText  },{ quoted: msg });
     
    break;
}



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

/*****************   ai function for  language process  *****************/
ai(msg.pushName , messageText, sender, async (err, reply) => {
  AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '🔄', key: msg.key}});
  if (err) {
    console.error("Error:", err);
  } else {    
    let prosseseb = reply.trim().split(/\s+/)[0].toLowerCase(); // Assign as command
    let replyyy = reply.replace(/\s+/, '\t').trim()

    if (replyyy.includes("{$var123a$}")) {
    replyyy = reply.replace("{$var123a$}", msg.pushName);
}
        const bargs = replyyy.trim().split(/ +/).slice(1);
        const btext  = bargs.join(" ");

    switch(prosseseb){

case 'menu' : case 'menu.' :{





                AlexaInc.sendMessage(msg.key.remoteJid,{ image: {url: './res/img/alexa.jpeg'},caption: menu},{ quoted: msg });

  break
}

case 'ping':case 'ping.':{



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


case 'weather' :{



    if (!btext) {
        AlexaInc.sendMessage(msg.key.remoteJid, { text: 'Please enter city after command' }, { quoted: msg });
    }
    try {
        // Await the weather data
        const fetchmg = await weatherof(bargs);
        const summary = generateWeatherSummary(fetchmg.temperature, fetchmg.windspeed, fetchmg.winddirection);
        // Check if the city is invalid
        if (fetchmg === 'invalid city') {
            // If the city is invalid, send a message back saying "invalid city"
            AlexaInc.sendMessage(msg.key.remoteJid, { 
                text: 'Invalid city name. Please recheck the city name and try again.' 
            }, { quoted: msg });
        } else {
            // If the city is valid, send the weather information
            const repmsg = `
*City* *-* *${bargs}*
*Time* *-* *${moment.tz('Asia/Colombo').format('HH:mm')}* *UTC* *+5.30*
${summary}
  `;
        
            // Send the weather information to the user
            AlexaInc.sendMessage(msg.key.remoteJid, {
                image: { url: './res/img/unnamed.jpeg' },
                caption: repmsg
            }, { quoted: msg });
        }
    } catch (error) {
        // Handle errors
        console.error(error);  // Log the error for debugging
        AlexaInc.sendMessage(msg.key.remoteJid, { react: { text: '☹️', key: msg.key } });
        AlexaInc.sendMessage(msg.key.remoteJid, { text: error.message || error }, { quoted: msg });
    }
    break;

}


    default:{

      let attempts = 0;  // ✅ Use "let" so we can update its value
      const maxRetries = 3;
      const delay = 2000;
      
      while (attempts < maxRetries) {
          try {
              const response = await AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '☹️', key: msg.key}});
              console.log("Message sent successfully:");
              break; // Exit loop if successful
          } catch (error) {
              console.error(`Failed to send message (Attempt ${attempts + 1}):`, error);
              attempts++; // ✅ Now this works because "attempts" is mutable
      
              if (attempts < maxRetries) {
                  console.log(`Retrying in ${delay / 1000} seconds...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                  console.error("All retries failed. Message not sent.");
              }
          }
      }
      AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '✅', key: msg.key}});
AlexaInc.sendMessage(msg.key.remoteJid, { text: `${replyyy}` }, { quoted: msg });
          //AlexaInc.sendMessage(msg.key.remoteJid,{text:`${replyyy}`},{ quoted: msg });
          
    //AlexaInc.readMessages([msg.key]);
 break
    }
    }
    //console.log('Chatbot Response:', reply);

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
