const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Define log file paths for both scripts
const logDir = './logs';
const indexLogFile = path.join(logDir, 'index.log');
const serverLogFile = path.join(logDir, 'server.log');

// Ensure the logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Function to log output to respective log files
function logOutput(scriptName, type , data) {
  const timestampedData = `${new Date().toISOString()} - ${type}\n ${data}`;
  
  // Log to file in real-time
  if (scriptName === 'index.js') {
    fs.appendFileSync(indexLogFile,  `${data}\n`);
  } else if (scriptName === 'server.js') {
    fs.appendFileSync(serverLogFile, `${data}\n`);
  }

  // Also output to console in real-time
  console.log(timestampedData);
}

// Function to start a given script
function startApp(scriptName, onExit) {
  const process = spawn('node', [scriptName]);

  // Capture stdout data
  process.stdout.on('data', (data) => {
    logOutput(scriptName, 'stdout:',`${data}`);
  });

  // Capture stderr data
  process.stderr.on('data', (data) => {
    logOutput(scriptName, 'stderr:',`${data}`);
    
    // If stderr contains status code 408 (Request Timeout), restart index.js
    if (data.includes("408")) {
      logOutput(scriptName, 'Status Code 408 detected. Restarting index.js...');
      startApp('index.js', onExit);
    }
  });

  // Handle the process exit (for restarting or handling crashes)
  process.on('exit', (code, signal) => {
    if (code !== 0) {
      logOutput(scriptName, `Process exited with code: ${code}`);
    }
    if (signal) {
      logOutput(scriptName, `Process was killed with signal: ${signal}`);
    }
    // If this is index.js and it crashed, restart it
    if (scriptName === 'index.js') {
      logOutput(scriptName, `Restarting index.js...`);
      startApp('index.js', onExit);
    } else {
      // If server.js crashes, restart it
      logOutput(scriptName, `Restarting server.js...`);
      startApp('server.js', onExit);
    }
    // Call the onExit callback (if any)
    if (onExit) onExit();
  });
}

// Start both index.js and server.js and keep them running independently
startApp('server.js');  // Keep server.js running independently
startApp('index.js', () => {
  // If index.js crashes, this callback can be used to log additional actions or stop server.js if needed.
  // In this case, we're not stopping server.js.
});

const logsDir = path.join(__dirname, "logs");
function deleteLogsDir() {
    if (fs.existsSync(logsDir)) {
        fs.rmSync(logsDir, { recursive: true, force: true });
        console.log("🗑️ Logs directory deleted.");
    }
}

// Listen for process exit signals
          // Normal exit
process.on('exit', () => {
  // When index.js stops or crashes, set data to null
  deleteLogsDir();
  //console.log('index.js stopped, data set to null');
});
process.on("SIGINT", () => {                // Ctrl + C
    console.log("\n⚠️ Process interrupted (SIGINT)");
    deleteLogsDir();
    process.exit(0);
});
process.on("SIGTERM", () => {               // Kill command
    console.log("\n⚠️ Process terminated (SIGTERM)");
    deleteLogsDir();
    process.exit(0);
});
process.on("uncaughtException", (err) => {  // Unhandled error
    console.error("❌ Uncaught Exception:", err);
    deleteLogsDir();
    process.exit(1);
});
process.on('beforeExit', () => {
  // When index.js stops or crashes, set data to null
  deleteLogsDir();
  console.log('index.js stopped, data set to null');
});   // Just before exit
