// Renders the airing cards with the mock home and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/airing.mjs
import { pair, shoot } from "./harness.mjs";
import { pageScript, setup } from "./mock.mjs";

// Every still, by its file name (screenshots/<name>.png and <name>-dark.png): the card, its scene and its options.
const STILLS = [
  { name: "ar-yes", tag: "airing-card", scene: "yes" },
  { name: "ar-meh", tag: "airing-card", scene: "meh" },
  { name: "ar-no", tag: "airing-card", scene: "no" },
  { name: "ar-none", tag: "airing-card", scene: "none" },
  { name: "ar-airing", tag: "airing-card", scene: "airing" },
  { name: "ar-narrow", tag: "airing-card", scene: "yes", width: 300 },
  { name: "ar-mini-yes", tag: "airing-mini-card", scene: "yes" },
  { name: "ar-mini-no", tag: "airing-mini-card", scene: "no" },
  { name: "ar-mini-zoom", tag: "airing-mini-card", scene: "yes", open: ".zoom" },
];

// Stills: animations: false stops the curtains and the breeze, so a capture only changes when the card does.
for (const { name, tag, ...s } of STILLS) {
  const cut = name.lastIndexOf("-");
  const shots = pair(name.slice(cut + 1), { ...s, config: { animations: false } });
  await shoot({ prefix: name.slice(0, cut), tag, shots, setup, ws: pageScript() });
}
