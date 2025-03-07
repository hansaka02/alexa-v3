const youtubedl = require('youtube-dl-exec');
const path = require('path');

async function downloadVideo(videoId) {
    let resultArr = [];

    try {
        // Define the save path in the 'temp' directory with the videoId as the filename
        const savePath = path.join(__dirname, '../temp', `${videoId}.mp4`);

        // Fetch metadata including title and duration
        const videoInfo = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
                        cookies: path.join(__dirname, 'cookies.txt')
        });

        // Extract title and playtime (duration)
        const title = videoInfo.title || 'Unknown Title';
        const playTime = formatTime(videoInfo.duration);  // Format duration to HH:MM:SS format

        // Download the video specifically in mp4 format
        await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            output: savePath,  // Specify download path
            format: 'mp4',     // Ensure MP4 format
        });

        // Construct caption message
        const caption = `\nTitle: ${title}\nPlaytime: ${playTime}`;

        resultArr.push({ downloaded: true, caption: caption, videoPath: savePath });
        return resultArr;

    } catch (error) {
        console.error('Error downloading video:', error);
        resultArr.push({ downloaded: false });
        return resultArr;
    }
}

// Helper function to format duration in seconds to HH:MM:SS
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}:${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
}

module.exports = downloadVideo

// Example function to send video with caption

