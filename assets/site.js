(() => {
  const LANGS = {"en": "English", "zh-Hans": "简体中文", "zh-Hant": "繁體中文", "ja": "日本語", "ko": "한국어", "fr": "Français", "es": "Español", "it": "Italiano", "tr": "Türkçe", "pl": "Polski", "nl": "Nederlands"};
  const COMMON = {
    "download": {"en": "Download for Mac", "zh-Hans": "下载 Mac 版", "zh-Hant": "下載 Mac 版", "ja": "Mac 版をダウンロード", "ko": "Mac용 다운로드", "fr": "Télécharger pour Mac", "es": "Descargar para Mac", "it": "Scarica per Mac", "tr": "Mac için indir", "pl": "Pobierz na Maca", "nl": "Download voor Mac"},
    "fine": {"en": "Free · macOS 14 or later · Signed and notarized by Apple", "zh-Hans": "免费 · macOS 14 或更新版本 · 经 Apple 签名与公证", "zh-Hant": "免費 · macOS 14 或更新版本 · 經 Apple 簽署與公證", "ja": "無料 · macOS 14 以降 · Apple による署名と公証済み", "ko": "무료 · macOS 14 이상 · Apple 서명 및 공증 완료", "fr": "Gratuit · macOS 14 ou ultérieur · Signé et notarisé par Apple", "es": "Gratis · macOS 14 o posterior · Firmada y notarizada por Apple", "it": "Gratis · macOS 14 o successivo · Firmata e notarizzata da Apple", "tr": "Ücretsiz · macOS 14 veya üstü · Apple tarafından imzalı ve onaylı", "pl": "Za darmo · macOS 14 lub nowszy · Podpisana i notaryzowana przez Apple", "nl": "Gratis · macOS 14 of nieuwer · Ondertekend en genotariseerd door Apple"},
    "more": {"en": "More from Reff Wu", "zh-Hans": "更多 Reff Wu 的 App", "zh-Hant": "更多 Reff Wu 的 App", "ja": "Reff Wu のほかの App", "ko": "Reff Wu의 다른 앱", "fr": "Plus d’apps de Reff Wu", "es": "Más de Reff Wu", "it": "Altro da Reff Wu", "tr": "Reff Wu’dan diğerleri", "pl": "Więcej od Reff Wu", "nl": "Meer van Reff Wu"},
    "source": {"en": "Source on GitHub", "zh-Hans": "GitHub 上的源代码", "zh-Hant": "GitHub 上的原始碼", "ja": "GitHub のソースコード", "ko": "GitHub 소스 코드", "fr": "Code source sur GitHub", "es": "Código fuente en GitHub", "it": "Codice sorgente su GitHub", "tr": "GitHub’da kaynak kod", "pl": "Kod źródłowy na GitHubie", "nl": "Broncode op GitHub"},
    "home.title": {"en": "Mac apps by Reff Wu", "zh-Hans": "Reff Wu 的 Mac App", "zh-Hant": "Reff Wu 的 Mac App", "ja": "Reff Wu の Mac App", "ko": "Reff Wu의 Mac 앱", "fr": "Apps Mac de Reff Wu", "es": "Apps para Mac de Reff Wu", "it": "App per Mac di Reff Wu", "tr": "Reff Wu’nun Mac uygulamaları", "pl": "Aplikacje na Maca od Reff Wu", "nl": "Mac-apps van Reff Wu"},
    "home.sub": {"en": "Small, careful tools. Free, native and notarized.", "zh-Hans": "小而用心的工具。免费、原生，经过 Apple 公证。", "zh-Hant": "小而用心的工具。免費、原生，經過 Apple 公證。", "ja": "小さく、丁寧な道具。無料・ネイティブ・公証済み。", "ko": "작고 세심한 도구. 무료, 네이티브, 공증 완료.", "fr": "De petits outils soignés. Gratuits, natifs et notarisés.", "es": "Herramientas pequeñas y cuidadas. Gratis, nativas y notarizadas.", "it": "Piccoli strumenti curati. Gratis, nativi e notarizzati.", "tr": "Küçük, özenli araçlar. Ücretsiz, yerel ve onaylı.", "pl": "Małe, dopracowane narzędzia. Darmowe, natywne i notaryzowane.", "nl": "Kleine, zorgvuldige tools. Gratis, native en genotariseerd."},
    "stats.live": {"en": "Live Stats", "zh-Hans": "实时大屏", "zh-Hant": "即時看板", "ja": "リアルタイム", "ko": "실시간 지표", "fr": "Stats en direct", "es": "En vivo", "it": "In tempo reale", "tr": "Canlı", "pl": "Na żywo", "nl": "Live stats"},
    "stats.downloads": {"en": "downloads", "zh-Hans": "次下载", "zh-Hant": "次下載", "ja": "ダウンロード", "ko": "회 다운로드", "fr": "téléchargements", "es": "descargas", "it": "download", "tr": "indirme", "pl": "pobrań", "nl": "downloads"},
    "stats.active_today": {"en": "active (24h)", "zh-Hans": "24h 活跃", "zh-Hant": "24h 活躍", "ja": "24h アクティブ", "ko": "24시간 활성", "fr": "actifs (24h)", "es": "activos (24h)", "it": "attivi (24h)", "tr": "aktif (24s)", "pl": "aktywnych (24h)", "nl": "actief (24u)"},
    "stats.active_devices": {"en": "active devices", "zh-Hans": "活跃设备", "zh-Hant": "活躍裝置", "ja": "アクティブ端末", "ko": "활성 기기", "fr": "appareils actifs", "es": "dispositivos activos", "it": "dispositivi attivi", "tr": "aktif cihaz", "pl": "aktywnych urządzeń", "nl": "actieve apparaten"}
  };

  function pick() {
    try {
      const saved = localStorage.getItem("lang");
      if (saved && LANGS[saved]) return saved;
    } catch (_) {}
    for (const raw of navigator.languages || [navigator.language || "en"]) {
      const tag = raw.toLowerCase();
      if (tag.startsWith("zh")) return /tw|hk|mo|hant/.test(tag) ? "zh-Hant" : "zh-Hans";
      const base = tag.split("-")[0];
      if (base !== "zh" && LANGS[base]) return base;
    }
    return "en";
  }

  const strings = Object.assign({}, COMMON, window.PAGE_STRINGS || {});
  let lang = pick();
  let cachedStats = null;
  let catalog = null;

  function formatNumber(num) {
    if (typeof num !== "number" || isNaN(num)) return "0";
    return num.toLocaleString();
  }

  function formatCompact(num) {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k+";
    return num.toString();
  }

  const STATS_URL = "https://softfold-telemetry.reffwu.workers.dev/api/public-stats";

  async function fetchStats(force = false) {
    if (cachedStats && !force) return cachedStats;
    try {
      const res = await fetch(STATS_URL, { cache: force ? "reload" : "default" });
      if (!res.ok) throw new Error("Network response was not ok");
      cachedStats = await res.json();
      window.__APP_STATS__ = cachedStats;
      return cachedStats;
    } catch (e) {
      console.warn("Telemetry stats unavailable:", e);
      return null;
    }
  }

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const entry = strings[el.dataset.i18n];
      if (entry) {
        const val = entry[lang] || entry.en;
        el.textContent = val;
        if (el.hasAttribute("title")) el.setAttribute("title", val);
      }
    });
    document.querySelectorAll("[data-hero]").forEach(img => {
      img.src = `${img.dataset.hero}-${["en", "zh-Hans", "zh-Hant", "ja", "ko"].includes(lang) ? lang : "en"}.webp`;
    });
    if (strings["page.title"]) document.title = strings["page.title"][lang] || strings["page.title"].en;
    renderApps();
    updateAppStatBadge();
    if (typeof window.__ON_LANG_CHANGE__ === "function") {
      window.__ON_LANG_CHANGE__(lang);
    }
  }

  function updateAppStatBadge() {
    const currentApp = document.body.dataset.app;
    const root = document.body.dataset.root || "";

    if (!currentApp) {
      if (cachedStats && cachedStats.totals) {
        const homePill = document.querySelector(".home [data-stat-pill], .home .stat-pill");
        if (homePill) {
          const textEl = homePill.querySelector(".stat-text") || homePill;
          const dlWord = strings["stats.downloads"] ? (strings["stats.downloads"][lang] || "downloads") : "downloads";
          const actWord = strings["stats.active_today"] ? (strings["stats.active_today"][lang] || "active today") : "active today";
          textEl.textContent = `${formatNumber(cachedStats.totals.downloads)} ${dlWord} · ${formatNumber(cachedStats.totals.active_today)} ${actWord}`;
        }
      }
      return;
    }

    let pill = document.querySelector(".stat-pill, [data-stat-pill]");
    if (!pill) {
      const cta = document.querySelector(".cta");
      if (!cta) return;
      pill = document.createElement("div");
      pill.className = "stat-pill";
      const dot = document.createElement("span");
      dot.className = "live-dot";
      dot.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.className = "stat-text";
      pill.append(dot, text);
      cta.append(pill);
    } else if (pill.tagName === "A") {
      pill.removeAttribute("href");
      pill.removeAttribute("title");
    }

    if (cachedStats && cachedStats.apps && cachedStats.apps[currentApp]) {
      const appData = cachedStats.apps[currentApp];
      const textEl = pill.querySelector(".stat-text") || pill;
      const dlWord = strings["stats.downloads"] ? (strings["stats.downloads"][lang] || "downloads") : "downloads";
      const actWord = strings["stats.active_today"] ? (strings["stats.active_today"][lang] || "active today") : "active today";
      const devWord = strings["stats.active_devices"] ? (strings["stats.active_devices"][lang] || "active devices") : "active devices";
      
      let text = `${formatNumber(appData.downloads)} ${dlWord}`;
      if (appData.active_today > 0) {
        text += ` · ${formatNumber(appData.active_today)} ${actWord}`;
      } else if (appData.active_30d > 0) {
        text += ` · ${formatNumber(appData.active_30d)} ${devWord}`;
      }
      textEl.textContent = text;
    }
  }

  function renderApps() {
    const grid = document.querySelector("[data-apps]");
    if (!grid || !catalog) return;
    const self = document.body.dataset.app;
    const root = document.body.dataset.root || "";
    grid.textContent = "";
    const apps = catalog.apps.filter(app => app.id !== self);
    for (const app of apps) {
      const card = document.createElement("a");
      card.className = "app-card";
      card.href = `${root}${app.id}/`;
      const icon = document.createElement("img");
      icon.src = `${root}icons/${app.id}.png`; icon.alt = ""; icon.width = 64; icon.height = 64;
      const text = document.createElement("div");
      const name = document.createElement("h3"); name.textContent = app.name;
      const line = document.createElement("p"); line.textContent = app.tagline[lang] || app.tagline.en;
      text.append(name, line);

      if (cachedStats && cachedStats.apps && cachedStats.apps[app.id]) {
        const itemStats = cachedStats.apps[app.id];
        if (itemStats.downloads > 0 || itemStats.active_today > 0) {
          const meta = document.createElement("div");
          meta.className = "app-card-meta";
          const badge = document.createElement("span");
          badge.className = "app-card-badge";
          const dlWord = strings["stats.downloads"] ? (strings["stats.downloads"][lang] || "downloads") : "downloads";
          badge.textContent = `${formatCompact(itemStats.downloads)} ${dlWord}`;
          meta.append(badge);
          text.append(meta);
        }
      }

      card.append(icon, text); grid.append(card);
    }
    const section = grid.closest("[data-more]");
    if (section) section.hidden = apps.length === 0;
  }

  function setupNav() {
    const navShell = document.querySelector("nav .shell");
    if (!navShell) return;
    const select = navShell.querySelector(".lang");
    if (!select) return;

    const isDashboard = document.body.dataset.page === "dashboard";
    const root = document.body.dataset.root || "";

    if (isDashboard && !navShell.querySelector(".nav-actions")) {
      const actions = document.createElement("div");
      actions.className = "nav-actions";
      const backLink = document.createElement("a");
      backLink.className = "nav-stat-link";
      backLink.href = `${root}`;
      backLink.innerHTML = `<span aria-hidden="true">←</span> <span>Apps</span>`;
      select.parentNode.insertBefore(actions, select);
      actions.append(backLink, select);
    }

    select.textContent = "";
    for (const [code, name] of Object.entries(LANGS)) {
      const option = document.createElement("option");
      option.value = code; option.textContent = name; select.append(option);
    }
    select.value = lang;
    select.addEventListener("change", () => {
      lang = select.value;
      try { localStorage.setItem("lang", lang); } catch (_) {}
      apply();
    });
  }

  window.REFRESH_STATS = async () => {
    const data = await fetchStats(true);
    apply();
    return data;
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupNav();
    apply();
    fetch(`${document.body.dataset.root || ""}catalog.json`, { cache: "no-cache" })
      .then(response => response.json())
      .then(data => { catalog = data; renderApps(); })
      .catch(() => {});
    fetchStats().then(stats => {
      if (stats) {
        apply();
      }
    });
  });
})();
