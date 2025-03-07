const youtubedl = require('youtube-dl-exec');
const path = require('path');

async function downloadVideo(videoId) {
    let resultArr = [];
  const cookies = '# Netscape HTTP Cookie File
# http://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file!  Do not edit.

.youtube.com	TRUE	/	TRUE	1769770743	LOGIN_INFO	AFmmF2swRQIhAJTz2qfqOFluP-Oma-sp0MW4QFGHp3TqJDFohfttkAfBAiBsZV9j-qTJLBqqAwLA8F37ebMF8LPVqn7W55NdAYs_hA:QUQ3MjNmelQ1NkpMaVBnSjFJWE1LdkUxM2QxRjVCaTFBMGctN0tmMHFwSzdIZnpTTXMzNGNVQlRlVHpFYjVabkhwY05JcFA4TGRKbkN6WmdiVkY5amVqakNIWml4Vk1qZ2pTYmxvM0Uydl93Sk0xekIzcjdYd1lSSWFGaXc4Y3NFZnZESnE1NG42cGY1R09FRFhtUEFrLUo2NlE4eFkwbHVB
.youtube.com	TRUE	/	FALSE	1743076622	_gcl_au	1.1.1052094683.1735300622
.youtube.com	TRUE	/	FALSE	1774432929	APISID	lIUxUygXgCyGl8aQ/AyZN2aF65c87Z4JZM
.youtube.com	TRUE	/	FALSE	1774432929	HSID	Aq6Khh69RNZWKikt3
.youtube.com	TRUE	/	TRUE	1774432929	SAPISID	8YhCVkyieZIx63lI/AAngaE4-rcBfB4lx6
.youtube.com	TRUE	/	FALSE	1774432929	SID	g.a000twjM3osux-gGYLYsqtIBePQshCleSR5xWALMU2xmkfjF8s6DxWqb8FU570ZAyfuZtUP6YQACgYKAToSARUSFQHGX2MiPNWtzKexi7ivOSaYIBFQeRoVAUF8yKoeA1Pi6IaWj0lrXrOo1NqY0076
.youtube.com	TRUE	/	TRUE	1774432929	SSID	AnKkdGDOsmjnKtc2L
.youtube.com	TRUE	/	TRUE	1774432929	__Secure-1PAPISID	8YhCVkyieZIx63lI/AAngaE4-rcBfB4lx6
.youtube.com	TRUE	/	TRUE	1774432929	__Secure-1PSID	g.a000twjM3osux-gGYLYsqtIBePQshCleSR5xWALMU2xmkfjF8s6DmHKNc55BdX_ixni4D0uZAwACgYKAY4SARUSFQHGX2Miuagmk5JX2BaEyG_6zWGyqBoVAUF8yKpFXF6fSQVLYcTxh5T57xl20076
.youtube.com	TRUE	/	TRUE	1774432929	__Secure-3PAPISID	8YhCVkyieZIx63lI/AAngaE4-rcBfB4lx6
.youtube.com	TRUE	/	TRUE	1774432929	__Secure-3PSID	g.a000twjM3osux-gGYLYsqtIBePQshCleSR5xWALMU2xmkfjF8s6DTMvyueMthwDPZ8aZ62-bhAACgYKAf4SARUSFQHGX2MicxNoQN4ZVuIU6JIKKGp9uRoVAUF8yKrrabjr_ByiLRgOkrwib1K10076
.youtube.com	TRUE	/	TRUE	1775935534	PREF	tz=Asia.Colombo&repeat=NONE&volume=9&f5=30000
.youtube.com	TRUE	/	TRUE	1741376133	CONSISTENCY	AKreu9tSEX_Oz-dQUUhKPt5xjDygRBDyaD8pQLtljsTNKpbNrPPZl4aJ2KohRAQy4jmpmDEQ2OyfXvqAsayfaaS1TEWETkuraatTIg6T0ag0CwQKhbBnRirQMrCSuTUsvkYJL0h_kDHlyE8DO6-SYZ0b
.youtube.com	TRUE	/	TRUE	1772911537	__Secure-1PSIDTS	sidts-CjEBEJ3XV-qjx_6TrnZZSKGB4VXdK1UBt5AruOpXNLsCMp1_VQTRcezIeyEj98tr5vrSEAA
.youtube.com	TRUE	/	TRUE	1772911537	__Secure-3PSIDTS	sidts-CjEBEJ3XV-qjx_6TrnZZSKGB4VXdK1UBt5AruOpXNLsCMp1_VQTRcezIeyEj98tr5vrSEAA
.youtube.com	TRUE	/	FALSE	1772911538	SIDCC	AKEyXzVYKHdOcHZDZnlE3jossneKI44wvlWFfiCXLVbKA_pFyeD_CaJjoPqok9ZSftUbz4zkxA
.youtube.com	TRUE	/	TRUE	1772911538	__Secure-1PSIDCC	AKEyXzUvkLpA3BqltR6-o4iLKbb7XPmJDIK-OYS-W-bgk7uGDjlkhwxHsMUdUa1gXfLyXbOAxg
.youtube.com	TRUE	/	TRUE	1772911538	__Secure-3PSIDCC	AKEyXzUvKJXoHhipvLgJnYJK-dgpvxEEA1LtFAyBCbxj76qXT4pC2hSHWT-38t_nx9hcBycxWA
.youtube.com	TRUE	/	TRUE	1756927526	VISITOR_INFO1_LIVE	P36sTtc0S_k
.youtube.com	TRUE	/	TRUE	1756927526	VISITOR_PRIVACY_METADATA	CgJMSxIEGgAgIA%3D%3D
.youtube.com	TRUE	/	TRUE	1756903972	__Secure-ROLLOUT_TOKEN	CIPDj5nd0vqu9QEQ26-1wpDqigMY9P3-zYH4iwM%3D
.youtube.com	TRUE	/	TRUE	0	YSC	2CKSqf-CtfQ
'
    try {
        // Define the save path in the 'temp' directory with the videoId as the filename
        const savePath = path.join(__dirname, '../temp', `${videoId}.mp4`);

        // Fetch metadata including title and duration
        const videoInfo = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
                        cookies: cookies
        });

        // Extract title and playtime (duration)
        const title = videoInfo.title || 'Unknown Title';
        const playTime = formatTime(videoInfo.duration);  // Format duration to HH:MM:SS format

        // Download the video specifically in mp4 format
        await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            output: savePath,  // Specify download path
            format: 'mp4',     // Ensure MP4 format
            cookies: cookies
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

