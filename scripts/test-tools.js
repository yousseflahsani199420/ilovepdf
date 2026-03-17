const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appJs = fs.readFileSync(path.join(root, "app.js"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

const cardIds = [...indexHtml.matchAll(/data-tool="([^"]+)"/g)].map((m) => m[1]);
const configIds = [...appJs.matchAll(/^\s*([a-z]+): \{ title:/gm)].map((m) => m[1]);
const seoDirs = fs
  .readdirSync(path.join(root, "tools"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const unique = (arr) => [...new Set(arr)];
const missingInConfig = cardIds.filter((id) => !configIds.includes(id));
const extraInConfig = configIds.filter((id) => !cardIds.includes(id));
const missingInSitemap = fs
  .readdirSync(path.join(root, "tools"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((slug) => !sitemap.includes(`/tools/${slug}/`));

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

if (missingInConfig.length) fail(`Tool cards missing in app config: ${missingInConfig.join(", ")}`);
if (extraInConfig.length) fail(`App config tools missing in cards: ${extraInConfig.join(", ")}`);
if (seoDirs.length < cardIds.length) fail(`SEO page count (${seoDirs.length}) is lower than tool card count (${cardIds.length}).`);
if (missingInSitemap.length) fail(`Tool pages missing from sitemap: ${missingInSitemap.join(", ")}`);

if (process.exitCode !== 1) {
  console.log("PASS: Tool wiring checks are valid.");
  console.log(`Cards: ${cardIds.length}, Config tools: ${configIds.length}, SEO pages: ${seoDirs.length}`);
}
