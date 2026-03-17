const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://www.i-lovepdf.site";
const SOURCE_LANG = "en";
const API_URL = "https://api.mymemory.translated.net/get";
const LINGVA_URL = "https://lingva.ml/api/v1";
const CONTACT_EMAIL = "yousseflahsaniiiiii@gmail.com";
const CACHE_FILE = path.join(__dirname, ".translation-cache.json");
const CONCURRENCY = 8;

const LOCALES = [
  { code: "fr", apiCode: "fr", htmlLang: "fr", label: "Francais" },
  { code: "ar", apiCode: "ar", htmlLang: "ar", label: "Arabic", dir: "rtl" },
  { code: "hi", apiCode: "hi", htmlLang: "hi", label: "Hindi" },
  { code: "id", apiCode: "id", htmlLang: "id", label: "Indonesian" },
  { code: "zh", apiCode: "zh-CN", htmlLang: "zh", label: "Chinese" }
];

const ALL_LANGS = [{ code: "en", htmlLang: "en" }, ...LOCALES.map((l) => ({ code: l.code, htmlLang: l.htmlLang }))];
const LOCALE_CODES = new Set(LOCALES.map((l) => l.code));
const LINGVA_LANG_MAP = {
  fr: "fr",
  ar: "ar",
  hi: "hi",
  id: "id",
  "zh-CN": "zh"
};

const SKIP_DIRS = new Set([".git", "node_modules", ...LOCALES.map((l) => l.code)]);
const SKIP_TEXT_TAGS = new Set(["script", "style", "noscript"]);
const ATTRIBUTE_KEYS = ["placeholder", "title", "aria-label", "alt"];
const TRANSLATABLE_META_KEYS = new Set([
  "description",
  "keywords",
  "og:title",
  "og:description",
  "twitter:title",
  "twitter:description"
]);
let myMemoryQuotaExceeded = false;

const MANUAL_EXACT = {
  fr: {
    "All Tool Pages": "Toutes les pages d'outils",
    "PDF Guides and Tutorials": "Guides et tutoriels PDF",
    "Related Tools": "Outils connexes",
    "Why Use FreePDF Pro": "Pourquoi utiliser FreePDF Pro",
    "Open Main App": "Ouvrir l'application principale"
  },
  ar: {
    "All Tool Pages": "جميع صفحات الأدوات",
    "All Tool Pages | FreePDF Pro": "جميع صفحات الأدوات | FreePDF Pro",
    "PDF Guides and Tutorials": "أدلة ودروس PDF",
    "PDF Guides and Tutorials | Free Online PDF Help": "أدلة ودروس PDF | مساعدة PDF مجانية عبر الإنترنت",
    "Related Tools": "أدوات ذات صلة",
    "Why Use FreePDF Pro": "لماذا تستخدم FreePDF Pro",
    "Free and easy to use on desktop and mobile.": "مجاني وسهل الاستخدام على الكمبيوتر والهاتف.",
    "Fast browser-based processing.": "معالجة سريعة داخل المتصفح.",
    "No account required to use tools.": "لا يلزم إنشاء حساب لاستخدام الأدوات.",
    "Direct download after processing.": "تنزيل مباشر بعد المعالجة.",
    "Open Main App": "افتح التطبيق الرئيسي"
  },
  hi: {
    "All Tool Pages": "सभी टूल पेज",
    "All Tool Pages | FreePDF Pro": "सभी टूल पेज | FreePDF Pro",
    "PDF Guides and Tutorials": "PDF गाइड और ट्यूटोरियल",
    "PDF Guides and Tutorials | Free Online PDF Help": "PDF गाइड और ट्यूटोरियल | मुफ्त ऑनलाइन PDF सहायता",
    "Related Tools": "संबंधित टूल",
    "Why Use FreePDF Pro": "FreePDF Pro क्यों इस्तेमाल करें",
    "Free and easy to use on desktop and mobile.": "डेस्कटॉप और मोबाइल पर मुफ्त और उपयोग में आसान।",
    "Fast browser-based processing.": "ब्राउज़र में तेज प्रोसेसिंग।",
    "No account required to use tools.": "टूल इस्तेमाल करने के लिए अकाउंट की जरूरत नहीं है।",
    "Direct download after processing.": "प्रोसेस के बाद सीधा डाउनलोड।",
    "Open Main App": "मुख्य ऐप खोलें"
  },
  id: {
    "All Tool Pages": "Semua Halaman Alat",
    "All Tool Pages | FreePDF Pro": "Semua Halaman Alat | FreePDF Pro",
    "PDF Guides and Tutorials": "Panduan dan Tutorial PDF",
    "PDF Guides and Tutorials | Free Online PDF Help": "Panduan dan Tutorial PDF | Bantuan PDF Online Gratis",
    "Related Tools": "Alat Terkait",
    "Why Use FreePDF Pro": "Mengapa Menggunakan FreePDF Pro",
    "Free and easy to use on desktop and mobile.": "Gratis dan mudah digunakan di desktop dan mobile.",
    "Fast browser-based processing.": "Pemrosesan cepat berbasis browser.",
    "No account required to use tools.": "Tidak perlu akun untuk menggunakan alat.",
    "Direct download after processing.": "Unduh langsung setelah diproses.",
    "Open Main App": "Buka Aplikasi Utama"
  },
  zh: {
    "All Tool Pages": "全部工具页面",
    "All Tool Pages | FreePDF Pro": "全部工具页面 | FreePDF Pro",
    "PDF Guides and Tutorials": "PDF 指南与教程",
    "PDF Guides and Tutorials | Free Online PDF Help": "PDF 指南与教程 | 免费在线 PDF 帮助",
    "Related Tools": "相关工具",
    "Why Use FreePDF Pro": "为什么选择 FreePDF Pro",
    "Free and easy to use on desktop and mobile.": "免费且易用，支持桌面和移动设备。",
    "Fast browser-based processing.": "基于浏览器的快速处理。",
    "No account required to use tools.": "无需注册账号即可使用工具。",
    "Direct download after processing.": "处理完成后可直接下载。",
    "Open Main App": "打开主应用"
  }
};

