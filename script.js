// --- KONFIGURASI ---
const API_KEY = 'b4f640b50fe62cb04ac7e3e627120dab'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// --- DOM ELEMENTS ---
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherResult = document.getElementById('weather-result');
const errorMessage = document.getElementById('error-message');
const loadingState = document.getElementById('loading');
const historyContainer = document.getElementById('history-container');
const unitToggle = document.getElementById('unit-toggle');
const unitLabel = document.getElementById('unit-label');

// --- STATE ---
let currentTempC = 0;
let isFahrenheit = false;
let searchHistory = JSON.parse(localStorage.getItem('zeroWeatherHistory')) || [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});

searchBtn.addEventListener('click', () => handleSearch());
cityInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());

unitToggle.addEventListener('change', (e) => {
    isFahrenheit = e.target.checked;
    unitLabel.textContent = isFahrenheit ? '°F' : '°C';
    updateTempUI();
});

function handleSearch() {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
}

// --- CORE LOGIC (ASYNC/AWAIT) ---
async function fetchWeather(city) {
    showLoading(true);
    hideError();
    weatherResult.classList.add('hidden');

    try {
        // Fetch Current
        const resCurrent = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        if (!resCurrent.ok) throw new Error(resCurrent.status === 404 ? 'Kota tidak ditemukan.' : 'Terjadi kesalahan.');
        
        const dataCurrent = await resCurrent.json();
        currentTempC = dataCurrent.main.temp;
        
        // Fetch Forecast
        const resForecast = await fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        const dataForecast = await resForecast.json();

        updateUI(dataCurrent, dataForecast.list);
        addToHistory(dataCurrent.name);

    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

// --- UI RENDERING ---
function updateUI(current, forecastList) {
    document.getElementById('city-name').textContent = current.name;
    document.getElementById('weather-desc').textContent = current.weather[0].description;
    document.getElementById('humidity').textContent = `${current.main.humidity}%`;
    document.getElementById('wind').textContent = `${Math.round(current.wind.speed * 3.6)} km/j`;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
    
    updateTempUI();
    renderForecast(forecastList);
    
    weatherResult.classList.remove('hidden');
}

function updateTempUI() {
    let val = currentTempC;
    if (isFahrenheit) val = (val * 9/5) + 32;
    document.getElementById('temp').textContent = Math.round(val) + '°';
}

// --- ARRAY METHODS IMPLEMENTATION ---

function renderForecast(list) {
    const container = document.getElementById('forecast-list');
    container.innerHTML = '';

    // Filter data harian (setiap 24 jam)
    const dailyData = list.filter((item, index) => index % 8 === 0).slice(0, 5);

    // Map untuk render HTML
    dailyData.map(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString('id-ID', { weekday: 'short' });
        const temp = isFahrenheit ? Math.round((day.main.temp * 9/5) + 32) : Math.round(day.main.temp);
        
        const el = document.createElement('div');
        el.className = 'fc-item';
        el.innerHTML = `
            <span class="fc-day">${date}</span>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="icon">
            <span class="fc-temp">${temp}°</span>
        `;
        container.appendChild(el);
    });
}

function addToHistory(city) {
    const unique = searchHistory.filter(c => c.toLowerCase() !== city.toLowerCase());
    searchHistory.unshift(city);
    if(searchHistory.length > 5) searchHistory.pop();
    
    localStorage.setItem('zeroWeatherHistory', JSON.stringify(searchHistory));
    renderHistory();
}

function renderHistory() {
    historyContainer.innerHTML = '';
    searchHistory.map(city => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = city;
        chip.onclick = () => {
            cityInput.value = city;
            fetchWeather(city);
        };
        historyContainer.appendChild(chip);
    });
}

// --- HELPERS ---
function showLoading(show) {
    loadingState.classList.toggle('hidden', !show);
}
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}
function hideError() {
    errorMessage.classList.add('hidden');
}