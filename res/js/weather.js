const axios = require('axios');

// Function to get latitude and longitude from city using Nominatim (OpenStreetMap)
async function getCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&addressdetails=1`;
//console.log(url)
    try {
        const response = await axios.get(url);
        if (response.data.length > 0) {
            const lat = response.data[0].lat;
            const lon = response.data[0].lon;
            return { lat, lon };
        } else {
            return { lat: null, lon: null }; // Return null if city not found
        }
    } catch (error) {
        //console.error("Error fetching coordinates:", error);
        return 'Error fetching coordinates'
    }
}

// Function to get weather data from Open-Meteo based on latitude and longitude
async function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
        const response = await axios.get(url);
        const weather = response.data.current_weather;
        return weather;
    } catch (error) {
        console.error("Error fetching weather:", error);
        throw new Error("Error fetching weather");
    }
}

// Main function to get weather of a city
async function weatherof(city) {
    const { lat, lon } = await getCoordinates(city);

    if (lat === null || lon === null) {
        return'invalid city' // Return message if coordinates are null
    } else if(lat === 'undefined' || lon === 'undefined'){
      return'invalid city'
    } else {
        const weather = await getWeather(lat, lon);
        return weather;
    }
}

module.exports = { weatherof };
