const { spawn, execSync } = require('child_process');
const path = require('path');

// Function to query Python script
function getSearchResults(query) {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(__dirname, 'env', 'bin', 'python'); // Virtual environment's Python path

    const pythonProcess = spawn(pythonPath, ['web.py', query]);

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
          // Assuming the Python script outputs JSON, parse it
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
async function websearch_query(query) {
  try {
    const searchResults = await getSearchResults(query);

    // Clean and format the output
    const cleanedResults = searchResults.map(result => result.replace(/\s+/g, ' ').trim());

    return cleanedResults;
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = { websearch_query };
