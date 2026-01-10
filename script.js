// script.js

// ===== 1) 카테고리 소스 정의 =====
const CATEGORIES = [
  { key: 'travel', label: '여행', json: 'travel/index.json' },
  { key: 'food',   label: '맛집', json: 'food/index.json'   },
  { key: 'stay',   label: '숙소', json: 'stay/index.json'   },
  { key: 'other',  label: '기타', json: 'other/index.json'  },
];

// ===== 2) JSON 스키마 안내 =====
/*
각 카테고리 폴더의 index.json 예시:

[
  {
    "title": "오사카 스시야 투어",
    "excerpt": "현지인들이 가는 스시집 Top3를 돌아본 코스입니다.",
    "thumb": "/food/images/osaka-sushi.jpg",
    "url": "/food/osaka-sushi.html",
    "date": "2025-09-01"
  }
]
※ 영상 카드는 thumb = 영상 썸네일, url = 영상 상세/외부 플랫폼.
*/

// ===== 3) 유틸 =====
const qs  = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => el.querySelectorAll(s);

// 페이지 점(도트) 렌더
function renderPager(container, total, activeIdx=0){
  if (!container) return;
  container.innerHTML = '';
  for(let i=0; i<total; i++){
    const d = document.createElement('span');
    d.className = 'dot' + (i===activeIdx ? ' is-active':'');
    container.appendChild(d);
  }
}

// 스크롤 위치에 따라 pager 활성화 업데이트 (카드 너비 ≈ 1페이지 가정)
function attachPager(scroller, pager){
  if(!scroller || !pager) return;
  const dots = () => [...pager.children];

  const sync = () => {
    const first = scroller.firstElementChild;
    if (!first) return;
    const style = getComputedStyle(scroller);
    const gap = parseFloat(style.columnGap || style.gap || 12) || 12;
    const cardWidth = first.getBoundingClientRect().width || 1;
    const idx = Math.round(scroller.scrollLeft / (cardWidth + gap));
    dots().forEach((d,i)=> d.classList.toggle('is-active', i===idx));
  };

  // 초기 동기화
  requestAnimationFrame(sync);

  scroller.addEventListener('scroll', () => {
    window.requestAnimationFrame(sync);
  }, { passive:true });
}

// (옵션) 별 문자열 생성 헬퍼 (정수 1~5) — 나중에 배지 쓸 때 사용
function renderStars(n=0){
  const v = Math.max(0, Math.min(5, parseInt(n,10) || 0));
  let html = '';
  for(let i=1; i<=5; i++){
    html += `<span class="star ${i<=v ? 'filled' : 'empty'}">★</span>`;
  }
  return html;
}

// 카드 DOM 생성 (★ 수정본)
function createCard(item, catLabel){
  const a = document.createElement('a');
  a.href = item.url || '#';
  a.className = 'card';

  // 별점 (index.json에 rating: 1~5 넣어두면 표시됨)
  const ratingNum = Math.max(0, Math.min(5, Number(item.rating || 0)));
  const badge = ratingNum > 0
    ? `<span class="star-badge" aria-label="별점 ${ratingNum}점">
         ${renderStars(ratingNum)}
         <span class="score">${ratingNum}</span>
       </span>`
    : '';

  a.innerHTML = `
    ${badge}
    <img class="card-img" src="${item.thumb || ''}" alt="${item.title || ''}" loading="lazy">
    <div class="card-body">
      <span class="card-cat"># ${catLabel}</span>
      <h3 class="card-title">${item.title || ''}</h3>
      <p class="card-excerpt">${item.excerpt || ''}</p>
    </div>
  `;
  return a;
}

// ===== 4) 데이터 로드 & 렌더 =====
async function loadCategory(cat){
  try{
    const res = await fetch(cat.json, { cache: 'no-store' });
    if(!res.ok) throw new Error('load fail: ' + cat.json);
    /** @type {Array} */
    const list = await res.json();
    // 최신순 정렬 (date DESC)
    list.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    return list;
  }catch(e){
    console.warn('[loadCategory]', e);
    return [];
  }
}

