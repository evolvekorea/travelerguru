/* =============================================
   category.js - 공용 카테고리 리스팅 스크립트
   각 페이지에서 window.CAT_CONFIG 설정 후 로드
   =============================================
   CAT_CONFIG 예시:
   {
     country:  'bali',          // 필터할 국가 키
     jsonUrl:  '../../food/index.json',  // JSON 경로
     catLabel: '맛집',          // 카테고리 한글명
     hasStar:  true             // 별점 필터 표시 여부
   }
   ============================================= */
(async function () {
  const cfg = window.CAT_CONFIG || {};
  const { country, jsonUrl, catLabel, hasStar = true } = cfg;
  if (!jsonUrl) return;

  /* 데이터 로드 */
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
  let minRating = 0;
  let sortBy = 'date-desc';

  function renderPosts() {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    let list = [...posts];

    if (minRating > 0) {
      list = list.filter(p => (p.rating || 0) >= minRating);
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
    } else if (sortBy === 'rating-desc') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'rating-asc') {
      list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
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

      const starsHtml = buildStars(item.rating);
      const dateStr = (item.date || '').replace(/-/g, '.');

      card.innerHTML = `
        <div class="cat-card-thumb-wrap">
          <img class="cat-card-thumb"
               src="${item.thumb || ''}"
               alt="${item.title || ''}"
               loading="lazy"
               onerror="this.style.opacity='0'">
          ${starsHtml ? `<span class="cat-card-rating">${starsHtml}</span>` : ''}
        </div>
        <div class="cat-card-body">
          <p class="cat-card-title">${item.title || ''}</p>
          <p class="cat-card-date">${dateStr}</p>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function buildStars(n) {
    const v = Math.min(5, Math.max(0, parseInt(n) || 0));
    if (!v) return '';
    let s = '';
    for (let i = 1; i <= 5; i++) {
      s += `<span class="${i <= v ? 'star-f' : 'star-e'}">★</span>`;
    }
    return s;
  }

  document.querySelectorAll('.sf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sf-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      minRating = parseInt(btn.dataset.min || 0);
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
