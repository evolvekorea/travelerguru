/* =============================================
   travelerguru — script.js (homepage)
   ============================================= */

const COUNTRIES = [
  { key: 'korea', name: '대한민국', flag: '🇰🇷', url: 'korea/' },
  { key: 'bali',  name: '발리',    flag: '🌴',  url: 'bali/'  },
];

const GUIDE_ICONS = {
  '에어포트': '🚗', '항공': '✈️', 'KE': '✈️',
  '비즈니스': '✈️', '여행': '🧳', '호텔': '🏨', '리조트': '🏝️',
};

function getGuideIcon(title) {
  for (const [kw, ico] of Object.entries(GUIDE_ICONS)) {
    if (title.includes(kw)) return ico;
  }
  return '📋';
}

function formatDate(d) {
  if (!d) return '';
  return d.replace(/-/g, '.');
}

async function fetchJSON(url) {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

// ── Hero (여행기록 only) ──────────────────────
function initHero(travelPosts) {
  const track  = document.getElementById('heroTrack');
  const dotsEl = document.getElementById('heroDots');
  if (!track) return;

  const items = travelPosts
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 8);

  if (items.length === 0) {
    track.closest('.hero-section').style.display = 'none';
    return;
  }

  let current = 0;
  let timer   = null;

  items.forEach((item, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide';

    const inner = document.createElement('a');
    inner.className = 'hero-slide-inner';
    inner.href = item.url || '#';
    inner.innerHTML = `
      <img class="hero-slide-img"
           src="${item.thumb || ''}" alt="${item.title || ''}"
           loading="${i === 0 ? 'eager' : 'lazy'}"
           onerror="this.style.opacity='0'">
      <div class="hero-slide-gradient"></div>
      <div class="hero-slide-body">
        <span class="hero-slide-cat">여행기록 · ${formatDate(item.date)}</span>
        <h3 class="hero-slide-title">${item.title || ''}</h3>
        <p class="hero-slide-excerpt">${item.excerpt || ''}</p>
      </div>
    `;
    slide.appendChild(inner);
    track.appendChild(slide);

    if (items.length > 1) {
      const dot = document.createElement('span');
      dot.className = 'hero-dot' + (i === 0 ? ' is-active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }
  });

  function goTo(idx) {
    current = ((idx % items.length) + items.length) % items.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    [...dotsEl.children].forEach((d, i) =>
      d.classList.toggle('is-active', i === current));
  }

  function startAuto() {
    if (items.length <= 1) return;
    stopAuto();
    timer = setInterval(() => goTo(current + 1), 5500);
  }
  function stopAuto() { if (timer) clearInterval(timer); }

  startAuto();
  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);

  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; stopAuto(); }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = sx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
    startAuto();
  }, { passive: true });
}

