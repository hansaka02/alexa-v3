const fs = require('fs-extra');
const  YtDl  = require('./res/ytdl');  // Import downloadVideo from ytdl file

const yts = require('yt-search');
const{weatherof} = require('./res/js/weather.js')
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
                       `- *assistant name is alexa, a WhatsApp chatbot created by Hansaka.* \n\n assistant name must be alexa its not virtual assistant or chatbot. when a user send greeting message reply hello ${thread_id_name}.I am your virtual assistant. how can I help you today?.\n\n When a user used weather quary prompt lite what weather loom like or what was weather today to find weather of any city, reply must only be contain  "weather city_name" dont include weather infomations or any other words like"today yesterdat tomorow or any".\n\n When a user asks for a menu message like show me menu what is menu , reply must be one word its 'menu' \n\n When a user asks for ping or system status message like what is system status or  test ping , reply must be include one word its 'ping' \n\n wha a user asks for documentation reply must be include one word its 'doc' \n\n All text formatting must follow WhatsApp text formatting standards. \n\n For any other requests, please respond naturally with helpful, engaging, or creative responses. \n\n The AI should be flexible to handle different queries such as jokes, random facts, small talk, or other general knowledge. \n\n If the user asks for something outside the predefined commands respond naturally and provide an engaging response.`

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
const senderdef = msg.key.remoteJid;
// Check if the message is from a group or a broadcast list
if (sender.endsWith('@g.us') || sender.endsWith('@broadcast')) {
    sender = `${msg.key.participant}@${senderdef}`; // Assign participant ID instead
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
┃  .web  - search on web
┃  .browse  - search on web
┃  .search  - search on web
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

if you want to download use command
.ytdl https://www.youtube.com/watch?v=abc4jso0A3k
command like this 
you can coppy link from above
Hansaka@AlexxaInc © All Right Reserved
`
preparemsttt += videoresult


    });

    AlexaInc.sendMessage(msg.key.remoteJid,{text:preparemsttt},{quoted:msg})
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
            const videoFilePath = `./temp/${videoId}.mp4`;

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
                video: videoBuffer,
                caption: `${caption}\n Hansaka@AlexxaInc © All Right Reserved`,
                gifPlayback: false
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
        const videoFilePath = `./temp/${videoId}.mp4`;
        await fs.remove(videoFilePath);
        //console.log('Video file deleted:', videoFilePath);
    }
}

  break
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
        const btext  = bargs.join(" ")
    const cpuData = await si.cpus()[0].model;
const memTotal = Math.round(await si.totalmem()/1e+9) +' GB' ;
const memUsed = Math.round(((await si.totalmem()- await si.freemem())/1e+9)*100)/100; 
    switch(prosseseb){

case 'menu' : case 'menu.' :{

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
┃  .web  - search on web
┃  .browse  - search on web
┃  .search  - search on web
┃ 
┃     ↣𝐘𝐨𝐮𝐭𝐮𝐛𝐞↢ 
┃
┃
┃━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃               🎀  𝒜𝐿𝐸𝒳𝒜  🎀
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯


`

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
          AlexaInc.sendMessage(msg.key.remoteJid,{text:`${replyyy}`},{ quoted: msg });
          AlexaInc.sendMessage(msg.key.remoteJid,{react: {text: '✅', key: msg.key}});
    AlexaInc.readMessages([msg.key]);
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
