
const fs = require('fs');
const path = require('path');

const root = __dirname;
const out = path.join(root, 'dist');
const base = process.env.SITE_BASE || '/mrhitesh-website/';
const url = p => base.replace(/\/$/, '/') + String(p).replace(/^\/+/, '');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function parse(src) {
  const match = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const data = {};

  if (match) {
    for (const line of match[1].split('\n')) {
      const m = line.match(/^([\w-]+):\s*(.*)$/);
      if (m) {
        let val = m[2].trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        data[m[1]] = val;
      }
    }
  }

  data.body = src.slice(match ? match[0].length : 0).trim();
  return data;
}

function md(s) {
  return String(s || '').split(/\n\s*\n/).map(block => {
    const lines = block.trim().split('\n');
    if (!block.trim()) return '';

    if (lines.every(l => l.startsWith('- '))) {
      return '<ul>' + lines.map(l =>
        '<li>' + esc(l.slice(2)) + '</li>'
      ).join('') + '</ul>';
    }

    const head = block.match(/^(#{1,3})\s+(.+)$/);
    if (head) {
      return `<h${head[1].length}>${esc(head[2])}</h${head[1].length}>`;
    }

    return '<p>' + lines.map(esc).join('<br>') + '</p>';
  }).join('\n');
}

const contentDir = path.join(root, 'content', 'posts');

const posts = fs.readdirSync(contentDir)
  .filter(f => f.endsWith('.md'))
  .map(f => ({
    ...parse(fs.readFileSync(path.join(contentDir, f), 'utf8')),
    slug: path.basename(f, '.md')
  }))
  .filter(p => p.published !== 'false')
  .sort((a, b) =>
    String(b.date || '').localeCompare(String(a.date || ''))
  );

const cats = ['બધું', 'સમાચાર', 'શાયરી', 'સુવિચાર', 'લેખ'];

const feedCats = ['શાયરી', 'સુવિચાર'];

const categoryUrl = c =>
  url('category/' + encodeURIComponent(c) + '/');

const placeholder = cat =>
  cat === 'શાયરી' ? '✒' :
  cat === 'સમાચાર' ? '◈' :
  cat === 'સુવિચાર' ? '❝' : '✦';

function asset(p) {
  return /^https?:\/\//i.test(p)
    ? p
    : url(String(p).replace(/^\/+/, ''));
}

function card(p) {
  const image = p.image
    ? `<img loading="lazy" src="${esc(asset(p.image))}" alt="${esc(p.title)}">`
    : `<div class="art-placeholder">
         <span>${placeholder(p.category)}</span>
         <small>MrHitesh.com</small>
       </div>`;

  return `
  <a class="story-card" href="${url('posts/' + encodeURIComponent(p.slug) + '/')}">
    <div class="story-img">${image}</div>
    <div class="story-body">
      <span class="pill">${esc(p.category || 'લેખ')}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description || 'વધુ વાંચવા માટે અહીં ક્લિક કરો.')}</p>
      <div class="story-foot">
        <span>${esc(p.date || '')}</span>
        <span>વાંચો <span aria-hidden="true">↗</span></span>
      </div>
    </div>
  </a>`;
}

// Full text feed for Shayari and Suvichar
function feedCard(p) {
  return `
  <article class="quote-feed-card">
    <div class="quote-feed-top">
      <span class="pill">${esc(p.category)}</span>
      <time>${esc(p.date || '')}</time>
    </div>

    <h2>${esc(p.title || '')}</h2>

    <div class="quote-feed-text">
      ${md(p.body)}
    </div>

    <div class="quote-feed-bottom">
      <span class="quote-sign">MrHitesh.com</span>
      <div class="quote-feed-actions">
        <button class="quote-copy" type="button">
          કૉપી કરો
        </button>
        <button class="quote-share" type="button"
          data-url="${esc(url('posts/' + encodeURIComponent(p.slug) + '/'))}"
          data-title="${esc(p.title || '')}">
          શેર કરો ↗
        </button>
      </div>
    </div>
  </article>`;
}

function layout(
  main,
  title = 'ગુજરાતી સમાચાર, શાયરી અને વિચારો',
  desc = 'ગુજરાતી સમાચાર, શાયરી, સુવિચાર અને રસપ્રદ લેખો'
) {
  return `<!doctype html>
<html lang="gu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#651d35">
<meta name="description" content="${esc(desc)}">
<title>${esc(title)} | MrHitesh.com</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${url('style.css')}">

<style>
.category-feed-page {
  padding-top: 42px;
  padding-bottom: 75px;
}

.category-feed-heading {
  max-width: 780px;
  margin: 0 auto 32px;
}

.category-feed-heading h1 {
  color: #651d35;
  font-size: clamp(28px, 5vw, 42px);
  margin: 18px 0 10px;
}

.category-feed-heading p {
  color: #78636b;
  line-height: 1.8;
}

.quote-feed-list {
  max-width: 780px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.quote-feed-card {
  background: #fffaf4;
  border: 1px solid #eaded8;
  border-radius: 18px;
  padding: 28px 24px;
  box-shadow: 0 5px 20px rgba(50,20,30,.045);
}

.quote-feed-top,
.quote-feed-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.quote-feed-top time {
  color: #88747a;
  font-size: 13px;
}

.quote-feed-card h2 {
  color: #651d35;
  font-size: 21px;
  line-height: 1.6;
  margin: 18px 0;
}

.quote-feed-text {
  color: #492737;
  font-size: 19px;
  line-height: 2;
  overflow-wrap: anywhere;
}

.quote-feed-text p {
  margin: 0 0 16px;
}

.quote-feed-text p:last-child {
  margin-bottom: 0;
}

.quote-feed-bottom {
  border-top: 1px solid #eaded8;
  padding-top: 18px;
  margin-top: 24px;
}

.quote-sign {
  font-size: 13px;
  font-weight: 700;
  color: #651d35;
}

.quote-feed-actions {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

.quote-feed-actions button {
  border: 1px solid #651d35;
  background: transparent;
  color: #651d35;
  padding: 9px 14px;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.quote-feed-actions .quote-share {
  background: #651d35;
  color: white;
}

.category-empty {
  padding: 35px;
  text-align: center;
  background: #fffaf4;
  border-radius: 14px;
}

@media(max-width:600px) {
  .quote-feed-card {
    padding: 22px 17px;
  }
  .quote-feed-text {
    font-size: 18px;
  }
  .quote-feed-card h2 {
    font-size: 19px;
  }
}
</style>
</head>
<body>

<div class="topline">
  <div class="container topline-inner">
    <span>ગુજરાતની વાત, ગુજરાતી અંદાજમાં</span>
    <span>સ્વતંત્ર ગુજરાતી ડિજિટલ પ્લેટફોર્મ</span>
  </div>
</div>

<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="${base}" aria-label="MrHitesh homepage">
      <span class="brand-symbol">M<span>.</span></span>
      <span class="brand-text">
        <strong>MrHitesh<span>.com</span></strong>
        <small>શબ્દો જે દિલ સુધી પહોંચે</small>
      </span>
    </a>

    <button class="menu-toggle"
      aria-label="મેનુ ખોલો"
      aria-expanded="false">☰</button>

    <nav id="nav">
      <a href="${base}">હોમ</a>
      ${cats.slice(1).map(c =>
        `<a href="${categoryUrl(c)}">${c}</a>`
      ).join('')}
      <a href="${url('about/')}">અમારા વિશે</a>
    </nav>

    <a class="header-social"
       href="https://www.instagram.com/mrhitesh.in/"
       target="_blank" rel="noopener">
       Instagram ↗
    </a>
  </div>
</header>

${main}

<footer class="footer">
  <div class="container footer-grid">
    <div>
      <h2>MrHitesh<span>.com</span></h2>
      <p>ગુજરાતી સમાચાર, લાગણીસભર શબ્દો અને જીવનને સ્પર્શતા વિચારો માટે તમારું પોતાનું ડિજિટલ સ્થળ.</p>
    </div>
    <div>
      <strong>ઝડપી લિંક્સ</strong>
      <a href="${base}">હોમ</a>
      <a href="${url('about/')}">અમારા વિશે</a>
      <a href="https://www.instagram.com/mrhitesh.in/"
         target="_blank" rel="noopener">Instagram</a>
    </div>
  </div>

  <div class="container copyright">
    © ${new Date().getFullYear()} MrHitesh.com · All rights reserved · Independent publication
  </div>
</footer>

<script src="${url('site.js')}" defer></script>

<script>
document.addEventListener('click', async function(e) {
  const copy = e.target.closest('.quote-copy');

  if (copy) {
    const card = copy.closest('.quote-feed-card');
    const title = card.querySelector('h2').innerText;
    const body = card.querySelector('.quote-feed-text').innerText;
    const content = title + '\\n\\n' + body;

    try {
      await navigator.clipboard.writeText(content);
      copy.textContent = 'કૉપી થઈ ગયું ✓';
      setTimeout(() => {
        copy.textContent = 'કૉપી કરો';
      }, 1800);
    } catch (err) {
      alert('કૉપી થઈ શક્યું નથી.');
    }
    return;
  }

  const share = e.target.closest('.quote-share');

  if (share) {
    const link = new URL(share.dataset.url, location.origin).href;
    const title = share.dataset.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: link });
      } catch (err) {
        if (err.name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(link);
            alert('લિંક કૉપી થઈ ગઈ.');
          } catch (copyErr) {
            prompt('લિંક કૉપી કરો:', link);
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(link);
        alert('લિંક કૉપી થઈ ગઈ.');
      } catch (err) {
        prompt('લિંક કૉપી કરો:', link);
      }
    }
  }
});
</script>

</body>
</html>`;
}

const hero = `
<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">
        <span class="eyedot"></span>
        WELCOME TO MRHITESH.COM
      </span>

      <h1>ગુજરાતીની વાત,<br><em>દિલથી દિલ સુધી.</em></h1>

      <p>સમાચાર હોય કે લાગણીના શબ્દો, અહીં દરેક વાત તમારી પોતાની ભાષામાં — સરળ, સુંદર અને સાચી.</p>

      <div class="hero-actions">
        <a class="btn btn-primary" href="#latest">
          નવું વાંચો <span>↗</span>
        </a>
        <a class="btn btn-outline"
           href="https://www.instagram.com/mrhitesh.in/"
           target="_blank" rel="noopener">
          Instagram પર જોડાઓ
        </a>
      </div>

      <div class="hero-stat">
        <span>✦</span> ગુજરાતી સમાચાર
        <b>·</b> શાયરી <b>·</b> વિચાર
      </div>
    </div>

    <div class="hero-visual">
      <div class="hero-orbit">✦</div>
      <div class="hero-frame">
        <span class="hero-kicker">MRHITESH ORIGINALS</span>
        <span class="hero-quote">
          શબ્દો નાના હોય છે,<br>
          પણ એની અસર<br>
          <i>દિલ સુધી જાય છે.</i>
        </span>
        <span class="hero-sign">— MrHitesh.com</span>
      </div>
      <div class="hero-seal">
        ગુજરાતી<br><strong>અંદાજ</strong>
      </div>
    </div>
  </div>
</section>`;

const main = `${hero}

<section class="category-strip">
  <div class="container">
    <span>શોધો તમારી પસંદ</span>
    <div class="category-list">
      ${cats.slice(1).map((c, i) =>
        `<a href="${categoryUrl(c)}">
          <span>${['◈','✒','❝','▤'][i]}</span>
          ${c} <b>↗</b>
        </a>`
      ).join('')}
    </div>
  </div>
</section>

<main class="container main-content" id="latest">
  <div class="section-head">
    <div>
      <span class="section-kicker">LATEST STORIES</span>
      <h2>નવીનતમ <em>વાંચન</em></h2>
      <p>તમારા માટે પસંદ કરેલી નવી વાતો અને વિચારો.</p>
    </div>

    <div class="filter-box">
      <label for="categoryFilter">વિભાગ</label>
      <select id="categoryFilter">
        ${cats.map(c =>
          `<option value="${esc(c)}">${esc(c)}</option>`
        ).join('')}
      </select>
    </div>
  </div>

  <div class="story-grid" id="storyGrid">
    ${posts.map(card).join('')}
  </div>

  <div class="empty-state" id="emptyState" hidden>
    આ વિભાગમાં હજી કોઈ લેખ નથી.
  </div>
</main>

<section class="newsletter">
  <div class="container newsletter-inner">
    <div>
      <span>FOLLOW THE STORIES</span>
      <h2>વાતો અહીંથી શરૂ થાય છે,<br>અને જોડાણ Instagram પર.</h2>
    </div>
    <a class="btn btn-light"
       href="https://www.instagram.com/mrhitesh.in/"
       target="_blank" rel="noopener">
       @MrHitesh.in ↗
    </a>
  </div>
</section>`;

fs.writeFileSync(
  path.join(out, 'index.html'),
  layout(main)
);

// Individual article pages remain available
for (const p of posts) {
  const dir = path.join(out, 'posts', p.slug);
  fs.mkdirSync(dir, { recursive: true });

  const cover = p.image
    ? `<img class="article-cover"
         src="${esc(asset(p.image))}"
         alt="${esc(p.title)}">`
    : '';

  const article = `
  <main class="container article-wrap">
    <a class="backlink" href="${base}">
      ← હોમ પર પાછા જાઓ
    </a>

    <article class="article">
      <div class="article-header">
        <span class="pill">${esc(p.category || 'લેખ')}</span>
        <h1>${esc(p.title)}</h1>
        <p class="article-description">
          ${esc(p.description || '')}
        </p>

        <div class="article-meta">
          <span>MrHitesh Editorial</span>
          <span>•</span>
          <time>${esc(p.date || '')}</time>
        </div>
      </div>

      ${cover}

      <div class="article-content">
        ${md(p.body)}
      </div>

      <div class="share">
        <span>આ લેખ ગમ્યો?</span>
        <button id="shareButton"
          data-title="${esc(p.title)}">
          શેર કરો ↗
        </button>
      </div>
    </article>

    <div class="return">
      <a href="${categoryUrl(p.category && cats.includes(p.category) ? p.category : 'લેખ')}">
        ← બીજા લેખો વાંચો
      </a>
    </div>
  </main>`;

  fs.writeFileSync(
    path.join(dir, 'index.html'),
    layout(article, p.title, p.description)
  );
}

// Category pages
for (const category of cats.slice(1)) {
  const categoryPosts = posts.filter(p =>
    p.category === category
  );

  const isFeed = feedCats.includes(category);

  const contentItems = categoryPosts.map(p =>
    isFeed ? feedCard(p) : card(p)
  ).join('');

  const categoryContent = `
  <main class="container category-feed-page">

    <div class="category-feed-heading">
      <a class="backlink" href="${base}">
        ← હોમ પર પાછા જાઓ
      </a>

      <h1>${esc(category)}</h1>

      <p>
        ${isFeed
          ? `બધા ${esc(category)} એક જ જગ્યાએ વાંચો.`
          : `નવા ${esc(category)} અને રસપ્રદ વાંચન.`}
      </p>
    </div>

    <div class="${isFeed ? 'quote-feed-list' : 'story-grid'}">
      ${contentItems || `
        <div class="category-empty">
          આ વિભાગમાં હજી કોઈ પોસ્ટ નથી.
        </div>
      `}
    </div>

  </main>`;

  const dir = path.join(out, 'category', category);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'index.html'),
    layout(
      categoryContent,
      category,
      `${category} - ગુજરાતી વાંચન MrHitesh.com`
    )
  );
}

