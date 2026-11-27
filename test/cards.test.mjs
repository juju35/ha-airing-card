import assert from "node:assert/strict";
import { test } from "node:test";
import { CONFIG, makeHass, NOW, st } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const ar = load({ now: NOW });
const { cards } = ar;
const json = (v) => JSON.parse(JSON.stringify(v));
const settle = () => new Promise((r) => setTimeout(r, 0));
const verdict = (hass, config = CONFIG) => ar.arEvaluate(hass, { ...config, smart_comfort: "auto" }, NOW);

// A card whose shadow root answers every selector with nodes recording their click listeners.
const make = async (tag, config = CONFIG, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  await settle();
  return card;
};

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["airing-card", "airing-mini-card"]) {
    assert.ok(ar.customElements.get(tag), tag);
    assert.ok(ar.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(ar.window.customCards.map((c) => c.type)), ["airing-card", "airing-mini-card"]);
});

test("first config: the CO₂ sensors as rooms (named by their area) and the weather", () => {
  assert.deepEqual(json(cards["airing-card"].getStubConfig(makeHass())), {
    rooms: [
      { name: "Living room", co2: "sensor.living_co2" },
      { name: "Bedroom CO₂", co2: "sensor.bedroom_co2" },
    ],
    weather: "weather.home",
  });
});

test("yes: a room needs air and nothing outside is against it", () => {
  const v = verdict(makeHass());
  assert.equal(v.answer, "yes");
  assert.equal(v.minutes, 10);
  assert.deepEqual(json(v.rooms.map((r) => [r.name, r.level, r.needs])), [
    ["Living room", "air", ["co2"]],
    ["Bedroom", "ok", []],
  ]);
  assert.deepEqual(json(v.reasons.map((r) => r.key)), ["r_co2", "r_air_good", "r_dry"]);
  assert.deepEqual(json(v.indoor), { co2: 1240, humidity: 58, temperature: 21.4 });
});

test("no need: every room under its thresholds", () => {
  const v = verdict(makeHass({ "sensor.living_co2": "700" }));
  assert.equal(v.answer, "none");
  assert.equal(v.minutes, 0);
});

test("meh: moderate air, pollen, rain or rain soon make it a short airing", () => {
  assert.deepEqual([verdict(makeHass({ "sensor.air_index": "3" })).answer, verdict(makeHass({ "sensor.air_index": "3" })).minutes], ["meh", 5]);
  assert.equal(verdict(makeHass({ "sensor.pollen": "3" })).answer, "meh");
  assert.equal(verdict(makeHass({ "weather.home": "rainy" })).answer, "meh");
  const soon = verdict(makeHass({ "sensor.next_rain": new Date(NOW + 12 * 60000).toISOString() }));
  assert.equal(soon.answer, "meh");
  assert.deepEqual(json(soon.reasons.find((r) => r.key === "r_rain_soon")), { key: "r_rain_soon", level: "warn", min: 12 });
  const later = verdict(makeHass({ "sensor.next_rain": new Date(NOW + 50 * 60000).toISOString() }));
  assert.equal(later.answer, "yes", "rain beyond rain_soon: dry for now");
});

test("no: poor air, high pollen, a storm or a heat wave forbid opening", () => {
  assert.equal(verdict(makeHass({ "sensor.air_index": "4" })).answer, "no");
  assert.equal(verdict(makeHass({ "sensor.pollen": "5" })).answer, "no");
  assert.equal(verdict(makeHass({ "weather.home": "lightning-rainy" })).answer, "no");
  const hot = verdict(makeHass({ "sensor.outdoor_temperature": "33" }));
  assert.equal(hot.answer, "no");
  assert.deepEqual(json(hot.reasons.find((r) => r.key === "r_hot")), { key: "r_hot", level: "alert", temp: 33 });
});

