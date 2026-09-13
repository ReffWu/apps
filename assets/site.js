(() => {
  const LANGS = { "en": "English", "zh-Hans": "简体中文", "zh-Hant": "繁體中文", "ja": "日本語", "ko": "한국어" };
  const COMMON = {
    "download": { "en": "Download for Mac", "zh-Hans": "下载 Mac 版", "zh-Hant": "下載 Mac 版", "ja": "Mac 版をダウンロード", "ko": "Mac용 다운로드" },
    "fine": { "en": "Free · macOS 14 or later · Signed and notarized by Apple", "zh-Hans": "免费 · macOS 14 或更新版本 · 经 Apple 签名与公证", "zh-Hant": "免費 · macOS 14 或更新版本 · 經 Apple 簽署與公證", "ja": "無料 · macOS 14 以降 · Apple による署名と公証済み", "ko": "무료 · macOS 14 이상 · Apple 서명 및 공증 완료" },
    "more": { "en": "More from Reff Wu", "zh-Hans": "更多 Reff Wu 的 App", "zh-Hant": "更多 Reff Wu 的 App", "ja": "Reff Wu のほかの App", "ko": "Reff Wu의 다른 앱" },
    "source": { "en": "Source on GitHub", "zh-Hans": "GitHub 上的源代码", "zh-Hant": "GitHub 上的原始碼", "ja": "GitHub のソースコード", "ko": "GitHub 소스 코드" },
    "home.title": { "en": "Mac apps by Reff Wu", "zh-Hans": "Reff Wu 的 Mac App", "zh-Hant": "Reff Wu 的 Mac App", "ja": "Reff Wu の Mac App", "ko": "Reff Wu의 Mac 앱" },
    "home.sub": { "en": "Small, careful tools. Free, open source and notarized.", "zh-Hans": "小而用心的工具。免费、开源，经过 Apple 公证。", "zh-Hant": "小而用心的工具。免費、開源，經過 Apple 公證。", "ja": "小さく、丁寧な道具。無料・オープンソース・公証済み。", "ko": "작고 세심한 도구. 무료, 오픈 소스, 공증 완료." }
  };

  function pick() {
    try {
      const saved = localStorage.getItem("lang");
      if (saved && LANGS[saved]) return saved;
    } catch (_) {}
    for (const raw of navigator.languages || [navigator.language || "en"]) {
      const tag = raw.toLowerCase();
      if (tag.startsWith("zh")) return /tw|hk|mo|hant/.test(tag) ? "zh-Hant" : "zh-Hans";
      if (tag.startsWith("ja")) return "ja";
      if (tag.startsWith("ko")) return "ko";
      if (tag.startsWith("en")) return "en";
    }
    return "en";
  }

  const strings = Object.assign({}, COMMON, window.PAGE_STRINGS || {});
  let lang = pick();

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const entry = strings[el.dataset.i18n];
      if (entry) el.textContent = entry[lang] || entry.en;
    });
    document.querySelectorAll("[data-hero]").forEach(img => {
      img.src = `${img.dataset.hero}-${lang}.webp`;
    });
    if (strings["page.title"]) document.title = strings["page.title"][lang] || strings["page.title"].en;
    renderApps();
  }

  let catalog = null;
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
      text.append(name, line); card.append(icon, text); grid.append(card);
    }
    const section = grid.closest("[data-more]");
    if (section) section.hidden = apps.length === 0;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const select = document.querySelector(".lang");
    if (select) {
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
    apply();
    fetch(`${document.body.dataset.root || ""}catalog.json`, { cache: "no-cache" })
      .then(response => response.json())
      .then(data => { catalog = data; renderApps(); })
      .catch(() => {});
  });
})();
