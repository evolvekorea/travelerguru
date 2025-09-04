/* ---------------------------
 * 간단 캐러셀/도트 예시 + 더미 데이터 표시
 * --------------------------- */

// 히어로 슬라이드(정적 3장 가정) 자동 순환
(function heroCarousel(){
  const dots = document.querySelectorAll('.dots .dot');
  let idx = 0;
  function setActive(i){
    dots.forEach(d=>d.classList.remove('is-active'));
    dots[i].classList.add('is-active');
    // 실제 배너 이미지/링크 변경 포인트:
    // TODO: hero 이미지/제목/링크를 i에 맞게 교체하도록 구현
  }
  setInterval(()=>{
    idx = (idx + 1) % dots.length;
    setActive(idx);
  }, 3500);
})();

// “오늘의 스냅” 더 보기 (샘플로 8개 추가)
document.querySelector('.more-btn')?.addEventListener('click', ()=>{
  const grid = document.querySelector('.snap-grid');
  const makeItem = (title='스냅', alt='스냅')=>{
    const a = document.createElement('a');
    a.className = 'snap-item'; a.href = '#'; a.dataset.type='photo'; a.title = title;
    a.innerHTML = `
      <!-- ↓↓↓ 사진 URL -->
      <img src="" alt="${alt}" loading="lazy">
      <span class="snap-caption">${title}</span>
    `;
    return a;
  };
  for(let i=0;i<8;i++) grid.appendChild(makeItem('추가 스냅', '추가 스냅'));
});

// 경제 미니보드 더미(실데이터 연동 지점 표기)
/*
  실제 데이터 연동시 예:
  - 환율: 한국수출입은행/민간 API / 구글 파이낸스 스크래핑(비권장)
  - 코스피/나스닥: 증권사 공개 API, 파이어베이스 캐싱 등
  - 원칙적으로 클라이언트에서 직접 외부 API 호출은 CORS/Key 문제 → 서버나 Cloud Function 권장
*/
(function miniBoardDemo(){
  const fx = document.getElementById('fx-krw');
  const ks = document.getElementById('kospi');
  const nd = document.getElementById('nasdaq');
  const br = document.getElementById('brent');
  // 시연용 난수
  const rand = (base, spread)=> (base + Math.random()*spread).toFixed(2);
  fx.textContent = `${(1300 + Math.random()*20).toFixed(2)}₩`;
  ks.textContent = rand(2480, 30);
  nd.textContent = rand(16500, 120);
  br.textContent = `$${rand(83, 3)}`;
})();