const MANUAL_PREFIX = {
  fr: { open: "Ouvrir", howTo: "Comment utiliser" },
  ar: { open: "افتح", howTo: "كيفية استخدام" },
  hi: { open: "खोलें", howTo: "कैसे उपयोग करें" },
  id: { open: "Buka", howTo: "Cara Menggunakan" },
  zh: { open: "打开", howTo: "如何使用" }
};

function manualOverride(localeCode, sourceText) {
  const exact = MANUAL_EXACT[localeCode]?.[sourceText];
  if (exact) return exact;

  const prefix = MANUAL_PREFIX[localeCode];
  if (!prefix) return null;

  if (sourceText.startsWith("Open ")) {
    return `${prefix.open} ${sourceText.slice(5)}`;
  }

  if (sourceText.startsWith("How To Use ")) {
    return `${prefix.howTo} ${sourceText.slice("How To Use ".length)}`;
  }

  return null;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function walkForHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkForHtml(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name.toLowerCase() === "index.html") out.push(full);
  }
  return out;
}

function toRoutePath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) {
    return `/${rel.slice(0, -"/index.html".length)}/`;
  }
  return `/${rel}`;
}

function toFilePathFromRoute(routePath) {
  if (routePath === "/") return "index.html";
  return `${routePath.slice(1)}index.html`;
}

