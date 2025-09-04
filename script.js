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
각 카테고리 폴더의 index.json 예시 (배포 시 폴더에 파일로 추가):

[
  {
    "title": "오사카 스시야 투어",
    "excerpt": "현지인들이 가는 스시집 Top3를 돌아본 코스입니다.",
    "thumb": "/food/images/osaka-sushi.jpg",     // ← 썸네일 이미지 경로 (절대/상대 가능)
    "url": "/food/osaka-sushi.html",             // ← 글(HTML) 경로
    "date": "2025-09-01"                         // ← 최신순 정렬용 (YYYY-MM-DD)
  }
]
※ 영상 카드는 thumb를 영상 썸네일로, url은 영상 상세/외부 플랫폼으로.
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

  // 초기 동기화 1회
  requestAnimationFrame(sync);

  scroller.addEventListener('scroll', () => {
    window.requestAnimationFrame(sync);
  }, { passive:true });
}

// (추가) 별 문자열 생성 헬퍼 (정수 1~5)
function renderStars(n=0){
  const v = Math.max(0, Math.min(5, parseInt(n,10) || 0));
  return '★'.repeat(v) + '☆'.repeat(5 - v);
}

// 카드 DOM 생성
function createCard(item, catLabel){
  const a = document.createElement('a');
  a.href = item.url || '#';
  a.className = 'card';
  a.innerHTML = `
    <!-- ↓↓↓ 썸네일 이미지 URL 넣는 곳 (index.json의 thumb 필드 사용) -->
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

  // 1) 마우스 휠 세로 → 가로로 매핑
  scrollers.forEach(scroller => {
    scroller.addEventListener('wheel', (e) => {
      // Shift 누르면 브라우저 기본 가로 스크롤 허용
      if (e.shiftKey) return;

      // 세로 입력이 강하면 가로로 변환
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scroller.scrollLeft += e.deltaY;
        e.preventDefault(); // 페이지 전체 세로 스크롤 방지
      }
    }, { passive: false });
  });

  // 2) 드래그로 가로 스크롤
  scrollers.forEach(scroller => {
    let isDown = false, startX = 0, startLeft = 0, pid = null;

    scroller.addEventListener('pointerdown', (e) => {
      isDown = true;
      pid = e.pointerId;
      scroller.setPointerCapture(pid);
      startX = e.clientX;
      startLeft = scroller.scrollLeft;
    });

    scroller.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      scroller.scrollLeft = startLeft - dx;
    });

    const release = () => { isDown = false; pid = null; };
    scroller.addEventListener('pointerup', release);
    scroller.addEventListener('pointercancel', release);
    scroller.addEventListener('mouseleave', release);
  });
}

async function render(){
  // 각 카테고리 로드
  const map = {};
  for(const cat of CATEGORIES){
    map[cat.key] = await loadCategory(cat);
  }

  // 히어로: 카테고리 섞어서 상위 몇개 (최신 5개)
  {
    const heroEl = qs('[data-row="hero"]');
    const heroPager = qs('[data-pager="hero"]');
    if (heroEl) {
      const merged = [...(map.travel||[]), ...(map.food||[]), ...(map.stay||[]), ...(map.other||[])]
        .sort((a,b)=> (b.date||'').localeCompare(a.date||''))
        .slice(0, 5);

      merged.forEach(item=>{
        // 어떤 카테고리인지 라벨 찾기 (url 경로로 추정)
        const cat = CATEGORIES.find(c => (item.url||'').startsWith('/'+c.key)) || CATEGORIES[0];
        heroEl.appendChild(createCard(item, cat.label));
      });
      renderPager(heroPager, merged.length, 0);
      attachPager(heroEl, heroPager);
    }
  }

  // 카테고리별 행
  for(const cat of CATEGORIES){
    const row   = qs(`[data-row="${cat.key}"]`);
    const pager = qs(`[data-pager="${cat.key}"]`);
    if (!row) continue;
    const list = (map[cat.key] || []).slice(0, 12); // 각 섹션 최대 12개
    list.forEach(item => row.appendChild(createCard(item, cat.label)));
    renderPager(pager, list.length, 0);
    attachPager(row, pager);
  }

  // PC 가로 스크롤 UX 개선(휠/드래그) 활성화
  enhanceDesktopScrollers(document);
}

document.addEventListener('DOMContentLoaded', render);
