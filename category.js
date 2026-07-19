/* =============================================
   category.js - 공용 카테고리 리스팅 스크립트
   각 페이지에서 window.CAT_CONFIG 설정 후 로드
   ============================================= */
(async function () {
  const cfg = window.CAT_CONFIG || {};
  const { country, jsonUrl, recommendEnabled = false } = cfg;
  if (!jsonUrl) return;

  let allPosts = [];
  try {
    const r = await fetch(jsonUrl, { cache: 'no-store' });
    allPosts = r.ok ? await r.json() : [];
  } catch {
    allPosts = [];
  }

  let posts = country
    ? allPosts.filter(p => p.country === country)
    : allPosts;

  let query = '';
  let recommendOnly = false;
  let sortBy = 'date-desc';

  function renderPosts() {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    let list = [...posts];

    if (recommendEnabled && recommendOnly) {
      list = list.filter(p => p.recommend === true);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'date-desc') {
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } else if (sortBy === 'date-asc') {
      list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }

    grid.innerHTML = '';

    if (list.length === 0) {
      grid.innerHTML = '<p class="cat-empty">게시물이 없습니다</p>';
      return;
    }

    list.forEach(item => {
      const card = document.createElement('a');
      card.className = 'cat-card';
      card.href = item.url || '#';

      const dateStr = (item.date || '').replace(/-/g, '.');
      const badge = recommendEnabled && item.recommend === true
        ? '<span class="recommend-badge">👍 추천</span>'
        : '';

      card.innerHTML = `
        <div class="cat-card-thumb-wrap">
          <img class="cat-card-thumb"
               src="${item.thumb || ''}"
               alt="${item.title || ''}"
               loading="lazy"
               onerror="this.style.opacity='0'">
          ${badge}
        </div>
        <div class="cat-card-body">
          <p class="cat-card-title">${item.title || ''}</p>
          <p class="cat-card-date">${dateStr}</p>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  document.querySelectorAll('.recommend-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.recommend-filter-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      recommendOnly = btn.dataset.recommend === 'true';
      renderPosts();
    });
  });

  const searchInput = document.getElementById('searchInput');
  let debounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      query = searchInput.value.trim();
      renderPosts();
    }, 220);
  });

  const sortSelect = document.getElementById('sortSelect');
  sortSelect?.addEventListener('change', () => {
    sortBy = sortSelect.value;
    renderPosts();
  });

  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  renderPosts();

  const countEl = document.getElementById('postCount');
  if (countEl) countEl.textContent = `${posts.length}개`;

  const heroImg = document.getElementById('catHeroImg');
  if (heroImg && !heroImg.getAttribute('src')) {
    const first = posts[0];
    if (first?.thumb) heroImg.src = first.thumb;
  }
})();
