 // API configuration
        const API_KEY = '54c3dc5c0d489c2674a4c07fc4e4af54'; // Replace with your OpenWeatherMap API key
        const BASE_URL = 'https://api.openweathermap.org/data/2.5';
        
        // State management
        const state = {
            currentCity: 'Madrid',
            favorites: JSON.parse(localStorage.getItem('weatherFavorites')) || [],
            settings: JSON.parse(localStorage.getItem('weatherSettings')) || {
                tempUnit: 'celsius',
                windUnit: 'kmh'
            },
            map: null,
            mapMarkers: []
        };
        
        // Popular cities for suggestions
        const popularCities = [
            'Madrid', 'Barcelona', 'Malaga', 'Bilbao', 'Valencia',
            'Paris', 'London', 'Berlin', 'Rome', 'New York',
            'Tokyo', 'Sydney', 'Dubai', 'Moscow', 'Toronto'
        ];
        
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize the app
            initApp();
            
            function initApp() {
                // Load settings
                loadSettings();
                
                // Initialize routing
                initRouting();
                
                // Initialize map (but don't show it yet)
                initMap();
                
                // Load default city weather
                fetchWeatherData(state.currentCity);
                
                // Load favorites
                renderFavorites();
                
                // Load suggestions
                renderSuggestions();
                
                // Set up event listeners
                setupEventListeners();
            }
            
            function initRouting() {
                // Handle initial route
                handleRouteChange();
                
                // Listen for hash changes
                window.addEventListener('hashchange', handleRouteChange);
            }
            
            function handleRouteChange() {
    const hash = window.location.hash.substring(1) || 'dashboard';

    // Define all page IDs that correspond to your nav links
    const pageIds = ['dashboard', 'favorites', 'maps', 'settings'];

    // Hide all pages
    pageIds.forEach(id => {
        const page = document.getElementById(id);
        if (page) page.classList.remove('active');
    });

    // Show only the current page
    const currentPage = document.getElementById(hash);
    if (currentPage) {
        currentPage.classList.add('active');
    } else {
        // If invalid hash, default to dashboard
        document.getElementById('dashboard').classList.add('active');
        window.location.hash = 'dashboard';
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === hash) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const page = e.currentTarget.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');
  });
});


    // Additional page-specific logic
    if (hash === 'maps') {
        setTimeout(() => {
        state.map.invalidateSize();  // Force Leaflet to resize properly
    }, 200);
        updateMapView();
    }
}

            
            function initMap() {
                // Initialize Leaflet map
                state.map = L.map('map').setView([40.4168, -3.7038], 6); // Default to Spain
                
                // Add tile layer (OpenStreetMap)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(state.map);
            }
            
            function updateMapView() {
    // Clear existing markers
    state.mapMarkers.forEach(marker => state.map.removeLayer(marker));
    state.mapMarkers = [];

    // Add markers for favorites or popular cities
    const citiesToShow = state.favorites.length > 0 ? state.favorites : popularCities.slice(0, 5);

    // Fetch weather for each city and add markers
    citiesToShow.forEach(city => {
        fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                if (data.coord) {
                    const marker = L.marker([data.coord.lat, data.coord.lon]).addTo(state.map);

                    const popupContent = `<b>${data.name}</b><br>${Math.round(data.main.temp)}°C`;

                    // Bind popup but don't open immediately
                    marker.bindPopup(popupContent);

                    // Show popup on hover
                    marker.on('mouseover', function() {
                        this.openPopup();
                    });

                    // Hide popup when no longer hovering
                    marker.on('mouseout', function() {
                        this.closePopup();
                    });

                    state.mapMarkers.push(marker);
                }
            });
    });

    // Also update cities list
    renderMapCities(citiesToShow);
}
            
            function setupEventListeners() {
                // Search functionality
                const searchBtn = document.getElementById('searchBtn');
                const searchInput = document.getElementById('searchInput');
                
                searchBtn.addEventListener('click', performSearch);
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') performSearch();
                });
                
                // Unit toggle buttons
                document.getElementById('celsiusBtn').addEventListener('click', () => toggleUnits('celsius'));
                document.getElementById('fahrenheitBtn').addEventListener('click', () => toggleUnits('fahrenheit'));
                
                // Settings functionality
                document.getElementById('saveSettings').addEventListener('click', saveSettings);
                
                // Detect location button
                document.getElementById('detectLocation').addEventListener('click', detectLocation);
                
                // Map tabs
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.addEventListener('click', function() {
                        const tabId = this.getAttribute('data-tab');
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                        
                        this.classList.add('active');
                        document.getElementById(tabId + 'Tab').classList.add('active');
                    });
                });
            }
            
            function toggleUnits(unit) {
                state.settings.tempUnit = unit;
                document.getElementById('tempUnit').value = unit;
                
                // Update toggle buttons
                document.getElementById('celsiusBtn').classList.toggle('active', unit === 'celsius');
                document.getElementById('fahrenheitBtn').classList.toggle('active', unit === 'fahrenheit');
                
                // Refresh weather data with new units
                fetchWeatherData(state.currentCity);
                
                // If on maps page, update that too
                if (window.location.hash === '#maps') {
                    updateMapView();
                }
            }
            
            function performSearch() {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    state.currentCity = searchTerm;
                    fetchWeatherData(searchTerm);
                    
                    // If on forecast page, update that too
                    if (window.location.hash === '#maps') {
                        updateMapView();
                    }
                }
            }
            
            function toggleFavorite(city) {
                const index = state.favorites.indexOf(city);
                if (index === -1) {
                    // Add to favorites
                    state.favorites.push(city);
                } else {
                    // Remove from favorites
                    state.favorites.splice(index, 1);
                }
                
                // Save to localStorage
                localStorage.setItem('weatherFavorites', JSON.stringify(state.favorites));
                
                // Update UI
                renderFavorites();
                renderSuggestions();

             // 🔄 Also update the Dashboard Save button (if visible)
                const dashboardBtn = document.querySelector('.current-weather .favorite-btn');
                if (dashboardBtn) {
                    dashboardBtn.classList.toggle('active', state.favorites.includes(city));
                    dashboardBtn.innerHTML = `
                    <i class="fas fa-star"></i> 
                    ${state.favorites.includes(city) ? 'Saved' : 'Save to Favorites'}
        `       ;
            }

    // Update the map if on maps page
    if (window.location.hash === '#maps') {
        updateMapView();
    }
}
            
            function loadFavorite(city) {
                state.currentCity = city;
                document.getElementById('searchInput').value = city;
                fetchWeatherData(city);
                window.location.hash = 'dashboard';
            }
            
            function renderFavorites() {
                const favoritesList = document.getElementById('favoritesList');
                favoritesList.innerHTML = '';
                
                if (state.favorites.length === 0) {
                    favoritesList.innerHTML = '<p>No favorite locations saved yet.</p>';
                    return;
                }
                
                state.favorites.forEach((city, index) => {
                    const li = document.createElement('li');
                    li.className = 'suggestion-item';
                    li.innerHTML = `
                        <span>${city}</span>
                        <div>
                            <button class="btn btn-primary" onclick="loadFavorite('${city}')">View</button>
                            <button class="btn btn-danger" onclick="removeFavorite(${index})">Remove</button>
                        </div>
                    `;
                    favoritesList.appendChild(li);
                });
            }
            
            function renderSuggestions() {
                const suggestionsList = document.getElementById('suggestionsList');
                suggestionsList.innerHTML = '';
                
                popularCities.forEach(city => {
                    if (city.toLowerCase() !== state.currentCity.toLowerCase()) {
                        const li = document.createElement('li');
                        li.className = 'suggestion-item';
                        li.innerHTML = `
                            <span>${city}</span>
                            <div>
                                <button class="btn btn-primary" onclick="loadFavorite('${city}')">View</button>
                                <button class="favorite-btn ${state.favorites.includes(city) ? 'active' : ''}" 
                                    onclick="toggleFavorite('${city}')">
                                    <i class="fas fa-star"></i>
                                </button>
                            </div>
                        `;
                        suggestionsList.appendChild(li);
                    }
                });
            }
            
            function renderMapCities(cities) {
    const mapCitiesContainer = document.getElementById('mapCities');
    mapCitiesContainer.innerHTML = '';

    cities.forEach(city => {
        fetch(`${BASE_URL}/weather?q=${city}&units=${state.settings.tempUnit === 'celsius' ? 'metric' : 'imperial'}&appid=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                const cityElement = document.createElement('div');
                cityElement.className = 'map-city';
                cityElement.innerHTML = `
                    <div class="map-city-name">${data.name}</div>
                    <div class="map-city-temp">${Math.round(data.main.temp)}°${state.settings.tempUnit === 'celsius' ? 'C' : 'F'}</div>
                `;

                // Create a tooltip element (hidden by default)
                const tooltip = document.createElement('div');
                tooltip.className = 'map-city-tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.background = 'rgba(0, 0, 0, 0.75)';
                tooltip.style.color = '#fff';
                tooltip.style.padding = '5px 8px';
                tooltip.style.borderRadius = '5px';
                tooltip.style.fontSize = '12px';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.display = 'none';
                tooltip.innerText = `${data.weather[0].description}, ${Math.round(data.main.temp)}°${state.settings.tempUnit === 'celsius' ? 'C' : 'F'}`;

                cityElement.style.position = 'relative';
                cityElement.appendChild(tooltip);

                cityElement.addEventListener('mouseenter', () => {
                    tooltip.style.display = 'block';
                });

                cityElement.addEventListener('mousemove', (e) => {
                    // Position tooltip relative to mouse within the city element
                    const rect = cityElement.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left + 10;
                    const offsetY = e.clientY - rect.top + 10;
                    tooltip.style.left = offsetX + 'px';
                    tooltip.style.top = offsetY + 'px';
                });

                cityElement.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });

                cityElement.addEventListener('click', () => {
                    state.currentCity = data.name;
                    document.getElementById('searchInput').value = data.name;
                    fetchWeatherData(data.name);
                    window.location.hash = 'dashboard';
                });

                mapCitiesContainer.appendChild(cityElement);
            });
    });
}
            
            function loadSettings() {
                document.getElementById('tempUnit').value = state.settings.tempUnit;
                document.getElementById('windUnit').value = state.settings.windUnit;
                
                // Set unit toggle buttons
                document.getElementById('celsiusBtn').classList.toggle('active', state.settings.tempUnit === 'celsius');
                document.getElementById('fahrenheitBtn').classList.toggle('active', state.settings.tempUnit === 'fahrenheit');
            }
            
            function saveSettings() {
                state.settings = {
                    tempUnit: document.getElementById('tempUnit').value,
                    windUnit: document.getElementById('windUnit').value
                };
                localStorage.setItem('weatherSettings', JSON.stringify(state.settings));
                
                // Update unit toggle buttons
                toggleUnits(state.settings.tempUnit);
                
                // Show success message
                alert('Settings saved successfully!');
            }
            
            function detectLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const lat = position.coords.latitude;
                            const lon = position.coords.longitude;
                            
                            // Fetch city name from coordinates
                            fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data && data.length > 0) {
                                        const city = data[0].name;
                                        state.currentCity = city;
                                        document.getElementById('searchInput').value = city;
                                        fetchWeatherData(city);
                                        alert(`Location detected: ${city}`);
                                    }
                                });
                        },
                        error => {
                            alert('Error getting your location: ' + error.message);
                        }
                    );
                } else {
                    alert('Geolocation is not supported by your browser');
                }
            }
            
            async function fetchWeatherData(city) {
                const weatherDataContainer = document.getElementById('weatherData');
                weatherDataContainer.innerHTML = '<div class="loading">Loading weather data...</div>';
                
                try {
                    // Determine units based on settings
                    const units = state.settings.tempUnit === 'celsius' ? 'metric' : 'imperial';
                    
                    // Fetch current weather
                    const currentResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
                    if (!currentResponse.ok) {
                        throw new Error('City not found');
                    }
                    const currentData = await currentResponse.json();
                    
                    // Fetch 5-day forecast
                    const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
                    if (!forecastResponse.ok) {
                        throw new Error('Forecast not available');
                    }
                    const forecastData = await forecastResponse.json();
                    
                    // Render the weather data
                    renderWeatherData(currentData, forecastData);
                    
                    // Update suggestions (to update favorite stars)
                    renderSuggestions();
                } catch (error) {
                    weatherDataContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
                    console.error('Error fetching weather data:', error);
                }
            }
            
            function renderWeatherData(currentData, forecastData) {
                const cityName = currentData.name;
                const country = currentData.sys?.country || '';
                const temp = Math.round(currentData.main.temp);
                const feelsLike = Math.round(currentData.main.feels_like);
                const description = currentData.weather[0].description;
                const humidity = currentData.main.humidity;
                const windSpeed = convertWindSpeed(currentData.wind.speed);
                const weatherIcon = currentData.weather[0].icon;
                const weatherMain = currentData.weather[0].main.toLowerCase();
                
                // Get chance of rain if available
                let chanceOfRain = 0;
                if (currentData.rain && currentData.rain['1h']) {
                    chanceOfRain = Math.round(currentData.rain['1h'] * 100);
                }
                
                // Process hourly forecast (next 6 hours)
                const now = new Date();
                const hourlyForecast = [];
                for (let i = 0; i < 6; i++) {
                    const forecastTime = new Date(now.getTime() + i * 3 * 60 * 60 * 1000);
                    const forecastHour = forecastTime.getHours();
                    
                    // Find the closest forecast to this time
                    const forecast = forecastData.list.find(item => {
                        const itemTime = new Date(item.dt * 1000).getHours();
                        return itemTime >= forecastHour && itemTime < forecastHour + 3;
                    });
                    
                    if (forecast) {
                        hourlyForecast.push({
                            time: forecastHour === 0 ? '12 AM' : 
                                  forecastHour < 12 ? `${forecastHour} AM` :
                                  forecastHour === 12 ? '12 PM' : `${forecastHour - 12} PM`,
                            temp: Math.round(forecast.main.temp),
                            icon: forecast.weather[0].icon,
                            weather: forecast.weather[0].main.toLowerCase()
                        });
                    }
                }
                
                // Process 3-day forecast
                const dailyForecast = [];
                const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                
                // Group forecast by day
                const dailyData = {};
                forecastData.list.forEach(item => {
                    const date = new Date(item.dt * 1000);
                    const day = date.getDate();
                    
                    if (!dailyData[day]) {
                        dailyData[day] = {
                            date: date,
                            temps: [],
                            weather: []
                        };
                    }
                    
                    dailyData[day].temps.push(item.main.temp);
                    dailyData[day].weather.push(item.weather[0].main.toLowerCase());
                });
                
                // Get forecast for next 3 days
                Object.keys(dailyData).slice(0, 3).forEach((day, index) => {
                    const data = dailyData[day];
                    const minTemp = Math.round(Math.min(...data.temps));
                    const maxTemp = Math.round(Math.max(...data.temps));
                    
                    // Determine most common weather condition for the day
                    const weatherCount = {};
                    data.weather.forEach(condition => {
                        weatherCount[condition] = (weatherCount[condition] || 0) + 1;
                    });
                    const mostCommonWeather = Object.keys(weatherCount).reduce((a, b) => 
                        weatherCount[a] > weatherCount[b] ? a : b);
                    
                    dailyForecast.push({
                        name: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : days[data.date.getDay()] ? 'Day after tomorrow' : days[data.date.getDate()],
                        weather: mostCommonWeather,
                        temp: `${maxTemp}/${minTemp}`,
                        icon: getWeatherIcon(mostCommonWeather)
                    });
                });
                
                // Create HTML for weather data
                const weatherDataContainer = document.getElementById('weatherData');
                weatherDataContainer.innerHTML = `
                    <div class="current-weather">
                        <div class="city">${cityName}${country ? ', ' + country : ''}</div>
                        <div class="weather-description ${weatherMain}">${description}</div>
                        <div class="rain-chance">Chance of rain: ${chanceOfRain}%</div>
                        <div class="temperature">${temp}°${state.settings.tempUnit === 'celsius' ? 'C' : 'F'}</div>
                        <button class="favorite-btn ${state.favorites.includes(cityName) ? 'active' : ''}" 
                            onclick="toggleFavorite('${cityName}')">
                            <i class="fas fa-star"></i> ${state.favorites.includes(cityName) ? 'Saved' : 'Save to Favorites'}
                        </button>
                    </div>
                    
                    <div class="forecast-title">TODAY'S FORECAST</div>
                    <div class="hourly-forecast" id="hourlyForecast">
                        ${hourlyForecast.map(hour => `
                            <div class="hour">
                                <div class="hour-time">${hour.time}</div>
                                <img src="https://openweathermap.org/img/wn/${hour.icon}.png" alt="Weather icon" class="weather-icon">
                                <div class="hour-temp">${hour.temp}°${state.settings.tempUnit === 'celsius' ? 'C' : 'F'}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="air-conditions">
                        <div class="conditions-title">AIR CONDITIONS</div>
                        <div class="conditions-grid">
                            <div class="condition-item">
                                <span class="condition-label">Real Feel</span>
                                <span class="condition-value">${feelsLike}°${state.settings.tempUnit === 'celsius' ? 'C' : 'F'}</span>
                            </div>
                            <div class="condition-item">
                                <span class="condition-label">Chance of rain</span>
                                <span class="condition-value">${chanceOfRain}%</span>
                            </div>
                            <div class="condition-item">
                                <span class="condition-label">Wind</span>
                                <span class="condition-value">${windSpeed}</span>
                            </div>
                            <div class="condition-item">
                                <span class="condition-label">Humidity</span>
                                <span class="condition-value">${humidity}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="weekly-title">3-DAY FORECAST</div>
                    <div class="weekly-forecast" id="weeklyForecast">
                        ${dailyForecast.map(day => `
                            <div class="day-row">
                                <div class="day-name">${day.name}</div>
                                <div class="day-weather ${day.weather}">
                                    <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="Weather icon" class="day-weather-icon">
                                    <span>${capitalizeFirstLetter(day.weather)}</span>
                                </div>
                                <div class="day-temp">${day.temp}°${state.settings.tempUnit === 'celsius' ? 'C' : 'F'}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            function convertWindSpeed(speed) {
                // Convert from m/s to selected unit
                switch(state.settings.windUnit) {
                    case 'mph':
                        return `${(speed * 2.237).toFixed(1)} mph`;
                    case 'ms':
                        return `${speed.toFixed(1)} m/s`;
                    case 'kmh':
                    default:
                        return `${(speed * 3.6).toFixed(1)} km/h`;
                }
            }
            
            // Helper function to get weather icon based on condition
            function getWeatherIcon(condition) {
                const icons = {
                    'clear': '01d',
                    'clouds': '03d',
                    'rain': '10d',
                    'thunderstorm': '11d',
                    'snow': '13d',
                    'mist': '50d',
                    'fog': '50d',
                    'haze': '50d'
                };
                return icons[condition] || '01d';
            }
            
            // Helper function to capitalize first letter
            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            
            // Make functions available globally for HTML onclick handlers
            window.toggleFavorite = toggleFavorite;
            window.loadFavorite = loadFavorite;
            window.removeFavorite = function(index) {
                state.favorites.splice(index, 1);
                localStorage.setItem('weatherFavorites', JSON.stringify(state.favorites));
                renderFavorites();
                renderSuggestions();
                
                // If on maps page, update that too
                if (window.location.hash === '#maps') {
                    updateMapView();
                }
            };

            window.removeFavorite = function(index) {
            const city = state.favorites[index];
            if (!confirm(`Are you sure you want to remove ${city} from favorites?`)) return;
    
            state.favorites.splice(index, 1);
            localStorage.setItem('weatherFavorites', JSON.stringify(state.favorites));
            renderFavorites();
            renderSuggestions();
            if (window.location.hash === '#maps') updateMapView();
        };
    });