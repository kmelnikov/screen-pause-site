import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (rel) => readFile(new URL(rel, root), "utf8");

test("CNAME, SEO discovery files, and static assets exist for screenpause.melnikov.pl", async () => {
  const cname = (await read("CNAME")).trim();
  assert.equal(cname, "screenpause.melnikov.pl");
  for (const rel of [
    ".nojekyll",
    "robots.txt",
    "sitemap.xml",
    "styles.css",
    "demo.js",
    "icon.png",
    "og-v2.png",
    "demo-25s.mp4",
    "demo-25s.webm",
    "demo-25s-poster.jpg",
    "compare/index.html",
    "screenshots/manual-pause.jpg",
    "screenshots/auto-pause-series.png",
    "screenshots/menu-bar.png",
    "screenshots/adaptive-prompt.jpg",
  ]) {
    await access(new URL(rel, root));
  }
  const robots = await read("robots.txt");
  const sitemap = await read("sitemap.xml");
  assert.match(robots, /Sitemap:\s*https:\/\/screenpause\.melnikov\.pl\/sitemap\.xml/);
  for (const loc of ["/", "/compare", "/support", "/privacy"]) {
    assert.ok(sitemap.includes(`<loc>https://screenpause.melnikov.pl${loc}</loc>`), `Missing sitemap URL: ${loc}`);
  }
});

test("all four pages use screenpause.melnikov.pl, have zero chatgpt.site links, and load zero third-party scripts", async () => {
  const [home, compare, privacy, support] = await Promise.all([
    read("index.html"),
    read("compare/index.html"),
    read("privacy/index.html"),
    read("support/index.html"),
  ]);
  for (const html of [home, compare, privacy, support]) {
    assert.doesNotMatch(html, /chatgpt\.site/i);
    assert.match(html, /https:\/\/screenpause\.melnikov\.pl/);
    assert.match(html, /href="\/styles\.css"/);
    assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
  }
});

test("home page removes disabled MAS button leak, uses cookieless UTM attribution, valid JSON-LD, and preserves anchors", async () => {
  const home = await read("index.html");
  assert.match(home, /Direct DMG edition blocks normal keyboard, mouse and trackpad input/);
  assert.match(home, /Mac App Store edition uses active full-screen pause windows/);
  assert.match(home, /requires neither Accessibility nor Input Monitoring/);
  assert.match(home, /aria-label="Gumroad Direct DMG setup"/);
  assert.match(home, /<script src="\/demo\.js" defer><\/script>/);
  assert.match(home, /id="demo-video"/);
  assert.match(home, /src="\/demo-25s\.mp4"/);
  assert.match(home, /src="\/demo-25s\.webm"/);
  assert.match(home, /poster="\/demo-25s-poster\.jpg"/);
  assert.doesNotMatch(home, /apps\.apple\.com/);
  assert.doesNotMatch(home, /store-coming-soon/);
  assert.doesNotMatch(home, /lifetime updates|free updates forever|money-back guarantee|unlimited devices/i);

  const ldMatch = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ldMatch, "Missing JSON-LD block on home page");
  const ld = JSON.parse(ldMatch[1]);
  assert.equal(ld["@type"], "SoftwareApplication");
  assert.equal(ld.offers.price, "19.99");

  const gumroadTags = [...home.matchAll(/<a\b[^>]*href="(https:\/\/melnikov28\.gumroad\.com\/l\/screen-pause-for-macos\?[^"]+)"[^>]*>/g)];
  assert.equal(gumroadTags.length, 3);
  for (const [tag, href] of gumroadTags) {
    assert.match(href, /utm_source=screenpause_site/);
    assert.match(href, /utm_content=(nav|hero|closing)/);
    assert.doesNotMatch(tag, /noreferrer/);
  }

  const links = [...home.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of links.filter((h) => h.startsWith("#"))) {
    assert.ok(home.includes(`id="${href.slice(1)}"`), `Missing home anchor: ${href}`);
  }
});

test("compare page covers key alternatives, zero-network verification, and attributed Gumroad links", async () => {
  const compare = await read("compare/index.html");
  for (const term of ["LookAway", "StandLock", "Stretchly", "Time Out", "otool -L", "nm -u"]) {
    assert.ok(compare.includes(term), `Missing compare term: ${term}`);
  }
  const gumroadLinks = [...compare.matchAll(/href="(https:\/\/melnikov28\.gumroad\.com\/l\/screen-pause-for-macos\?[^"]+)"/g)];
  assert.equal(gumroadLinks.length, 2);
  assert.doesNotMatch(compare, /noreferrer/);
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
