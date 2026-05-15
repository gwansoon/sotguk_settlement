// OpenWeatherMap API 키
const WEATHER_API_KEY = "6b83319a2ef4412d6da08d79406d0f40";

export async function initWeather(weatherInfoElement, lat, lon) {
    if (!weatherInfoElement) return;
    
    if (!lat || !lon) {
        weatherInfoElement.innerText = "☁️ 위치 정보 없음";
        return;
    }

    weatherInfoElement.innerText = "⏳ 날씨 정보를 불러오는 중...";

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`;
        const response = await fetch(url);
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        
        // 날씨 상태에 따른 이모지 매핑
        const iconCode = data.weather[0].icon;
        const emojis = { '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️', '09': '🌧️', '10': '🌧️', '11': '🌩️', '13': '❄️', '50': '🌫️' };
        const emoji = emojis[iconCode.substring(0, 2)] || '🌈';
        
        weatherInfoElement.innerText = `${emoji} ${description} (${temp}℃)`;
    } catch (error) {
        console.error("날씨를 가져오는 중 오류 발생:", error);
        weatherInfoElement.innerText = "☁️ 날씨 정보 없음";
    }
}