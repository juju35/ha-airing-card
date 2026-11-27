// ── Airing ───────────────────────────────────────────────────────────────────
// Whether to air the home now, from the rooms' readings (CO₂, humidity, temperature, open windows) and the outdoors
// (temperature, humidity, air quality index, rain, pollen). Each room that needs air gives a reason to open; the
// outdoors gives reasons to wait (Meh) or not to open at all (No). The answer:
// - none: no room needs air (CO₂ and humidity under their thresholds);
// - no: a room needs air, but something outside forbids it (poor air, high pollen, a storm, a heat wave);
// - meh: a room needs air and the outdoors is not ideal (moderate air, pollen, rain, warmer outside): a short airing;
// - yes: a room needs air and nothing outside is against it.
// Rooms come from the `rooms` list of the config, or from Smart Comfort's room sensors (their readings are in their
// attributes), and the outdoors from its own options, or from Smart Comfort's alerts sensor.

// The thresholds, each one overridable in the config's `thresholds`. `aqi_meh` / `aqi_no` depend on the index's
// scale when unset: a European-style index (1 to 6, Atmo France) or a US-style AQI (0 to 500, WAQI).
export const AR_THRESHOLDS = { co2: 1000, co2_high: 1400, humidity: 65, pollen_meh: 3, pollen_no: 5, heat: 30, warm_indoor: 25, cold: 5, rain_soon: 30 };
export const AR_AQI = { index: { meh: 3, no: 4 }, aqi: { meh: 101, no: 151 } };
// Weather conditions that forbid opening, and those that only make it a short airing.
export const AR_STORM = ["pouring", "lightning", "lightning-rainy", "hail", "exceptional"];
export const AR_RAIN = ["rainy", "snowy", "snowy-rainy"];

// A number from an entity's state (or one of its attributes), null when unknown or unavailable.
export const arNum = (hass, id, attr) => {
  if (!id) return null;
  const st = hass.states[id];
  if (!st) return null;
  const v = attr ? st.attributes?.[attr] : st.state;
  if (v == null || v === "" || ["unavailable", "unknown", "none"].includes(String(v).toLowerCase())) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Grams of water per m³ of air at `t` °C and `rh` % (Magnus formula): opening a window only dries a room when the
// air outside holds less water, whatever its relative humidity.
export const arAbsHumidity = (t, rh) => (6.112 * Math.exp((17.67 * t) / (t + 243.5)) * rh * 2.1674) / (273.15 + t);

// The air quality index's scale from its value: up to 10, a European-style index; above, a US-style AQI.
export const arAqiScale = (v) => (v <= 10 ? "index" : "aqi");

// An open window: a binary sensor on (one id or a list), or Smart Comfort's `open` attribute (a list or a boolean).
export const arOpen = (hass, ids) => {
  const list = Array.isArray(ids) ? ids : ids ? [ids] : [];
  if (!list.length) return null;
  return list.some((id) => hass.states[id]?.state === "on");
};

// "storm", "now", "soon" (with its minutes), "dry" or null (no rain source): from the weather's condition and the
// `rain` entity — a binary sensor (on: raining), a next-rain timestamp (Météo-France) or a rain rate.
export const arRain = (hass, c, now, soon) => {
  const w = c.weather && hass.states[c.weather]?.state;
  if (AR_STORM.includes(w)) return { kind: "storm" };
  const r = c.rain && hass.states[c.rain];
  let kind = AR_RAIN.includes(w) ? "now" : null;
  if (!kind && r && !["unavailable", "unknown", ""].includes(r.state)) {
    if (c.rain.startsWith("binary_sensor.")) kind = r.state === "on" ? "now" : "dry";
    else if (Number.isFinite(Number(r.state))) kind = Number(r.state) > 0 ? "now" : "dry";
    else {
      const t = Date.parse(r.state);
      if (Number.isFinite(t)) {
        const min = Math.round((t - now) / 60000);
        if (min <= 0) kind = "now";
        else if (min <= soon) return { kind: "soon", min };
        else kind = "dry";
      }
    }
  }
  if (kind) return { kind };
  return w || r ? { kind: "dry" } : null;
};

// Smart Comfort's room sensors (enum sensors of the smart_comfort platform with a `room_name`): one room each, its
// readings from the attributes.
export const arSmartRooms = (hass) =>
  Object.keys(hass.states)
    .filter((id) => id.startsWith("sensor.") && hass.entities?.[id]?.platform === "smart_comfort" && hass.states[id].attributes?.room_name != null)
    .map((id) => {
      const a = hass.states[id].attributes;
      const open = Array.isArray(a.open) ? a.open.length > 0 : a.open == null ? null : !!a.open;
      return { id, name: a.room_name, co2: arAttr(a.co2), humidity: arAttr(a.humidity), temperature: arAttr(a.temperature), open };
    });

const arAttr = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));

