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
  const child = spawn('node', [scriptName]);

  // Helper function to restart index.js unless it's 515
  const restartIndex = (statusCode) => {
    if (statusCode !== 515) {
      logOutput(scriptName, `Detected status code: ${statusCode}. Restarting index.js...`, '');
      child.kill(); // Kill the current process before restarting
      startApp('index.js', onExit);
    } else {
      logOutput(scriptName, `Detected status code: 515. NOT restarting index.js.`, '');
    }
  };

  // Capture stdout
  child.stdout.on('data', (data) => {
    const line = data.toString().trim();
    logOutput(scriptName, 'stdout:', line);

    if (scriptName === 'index.js') {
      // Convert line to integer
      const code = parseInt(line, 10);

      // If it's a valid number and not 515, restart
      if (!isNaN(code) && code !== 515) {
        restartIndex(code);
      }
    }
  });

  // Capture stderr
  child.stderr.on('data', (data) => {
    const line = data.toString().trim();
    logOutput(scriptName, 'stderr:', line);

    if (scriptName === 'index.js') {
      // Convert line to integer
      const code = parseInt(line, 10);

      // If it's a valid number and not 515, restart
      if (!isNaN(code) && code !== 515) {
        restartIndex(code);
      }
    }
  });

  // Handle process exit
  child.on('exit', (code, signal) => {
    if (code !== 0) {
      logOutput(scriptName, `Process exited with code: ${code}`, '');
    }
    if (signal) {
      logOutput(scriptName, `Process was killed with signal: ${signal}`, '');
    }

    // If index.js crashed, restart it unless code is 515
    if (scriptName === 'index.js') {
      if (code === 515) {
        logOutput(scriptName, 'index.js exited with code 515. NOT restarting.', '');
      } else {
        logOutput(scriptName, 'index.js exited. Restarting...', '');
        startApp('index.js', onExit);
      }
    } else {
      // If server.js crashed, restart server.js
      logOutput(scriptName, 'server.js exited. Restarting...', '');
      startApp('server.js', onExit);
    }

    if (onExit) onExit();
  });
}

// Start both scripts
startApp('server.js');
startApp('index.js', () => {
  // Callback if index.js crashes
});

// Logs directory cleanup
const logsDir = path.join(__dirname, 'logs');
function deleteLogsDir() {
  if (fs.existsSync(logsDir)) {
    fs.rmSync(logsDir, { recursive: true, force: true });
    console.log('🗑️ Logs directory deleted.');
  }
}

process.on('exit', () => {
  deleteLogsDir();
});
process.on('SIGINT', () => {
  console.log('\n⚠️ Process interrupted (SIGINT)');
  deleteLogsDir();
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\n⚠️ Process terminated (SIGTERM)');
  deleteLogsDir();
  process.exit(0);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  deleteLogsDir();
  process.exit(1);
});
process.on('beforeExit', () => {
  deleteLogsDir();
  console.log('index.js stopped, data set to null');
});

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
