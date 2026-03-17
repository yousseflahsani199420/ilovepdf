(function () {
  const STORAGE_KEY = "site_lang";
  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Francais" },
    { code: "ar", label: "Arabic" },
    { code: "zh-CN", label: "Chinese" },
    { code: "hi", label: "Hindi" },
    { code: "id", label: "Indonesian" }
  ];

  function injectStyles() {
    if (document.getElementById("lang-switcher-styles")) return;
    const style = document.createElement("style");
    style.id = "lang-switcher-styles";
    style.textContent = [
      ".lang-switcher{position:relative;display:inline-flex;align-items:center}",
      ".lang-toggle{border:1px solid rgba(0,78,137,0.2);background:#fff;color:#0f172a;border-radius:10px;padding:7px 10px;cursor:pointer;font-weight:700;line-height:1}",
      ".lang-menu{position:absolute;right:0;top:120%;min-width:150px;background:#fff;border:1px solid rgba(0,78,137,0.18);border-radius:12px;box-shadow:0 10px 20px rgba(15,23,42,.08);padding:6px;display:none;z-index:10001}",
      ".lang-menu.open{display:block}",
      ".lang-option{width:100%;text-align:left;border:0;background:#fff;padding:8px 10px;border-radius:8px;cursor:pointer;color:#0f172a;font-size:.9rem}",
      ".lang-option:hover{background:#f1f5f9}",
      ".lang-switcher-slot{list-style:none}",
      ".lang-floating{position:fixed;right:14px;bottom:14px;z-index:10001}",
      "body{top:0 !important}",
      ".goog-te-banner-frame.skiptranslate{display:none !important}",
      "iframe.skiptranslate{display:none !important}",
      "#goog-gt-tt,.goog-te-balloon-frame{display:none !important}"
    ].join("");
    document.head.appendChild(style);
  }

  function setGoogleTranslateCookie(value) {
    const baseDomain = window.location.hostname.replace(/^www\./, "");
    document.cookie = `googtrans=${value}; path=/`;
    document.cookie = `googtrans=${value}; path=/; domain=.${baseDomain}`;
  }

  function applyLanguage(code) {
    localStorage.setItem(STORAGE_KEY, code);

    if (code === "en") {
      setGoogleTranslateCookie("/en/en");
      window.location.reload();
      return;
    }

    setGoogleTranslateCookie(`/en/${code}`);
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event("change"));
      return;
    }
    window.location.reload();
  }

  function buildSwitcher() {
    const switcher = document.createElement("div");
    switcher.className = "lang-switcher";

    const toggle = document.createElement("button");
    toggle.className = "lang-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Change language");
    toggle.title = "Change language";
    toggle.textContent = "🌐";

    const menu = document.createElement("div");
    menu.className = "lang-menu";
    menu.setAttribute("role", "menu");

    for (const lang of LANGUAGES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-option";
      btn.textContent = lang.label;
      btn.addEventListener("click", function () {
        menu.classList.remove("open");
        applyLanguage(lang.code);
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

  function ensureTranslateTarget() {
    if (document.getElementById("google_translate_element")) return;
    const holder = document.createElement("div");
    holder.id = "google_translate_element";
    holder.style.display = "none";
    document.body.appendChild(holder);
  }

  function loadGoogleTranslate() {
    if (window.googleTranslateElementInit) return;
    window.googleTranslateElementInit = function () {
      if (!window.google || !window.google.translate) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,fr,ar,zh-CN,hi,id",
          autoDisplay: false
        },
        "google_translate_element"
      );

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== "en") {
        setTimeout(function () {
          const combo = document.querySelector(".goog-te-combo");
          if (combo) {
            combo.value = saved;
            combo.dispatchEvent(new Event("change"));
          }
        }, 600);
      }
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);
  }

  function init() {
    injectStyles();
    buildSwitcher();
    ensureTranslateTarget();
    loadGoogleTranslate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
