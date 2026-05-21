/* =============================================
   category.js — 공용 카테고리 리스팅 스크립트
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

  /* ── 데이터 로드 ─────────────────────────── */
  let allPosts = [];
  try {
    const r = await fetch(jsonUrl, { cache: 'no-store' });
    allPosts = r.ok ? await r.json() : [];
  } catch { allPosts = []; }

  // 국가 필터
  let posts = country
    ? allPosts.filter(p => p.country === country)
    : allPosts;

  /* ── 상태 ───────────────────────────────── */
  let query     = '';
  let minRating = 0;
  let sortBy    = 'date-desc';

  /* ── 렌더 ───────────────────────────────── */
  function renderPosts() {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    let list = [...posts];

    // 별점 필터
    if (minRating > 0) list = list.filter(p => (p.rating || 0) >= minRating);

    // 검색어 필터
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        (p.title   || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      );
    }

    // 정렬
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
      const dateStr   = (item.date || '').replace(/-/g, '.');

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

  /* ── 별점 필터 버튼 ──────────────────────── */
  document.querySelectorAll('.sf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sf-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      minRating = parseInt(btn.dataset.min || 0);
      renderPosts();
    });
  });

  /* ── 검색창 ─────────────────────────────── */
  const searchInput = document.getElementById('searchInput');
  let debounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      query = searchInput.value.trim();
      renderPosts();
    }, 220);
  });

  /* ── 정렬 셀렉트 ────────────────────────── */
  const sortSelect = document.getElementById('sortSelect');
  sortSelect?.addEventListener('change', () => {
    sortBy = sortSelect.value;
    renderPosts();
  });

  /* ── 초기 렌더 ──────────────────────────── */
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  renderPosts();

  /* ── 총 개수 표시 ───────────────────────── */
  const countEl = document.getElementById('postCount');
  if (countEl) countEl.textContent = `${posts.length}개`;

  /* ── 히어로 이미지 (src가 비어있으면 첫 포스트 썸네일로 채움) ── */
  const heroImg = document.getElementById('catHeroImg');
  if (heroImg && !heroImg.getAttribute('src')) {
    const first = posts[0];
    if (first?.thumb) heroImg.src = first.thumb;
  }
})();
