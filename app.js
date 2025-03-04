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
function logOutput(scriptName, type, data) {
  const timestampedData = `${new Date().toISOString()} - ${type}\n ${data}`;

  // Log to file in real-time
  if (scriptName === 'index.js') {
    fs.appendFileSync(indexLogFile, `${data}\n`);
  } else if (scriptName === 'server.js') {
    fs.appendFileSync(serverLogFile, `${data}\n`);
  }

  // Also output to console in real-time
  console.log(timestampedData);
}

// Function to start a given script
function startApp(scriptName, onExit) {
  const process = spawn('node', [scriptName]);

  const restartIndex = (statusCode) => {
    logOutput(scriptName, `Status Code ${statusCode} detected. Restarting index.js...`);
    process.kill(); // Kill the current process before restarting
    startApp('index.js', onExit);
  };

  // Capture stdout data
  process.stdout.on('data', (data) => {
    logOutput(scriptName, 'stdout:', `${data}`);
    
    // Restart on detected status codes in stdout
    if (scriptName === 'index.js' && (data.includes("408") || data.includes("503"))) {
      restartIndex(data);
    }
  });

  // Capture stderr data
  process.stderr.on('data', (data) => {
    logOutput(scriptName, 'stderr:', `${data}`);
    
    // Restart on detected status codes in stderr
    if (scriptName === 'index.js' && (data.includes("408") || data.includes("503"))) {
      restartIndex(data);
    }
  });

  // Handle process exit (for restarting or handling crashes)
  process.on('exit', (code, signal) => {
    if (code !== 0) {
      logOutput(scriptName, `Process exited with code: ${code}`);
    }
    if (signal) {
      logOutput(scriptName, `Process was killed with signal: ${signal}`);
    }

    // Restart index.js if it crashes
    if (scriptName === 'index.js') {
      logOutput(scriptName, `Restarting index.js...`);
      startApp('index.js', onExit);
    } else {
      // Restart server.js if it crashes
      logOutput(scriptName, `Restarting server.js...`);
      startApp('server.js', onExit);
    }

    if (onExit) onExit();
  });
}

// Start both index.js and server.js and keep them running independently
startApp('server.js'); // Keep server.js running independently
startApp('index.js', () => {
  // If index.js crashes, this callback can be used to log additional actions or stop server.js if needed.
});

// Logs directory cleanup function
const logsDir = path.join(__dirname, "logs");
function deleteLogsDir() {
    if (fs.existsSync(logsDir)) {
        fs.rmSync(logsDir, { recursive: true, force: true });
        console.log("🗑️ Logs directory deleted.");
    }
}

// Listen for process exit signals
process.on('exit', () => {
  deleteLogsDir();
});
process.on("SIGINT", () => { // Ctrl + C
    console.log("\n⚠️ Process interrupted (SIGINT)");
    deleteLogsDir();
    process.exit(0);
});
process.on("SIGTERM", () => { // Kill command
    console.log("\n⚠️ Process terminated (SIGTERM)");
    deleteLogsDir();
    process.exit(0);
});
process.on("uncaughtException", (err) => { // Unhandled error
    console.error("❌ Uncaught Exception:", err);
    deleteLogsDir();
    process.exit(1);
});
process.on('beforeExit', () => {
  deleteLogsDir();
  console.log('index.js stopped, data set to null');
});
