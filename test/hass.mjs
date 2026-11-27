// A mock Home Assistant: two rooms (CO₂, humidity, temperature, a window), the outdoors (temperature, humidity, an
// air quality index, a weather entity, a next-rain sensor, pollen) and a timer helper. The day is fixed by the tests
// (NOW): 22 November 2026, 10:00 local time.
export const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });

export const NOW = new Date(2026, 10, 22, 10, 0).getTime();

// `over`: states to replace or add, by entity id (a value is the state, an array is [state, attributes]).
export const makeHass = (over = {}, extra = {}) => {
  const states = {
    "sensor.living_co2": st("sensor.living_co2", "1240", { device_class: "carbon_dioxide", friendly_name: "Living room CO₂" }),
    "sensor.living_humidity": st("sensor.living_humidity", "58"),
    "sensor.living_temperature": st("sensor.living_temperature", "21.4"),
    "binary_sensor.living_window": st("binary_sensor.living_window", "off"),
    "sensor.bedroom_co2": st("sensor.bedroom_co2", "860", { device_class: "carbon_dioxide", friendly_name: "Bedroom CO₂" }),
    "sensor.bedroom_humidity": st("sensor.bedroom_humidity", "52"),
    "sensor.outdoor_temperature": st("sensor.outdoor_temperature", "12"),
    "sensor.outdoor_humidity": st("sensor.outdoor_humidity", "70"),
    "sensor.air_index": st("sensor.air_index", "2"),
    "sensor.pollen": st("sensor.pollen", "1"),
    "sensor.next_rain": st("sensor.next_rain", "unknown", { device_class: "timestamp" }),
    "weather.home": st("weather.home", "cloudy"),
    "timer.airing": st("timer.airing", "idle"),
  };
  for (const [id, v] of Object.entries(over)) {
    if (v === null) delete states[id];
    else states[id] = Array.isArray(v) ? st(id, v[0], v[1]) : st(id, v, states[id]?.attributes);
  }
  return {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    areas: { living: { name: "Living room" } },
    entities: { "sensor.living_co2": { area_id: "living" } },
    states,
    calls: [],
    callService(domain, service, data) {
      this.calls.push([domain, service, data]);
      return Promise.resolve();
    },
    ...extra,
  };
};

export const ROOMS = [
  { name: "Living room", co2: "sensor.living_co2", humidity: "sensor.living_humidity", temperature: "sensor.living_temperature", window: "binary_sensor.living_window" },
  { name: "Bedroom", co2: "sensor.bedroom_co2", humidity: "sensor.bedroom_humidity" },
];

export const CONFIG = {
  rooms: ROOMS,
  outdoor_temperature: "sensor.outdoor_temperature",
  outdoor_humidity: "sensor.outdoor_humidity",
  air_quality: "sensor.air_index",
  weather: "weather.home",
  rain: "sensor.next_rain",
  pollen: "sensor.pollen",
};
