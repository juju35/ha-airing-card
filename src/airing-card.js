/**
 * airing-card / airing-mini-card: whether to air the home now. The rooms' CO₂ and humidity give the reasons to open,
 * the outdoors (air quality, pollen, rain, temperature) the reasons to wait: Yes, Meh (a short airing), No, or No need.
 * The advised time, the reasons as chips, the indoor / outdoor table, each room's state and a button that times the
 * airing (a timer helper, or the card's own countdown).
 * https://github.com/juju35/ha-airing-card
 */

// Icon of each answer, and of the airing under way.
const AR_ICONS = { yes: "mdi:window-open-variant", meh: "mdi:window-open-variant", no: "mdi:window-closed-variant", none: "mdi:window-closed-variant", airing: "mdi:weather-windy" };
// A room tile's icon, by its state.
const AR_ROOM_ICONS = { co2: "mdi:molecule-co2", humid: "mdi:water-percent", open: "mdi:window-open-variant", ok: "mdi:leaf", na: "mdi:help-circle-outline" };
// One loop of the banner's animations (s): the curtains sway once, the breeze crosses the window once.
const AR_LOOP = 3;
// How often the card is drawn again while an airing is timed (ms): the minutes left.
const AR_TICK = 30 * 1000;
// How far the curtains are drawn back, by state (px of the 40 px each one covers when closed).
const AR_CURTAIN = { none: 8, no: 8, meh: 16, yes: 24, airing: 26 };

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's scene: 200 × 80, drawn to the banner's right edge. A window on the wall, the sky outside
// (sun by day, moon and stars by night, rain when it rains, a haze when the air is poor), its sash swung open and its
// curtains drawn back as far as the answer allows; a breeze crosses it while it is open.
const arScene = ({ night, state, animate, rain, haze }) => {
  const open = AR_CURTAIN[state] ?? 0;
  const ajar = ["meh", "yes", "airing"].includes(state);
  const sky = night ? ["#1b2a44", "#2b3d5c"] : ["#bfe6f7", "#e5f5fb"];
  const frame = night ? "#5b6b62" : "#ffffff";
  const edge = night ? "#3c4a43" : "#bcd9c8";
  const curtain = night ? "#3f6b55" : "#8fcfae";
  const sway = (x) =>
    animate && ajar ? `<animateTransform attributeName="transform" type="rotate" values="0 ${x} 8;2.5 ${x} 8;0 ${x} 8" dur="${AR_LOOP}s" repeatCount="indefinite"/>` : "";
  const drops = rain
    ? Array.from({ length: 9 }, (_, i) => {
        const x = 104 + i * 8;
        const y = 16 + ((i * 17) % 34);
        const fall = animate ? `<animate attributeName="y1" values="${y};${y + 18};${y}" dur="${AR_LOOP / 3}s" begin="${(i * 0.11).toFixed(2)}s" repeatCount="indefinite"/>` : "";
        return `<line x1="${x}" y1="${y}" x2="${x - 2}" y2="${y + 6}" stroke="${night ? "#8fb6e8" : "#5a9bd5"}" stroke-width="1.2" stroke-linecap="round">${fall}</line>`;
      }).join("")
    : "";
  const breeze =
    ajar
      ? [24, 40, 56]
          .map((y, i) => {
            const flow = animate ? `<animate attributeName="stroke-dashoffset" values="40;0" dur="${AR_LOOP}s" begin="${i * 0.4}s" repeatCount="indefinite"/>` : "";
            return `<path d="M98 ${y} q14 -6 28 0 t28 0" fill="none" stroke="${night ? "#7fd1a8" : "#1e8e5a"}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="18 22" opacity=".55">${flow}</path>`;
          })
          .join("")
      : "";
  const lights = night
    ? `<circle cx="160" cy="20" r="6" fill="#f1f3d0"/><circle cx="163" cy="18" r="5" fill="${sky[0]}"/><circle cx="112" cy="18" r=".9" fill="#fff"/><circle cx="130" cy="28" r=".7" fill="#fff"/><circle cx="146" cy="14" r=".8" fill="#fff"/>`
    : `<circle cx="158" cy="22" r="8" fill="#ffd27a"/><circle cx="158" cy="22" r="12" fill="#ffd27a" opacity=".3"/>`;
  // The sash: closed, it fills the right half of the window; open, it swings into the room (a narrower parallelogram).
  const sash = ajar
    ? `<path d="M136 10 L156 16 L156 66 L136 70Z" fill="${frame}" opacity=".85" stroke="${edge}"/>`
    : `<rect x="136" y="10" width="38" height="60" fill="none" stroke="${frame}" stroke-width="3"/>`;
  return `<defs><linearGradient id="arsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
    <rect x="98" y="10" width="76" height="60" fill="url(#arsky)"/>${lights}
    <path d="M98 60 q20 -10 40 -4 t36 -2 V70 H98Z" fill="${night ? "#22382d" : "#a8dcbf"}"/>
    ${haze ? `<rect x="98" y="10" width="76" height="60" fill="${night ? "#6b6f74" : "#b9b4a8"}" opacity=".45"/>` : ""}${drops}
    <rect x="96" y="8" width="80" height="64" fill="none" stroke="${frame}" stroke-width="4"/><rect x="96" y="8" width="80" height="64" fill="none" stroke="${edge}" stroke-width=".8"/>
    <line x1="136" y1="10" x2="136" y2="70" stroke="${frame}" stroke-width="3"/>${sash}${breeze}
    <rect x="92" y="72" width="88" height="4" rx="1" fill="${frame}" stroke="${edge}" stroke-width=".6"/>
    <rect x="90" y="4" width="92" height="3" rx="1.5" fill="${night ? "#8a9a90" : "#b08968"}"/>
    <g><path d="M92 6 h${40 - open} q-4 34 2 68 h-${42 - open}Z" fill="${curtain}"/>${sway(92)}</g>
    <g><path d="M180 6 h-${40 - open} q4 34 -2 68 h${42 - open}Z" fill="${curtain}"/>${sway(180)}</g>`;
};

// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line). When the label is still cut there, or the text
// block leaves the banner or runs over its ground strip, the pill keeps its dot alone, on the title row (its label
// stays in title and aria-label). A card of 200 px or less shows the dot alone anyway (CSS), beside the title.
const arPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

// `smart_comfort`: auto (the default), true / on, false / off.
const arSmartMode = (v) => ({ true: true, on: true, false: false, off: false })[String(v)] ?? "auto";

// ── Card ─────────────────────────────────────────────────────────────────────
class AiringCard extends RcCard {
  static tag = "airing-card";
  static i18n = AR_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", show_subtitle: true, show_table: true, show_rooms: true, animations: true, duration: 10, smart_comfort: "auto" };

  // Smart Comfort's rooms when it is installed (nothing to write then); else the CO₂ sensors of the home, one room
  // each, and its first weather entity.
  static getStubConfig(hass) {
    if (!hass || arSmartRooms(hass).length) return {};
    const ids = Object.keys(hass.states);
    const rooms = ids
      .filter((id) => id.startsWith("sensor.") && hass.states[id].attributes?.device_class === "carbon_dioxide")
      .slice(0, 3)
      .map((co2) => {
        const area = hass.entities?.[co2]?.area_id;
        return { name: hass.areas?.[area]?.name || hass.states[co2].attributes.friendly_name || co2, co2 };
      });
    const weather = ids.find((id) => id.startsWith("weather."));
    return { ...(rooms.length ? { rooms } : {}), ...(weather ? { weather } : {}) };
  }

  getCardSize() {
    return 6;
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._timer ??= setInterval(() => {
      if (!this._items?.timer) return;
      this._sig = null;
      this._render();
    }, AR_TICK);
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearInterval(this._timer);
    this._timer = undefined;
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  _collect() {
    const c = { ...this._config, smart_comfort: arSmartMode(this._config.smart_comfort) };
    const now = Date.now();
    const m = arEvaluate(this._hass, c, now);
    m.timer = arTimer(this._hass, c, this._local, now);
    m.state = m.timer ? "airing" : m.answer;
    m.name = c.title || this._t("title");
    return m;
  }

  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return this._dark();
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  _num(v, digits = 0) {
    try {
      return arIntl(this._lang(), { maximumFractionDigits: digits }).format(v);
    } catch {
      return String(Math.round(v));
    }
  }

  _ppm(v) {
    return `${this._num(v)} ppm`;
  }

  _pct(v) {
    try {
      return arIntl(this._lang(), { style: "unit", unit: "percent", maximumFractionDigits: 0 }).format(v);
    } catch {
      return `${Math.round(v)}%`;
    }
  }

  _deg(v) {
    try {
      return arIntl(this._lang(), { style: "unit", unit: "celsius", maximumFractionDigits: 1 }).format(v);
    } catch {
      return `${v}°C`;
    }
  }

  // A reason chip's text.
  _reason(r) {
    return this._t(r.key, { rooms: (r.rooms || []).join(", "), n: r.min, t: r.temp != null ? this._deg(r.temp) : "" });
  }

  // The subtitle and the pill: what to do now.
  _sub(m) {
    if (m.state === "airing") return this._t("sub_airing", { n: m.timer.left });
    if (m.state === "yes") return this._t("sub_yes", { n: m.minutes });
    if (m.state === "meh") return this._t("sub_meh", { n: m.minutes });
    return this._t(`sub_${m.state}`);
  }

  // The illustrated header: the badge, the title, `sub` and the pill on the left, the window at the right, a 10 px
  // floor strip edge to edge. `scene`: the window's drawing.
  _banner(m, sub, scene, pill) {
    const c = this._config;
    const nav = c.navigation_path;
    const night = this._night();
    const chip = `<span class="bpill" title="${rcEsc(pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span>`;
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge"><ha-icon icon="${AR_ICONS[m.state]}"></ha-icon></div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${chip}</div>${sub}</div>
        </div>
        <svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${scene}</svg>
        <div class="ground"></div>
      </div>`;
  }

  _scene(m) {
    return arScene({
      night: this._night(),
      state: m.state,
      animate: this._animate(),
      rain: ["now", "storm"].includes(m.outdoor.rain?.kind),
      haze: m.outdoor.airLevel === "no",
    });
  }

  // The status pill's place, on the banner and on the classic header (see arPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      arPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  // The indoor / outdoor table: a row per reading known on either side.
  _table(m) {
    const i = m.indoor;
    const o = m.outdoor;
    const aq = o.air != null ? `${this._t(`aq_${o.airLevel}`)} · ${this._num(o.air)}` : null;
    const rows = [
      ["row_co2", i.co2 != null ? this._ppm(i.co2) : null, null, i.co2 != null && i.co2 >= this._th("co2") ? "warn" : ""],
      ["row_humidity", i.humidity != null ? this._pct(i.humidity) : null, o.humidity != null ? this._pct(o.humidity) : null, i.humidity != null && i.humidity >= this._th("humidity") ? "warn" : ""],
      ["row_temperature", i.temperature != null ? this._deg(Math.round(i.temperature * 10) / 10) : null, o.temperature != null ? this._deg(o.temperature) : null, ""],
      ["row_air", null, aq, ""],
      ["row_pollen", null, o.pollen != null ? this._num(o.pollen, 1) : null, ""],
    ].filter((r) => r[1] != null || r[2] != null);
    if (!rows.length) return "";
    const cell = (v, cls = "") => `<span class="tc${cls ? ` ${cls}` : ""}">${v == null ? "—" : rcEsc(v)}</span>`;
    const outCls = (k) => (k === "row_air" ? ` aq-${o.airLevel}` : "");
    return `<div class="tbl" role="table">
      <span class="th"></span><span class="th">${rcEsc(this._t("indoors"))}</span><span class="th">${rcEsc(this._t("outdoors"))}</span>
      ${rows.map(([k, a, b, w]) => `<span class="tl">${rcEsc(this._t(k))}</span>${cell(a, w)}${cell(b, outCls(k).trim())}`).join("")}
    </div>`;
  }

  _th(key) {
    return { ...AR_THRESHOLDS, ...(this._config.thresholds || {}) }[key];
  }

  _chips(m) {
    if (!m.reasons.length) return "";
    return `<div class="chips">${m.reasons.map((r) => `<span class="chip k-${r.level}">${rcEsc(this._reason(r))}</span>`).join("")}</div>`;
  }

  // A room's tile: its icon by state, its name, its readings and what it needs.
  _roomTile(r) {
    const icon = r.level === "open" ? AR_ROOM_ICONS.open : r.level === "air" ? AR_ROOM_ICONS[r.needs[0]] : AR_ROOM_ICONS[r.level];
    const bits = [r.co2 != null ? this._ppm(r.co2) : null, r.humidity != null ? this._pct(r.humidity) : null].filter(Boolean);
    const what = r.level === "na" ? this._t("unavailable") : this._t(`rm_${r.level}`);
    const text = [...bits, what].join(" · ");
    return `<button class="rt lv-${r.level}"${r.id ? ` data-id="${rcEsc(r.id)}"` : ""} title="${rcEsc(`${r.name} · ${text}`)}">
      <span class="ri"><ha-icon icon="${icon}"></ha-icon></span>
      <span class="rx"><span class="rn">${rcEsc(r.name)}</span><span class="rs2">${rcEsc(text)}</span></span>
      <span class="rd"></span>
    </button>`;
  }

  // Under the rooms: the windows open (or closed), and the button that times the airing.
  _foot(m) {
    const windows = m.open.length ? this._t("r_open", { rooms: m.open.join(", ") }) : m.rooms.some((r) => r.open === false) ? this._t("ft_closed") : "";
    let button = "";
    if (m.state === "airing") button = `<button class="go stop" data-k="go">${rcEsc(this._t("btn_stop"))}</button>`;
    else if (m.minutes) button = `<button class="go" data-k="go">${rcEsc(this._t("btn_start", { n: m.minutes }))}</button>`;
    if (!windows && !button) return "";
    return `<div class="foot"><span class="fw">${rcEsc(windows)}</span>${button}</div>`;
  }

  _draw(m) {
    const c = this._config;
    const dark = this._dark();
    const night = this._night();
    if (!this._changed([m.state, m.minutes, m.timer?.left, m.reasons, m.rooms, m.indoor, m.outdoor, dark, night])) return;
    const sub = c.show_subtitle === false ? "" : `<div class="subt">${rcEsc(this._sub(m))}</div>`;
    const pill = this._t(`st_${m.state}`);
    const head =
      c.illustration !== false
        ? this._banner(m, sub, this._scene(m), pill)
        : `<div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
            <div class="badge"><ha-icon icon="${AR_ICONS[m.state]}"></ha-icon></div>
            <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div><span class="pill" title="${rcEsc(pill)}"><span class="pt">${rcEsc(pill)}</span></span></div>${sub}</div>
          </div>`;
    const empty = !m.rooms.length ? `<div class="box none">${rcEsc(this._t("nothing"))}</div>` : "";
    const rooms = c.show_rooms !== false && m.rooms.length ? `<div class="rooms">${m.rooms.map((r) => this._roomTile(r)).join("")}</div>` : "";
    const body = `${empty}${c.show_table !== false ? this._table(m) : ""}${this._chips(m)}${rooms}${this._foot(m)}`;
    this._paint(m.state, head + body, "", `${dark ? " dk" : ""}`);
    this._fitPill();
  }

  _bindAfter(root) {
    for (const b of root.querySelectorAll(".rt[data-id]") || []) b.addEventListener("click", () => rcMoreInfo(this, b.dataset.id));
    root.querySelector(".go")?.addEventListener("click", (ev) => this._go(ev));
  }

  // Starts the airing (the timer helper, or the card's own countdown), or stops it.
  _go(ev) {
    ev.stopPropagation();
    const c = this._config;
    const m = this._items;
    if (c.timer) {
      if (m.state === "airing") rcCall(this._hass, "timer", "cancel", { entity_id: c.timer });
      else rcCall(this._hass, "timer", "start", { entity_id: c.timer, duration: `00:${String(m.minutes).padStart(2, "0")}:00` });
      return;
    }
    this._local = m.state === "airing" ? null : Date.now() + m.minutes * 60000;
    this._sig = null;
    this._render();
  }

  static styles = `
    ha-card { --c: var(--rc-idle); }
    ha-card.lvl-yes { --c: var(--rc-ok); } ha-card.lvl-meh { --c: var(--rc-warn); } ha-card.lvl-no { --c: var(--rc-alert); }
    ha-card.lvl-none { --c: var(--rc-idle); } ha-card.lvl-airing { --c: var(--rc-info); }
    .k-ok { --t: var(--rc-ok); } .k-warn { --t: var(--rc-warn); } .k-alert { --t: var(--rc-alert); } .k-info { --t: var(--rc-info); }
    .lv-air { --t: var(--rc-warn); } .lv-ok { --t: var(--rc-ok); } .lv-open { --t: var(--rc-info); } .lv-na { --t: var(--rc-na); }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .box { margin-top: 10px; border-radius: 12px; padding: 10px 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .none { font-size: 13px; color: var(--secondary-text-color); }
    /* The indoor / outdoor table. */
    .tbl { margin-top: 12px; display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr); border-radius: 12px; overflow: hidden;
           border: 1px solid var(--divider-color, rgba(127,127,127,.2)); font-size: 13px; }
    .tbl > span { padding: 8px 10px; min-width: 0; overflow-wrap: anywhere; }
    .tbl > span:nth-child(n + 4) { border-top: 1px solid var(--divider-color, rgba(127,127,127,.12)); }
    .th { background: var(--secondary-background-color, rgba(127,127,127,.08)); font-size: 11px; font-weight: 600; letter-spacing: .04em;
          text-transform: uppercase; color: var(--secondary-text-color); }
    .tl { color: var(--primary-text-color); }
    .tc { font-weight: 600; color: var(--primary-text-color); }
    .tc.warn { color: color-mix(in srgb, var(--rc-warn) 60%, var(--primary-text-color, #212121)); }
    .tc.aq-good { color: color-mix(in srgb, var(--rc-ok) 70%, var(--primary-text-color, #212121)); }
    .tc.aq-meh { color: color-mix(in srgb, var(--rc-warn) 60%, var(--primary-text-color, #212121)); }
    .tc.aq-no { color: color-mix(in srgb, var(--rc-alert) 70%, var(--primary-text-color, #212121)); }
    /* The reasons, as tinted chips (no plain fill). */
    .chips { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 999px; min-width: 0; overflow-wrap: anywhere;
            background: color-mix(in srgb, var(--t) 12%, transparent); color: color-mix(in srgb, var(--t) 55%, var(--primary-text-color, #212121)); }
    ha-card.dk .chip { color: color-mix(in srgb, var(--t) 55%, #fff); }
    /* The rooms: calm tiles (neutral background, tinted icon badge, the state in colour, a state dot). */
    .rooms { margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 8px; }
    .rt { all: unset; box-sizing: border-box; position: relative; display: flex; align-items: center; gap: 10px; min-width: 0; padding: 10px;
          border-radius: 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .rt[data-id] { cursor: pointer; }
    .rt:focus-visible, .go:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .ri { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: var(--t);
          background: color-mix(in srgb, var(--t) 16%, transparent); }
    .ri ha-icon { --mdc-icon-size: 18px; }
    .rx { display: flex; flex-direction: column; min-width: 0; }
    .rn { font-size: 13px; font-weight: 600; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rs2 { font-size: 12px; font-weight: 500; color: color-mix(in srgb, var(--t) 60%, var(--primary-text-color, #212121)); overflow-wrap: anywhere; }
    ha-card.dk .rs2 { color: color-mix(in srgb, var(--t) 55%, #fff); }
    .rd { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; border-radius: 50%; background: var(--t); }
    /* Under the rooms: the windows, and the outlined button that times the airing. */
    .foot { margin-top: 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .fw { flex: 1 1 auto; min-width: 0; font-size: 12.5px; color: var(--secondary-text-color); }
    .go { all: unset; box-sizing: border-box; flex: none; cursor: pointer; min-height: 32px; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600;
          border: 1px solid color-mix(in srgb, var(--c) 45%, transparent); color: color-mix(in srgb, var(--c) 60%, var(--primary-text-color, #212121)); }
    .go:hover { background: color-mix(in srgb, var(--c) 10%, transparent); }
    ha-card.dk .go { color: color-mix(in srgb, var(--c) 55%, #fff); }
    /* Illustrated header (banner): 90 px, edge to edge, the title on a pale green wall, the window at the right, a 10 px
       floor strip at the bottom. The badge's icon is in the answer's colour, by day and night. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden;
              background: linear-gradient(180deg, #eef8f1 0%, #dcefe3 100%);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(180deg, #15211b 0%, #1d2c24 100%); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.7); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #c9b38f 0 22px, #d8c4a2 22px 44px); }
    .banner.night .ground { background: repeating-linear-gradient(90deg, #3d3226 0 22px, #4a3d2e 22px 44px); }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title (see arPlacePill). */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    /* Narrower cards: the window is drawn smaller (75 %, 62 %, then 50 % of its height, its left part cropped). */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } .tbl { font-size: 12px; } }
    /* The mini card's window stays clear of the zoom button. */
    ha-card.bn > .banner .room { right: 30px; }
    ha-card.bn > .banner { --sw: 96px; --sk: .9; }
    @container (max-width: 340px) { ha-card.bn > .banner .room { display: none; } ha-card.bn > .banner .head { padding-right: 34px; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const arEntity = (name, domain, extra = {}) => ({ name, selector: { entity: { domain, ...extra } } });
const arSchema = (booleans) => (lang) => [
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  arEntity("outdoor_temperature", "sensor", { device_class: "temperature" }),
  arEntity("outdoor_humidity", "sensor", { device_class: "humidity" }),
  arEntity("air_quality", "sensor"),
  arEntity("weather", "weather"),
  arEntity("rain", ["sensor", "binary_sensor"]),
  arEntity("pollen", "sensor"),
  arEntity("timer", "timer"),
  { name: "duration", selector: { number: { min: 1, max: 60, step: 1, mode: "box", unit_of_measurement: "min" } } },
  {
    name: "smart_comfort",
    selector: { select: { mode: "dropdown", options: ["auto", "on", "off"].map((value) => ({ value, label: rcT(AR_I18N, lang, `ed_sc_${value}`) })) } },
  },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(AR_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(AR_I18N, lang, "rooms", "thresholds", "language"),
];

const AR_HELPERS = ["title", "air_quality", "weather", "rain", "timer", "duration", "smart_comfort", "zoom", "rooms", "thresholds", "language"];

const AiringCardEditor = rcEditor({
  card: AiringCard,
  helpers: AR_HELPERS,
  schema: arSchema(["show_title", "show_subtitle", "show_table", "show_rooms", "illustration", "animations"]),
});

rcRegister(AiringCard, AiringCardEditor, "Airing Card", "Whether to air the home now: the rooms' CO₂ and humidity against the outdoor air, rain and pollen, with the advised time");

// ── Mini card ────────────────────────────────────────────────────────────────
// The answer on two lines: the title and the answer, then the advised time and the main reason, and the window at the
// right of the banner; the zoom button opens the full card in place.
class AiringMiniCard extends rcMini(AiringCard, "airing-mini-card", "") {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    const night = this._night();
    const dark = this._dark();
    if (!this._changed(["mini", m.state, m.minutes, m.timer?.left, m.reasons, night, dark])) return;
    const main = m.reasons.find((r) => r.level !== "ok" && r.level !== "info") || m.reasons[0];
    const text = [this._sub(m), main ? this._reason(main) : ""].filter(Boolean).join(" · ");
    const line = `<div class="subt" title="${rcEsc(text)}">${rcEsc(text)}</div>`;
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.state} bn${dark ? " dk" : ""}">${this._banner(m, line, this._scene(m), this._t(`st_${m.state}`))}</ha-card>`;
    if (c.navigation_path) rcBindNav(this.shadowRoot.querySelector(".head"), c.navigation_path);
    this._fitPill();
  }
}

const AiringMiniCardEditor = rcEditor({
  card: AiringMiniCard,
  helpers: AR_HELPERS,
  schema: arSchema(["show_title", "show_subtitle", "show_table", "show_rooms", "illustration", "animations", "zoom"]),
});

rcRegister(AiringMiniCard, AiringMiniCardEditor, "Airing Mini Card", "Whether to air the home now on two lines, with a zoom to the full card");