// Smart Comfort's alerts sensor (its outdoor readings), when present.
export const arSmartOutdoor = (hass) => {
  const id = Object.keys(hass.states).find((i) => hass.entities?.[i]?.platform === "smart_comfort" && "outdoor_temperature" in (hass.states[i].attributes || {}));
  if (!id) return {};
  const a = hass.states[id].attributes;
  return { temperature: arAttr(a.outdoor_temperature), air: arAttr(a.outdoor_air_quality) };
};

// A room of the config: { name, co2, humidity, temperature, window } (entity ids; window one or a list).
export const arRoom = (hass, r) => {
  const id = r.co2 || r.humidity || r.temperature || (Array.isArray(r.window) ? r.window[0] : r.window) || null;
  const name = r.name || (id && hass.states[id]?.attributes?.friendly_name) || id || "";
  return { id, name, co2: arNum(hass, r.co2), humidity: arNum(hass, r.humidity), temperature: arNum(hass, r.temperature), open: arOpen(hass, r.window) };
};

// Every room: the config's, then Smart Comfort's (with `smart_comfort: auto` only when the config lists none).
export const arRooms = (hass, c) => {
  const own = (c.rooms || []).map((r) => arRoom(hass, r));
  const sc = c.smart_comfort === true || (c.smart_comfort !== false && !own.length) ? arSmartRooms(hass) : [];
  const names = new Set(own.map((r) => r.name));
  return [...own, ...sc.filter((r) => !names.has(r.name))];
};

const arMean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
const arMax = (list) => (list.length ? Math.max(...list) : null);

