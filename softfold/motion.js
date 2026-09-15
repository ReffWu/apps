const video = document.querySelector('.shot video.motion');
const LANGS = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'fr', 'es', 'it', 'tr', 'pl', 'nl'];
const scheme = matchMedia('(prefers-color-scheme: dark)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let shown = '';
let visible = true;

function update() {
  const lang = LANGS.includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  const key = `${scheme.matches ? 'dark' : 'light'}-${lang}`;
  if (key === shown) return;
  shown = key;
  video.poster = `motion/poster-${key}.jpg`;
  if (reduced.matches) {
    video.removeAttribute('src');
    video.load();
    return;
  }
  video.src = `motion/softfold-${key}.mp4`;
  if (visible) video.play().catch(() => {});
}

new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
scheme.addEventListener('change', update);
reduced.addEventListener('change', () => { shown = ''; update(); });
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (!video.src) return;
  if (visible) video.play().catch(() => {});
  else video.pause();
}).observe(video);
update();