test("air quality: the scale comes from the value (index 1-6 or AQI 0-500), thresholds overridable", () => {
  assert.deepEqual([ar.arAqiScale(4), ar.arAqiScale(80)], ["index", "aqi"]);
  assert.equal(verdict(makeHass({ "sensor.air_index": "80" })).answer, "yes", "AQI 80 is good");
  assert.equal(verdict(makeHass({ "sensor.air_index": "120" })).answer, "meh");
  assert.equal(verdict(makeHass({ "sensor.air_index": "160" })).answer, "no");
  assert.equal(verdict(makeHass({ "sensor.air_index": "3" }), { ...CONFIG, thresholds: { aqi_meh: 4, aqi_no: 5 } }).answer, "yes");
});

test("humidity: only a reason when the air outside would dry the room", () => {
  const dry = verdict(makeHass({ "sensor.living_co2": "700", "sensor.living_humidity": "72", "sensor.outdoor_humidity": "60" }));
  assert.equal(dry.answer, "yes");
  assert.deepEqual(json(dry.rooms[0].needs), ["humid"]);
  // 72 % at 21 °C holds less water than 95 % at 22 °C outside: airing would not dry the room.
  const wet = verdict(makeHass({ "sensor.living_co2": "700", "sensor.living_humidity": "72", "sensor.outdoor_temperature": "22", "sensor.outdoor_humidity": "95" }));
  assert.equal(wet.answer, "none");
  assert.ok(wet.reasons.some((r) => r.key === "r_wetter"));
  assert.ok(ar.arAbsHumidity(20, 50) > 8 && ar.arAbsHumidity(20, 50) < 9.5);
});

test("time: +5 min when CO₂ is very high, 5 at most when it is cold", () => {
  assert.equal(verdict(makeHass({ "sensor.living_co2": "1500" })).minutes, 15);
  const cold = verdict(makeHass({ "sensor.living_co2": "1500", "sensor.outdoor_temperature": "2" }));
  assert.deepEqual([cold.answer, cold.minutes], ["yes", 5]);
  assert.ok(cold.reasons.some((r) => r.key === "r_cold"));
  assert.equal(verdict(makeHass(), { ...CONFIG, duration: 20 }).minutes, 20);
});

test("rain sources: a binary sensor, a rain rate, a next-rain time", () => {
  const h = makeHass({ "binary_sensor.rain": "on", "sensor.rate": "0.4" });
  assert.deepEqual(json(ar.arRain(h, { rain: "binary_sensor.rain" }, NOW, 30)), { kind: "now" });
  assert.deepEqual(json(ar.arRain(h, { rain: "sensor.rate" }, NOW, 30)), { kind: "now" });
  assert.deepEqual(json(ar.arRain(h, { weather: "weather.home" }, NOW, 30)), { kind: "dry" });
  assert.equal(ar.arRain(h, {}, NOW, 30), null);
});

test("Smart Comfort: its room sensors and its outdoor readings when the config has no rooms", () => {
  const hass = makeHass(
    {
      "sensor.sc_kitchen": ["co2", { room_name: "Kitchen", co2: 1310, humidity: 55, temperature: 22, open: [] }],
      "sensor.sc_alerts": ["1", { outdoor_temperature: 9, outdoor_air_quality: 2 }],
    },
    { entities: { "sensor.sc_kitchen": { platform: "smart_comfort" }, "sensor.sc_alerts": { platform: "smart_comfort" } } },
  );
  const v = verdict(hass, {});
  assert.deepEqual(json(v.rooms.map((r) => [r.name, r.co2, r.open, r.level])), [["Kitchen", 1310, false, "air"]]);
  assert.deepEqual(json([v.outdoor.temperature, v.outdoor.air]), [9, 2]);
  assert.equal(v.answer, "yes");
  // Rooms in the config: Smart Comfort's only with smart_comfort: true.
  assert.equal(ar.arRooms(hass, { rooms: [{ name: "Hall", co2: "sensor.bedroom_co2" }] }).length, 1);
  assert.equal(ar.arRooms(hass, { rooms: [{ name: "Hall", co2: "sensor.bedroom_co2" }], smart_comfort: true }).length, 2);
});

