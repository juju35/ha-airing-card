# ha-airing-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-airing-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-airing-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-airing-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-airing-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-airing-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-airing-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-airing-card)](https://github.com/juju35/ha-airing-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-airing-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/icon.svg" alt="Airing Card" width="120"></p>

<p align="center">
  <a href="https://github.com/sebcaps/atmofrance"><img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/atmofrance.png" alt="Atmo France" height="36"></a>&nbsp;&nbsp;
  <a href="https://www.home-assistant.io/integrations/waqi/"><img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/waqi.png" alt="WAQI" height="36"></a>&nbsp;&nbsp;
  <a href="https://www.home-assistant.io/integrations/meteo_france/"><img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/meteo_france.png" alt="Météo-France" height="36"></a>&nbsp;&nbsp;
  <a href="https://github.com/juju35/ha-smart-comfort"><img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/smart_comfort.png" alt="Smart Comfort" height="36"></a>
</p>

A Lovelace card that tells you **whether to air your home right now**: the rooms' CO₂ and humidity against the outdoor air quality, pollen, rain and temperature, with the advised airing time.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-airing-card&category=plugin)

| Card | Type | What it shows |
|---|---|---|
| [Airing](#screenshots) | `custom:airing-card` | The answer and the advised time, the reasons, an indoor / outdoor table, each room's state and a button that times the airing. |
| [Airing mini](#airing-mini) | `custom:airing-mini-card` | The answer, the time and the main reason on two lines, with a zoom to the full card. |

| Yes | Not now |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-yes.png" alt="Yes" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-no.png" alt="Not now" width="400"> |

## Features

- **One answer**: *Good time* (green), *Not ideal* (amber: air briefly), *Not now* (red: keep the windows closed) or *No need* (grey: the air is fine)
- **Reasons to open**: a room's CO₂ over its threshold, or its humidity when the air outside would dry it (the absolute humidity is compared, not the relative one)
- **Reasons to wait**: moderate or poor outdoor air (an Atmo-style index 1–6 or a US-style AQI 0–500, found from the value), pollen, rain now or within the next half hour, a storm, warmer or much hotter air outside
- **Advised time**: 10 min by default, +5 min when CO₂ is very high, 5 min at most when it is cold outside or not ideal
- **Indoor / outdoor table**, the reasons as chips and a calm tile per room (its readings and what it needs; tap for its details)
- **Timed airing**: a button starts a `timer` helper (or, without one, the card's own countdown); the header then shows the minutes left and the open windows
- **Smart Comfort**: without rooms in the config, the card reads the rooms and the outdoor readings of the [Smart Comfort](https://github.com/juju35/ha-smart-comfort) integration
- **Illustrated header**: a window whose curtains draw back with the answer, a breeze while it is open, rain and a haze outside; the dark theme turns it to night
- **Mini card**: two lines — the title with the answer, then the time and the main reason — and its zoom button opens the full card in place
- Visual editor for both cards, light and dark themes, 22 languages, no external dependency

## Supported integrations

The card reads any sensor; these integrations give what it needs:

| | Integration | What the cards use |
|:---:|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/atmofrance.png" alt="Atmo France" height="16"> | [Atmo France](https://github.com/sebcaps/atmofrance) (Marketplace) | The outdoor air quality index (1 to 6) and the pollen levels |
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/waqi.png" alt="WAQI" height="16"> | [World Air Quality Index](https://www.home-assistant.io/integrations/waqi/) (built in) | The outdoor AQI (0 to 500) |
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/meteo_france.png" alt="Météo-France" height="16"> | [Météo-France](https://www.home-assistant.io/integrations/meteo_france/) (built in) | The weather (rain, storms) and the next rain within the hour |
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/smart_comfort.png" alt="Smart Comfort" height="16"> | [Smart Comfort](https://github.com/juju35/ha-smart-comfort) (Marketplace) | The rooms (CO₂, humidity, temperature, open windows) and the outdoor readings |
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/images/home_assistant.png" alt="" height="16"> | [Timer](https://www.home-assistant.io/integrations/timer/) (built in) | The airing countdown, shared by every dashboard |

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-airing-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-airing-card` — Type: **Dashboard**
3. Open **Airing Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you.

### Manual

1. Download `ha-airing-card.js` and the `ha-airing-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-airing-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-airing-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

Every option is in the visual editor; `rooms` and `thresholds` are written as YAML in its advanced section. In YAML:

```yaml
type: custom:airing-card
rooms:
  - name: Living room
    co2: sensor.living_room_co2
    humidity: sensor.living_room_humidity
    temperature: sensor.living_room_temperature
    window: binary_sensor.living_room_window
  - name: Bedroom
    co2: sensor.bedroom_co2
    humidity: sensor.bedroom_humidity
outdoor_temperature: sensor.outdoor_temperature
outdoor_humidity: sensor.outdoor_humidity
air_quality: sensor.atmo_index
weather: weather.home
rain: sensor.home_next_rain
pollen: sensor.pollen_level
timer: timer.airing

# With the Smart Comfort integration: its rooms and outdoor readings, nothing else to set
type: custom:airing-card

# Stricter thresholds
type: custom:airing-card
thresholds:
  co2: 900
  humidity: 60

# Two lines on a phone dashboard
type: custom:airing-mini-card
```

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `Air now?` | Both: card title |
| `show_title` | boolean | `true` | Both: show the title |
| `show_subtitle` | boolean | `true` | Both: what to do now under the title (*Yes · 10 min advised*, *7 min left*…) |
| `navigation_path` | string | | Both: a tap on the header opens this dashboard path |
| `rooms` | list | | Both, as YAML: `name`, `co2`, `humidity`, `temperature`, `window` (one binary sensor or a list) per room |
| `smart_comfort` | string | `auto` | Both: `auto` (Smart Comfort's rooms when `rooms` is empty), `on` (added to `rooms`) or `off` |
| `outdoor_temperature` | entity | Smart Comfort's | Both: outdoor temperature sensor |
| `outdoor_humidity` | entity | | Both: outdoor humidity sensor (to know whether airing would dry a room) |
| `air_quality` | entity | Smart Comfort's | Both: outdoor air quality index (1–6 or 0–500) |
| `weather` | entity | | Both: weather entity — `rainy`, `snowy` make it *Not ideal*, `pouring`, `lightning`, `hail` *Not now* |
| `rain` | entity | | Both: the next rain time (Météo-France), a rain rate (> 0: raining) or a rain binary sensor |
| `pollen` | entity | | Both: pollen level |
| `timer` | entity | | Both: `timer` helper started for the airing time; without one, the card counts down by itself (on that dashboard only) |
| `duration` | number | `10` | Both: airing time in minutes |
| `thresholds` | object | | Both, as YAML: any of the thresholds below |
| `show_table` | boolean | `true` | Both: the indoor / outdoor table |
| `show_rooms` | boolean | `true` | Both: the room tiles |
| `illustration` | boolean | `true` | Both: the illustrated header (`false`: the classic header) |
| `illustration_theme` | string | `auto` | Both: `auto` (follows the Home Assistant theme: night with a dark theme, day with a light theme), `day` or `night` |
| `animations` | boolean | `true` | Both: the curtains, the breeze and the rain |
| `zoom` | boolean | `true` | Mini card: the zoom button |
| `language` | string | Home Assistant's | Advanced: one of the [languages](#translations) |

### Thresholds

| Threshold | Default | Meaning |
|---|---|---|
| `co2` | `1000` | ppm from which a room needs air |
| `co2_high` | `1400` | ppm from which the airing time gets 5 more minutes |
| `humidity` | `65` | % from which a room needs air (when the air outside would dry it) |
| `aqi_meh` / `aqi_no` | `3` / `4` (index), `101` / `151` (AQI) | Air quality index from which it is *Not ideal* / *Not now* |
| `pollen_meh` / `pollen_no` | `3` / `5` | Pollen level from which it is *Not ideal* / *Not now* |
| `heat` | `30` | °C outside, warmer than inside, from which it is *Not now* |
| `warm_indoor` | `25` | °C inside from which warmer air outside makes it *Not ideal* |
| `cold` | `5` | °C outside under which the airing is 5 minutes at most |
| `rain_soon` | `30` | Minutes before the next rain under which it is *Not ideal* |

## Screenshots

| Yes | Not ideal | Not now |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-yes.png" alt="Yes" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-meh.png" alt="Not ideal" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-no.png" alt="Not now" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-yes-dark.png" alt="Yes, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-meh-dark.png" alt="Not ideal, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-no-dark.png" alt="Not now, dark" width="400"> |

| No need | Airing | Narrow |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-none.png" alt="No need" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-airing.png" alt="Airing" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-narrow.png" alt="Narrow" width="300"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-none-dark.png" alt="No need, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-airing-dark.png" alt="Airing, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-narrow-dark.png" alt="Narrow, dark" width="300"> |

**Open window animation**: the curtains drawn back sway and a breeze crosses the open window (still with `animations: false`, or when the system asks for reduced motion).

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-yes.gif" alt="Open window animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-yes-dark.gif" alt="Open window animation, dark" width="400"> |

**Rain animation**: *Not ideal* with rain outside — the curtains half drawn back, the rain falls past the window.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-meh.gif" alt="Rain animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-meh-dark.gif" alt="Rain animation, dark" width="400"> |

**Closed window**: *Not now* — the curtains drawn, a haze outside when the air is poor; nothing moves.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-no.gif" alt="Closed window" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-no-dark.gif" alt="Closed window, dark" width="400"> |

### Airing mini

| Yes | Not now | Zoomed in |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-mini-yes.png" alt="Mini, yes" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-mini-no.png" alt="Mini, not now" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-mini-zoom.png" alt="Mini, zoomed in" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-mini-yes-dark.png" alt="Mini, yes, dark" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-mini-no-dark.png" alt="Mini, not now, dark" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-airing-card/main/screenshots/ar-mini-zoom-dark.png" alt="Mini, zoomed in, dark" width="400"> |

## Translations

English, French, German, Spanish, Italian, Dutch, Portuguese (Portugal), Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian, Greek, Serbian (Cyrillic and Latin). The card follows the Home Assistant language, or `language`.

## License

MIT — see [LICENSE](LICENSE).
