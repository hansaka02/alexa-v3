const axios = require('axios');

async function sendRequest(query) {
  try {
    // Step 1: Send the POST request to get the event ID
    const postResponse = await axios.post('https://hansaka1-google-search2.hf.space/gradio_api/call/predict', {
      data: [query]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Log the response to inspect the structure and check where the event ID is located
    //console.log('POST Response:', postResponse.data);

    // Assuming the response has the event ID in a certain format, let's extract it
    const eventId = postResponse.data?.event_id;  // Modify based on actual response

    if (!eventId) {
      console.error('Event ID not found in the POST response');
      return;
    }

    // Step 2: Send a GET request with the extracted EVENT_ID
    const getResponse = await axios.get(`https://hansaka1-google-search2.hf.space/gradio_api/call/predict/${eventId}`);

    // Log the raw GET response
    //console.log('Raw GET Response:', getResponse.data);

    // Step 3: Clean up the response and extract only the 'data' part
    const rawResponse = getResponse.data;  // Assuming this is a string or incorrectly formatted JSON

    // If the response is in a raw format, we might need to manually clean it
    const cleanedResponse = rawResponse.replace(/^event:\s*complete\s*data:\s*/, '');  // Remove 'event: complete data:'

    // Now, we can safely parse the cleaned response as JSON
    try {
      const cleanData = JSON.parse(cleanedResponse);
      return cleanData;
      //console.log('Cleaned Data:', cleanData);
    } catch (parseError) {
      console.error('Error parsing cleaned response:', parseError.message);
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

async function websearch_query(query) {
  try {
    const searchResults = await sendRequest(query);

    // Check if searchResults is valid and inspect the first result
    if (!searchResults || searchResults.length === 0) {
      console.error('Error: searchResults is empty or invalid');
      return [];
    }

    // Assuming searchResults[0] is a string or another format, handle accordingly
    const cleanedResults = searchResults[0];

    // Check if cleanedResults is a string (you can adjust this if it's another type)
    if (typeof cleanedResults !== 'string') {
      console.error('Error: cleanedResults is not a string');
      return [];
    }

    // Now clean and format the string (if it's a string, as expected)
    console.log([cleanedResults.replace( /\s+/, ' ').trim()])
    return [cleanedResults.replace(/\s+/, ' ').trim()];

  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}



 module.exports = {websearch_query}

//sendRequest('srilanka').;