test("full card: the answer in the header, the table, the reasons, the rooms and the button", async () => {
  const card = await make("airing-card");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-yes">/);
  assert.match(html, /<span class="bpt">Good time<\/span>/);
  assert.match(html, /<div class="subt">Yes · 10 min advised<\/div>/);
  assert.match(html, /<span class="tc warn">1,240 ppm<\/span>/);
  assert.match(html, /Good · 2/);
  assert.match(html, /<span class="chip k-warn">High CO₂: Living room<\/span>/);
  assert.match(html, /<span class="rn">Living room<\/span><span class="rs2">1,240 ppm · 58% · air it<\/span>/);
  assert.match(html, /Windows closed/);
  assert.match(html, /<button class="go" data-k="go">Air for 10 min<\/button>/);
});

test("the button starts and stops the timer helper, or the card's own countdown", async () => {
  const hass = makeHass();
  const timed = await make("airing-card", { ...CONFIG, timer: "timer.airing" }, hass);
  timed._go({ stopPropagation() {} });
  assert.deepEqual(json(hass.calls), [["timer", "start", { entity_id: "timer.airing", duration: "00:10:00" }]]);
  hass.states["timer.airing"] = st("timer.airing", "active", { finishes_at: new Date(NOW + 7 * 60000).toISOString() });
  timed.hass = hass;
  assert.equal(timed._items.state, "airing");
  assert.match(timed.shadowRoot.innerHTML, /<div class="subt">7 min left<\/div>/);
  timed._go({ stopPropagation() {} });
  assert.deepEqual(json(hass.calls[1]), ["timer", "cancel", { entity_id: "timer.airing" }]);
  const local = await make("airing-card");
  local._go({ stopPropagation() {} });
  assert.equal(local._items.state, "airing");
  assert.match(local.shadowRoot.innerHTML, /class="go stop"/);
  local._go({ stopPropagation() {} });
  assert.equal(local._items.state, "yes");
});

test("mini card: the answer, the time and the main reason on two lines", async () => {
  const card = await make("airing-mini-card", CONFIG, makeHass({ "weather.home": "rainy" }));
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-meh bn">/);
  assert.match(html, /<span class="bpt">Not ideal<\/span>/);
  assert.match(html, /Briefly · 5 min · High CO₂: Living room/);
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="tbl"/);
});

test("the rooms open their entity's details", async () => {
  const card = await make("airing-card");
  const events = [];
  card.dispatchEvent = (e) => events.push(e.detail?.entityId);
  const rooms = [{ dataset: { id: "sensor.living_co2" }, addEventListener(_type, fn) { this.fn = fn; } }];
  card.shadowRoot.querySelectorAll = (s) => (s.includes(".rt[data-id]") ? rooms : []);
  card._bindAfter(card.shadowRoot);
  rooms[0].fn();
  assert.deepEqual(events, ["sensor.living_co2"]);
});

test("in French: numbers and reasons", async () => {
  const card = await make("airing-card", { ...CONFIG, language: "fr" });
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /1 240 ppm/);
  assert.match(html, /CO₂ élevé : Living room/);
  assert.match(html, /Aérer 10 min/);
});

test("translations: every language has every English key", () => {
  const en = Object.keys(ar.AR_I18N.en);
  for (const [lang, table] of Object.entries(ar.AR_I18N)) assert.deepEqual(en.filter((k) => !(k in table)), [], lang);
  assert.equal(Object.keys(ar.AR_I18N).length, 22);
});

test("the editor writes only what differs from the defaults", () => {
  const ed = new (ar.customElements.get("airing-card-editor"))();
  ed.setConfig({ type: "custom:airing-card" });
  ed.hass = makeHass();
  const form = ed.children[0];
  const names = form.schema.flatMap((s) => (s.schema ? s.schema.map((x) => x.name) : [s.name]));
  for (const n of ["outdoor_temperature", "air_quality", "weather", "rain", "pollen", "timer", "duration", "smart_comfort", "rooms", "thresholds", "language"]) assert.ok(names.includes(n), n);
  let out;
  ed.dispatchEvent = (e) => (out = e.detail.config);
  form.listeners["value-changed"]({ detail: { value: { type: "custom:airing-card", duration: 10, smart_comfort: "auto", weather: "weather.home" } } });
  assert.deepEqual(json(out), { type: "custom:airing-card", weather: "weather.home" });
});
