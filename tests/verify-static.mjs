import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (rel) => readFile(new URL(rel, root), "utf8");

test("CNAME and static assets exist for screenpause.melnikov.pl", async () => {
  const cname = (await read("CNAME")).trim();
  assert.equal(cname, "screenpause.melnikov.pl");
  for (const rel of [
    ".nojekyll",
    "styles.css",
    "demo.js",
    "icon.png",
    "og-v2.png",
    "screenshots/manual-pause.jpg",
    "screenshots/auto-pause-series.png",
    "screenshots/menu-bar.png",
    "screenshots/adaptive-prompt.jpg",
  ]) {
    await access(new URL(rel, root));
  }
});

test("all three pages use screenpause.melnikov.pl and have zero chatgpt.site links", async () => {
  const [home, privacy, support] = await Promise.all([
    read("index.html"),
    read("privacy/index.html"),
    read("support/index.html"),
  ]);
  for (const html of [home, privacy, support]) {
    assert.doesNotMatch(html, /chatgpt\.site/i);
    assert.match(html, /https:\/\/screenpause\.melnikov\.pl/);
    assert.match(html, /href="\/styles\.css"/);
  }
});

test("home page distinguishes Direct DMG and Mac App Store editions and preserves anchors", async () => {
  const home = await read("index.html");
  assert.match(home, /Direct DMG edition blocks normal keyboard, mouse and trackpad input/);
  assert.match(home, /Mac App Store edition uses active full-screen pause windows/);
  assert.match(home, /requires neither Accessibility nor Input Monitoring/);
  assert.match(home, /aria-label="Gumroad Direct DMG setup"/);
  assert.match(home, /<script src="\/demo\.js" defer><\/script>/);
  assert.doesNotMatch(home, /apps\.apple\.com/);
  const links = [...home.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(links.filter((h) => h === "https://melnikov28.gumroad.com/l/screen-pause-for-macos").length, 3);
  for (const href of links.filter((h) => h.startsWith("#"))) {
    assert.ok(home.includes(`id="${href.slice(1)}"`), `Missing home anchor: ${href}`);
  }
});

test("support and privacy pages preserve anchors, zero-TCC App Store wording, and emergency release nav", async () => {
  const [privacy, support] = await Promise.all([
    read("privacy/index.html"),
    read("support/index.html"),
  ]);
  assert.match(privacy, /The Mac App Store build runs inside App Sandbox and does not request/);
  assert.match(privacy, /This statement applies to Screen Pause 1\.6\.68\./);
  assert.match(support, /href="#end-pause">End a pause now<\/a>/);
  assert.match(support, /<section id="end-pause">/);
  assert.match(support, /No Accessibility or[\s\S]*Input Monitoring permissions are required/);
  for (const match of support.matchAll(/href="#([^"\s]+)"/g)) {
    assert.ok(support.includes(`id="${match[1]}"`), `Missing support anchor: ${match[1]}`);
  }
});