function hasLetters(text) {
  return /\p{L}/u.test(text);
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function isLikelyUrl(text) {
  return /^(https?:)?\/\//i.test(text) || /^mailto:/i.test(text) || /^tel:/i.test(text);
}

function isTranslatable(text) {
  if (!text) return false;
  if (text.length < 2) return false;
  if (!hasLetters(text)) return false;
  if (isLikelyUrl(text)) return false;
  return true;
}

function decodeEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function ensureBodyLanguageScript($) {
  if ($('script[src="/language-switcher.js"]').length) return;
  const scriptTag = '<script src="/language-switcher.js" defer></script>';
  if ($("body").length) {
    $("body").append(scriptTag);
  }
}

function collectPageStrings(html) {
  const cleanHtml = html.replace(/^\uFEFF/, "");
  const $ = cheerio.load(cleanHtml, { decodeEntities: false }, true);
  const bucket = new Set();

  const walk = (node) => {
    $(node)
      .contents()
      .each((_, child) => {
        if (child.type === "text") {
          const raw = child.data || "";
          const normalized = normalizeText(raw);
          if (isTranslatable(normalized)) bucket.add(normalized);
          return;
        }

        if (child.type !== "tag") return;
        const name = String(child.name || "").toLowerCase();
        if (SKIP_TEXT_TAGS.has(name)) return;
        walk(child);
      });
  };

  walk($.root());

  $("meta[content]").each((_, el) => {
    const name = String($(el).attr("name") || "").toLowerCase();
    const property = String($(el).attr("property") || "").toLowerCase();
    const key = name || property;
    if (!TRANSLATABLE_META_KEYS.has(key)) return;
    const content = normalizeText($(el).attr("content") || "");
    if (!isTranslatable(content)) return;
    bucket.add(content);
  });

  for (const attr of ATTRIBUTE_KEYS) {
    $(`[${attr}]`).each((_, el) => {
      const value = normalizeText($(el).attr(attr) || "");
      if (!isTranslatable(value)) return;
      bucket.add(value);
    });
  }

  return bucket;
}

async function translateViaMyMemory(text, localeApiCode) {
  if (myMemoryQuotaExceeded) throw new Error("mymemory_quota_exceeded");

  const params = new URLSearchParams({
    q: text,
    langpair: `${SOURCE_LANG}|${localeApiCode}`,
    de: CONTACT_EMAIL
  });

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "FreePDF-Pro-Static-I18N/1.0"
    }
  });

  if (!response.ok) {
    if (response.status === 429) myMemoryQuotaExceeded = true;
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const translatedRaw = data?.responseData?.translatedText;
  const status = Number(data?.responseStatus || 200);

  if (status === 429 || (typeof translatedRaw === "string" && translatedRaw.includes("MYMEMORY WARNING"))) {
    myMemoryQuotaExceeded = true;
    throw new Error("mymemory_quota_exceeded");
  }

  if (typeof translatedRaw !== "string" || !translatedRaw.trim()) {
    throw new Error("mymemory_empty_translation");
  }

  const translated = decodeEntities(translatedRaw.trim());
  if (!translated) throw new Error("mymemory_empty_translation");
  if (translated === text) throw new Error("mymemory_same_as_source");
  return translated;
}

async function translateViaLingva(text, localeApiCode) {
  const target = LINGVA_LANG_MAP[localeApiCode] || localeApiCode.toLowerCase();
  const endpoint = `${LINGVA_URL}/${SOURCE_LANG}/${target}/${encodeURIComponent(text)}`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "FreePDF-Pro-Static-I18N/1.0"
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const translatedRaw = data?.translation;
  if (typeof translatedRaw !== "string" || !translatedRaw.trim()) {
    throw new Error("lingva_empty_translation");
  }

  return decodeEntities(translatedRaw.trim());
}

async function translateWithRetry(text, localeApiCode) {
  const attempts = 3;
  for (let i = 0; i < attempts; i += 1) {
    try {
      if (!myMemoryQuotaExceeded) {
        return await translateViaMyMemory(text, localeApiCode);
      }
      return await translateViaLingva(text, localeApiCode);
    } catch (err) {
      try {
        return await translateViaLingva(text, localeApiCode);
      } catch {
        // fallback to retry/backoff below
      }
      if (i === attempts - 1) return text;
      await new Promise((resolve) => setTimeout(resolve, 350 * (i + 1)));
    }
  }
  return text;
}

async function buildLocaleDictionary(locale, uniqueStrings, cache) {
  cache[locale.code] = cache[locale.code] || {};
  const localeCache = cache[locale.code];
  const missing = uniqueStrings.filter((text) => {
    const forced = manualOverride(locale.code, text);
    if (forced) return localeCache[text] !== forced;
    const current = localeCache[text];
    if (!current) return true;
    return current === text;
  });

  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < missing.length) {
      const idx = cursor;
      cursor += 1;
      const value = missing[idx];
      const translated = await translateWithRetry(value, locale.apiCode);
      const forced = manualOverride(locale.code, value);
      localeCache[value] = forced || translated || value;

      if ((idx + 1) % 80 === 0 || idx + 1 === missing.length) {
        console.log(`[${locale.code}] translated ${idx + 1}/${missing.length}`);
      }
    }
  });

  await Promise.all(workers);
}