// ── Country Grid ─────────────────────────────
function initCountries(allPosts) {
  const grid = document.getElementById('countryGrid');
  if (!grid) return;

  COUNTRIES.forEach(c => {
    const posts = allPosts
      .filter(p => p.country === c.key)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (posts.length === 0) return;

    const thumb = posts[0]?.thumb || '';
    const card  = document.createElement('a');
    card.className = 'country-card';
    card.href = c.url;
    card.innerHTML = `
      <img class="country-card-img" src="${thumb}" alt="${c.name}"
           loading="lazy" onerror="this.style.opacity='0'">
      <div class="country-card-overlay"></div>
      <div class="country-card-body">
        <span class="country-card-name">${c.name}</span>
        <span class="country-card-count">지금까지 ${posts.length}개</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ── Guide Section (image-focused) ────────────
function initGuide(otherPosts) {
  const gridEl = document.getElementById('guideGrid');
  if (!gridEl) return;

  const items = otherPosts
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 4);

  items.forEach(item => {
    const icon = getGuideIcon(item.title || '');
    const card = document.createElement('a');
    card.className = 'guide-card';
    card.href = item.url || '#';

    if (item.thumb) {
      card.innerHTML = `
        <img class="guide-card-img" src="${item.thumb}" alt="${item.title || ''}"
             loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
        <div class="guide-card-fallback-icon" style="display:none">${icon}</div>
        <div class="guide-card-overlay"></div>
        <div class="guide-card-body">
          <p class="guide-card-title">${item.title || ''}</p>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="guide-card-fallback-icon">${icon}</div>
        <div class="guide-card-overlay"></div>
        <div class="guide-card-body">
          <p class="guide-card-title">${item.title || ''}</p>
        </div>
      `;
    }
    gridEl.appendChild(card);
  });
}

// ── Search ────────────────────────────────────
function initSearch(allPosts) {
  const overlay    = document.getElementById('searchOverlay');
  const searchBtn  = document.getElementById('searchBtn');
  const searchBack = document.getElementById('searchBack');
  const input      = document.getElementById('searchInput');
  const results    = document.getElementById('searchResults');
  if (!overlay || !searchBtn) return;

  const open  = () => {
    overlay.classList.add('is-open');
    overlay.removeAttribute('aria-hidden');
    setTimeout(() => input?.focus(), 60);
  };
  const close = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (input)   input.value = '';
    if (results) results.innerHTML = '<p class="search-empty">검색어를 입력하세요</p>';
  };

  searchBtn.addEventListener('click', open);
  searchBack?.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  let debounce;
  input?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = '<p class="search-empty">검색어를 입력하세요</p>'; return; }
      const hits = allPosts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      ).slice(0, 20);
      if (!hits.length) { results.innerHTML = `<p class="search-no-result">'${input.value}' 검색 결과가 없습니다</p>`; return; }
      results.innerHTML = '';
      hits.forEach(item => {
        const a = document.createElement('a');
        a.className = 'search-item';
        a.href = item.url || '#';
        a.innerHTML = `
          <img class="search-item-thumb" src="${item.thumb || ''}" alt=""
               loading="lazy" onerror="this.style.opacity='0'">
          <div class="search-item-body">
            <p class="search-item-title">${item.title || ''}</p>
            <p class="search-item-meta">${item._catLabel || ''} · ${formatDate(item.date)}</p>
          </div>
        `;
        results.appendChild(a);
      });
    }, 220);
  });
}

// ── Drawer ────────────────────────────────────
function initDrawer() {
  const menuBtn  = document.getElementById('menuBtn');
  const drawer   = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const closeBtn = document.getElementById('drawerClose');
  if (!menuBtn || !drawer) return;

  const open  = () => { drawer.classList.add('is-open'); backdrop.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
  const close = () => { drawer.classList.remove('is-open'); backdrop.classList.remove('is-open'); document.body.style.overflow = ''; };

  menuBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
}

// ── Subscribe ─────────────────────────────────
function initSubscribe() {
  const form    = document.getElementById('subscribeForm');
  const success = document.getElementById('subscribeSuccess');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.hidden = true;
    if (success) success.hidden = false;
  });
}

// ── Main ──────────────────────────────────────
async function main() {
  const [
    baliFoodPosts, baliTravelPosts, baliStayPosts,
    korFoodPosts, otherPosts,
  ] = await Promise.all([
    fetchJSON('bali/food/index.json'),
    fetchJSON('bali/travel/index.json'),
    fetchJSON('bali/stay/index.json'),
    fetchJSON('korea/food/index.json'),
    fetchJSON('other/index.json'),
  ]);

  const foodPosts   = [...baliFoodPosts,   ...korFoodPosts];
  const travelPosts = [...baliTravelPosts];
  const stayPosts   = [...baliStayPosts];

  foodPosts.forEach(p   => { p._catLabel = '맛집'; });
  travelPosts.forEach(p => { p._catLabel = '여행기록'; });
  stayPosts.forEach(p   => { p._catLabel = '숙소'; });
  otherPosts.forEach(p  => { p._catLabel = '가이드'; });

  const allPosts = [...foodPosts, ...travelPosts, ...stayPosts, ...otherPosts];

  initHero(travelPosts);
  initCountries(allPosts);
  initGuide(otherPosts);
  initSearch(allPosts);
  initDrawer();
  initSubscribe();
}

document.addEventListener('DOMContentLoaded', main);
