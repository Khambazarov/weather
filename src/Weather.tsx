import { FC, useRef } from "react";
import { NavLink, useParams, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

type WeatherData = {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    vis_km: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        maxwind_kph: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: number;
        is_moon_up: number;
        is_sun_up: number;
      };
      hour: Array<{
        time_epoch: number;
        time: string;
        temp_c: number;
        is_day: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        wind_kph: number;
        wind_dir: string;
        snow_cm: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
      }>;
    }>;
  };
};

const getCitiesFromLocalStorage = (): string[] => {
  const cities = localStorage.getItem("cities");
  return cities ? JSON.parse(cities) : ["kiel"];
};

const setCitiesToLocalStorage = (cities: string[]) => {
  localStorage.setItem("cities", JSON.stringify(cities));
};

export const Weather: FC = () => {
  const { date } = useParams<{ date: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const cityInputRef = useRef<HTMLInputElement>(null);

  const { data: cities } = useQuery<string[]>({
    queryKey: ["cities"],
    queryFn: () => Promise.resolve(getCitiesFromLocalStorage()),
    initialData: getCitiesFromLocalStorage,
  });

  const selectedCity = cities[0];

  const { data, error, isLoading } = useQuery<WeatherData>({
    queryKey: ["weather", selectedCity],
    queryFn: async () => {
      const current = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${selectedCity}&aqi=yes`
      );
      const forecast = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${selectedCity}&days=3&aqi=yes&alerts=yes`
      );
      return {
        ...forecast.data,
        current: current.data.current,
        location: current.data.location,
      };
    },
  });

  const handleCityClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (cityInputRef.current) {
      const newCity = cityInputRef.current.value.trim();
      if (newCity && !cities.includes(newCity)) {
        const updatedCities = [...cities, newCity];
        setCitiesToLocalStorage(updatedCities);
        queryClient.setQueryData(["cities"], updatedCities);
        navigate(`/weather/${newCity}`);
      }
    }
  };

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelectedCity = e.target.value;
    queryClient.setQueryData(["weather", newSelectedCity], null);
    navigate(`/weather/${newSelectedCity}`);
  };

  if (isLoading) return <div>Loading...</div>;

  if (error) return <div>An error has occurred: {error.message}</div>;

  if (!data) return <div>Loading...</div>;

  const getRounded = (round: number) => Math.round(round);

  const selectedForecast = date
    ? data.forecast.forecastday.find((day) => day.date === date)
    : null;

  if (!selectedForecast) {
    const today = new Date().toISOString().split("T")[0];
    return <Navigate to={`/weather/${selectedCity}/${today}`} />;
  }

  return (
    <div>
      <h1>Weather in {data.location.name}</h1>
      <form>
        <input type="text" ref={cityInputRef} placeholder="Enter city" />
        <button onClick={handleCityClick}>Add City</button>
      </form>
      <select value={selectedCity} onChange={handleCitySelect}>
        {cities.map((city, index) => (
          <option key={index} value={city}>
            {city}
          </option>
        ))}
      </select>
      <p>Region: {data.location.region}</p>
      <p>Country: {data.location.country}</p>
      <p>Local Time: {data.location.localtime}</p>
      <h2>Current Weather</h2>
      <p>Temperature: {getRounded(data.current.temp_c)}°C</p>
      <p>Condition: {data.current.condition.text}</p>
      <p>
        Wind: {getRounded(data.current.wind_kph)} kph {data.current.wind_dir}
      </p>
      <p>Humidity: {data.current.humidity}%</p>
      <p>Cloud: {data.current.cloud}%</p>
      <p>Feels Like: {getRounded(data.current.feelslike_c)}°C</p>
      <p>Visibility: {data.current.vis_km} km</p>
      <h2>Forecast</h2>
      {data.forecast.forecastday.map((day, index) => (
        <div key={index}>
          <NavLink
            to={`/weather/${selectedCity}/${day.date}`}
            style={{ textDecoration: "none" }}
          >
            <h3>{day.date}</h3>
          </NavLink>
          <p>Max Temp: {getRounded(day.day.maxtemp_c)}°C</p>
          <p>Min Temp: {getRounded(day.day.mintemp_c)}°C</p>
          <p>Max Wind: {getRounded(day.day.maxwind_kph)} kph</p>
          <p>Condition: {day.day.condition.text}</p>
          <h4>Astro</h4>
          <p>Sunrise: {day.astro.sunrise}</p>
          <p>Sunset: {day.astro.sunset}</p>
          <p>Moonrise: {day.astro.moonrise}</p>
          <p>Moonset: {day.astro.moonset}</p>
          <p>Moon Phase: {day.astro.moon_phase}</p>
          <p>Moon Illumination: {day.astro.moon_illumination}%</p>
        </div>
      ))}
      {selectedForecast && (
        <div>
          <h4>Hourly Forecast for {selectedForecast.date}</h4>
          {selectedForecast.hour.map((hour, index) => (
            <div key={index}>
              <p>Time: {hour.time.split(" ")[1]}</p>
              <p>Temp: {getRounded(hour.temp_c)}°C</p>
              <p>Condition: {hour.condition.text}</p>
              <p>
                Wind: {getRounded(hour.wind_kph)} kph {hour.wind_dir}
              </p>
              <p>Humidity: {hour.humidity}%</p>
              <p>Cloud: {hour.cloud}%</p>
              <p>Feels Like: {getRounded(hour.feelslike_c)}°C</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
