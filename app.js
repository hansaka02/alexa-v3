const { exec, spawn } = require("child_process");

let processInstance;

// Function to start index.js using PM2
function startProcess() {
  console.log("Starting index.js using PM2...");
  processInstance = spawn("pm2", ["start", "index.js", "--name", "alexaa-v3"], {
    stdio: "inherit",
  });

  processInstance.on("exit", (code, signal) => {
    console.log(`index.js exited with code ${code}, signal ${signal}`);
    if (code !== 0) {
      console.log("Restarting due to an unexpected exit...");
      startProcess(); // Restart on crash
    }
  });
}

// Function to restart index.js every hour
function restartProcess() {
  console.log("Restarting index.js using PM2...");
  exec("pm2 restart index.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error restarting index.js: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`PM2 stderr: ${stderr}`);
    }
    console.log(`PM2 stdout: ${stdout}`);
  });
}

// Start index.js initially
startProcess();

// Restart every hour
setInterval(restartProcess, 3600000);