// About page
fs.mkdirSync(
  path.join(out, 'about'),
  { recursive: true }
);

fs.writeFileSync(
  path.join(out, 'about', 'index.html'),
  layout(`
  <main class="container article-wrap">
    <article class="article about">
      <span class="section-kicker">ABOUT MRHITESH</span>
      <h1>અમારા વિશે</h1>

      <p>MrHitesh.com એક સ્વતંત્ર ગુજરાતી ડિજિટલ પ્લેટફોર્મ છે. અહીં ગુજરાતી સમાચાર, શાયરી, સુવિચાર અને જીવનને સ્પર્શતા લેખો પ્રકાશિત થાય છે.</p>

      <p>અમારી Instagram ઓળખ:
        <a href="https://www.instagram.com/mrhitesh.in/">
          @MrHitesh.in
        </a>
      </p>

      <p>વેબસાઇટ પરના સમાચાર અને માહિતી પ્રકાશિત કરતાં પહેલાં વિશ્વસનીય સ્ત્રોતથી ચકાસવાની અમારી પ્રતિબદ્ધતા છે.</p>
    </article>
  </main>`, 'અમારા વિશે')
);

// Existing CSS and JS
for (const name of ['style.css', 'site.js']) {
  fs.copyFileSync(
    path.join(root, 'assets', name),
    path.join(out, name)
  );
}

// Existing media
if (fs.existsSync(path.join(root, 'media'))) {
  fs.cpSync(
    path.join(root, 'media'),
    path.join(out, 'media'),
    { recursive: true }
  );
}

fs.writeFileSync(
  path.join(out, 'robots.txt'),
  'User-agent: *\nAllow: /\n'
);

console.log(
  'Built ' + posts.length + ' posts to dist/'
);
console.log('Category feed pages generated successfully.');