// The whole verdict: { answer, minutes, rooms (each with its level and reasons), reasons (chips), indoor, outdoor }.
export const arEvaluate = (hass, c, now) => {
  const t = { ...AR_THRESHOLDS, ...(c.thresholds || {}) };
  const sco = arSmartOutdoor(hass);
  const out = {
    temperature: arNum(hass, c.outdoor_temperature) ?? sco.temperature ?? null,
    humidity: arNum(hass, c.outdoor_humidity),
    air: arNum(hass, c.air_quality) ?? sco.air ?? null,
    pollen: arNum(hass, c.pollen),
  };
  out.rain = arRain(hass, c, now, t.rain_soon);
  const rooms = arRooms(hass, c);
  const known = (k) => rooms.map((r) => r[k]).filter((v) => v != null);
  const indoor = { co2: arMax(known("co2")), humidity: arMax(known("humidity")), temperature: arMean(known("temperature")) };
  const outAbs = out.temperature != null && out.humidity != null ? arAbsHumidity(out.temperature, out.humidity) : null;
  for (const r of rooms) {
    r.needs = [];
    if (r.co2 != null && r.co2 >= t.co2) r.needs.push("co2");
    // Humid: only a reason when the air outside would dry the room (or nothing says it would not).
    const inT = r.temperature ?? indoor.temperature;
    if (r.humidity != null && r.humidity >= t.humidity && (outAbs == null || inT == null || outAbs < arAbsHumidity(inT, r.humidity))) r.needs.push("humid");
    r.wetter = r.humidity != null && r.humidity >= t.humidity && !r.needs.includes("humid");
    r.level = r.co2 == null && r.humidity == null && r.open == null ? "na" : r.open ? "open" : r.needs.length ? "air" : "ok";
  }
  const reasons = [];
  const infos = [];
  const names = (need) => rooms.filter((r) => r.needs.includes(need)).map((r) => r.name);
  if (names("co2").length) reasons.push({ key: "r_co2", level: "warn", rooms: names("co2") });
  if (names("humid").length) reasons.push({ key: "r_humid", level: "warn", rooms: names("humid") });
  if (rooms.some((r) => r.wetter)) infos.push({ key: "r_wetter", level: "info" });
  const blockers = [];
  const cautions = [];
  if (out.air != null) {
    const scale = arAqiScale(out.air);
    const meh = t.aqi_meh ?? AR_AQI[scale].meh;
    const no = t.aqi_no ?? AR_AQI[scale].no;
    const key = out.air >= no ? "r_air_no" : out.air >= meh ? "r_air_meh" : "r_air_good";
    out.airLevel = key.slice(6);
    (key === "r_air_no" ? blockers : key === "r_air_meh" ? cautions : infos).push({ key, level: key === "r_air_no" ? "alert" : key === "r_air_meh" ? "warn" : "ok" });
  }
  if (out.pollen != null && out.pollen >= t.pollen_meh) {
    const high = out.pollen >= t.pollen_no;
    (high ? blockers : cautions).push({ key: high ? "r_pollen_no" : "r_pollen_meh", level: high ? "alert" : "warn" });
  }
  const rain = out.rain?.kind;
  if (rain === "storm") blockers.push({ key: "r_storm", level: "alert" });
  else if (rain === "now") cautions.push({ key: "r_rain", level: "warn" });
  else if (rain === "soon") cautions.push({ key: "r_rain_soon", level: "warn", min: out.rain.min });
  else if (rain === "dry") infos.push({ key: "r_dry", level: "info" });
  const inT = indoor.temperature;
  if (out.temperature != null && inT != null && out.temperature > inT) {
    if (out.temperature >= t.heat) blockers.push({ key: "r_hot", level: "alert", temp: out.temperature });
    else if (inT >= t.warm_indoor) cautions.push({ key: "r_warm", level: "warn" });
  }
  const cold = out.temperature != null && out.temperature < t.cold;
  if (cold) infos.push({ key: "r_cold", level: "info" });
  const open = rooms.filter((r) => r.open).map((r) => r.name);
  const needs = rooms.some((r) => r.needs.length);
  const answer = !needs ? "none" : blockers.length ? "no" : cautions.length ? "meh" : "yes";
  const base = Math.max(1, Math.round(Number(c.duration) || 10));
  let minutes = 0;
  if (answer === "yes" || answer === "meh") {
    minutes = rooms.some((r) => r.co2 != null && r.co2 >= t.co2_high) ? base + 5 : base;
    if (cold || answer === "meh") minutes = Math.min(minutes, 5);
  }
  return { answer, minutes, rooms, reasons: [...reasons, ...blockers, ...cautions, ...infos], indoor, outdoor: out, open };
};

// The airing under way: a timer helper running, or the card's own countdown. { left (min), until (ms) } or null.
export const arTimer = (hass, c, local, now) => {
  const st = c.timer && hass.states[c.timer];
  if (st) {
    if (st.state !== "active") return null;
    const until = Date.parse(st.attributes?.finishes_at);
    return Number.isFinite(until) && until > now ? { until, left: Math.ceil((until - now) / 60000) } : null;
  }
  return local && local > now ? { until: local, left: Math.ceil((local - now) / 60000) } : null;
};

// The Intl formats, made once per language and options (a render formats many numbers).
export const arIntlCache = new Map();
export const arIntl = (lang, opts) => {
  const key = `${lang}|${JSON.stringify(opts)}`;
  if (!arIntlCache.has(key)) arIntlCache.set(key, new Intl.NumberFormat(lang, opts));
  return arIntlCache.get(key);
};
