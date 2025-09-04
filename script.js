// script.js

// ===== 1) 카테고리 소스 정의 
const CATEGORIES = [
  { key: 'travel', label: '여행', json: 'travel/index.json' },
  { key: 'food',   label: '맛집', json: 'food/index.json'   },
  { key: 'stay',  label: '숙소', json: 'stay/index.json'  },
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
  },
  ...
]

※ 이미지/영상:
- 영상 카드로 쓰려면 thumb 자리에 영상 썸네일을 넣고, url은 영상 상세(또는 외부 플랫폼)로 연결하면 됩니다.
*/

// ===== 3) 유틸 =====
const qs  = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => el.querySelectorAll(s);

// 페이지 점(도트) 렌더
function renderPager(container, total, activeIdx=0){
  container.innerHTML = '';
  for(let i=0; i<total; i++){
    const d = document.createElement('span');
    d.className = 'dot' + (i===activeIdx ? ' is-active':'');
    container.appendChild(d);
  }
}

// 스크롤 위치에 따라 pager 활성화 업데이트 (카드 너비 ≈ 1페이지 가정)
function attachPager(scroller, pager){
  if(!pager) return;
  const dots = () => [...pager.children];

  const sync = () => {
    const cardWidth = scroller.firstElementChild?.getBoundingClientRect().width || 1;
    const idx = Math.round(scroller.scrollLeft / (cardWidth + 12)); // 12 = gap 추정
    dots().forEach((d,i)=> d.classList.toggle('is-active', i===idx));
  };
  scroller.addEventListener('scroll', () => {
    window.requestAnimationFrame(sync);
  }, { passive:true });
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

async function render(){
  // 각 카테고리 로드
  const map = {};
  for(const cat of CATEGORIES){
    map[cat.key] = await loadCategory(cat);
  }

  // 히어로: 카테고리 섞어서 상위 몇개
  {
    const heroEl = qs('[data-row="hero"]');
    const heroPager = qs('[data-pager="hero"]');
    const merged = [...map.travel, ...map.food, ...map.stay, ...map.other]
      .sort((a,b)=> (b.date||'').localeCompare(a.date||''))
      .slice(0, 5); // 히어로 5장

    merged.forEach(item=>{
      // 어떤 카테고리인지 라벨 찾아주기 (url 경로로 추정)
      const cat = CATEGORIES.find(c => (item.url||'').startsWith('/'+c.key)) || CATEGORIES[0];
      heroEl.appendChild(createCard(item, cat.label));
    });
    renderPager(heroPager, merged.length, 0);
    attachPager(heroEl, heroPager);
  }

  // 카테고리별 행
  for(const cat of CATEGORIES){
    const row = qs(`[data-row="${cat.key}"]`);
    const pager = qs(`[data-pager="${cat.key}"]`);
    const list = map[cat.key].slice(0, 12); // 각 섹션 최대 12개
    list.forEach(item => row.appendChild(createCard(item, cat.label)));
    renderPager(pager, list.length, 0);
    attachPager(row, pager);
  }
}

document.addEventListener('DOMContentLoaded', render);
