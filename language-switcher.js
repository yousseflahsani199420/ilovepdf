(function () {
  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Francais" },
    { code: "ar", label: "Arabic" },
    { code: "zh", label: "Chinese" },
    { code: "hi", label: "Hindi" },
    { code: "id", label: "Indonesian" }
  ];

  const CODES = new Set(LANGUAGES.map((lang) => lang.code));

  function currentLocale() {
    const first = window.location.pathname.split("/").filter(Boolean)[0];
    if (CODES.has(first)) return first;
    return "en";
  }

  function stripLocale(pathname) {
    const parts = pathname.split("/").filter(Boolean);
    if (!parts.length) return "/";
    if (!CODES.has(parts[0])) return pathname;
    const rest = parts.slice(1);
    if (!rest.length) return "/";
    return `/${rest.join("/")}${pathname.endsWith("/") ? "/" : ""}`;
  }

  function toLocaleUrl(localeCode) {
    const url = new URL(window.location.href);
    const basePath = stripLocale(url.pathname);

    if (localeCode === "en") {
      url.pathname = basePath;
    } else if (basePath === "/") {
      url.pathname = `/${localeCode}/`;
    } else {
      url.pathname = `/${localeCode}${basePath}`;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  }

  function injectStyles() {
    if (document.getElementById("lang-switcher-styles")) return;

    const style = document.createElement("style");
    style.id = "lang-switcher-styles";
    style.textContent = [
      ".lang-switcher{position:relative;display:inline-flex;align-items:center}",
      ".lang-toggle{border:1px solid rgba(0,78,137,0.2);background:#fff;color:#0f172a;border-radius:10px;padding:7px 10px;cursor:pointer;font-weight:700;line-height:1}",
      ".lang-menu{position:absolute;right:0;top:120%;min-width:165px;background:#fff;border:1px solid rgba(0,78,137,0.18);border-radius:12px;box-shadow:0 10px 20px rgba(15,23,42,.08);padding:6px;display:none;z-index:10001}",
      ".lang-menu.open{display:block}",
      ".lang-option{width:100%;text-align:left;border:0;background:#fff;padding:8px 10px;border-radius:8px;cursor:pointer;color:#0f172a;font-size:.9rem}",
      ".lang-option:hover{background:#f1f5f9}",
      ".lang-option.active{background:#eff6ff;color:#004e89;font-weight:700}",
      ".lang-switcher-slot{list-style:none}",
      ".lang-floating{position:fixed;right:14px;bottom:14px;z-index:10001}"
    ].join("");

    document.head.appendChild(style);
  }

  function buildSwitcher() {
    const switcher = document.createElement("div");
    switcher.className = "lang-switcher";

    const toggle = document.createElement("button");
    toggle.className = "lang-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Change language");
    toggle.title = "Change language";
    toggle.textContent = "Lang";

    const menu = document.createElement("div");
    menu.className = "lang-menu";
    menu.setAttribute("role", "menu");

    const locale = currentLocale();

    for (const lang of LANGUAGES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `lang-option${locale === lang.code ? " active" : ""}`;
      btn.textContent = lang.label;
      btn.addEventListener("click", function () {
        menu.classList.remove("open");
        window.location.href = toLocaleUrl(lang.code);
      });
      menu.appendChild(btn);
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      menu.classList.toggle("open");
    });

    document.addEventListener("click", function () {
      menu.classList.remove("open");
    });

    switcher.appendChild(toggle);
    switcher.appendChild(menu);

    const navLinks = document.querySelector(".nav-links");
    if (navLinks) {
      const li = document.createElement("li");
      li.className = "lang-switcher-slot";
      li.appendChild(switcher);
      navLinks.appendChild(li);
      return;
    }

    const actions = document.querySelector(".actions");
    if (actions) {
      actions.appendChild(switcher);
      return;
    }

    switcher.classList.add("lang-floating");
    document.body.appendChild(switcher);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {
        // Ignore registration errors to avoid blocking UI.
      });
    });
  }

  function init() {
    injectStyles();
    buildSwitcher();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