function stripLocalePrefix(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return "/";
  if (!LOCALE_CODES.has(parts[0])) return pathname;
  const rest = parts.slice(1);
  return rest.length ? `/${rest.join("/")}${pathname.endsWith("/") ? "/" : ""}` : "/";
}

function applyLocaleToPath(pathname, localeCode) {
  const basePath = stripLocalePrefix(pathname);
  if (localeCode === "en") return basePath;

  if (basePath === "/") return `/${localeCode}/`;
  return `/${localeCode}${basePath}`;
}

function shouldLocalizePath(pathname) {
  if (!pathname.startsWith("/")) return false;
  if (pathname === "/") return true;

  const ignorePrefixes = [
    "/vendor/",
    "/pdflogo.png",
    "/language-switcher.js",
    "/app.js",
    "/robots.txt",
    "/sitemap.xml"
  ];

  if (ignorePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) return false;

  if (/\.[a-z0-9]+$/i.test(pathname)) return false;
  return true;
}

function localizeHref(rawHref, localeCode) {
  if (!rawHref) return rawHref;
  if (/^(mailto:|tel:|javascript:|data:)/i.test(rawHref)) return rawHref;

  if (rawHref.startsWith("#")) {
    const rootPath = localeCode === "en" ? "/" : `/${localeCode}/`;
    return `${rootPath}${rawHref}`;
  }

  if (/^https?:\/\//i.test(rawHref)) {
    try {
      const url = new URL(rawHref);
      if (url.origin !== BASE_URL) return rawHref;
      if (!shouldLocalizePath(url.pathname)) return rawHref;
      url.pathname = applyLocaleToPath(url.pathname, localeCode);
      return url.toString();
    } catch {
      return rawHref;
    }
  }

  if (!rawHref.startsWith("/")) return rawHref;
  if (!shouldLocalizePath(rawHref)) return rawHref;

  const url = new URL(rawHref, BASE_URL);
  url.pathname = applyLocaleToPath(url.pathname, localeCode);
  return `${url.pathname}${url.search}${url.hash}`;
}

function setCanonicalAndAlternates($, routePath, localeCode) {
  const localizedRoute = applyLocaleToPath(routePath, localeCode);
  const canonicalHref = `${BASE_URL}${localizedRoute}`;

  let canonical = $('link[rel="canonical"]');
  if (!canonical.length) {
    $("head").append('<link rel="canonical" href="">');
    canonical = $('link[rel="canonical"]');
  }
  canonical.attr("href", canonicalHref);

  $('meta[property="og:url"]').attr("content", canonicalHref);
  $('meta[property="twitter:url"]').attr("content", canonicalHref);

  $('link[rel="alternate"][hreflang]').remove();

  const links = [
    ...ALL_LANGS.map((lang) => {
      const langRoute = applyLocaleToPath(routePath, lang.code);
      const href = `${BASE_URL}${langRoute}`;
      const hreflang = lang.code === "zh" ? "zh-CN" : lang.htmlLang;
      return `<link rel="alternate" hreflang="${hreflang}" href="${href}">`;
    }),
    `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${routePath}">`
  ];

  canonical.after(`\n  ${links.join("\n  ")}`);
}

function applyTranslations($, translationMap) {
  const walk = (node) => {
    $(node)
      .contents()
      .each((_, child) => {
        if (child.type === "text") {
          const raw = child.data || "";
          const normalized = normalizeText(raw);
          if (!isTranslatable(normalized)) return;
          const translated = translationMap[normalized] || normalized;

          const leading = (raw.match(/^\s*/) || [""])[0];
          const trailing = (raw.match(/\s*$/) || [""])[0];
          child.data = `${leading}${translated}${trailing}`;
          return;
        }

        if (child.type !== "tag") return;
        const name = String(child.name || "").toLowerCase();
        if (SKIP_TEXT_TAGS.has(name)) return;
        walk(child);
      });
  };

  walk($.root());

  $("meta[content]").each((_, el) => {
    const name = String($(el).attr("name") || "").toLowerCase();
    const property = String($(el).attr("property") || "").toLowerCase();
    const key = name || property;
    if (!TRANSLATABLE_META_KEYS.has(key)) return;
    const value = $(el).attr("content") || "";
    const normalized = normalizeText(value);
    if (!isTranslatable(normalized)) return;
    $(el).attr("content", translationMap[normalized] || normalized);
  });

  for (const attr of ATTRIBUTE_KEYS) {
    $(`[${attr}]`).each((_, el) => {
      const value = $(el).attr(attr) || "";
      const normalized = normalizeText(value);
      if (!isTranslatable(normalized)) return;
      $(el).attr(attr, translationMap[normalized] || normalized);
    });
  }
}

