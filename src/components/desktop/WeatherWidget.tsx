import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSnow, CloudSun, Loader2, Sun, Zap } from "lucide-react";
import type { Units, WidgetSize } from "@/lib/desktop-storage";

interface WeatherData {
  place: string;
  temp: number;
  code: number;
  high: number;
  low: number;
  days: { date: string; max: number; min: number; code: number }[];
}

function iconFor(code: number, className: string) {
  if (code === 0) return <Sun className={className} />;
  if (code <= 2) return <CloudSun className={className} />;
  if (code >= 95) return <Zap className={className} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={className} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86)) return <CloudRain className={className} />;
  return <Cloud className={className} />;
}

function labelFor(code: number) {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 86) return "Showers";
  return "Thunderstorm";
}

export function WeatherWidget({
  units,
  city,
  size = "small",
}: {
  units: Units;
  city: string;
  size?: WidgetSize;
}) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";

    const fetchAt = async (lat: number, lon: number, place: string) => {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=5&timezone=auto` +
        `&temperature_unit=${tempUnit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("weather");
      const json = await res.json();
      const days = (json.daily.time as string[]).slice(0, 5).map((t, i) => ({
        date: t.slice(5).replace("-", "-"),
        max: Math.round(json.daily.temperature_2m_max[i]),
        min: Math.round(json.daily.temperature_2m_min[i]),
        code: json.daily.weather_code[i],
      }));
      if (cancelled) return;
      setData({
        place,
        temp: Math.round(json.current.temperature_2m),
        code: json.current.weather_code,
        high: Math.round(json.daily.temperature_2m_max[0]),
        low: Math.round(json.daily.temperature_2m_min[0]),
        days,
      });
    };

    const run = async () => {
      setError(null);
      setData(null);
      try {
        if (city.trim()) {
          const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city.trim())}`,
          ).then((r) => r.json());
          const hit = geo?.results?.[0];
          if (!hit) throw new Error("City not found");
          await fetchAt(hit.latitude, hit.longitude, hit.name);
          return;
        }
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              fetchAt(pos.coords.latitude, pos.coords.longitude, "Current location").catch(() =>
                setError("Couldn't load weather"),
              );
            },
            () => {
              fetchAt(37.7749, -122.4194, "San Francisco").catch(() => setError("Couldn't load weather"));
            },
            { timeout: 8000 },
          );
          return;
        }
        await fetchAt(37.7749, -122.4194, "San Francisco");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load weather");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [units, city]);

  const large = size === "large";
  const unitLabel = units === "imperial" ? "F" : "C";
  const shell = `mac-weather-card flex h-[220px] flex-col justify-between overflow-hidden rounded-[26px] p-5 ${large ? "w-[420px]" : "w-[220px]"}`;

  if (error) {
    return (
      <div className={shell}>
        <p className="py-10 text-center text-sm opacity-80">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <Loader2 className={`h-6 w-6 animate-spin opacity-80 ${large ? "my-10" : "my-16"}`} />
      </div>
    );
  }

  if (large) {
    return (
      <div className={shell}>
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <span className="text-[56px] font-light leading-none tabular-nums">{data.temp}</span>
            <span className="mt-2 text-2xl font-light">°{unitLabel}</span>
          </div>
          <div className="mt-1 flex-1 px-5">
            <p className="truncate text-lg font-medium">{data.place}</p>
            <p className="text-sm opacity-80">{labelFor(data.code)}</p>
          </div>
          {iconFor(data.code, "h-14 w-14 shrink-0 opacity-95")}
        </div>
        <div className="mt-4 flex justify-between">
          {data.days.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-2">
              <span className="text-xs opacity-75 tabular-nums">{d.date}</span>
              {iconFor(d.code, "h-6 w-6 opacity-95")}
              <span className="text-sm tabular-nums">
                {d.max}°/{d.min}°
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{data.place}</p>
          <p className="truncate text-base font-medium opacity-70">{labelFor(data.code)}</p>
        </div>
        {iconFor(data.code, "h-8 w-8 shrink-0 opacity-95")}
      </div>
      <div className="mt-2 flex items-start">
        <span className="text-[54px] font-light leading-none tabular-nums">{data.temp}</span>
        <span className="mt-1 text-xl font-light">°{unitLabel}</span>
      </div>
      <p className="mt-2 text-xs font-medium opacity-90">
        H:{data.high}°{unitLabel} L:{data.low}°{unitLabel}
      </p>
    </div>
  );
}
