const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');  // For running FFmpeg commands

// Function to get video info and download video
async function downloadVideo(vidid) {
    const url = `https://www.youtube.com/watch?v=${vidid}`;
    const resultArr = [];

    try {
        // Step 1: Fetch video information
        const infoResponse = await axios.post('https://hansaka1-ytdl2.hf.space/get-info', { url });

        // Extract video details from the response
        const { title, duration } = infoResponse.data;

        // Step 2: Fetch video and audio (in mp4 format) for download
        const videoResponse = await axios.post('https://hansaka1-ytdl2.hf.space/download', { url }, {
            responseType: 'arraybuffer',  // Specify the response type as binary data
        });

        // Define the video path where we want to save the raw downloaded file
        const rawVideoFileName = `${vidid}_raw.mp4`;
        const rawVideoFilePath = path.join(__dirname, '../temp', rawVideoFileName);

        // Save the raw video file to the filesystem
        fs.writeFileSync(rawVideoFilePath, videoResponse.data);

        // Define the processed video path after re-encoding with FFmpeg
        const encodedVideoFileName = `${vidid}.mp4`;
        const encodedVideoFilePath = path.join(__dirname, '../temp', encodedVideoFileName);

        // Step 3: Re-encode the video with FFmpeg
        await reencodeVideo(rawVideoFilePath, encodedVideoFilePath);

        // Clean up the raw video file after encoding
        fs.unlinkSync(rawVideoFilePath);

        // Create the caption string for the response
        const playTime = formatDuration(duration); // Format duration into "MM:SS"
        const caption = `\nTitle: ${title}\nPlaytime: ${playTime}`;

        // Add the result to the result array
        resultArr.push({
            downloaded: true,
            caption: caption,
            videoPath: encodedVideoFilePath,
        });

        return resultArr;

    } catch (error) {
        console.error('Error downloading video or fetching info:', error);
        resultArr.push({ downloaded: false });
        return resultArr;
    }
}

// Helper function to format the video duration (in seconds) to MM:SS format
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to re-encode the downloaded video using FFmpeg
function reencodeVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        // FFmpeg command to re-encode the video to H.264 (video) and AAC (audio)
        const command = `ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac -strict experimental -preset fast -crf 23 "${outputPath}"`;

        // Execute the FFmpeg command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error re-encoding video: ${stderr}`);
                reject(error);
            } else {
                console.log(`Video re-encoded successfully: ${stdout}`);
                resolve();
            }
        });
    });
}

// Example usage
module.exports = downloadVideo;