// 데스크탑/마우스 환경 개선: 휠 가로 스크롤 + 드래그 스크롤
function enhanceDesktopScrollers(root = document){
  const scrollers = root.querySelectorAll('.row.scroller');

  // 1) 마우스 휠 세로 → 가로로 매핑 (단, 끝에 닿으면 세로 스크롤 허용)
  scrollers.forEach(scroller => {
    scroller.addEventListener('wheel', (e) => {
      if (e.shiftKey) return; // Shift는 기본 가로 스크롤 허용

      const canScrollX = scroller.scrollWidth > scroller.clientWidth + 1;
      if (!canScrollX) return; // 가로 스크롤 여지가 없으면 건드리지 않음

      // 세로 입력이 강할 때만 가로로 전환
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const atLeft  = scroller.scrollLeft <= 0;
        const atRight = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;

        // 휠 방향
        const goingRight = e.deltaY > 0;
        const goingLeft  = e.deltaY < 0;

        // 끝에 닿았고 더 진행하려는 방향이면 -> 페이지 세로 스크롤을 막지 않음
        if ((atRight && goingRight) || (atLeft && goingLeft)) {
          return;
        }

        scroller.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  });

  // 2) 드래그로 가로 스크롤 (클릭과 드래그를 임계값으로 구분)
  scrollers.forEach(scroller => {
    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    const THRESHOLD = 6; // px

    scroller.addEventListener('pointerdown', (e) => {
      // 좌클릭만
      if (e.button !== 0) return;

      isDown = true;
      moved = false;
      startX = e.clientX;
      startLeft = scroller.scrollLeft;

      // pointer capture는 유지하되, 클릭/드래그 구분을 threshold로 처리
      scroller.setPointerCapture(e.pointerId);
    });

    scroller.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;

      if (Math.abs(dx) > THRESHOLD) moved = true;
      if (!moved) return;

      scroller.scrollLeft = startLeft - dx;
      // 드래그 중에는 텍스트 선택/클릭 방지
      e.preventDefault();
    }, { passive: false });

    scroller.addEventListener('pointerup', (e) => {
      isDown = false;
      try { scroller.releasePointerCapture(e.pointerId); } catch(_) {}
    });

    scroller.addEventListener('pointercancel', (e) => {
      isDown = false;
      try { scroller.releasePointerCapture(e.pointerId); } catch(_) {}
    });

    // 드래그로 판단된 경우에만 링크 클릭 막기 (PC에서 "클릭 안 됨" 방지용)
    scroller.addEventListener('click', (e) => {
      if (!moved) return;
      const a = e.target.closest('a');
      if (a) {
        e.preventDefault();
        e.stopPropagation();
      }
      moved = false;
    }, true);
  });
}

async function render(){
  // 각 카테고리 로드
  const map = {};
  for(const cat of CATEGORIES){
    map[cat.key] = await loadCategory(cat);
  }

  // 히어로: 카테고리 섞어서 상위 몇개 (최신 10개)
  {
    const heroEl = qs('[data-row="hero"]');
    const heroPager = qs('[data-pager="hero"]');
    if (heroEl) {
      const merged = [...(map.travel||[]), ...(map.food||[]), ...(map.stay||[]), ...(map.other||[])]
        .sort((a,b)=> (b.date||'').localeCompare(a.date||''))
        .slice(0, 10); // ★ 10개

      merged.forEach(item=>{
        // 어떤 카테고리인지 라벨 찾기 (url 경로로 추정)
        const cat = CATEGORIES.find(c => (item.url||'').startsWith('/'+c.key)) || CATEGORIES[0];
        heroEl.appendChild(createCard(item, cat.label));
      });
      renderPager(heroPager, merged.length, 0);
      attachPager(heroEl, heroPager);
    }
  }

  // 카테고리별 행 (각 10개)
  for(const cat of CATEGORIES){
    const row   = qs(`[data-row="${cat.key}"]`);
    const pager = qs(`[data-pager="${cat.key}"]`);
    if (!row) continue;
    const list = (map[cat.key] || []).slice(0, 10); // ★ 각 섹션 최대 10개
    list.forEach(item => row.appendChild(createCard(item, cat.label)));
    renderPager(pager, list.length, 0);
    attachPager(row, pager);
  }

  // PC 가로 스크롤 UX 개선(휠/드래그) 활성화
  enhanceDesktopScrollers(document);
}

document.addEventListener('DOMContentLoaded', render);
