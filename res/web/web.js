const { spawn } = require('child_process');
const path = require('path');

// Function to query Python script
function getSearchResults(query) {
  return new Promise((resolve, reject) => {
    //const pythonPath = path.join(__dirname, 'myenv', 'bin', 'python'); // Linux/macOS
    // const pythonPath = path.join(__dirname, 'myenv', 'Scripts', 'python.exe'); // Windows
let pythonExecutable;

// Check if 'python' exists, otherwise fallback to 'python3'
try {
  execSync('command -v python');  // Will throw an error if python is not found
  pythonExecutable = 'python';
} catch (error) {
  pythonExecutable = 'python3';
}

const pythonProcess = spawn(pythonExecutable, ['web.py', query]);



    let data = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    pythonProcess.stderr.on('data', (err) => {
      errorData += err.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          //console.log('Raw Python Output:', data);
          resolve(JSON.parse(data));  // Parse JSON safely
        } catch (parseError) {
          reject(`Error parsing JSON: ${parseError.message}`);
        }
      } else {
        reject(`Python process exited with code ${code}. Error: ${errorData}`);
      }
    });
  });
}

// Example usage of the function
async function websearch_query(query)  {
  try {
    
    const searchResults = await getSearchResults(query);

    // Clean and format the output
    const cleanedResults = searchResults.map(result => result.replace(/\s+/g, ' ').trim());

    return cleanedResults
  } catch (error) {
    //console.error('Error:', error);
  }
}
 module.exports = {websearch_query}
