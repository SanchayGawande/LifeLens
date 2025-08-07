import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// OpenWeatherMap API configuration
const WEATHER_API_KEY = 'f48ac402f7c02674c3fecf79801916ca';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_KEY = 'weather_cache';

/**
 * Get current weather data with caching and location services
 */
export const getWeatherData = async () => {
  try {
    // Check cache first
    const cachedData = await getCachedWeather();
    if (cachedData) {
      return cachedData;
    }

    // Get user location
    const location = await getUserLocation();
    if (!location) {
      return null;
    }

    // Fetch fresh weather data
    const weatherData = await fetchWeatherFromAPI(location);
    
    // Cache the result
    await cacheWeatherData(weatherData);
    
    return weatherData;
  } catch (error) {
    console.error('Failed to get weather data:', error);
    return null;
  }
};

/**
 * Get user's current location with permission handling
 */
const getUserLocation = async () => {
  try {
    // Check if location services are enabled
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      maximumAge: 10 * 60 * 1000, // Accept location up to 10 minutes old
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Fetch weather data from OpenWeatherMap API
 */
const fetchWeatherFromAPI = async (location) => {
  if (!WEATHER_API_KEY) {
    console.warn('Weather API key not configured');
    return null;
  }

  const { latitude, longitude } = location;
  const url = `${WEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Transform data to our format
  return {
    location: {
      name: data.name,
      country: data.sys.country,
      coordinates: { latitude, longitude },
    },
    weather: data.weather[0],
    main: {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
    },
    wind: data.wind,
    clouds: data.clouds,
    visibility: data.visibility,
    timestamp: new Date().toISOString(),
    sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
    sunset: new Date(data.sys.sunset * 1000).toISOString(),
  };
};

/**
 * Cache weather data with timestamp
 */
const cacheWeatherData = async (weatherData) => {
  try {
    const cacheObject = {
      data: weatherData,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Failed to cache weather data:', error);
  }
};

/**
 * Get cached weather data if still fresh
 */
const getCachedWeather = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    
    if (!cached) {
      return null;
    }

    const cacheObject = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still fresh
    if (now - cacheObject.timestamp < CACHE_DURATION) {
      return cacheObject.data;
    }
    
    // Cache expired, remove it
    await AsyncStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Failed to get cached weather:', error);
    return null;
  }
};

/**
 * Get weather description for nudge engine
 */
export const getWeatherDescription = (weatherData) => {
  if (!weatherData?.weather?.main) {
    return 'Unknown weather';
  }

  const { main, description } = weatherData.weather;
  const temp = weatherData.main?.temp;
  
  const conditions = {
    Clear: '☀️ Clear skies',
    Clouds: '☁️ Cloudy',
    Rain: '🌧️ Rainy',
    Snow: '❄️ Snowy',
    Thunderstorm: '⛈️ Stormy',
    Drizzle: '🌦️ Light rain',
    Mist: '🌫️ Misty',
    Fog: '🌫️ Foggy',
  };

  const tempDescription = temp 
    ? temp > 25 ? ' and warm' 
      : temp > 15 ? ' and mild' 
      : temp > 5 ? ' and cool'
      : ' and cold'
    : '';

  return `${conditions[main] || description}${tempDescription}`;
};

/**
 * Check if weather is good for outdoor activities
 */
export const isGoodOutdoorWeather = (weatherData) => {
  if (!weatherData) return false;

  const { main, weather } = weatherData;
  const temp = main?.temp;
  const weatherMain = weather?.main;
  
  // Good conditions: clear or partly cloudy, reasonable temperature, no precipitation
  const goodWeatherTypes = ['Clear', 'Clouds'];
  const goodTemperature = temp && temp > 10 && temp < 35;
  const noSevereWeather = !['Rain', 'Snow', 'Thunderstorm'].includes(weatherMain);
  
  return goodWeatherTypes.includes(weatherMain) && goodTemperature && noSevereWeather;
};

/**
 * Get weather-based activity suggestions
 */
export const getWeatherActivitySuggestions = (weatherData) => {
  if (!weatherData) return [];

  const { main, weather } = weatherData;
  const temp = main?.temp;
  const weatherMain = weather?.main;
  
  const suggestions = [];
  
  if (weatherMain === 'Clear' && temp > 20) {
    suggestions.push('Take a walk in the park', 'Have a picnic', 'Go for a bike ride');
  } else if (weatherMain === 'Clear' && temp > 10) {
    suggestions.push('Go for a walk', 'Sit outside with coffee', 'Take photos outdoors');
  } else if (weatherMain === 'Clouds' && temp > 15) {
    suggestions.push('Perfect walking weather', 'Visit a local market', 'Outdoor cafe time');
  } else if (weatherMain === 'Rain') {
    suggestions.push('Cozy indoor activities', 'Read a book', 'Watch a movie', 'Cook something warm');
  } else if (temp < 5) {
    suggestions.push('Hot drinks', 'Indoor hobbies', 'Warm comfort food');
  }
  
  return suggestions;
};

/**
 * Clear weather cache (useful for testing or manual refresh)
 */
export const clearWeatherCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear weather cache:', error);
  }
};