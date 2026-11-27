// The mock home of the screenshots and animations: three neutral rooms (CO₂, humidity, temperature, a window), the
// outdoors (temperature, humidity, an Atmo-style air quality index, a weather entity, a next-rain time, pollen) and a
// timer helper. The clock is fixed, so that a capture only changes when the card does: 22 November 2026, 10:00.
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-11-01T00:00:00Z" });
const NOW = new Date(2026, 10, 22, 10, 0).getTime();

// `scene`: yes (CO₂ high, fine outside), meh (moderate air, rain within the hour), no (poor air), none (nothing to
// air), airing (the timer running).
const SCENES = {
  yes: {},
  meh: { "sensor.air_index": "3", "sensor.next_rain": new Date(NOW + 20 * 60000).toISOString() },
  no: { "sensor.air_index": "5", "weather.home": "cloudy" },
  none: { "sensor.living_co2": "720", "sensor.bedroom_co2": "640", "sensor.study_co2": "690", "sensor.study_humidity": "52" },
  airing: { "timer.airing": ["active", { finishes_at: new Date(NOW + 7 * 60000).toISOString() }], "binary_sensor.living_window": "on" },
};

export const nowOf = () => NOW;

// The page's clock, as script source: window.Date fixed at the scene's time.
export const pageScript = () => `(() => {
  const N = ${NOW};
  const R = Date;
  window.Date = class extends R {
    constructor(...a) { super(...(a.length ? a : [N])); }
    static now() { return N; }
  };
})();`;

export const setup = (s) => {
  const states = {
    "sensor.living_co2": st("sensor.living_co2", "1240"),
    "sensor.living_humidity": st("sensor.living_humidity", "58"),
    "sensor.living_temperature": st("sensor.living_temperature", "21.4"),
    "binary_sensor.living_window": st("binary_sensor.living_window", "off"),
    "sensor.bedroom_co2": st("sensor.bedroom_co2", "860"),
    "sensor.bedroom_humidity": st("sensor.bedroom_humidity", "54"),
    "sensor.study_co2": st("sensor.study_co2", "1020"),
    "sensor.study_humidity": st("sensor.study_humidity", "68"),
    "sensor.outdoor_temperature": st("sensor.outdoor_temperature", "12"),
    "sensor.outdoor_humidity": st("sensor.outdoor_humidity", "62"),
    "sensor.air_index": st("sensor.air_index", "2"),
    "sensor.next_rain": st("sensor.next_rain", "unknown"),
    "weather.home": st("weather.home", "partlycloudy"),
    "timer.airing": st("timer.airing", "idle"),
  };
  for (const [id, v] of Object.entries(SCENES[s.scene])) states[id] = Array.isArray(v) ? st(id, v[0], v[1]) : st(id, v);
  return {
    hass: { language: "en", locale: { language: "en" }, entities: {}, states },
    config: {
      rooms: [
        { name: "Living room", co2: "sensor.living_co2", humidity: "sensor.living_humidity", temperature: "sensor.living_temperature", window: "binary_sensor.living_window" },
        { name: "Bedroom", co2: "sensor.bedroom_co2", humidity: "sensor.bedroom_humidity" },
        { name: "Study", co2: "sensor.study_co2", humidity: "sensor.study_humidity" },
      ],
      outdoor_temperature: "sensor.outdoor_temperature",
      outdoor_humidity: "sensor.outdoor_humidity",
      air_quality: "sensor.air_index",
      weather: "weather.home",
      rain: "sensor.next_rain",
      timer: "timer.airing",
      ...s.config,
    },
    open: s.open,
  };
};