function localizePageUrls($, routePath, localeCode) {
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    $(el).attr("href", localizeHref(href, localeCode));
  });

  $('script:not([src])').each((_, el) => {
    const text = $(el).html() || "";
    if (!text.includes('const target = "/?"')) return;
    const prefix = localeCode === "en" ? "/?" : `/${localeCode}/?`;
    $(el).html(text.replace('const target = "/?"', `const target = "${prefix}"`));
  });

  $("html").attr("lang", localeCode === "zh" ? "zh" : localeCode);
  if (localeCode === "ar") {
    $("html").attr("dir", "rtl");
  } else {
    $("html").removeAttr("dir");
  }

  setCanonicalAndAlternates($, routePath, localeCode);
}

function writeLocalePage(localeCode, routePath, html) {
  const outputPath = path.join(ROOT, localeCode, toFilePathFromRoute(routePath));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, "utf8");
}

function cleanupOldLocaleDirs() {
  for (const locale of LOCALES) {
    const dir = path.join(ROOT, locale.code);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }
}

function generateSitemap(sourceRoutes) {
  const today = new Date().toISOString().slice(0, 10);
  const priorityFor = (route) => {
    if (route === "/") return "1.0";
    if (route === "/tools/") return "0.95";
    if (route.startsWith("/tools/")) return "0.85";
    if (route.startsWith("/guides/")) return "0.75";
    return "0.70";
  };

  const freqFor = (route) => {
    if (route === "/" || route === "/tools/") return "daily";
    if (route.startsWith("/tools/")) return "weekly";
    if (route.startsWith("/guides/")) return "monthly";
    return "monthly";
  };

  const allRoutes = [];
  for (const route of sourceRoutes) {
    allRoutes.push(route);
    for (const locale of LOCALES) {
      allRoutes.push(applyLocaleToPath(route, locale.code));
    }
  }

  const uniqueRoutes = [...new Set(allRoutes)];

  const entries = uniqueRoutes
    .map((route) => {
      const baseRoute = stripLocalePrefix(route);
      return `  <url>\n    <loc>${BASE_URL}${route}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freqFor(baseRoute)}</changefreq>\n    <priority>${priorityFor(baseRoute)}</priority>\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
}

async function main() {
  const htmlFiles = walkForHtml(ROOT);
  const pages = htmlFiles.map((filePath) => ({
    filePath,
    routePath: toRoutePath(filePath),
    html: fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "")
  }));

  const uniqueStringsSet = new Set();
  for (const page of pages) {
    const set = collectPageStrings(page.html);
    for (const str of set) uniqueStringsSet.add(str);
  }

  const uniqueStrings = [...uniqueStringsSet];
  console.log(`Source pages: ${pages.length}`);
  console.log(`Unique strings: ${uniqueStrings.length}`);

  const cache = readJson(CACHE_FILE, {});

  for (const locale of LOCALES) {
    console.log(`Translating locale: ${locale.code}`);
    await buildLocaleDictionary(locale, uniqueStrings, cache);
    writeJson(CACHE_FILE, cache);
  }

  cleanupOldLocaleDirs();

  for (const page of pages) {
    // Keep English pages as source of truth but enrich with hreflang alternates.
    const $en = cheerio.load(page.html, { decodeEntities: false }, true);
    ensureBodyLanguageScript($en);
    localizePageUrls($en, page.routePath, "en");
    fs.writeFileSync(page.filePath, $en.html(), "utf8");

    for (const locale of LOCALES) {
      const $ = cheerio.load(page.html, { decodeEntities: false }, true);
      ensureBodyLanguageScript($);
      applyTranslations($, cache[locale.code] || {});
      localizePageUrls($, page.routePath, locale.code);
      writeLocalePage(locale.code, page.routePath, $.html());
    }
  }

  generateSitemap(pages.map((p) => p.routePath));

  console.log("Static translation build complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
