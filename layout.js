/* Shared presentation layer. Content and canonical article URLs stay in their existing folders. */
(() => {
'use strict';
const countries=[
  {key:'korea',name:'대한민국',en:'SOUTH KOREA'},
  {key:'indonesia',name:'인도네시아',en:'INDONESIA',collection:true,cover:'/indonesia/stay/images/Kamandalu3.webp',description:'발리 여행기부터 맛집과 숙소까지. 직접 다녀온 인도네시아의 기록을 한곳에서 만나보세요.'},
  // Append Spain here when its existing content folder is ready. Collections follow this order.
];
const flags={indonesia:`<svg class="flag" viewBox="0 0 90 60" role="img" aria-label="인도네시아 국기"><path fill="#fff" d="M0 0h90v60H0z"/><path fill="#e3313c" d="M0 0h90v30H0z"/></svg>`,korea:`<svg class="flag" viewBox="0 0 90 60" role="img" aria-label="대한민국 국기"><path fill="#fff" d="M0 0h90v60H0z"/><g transform="rotate(33.69 45 30)"><circle cx="45" cy="30" r="15" fill="#cd2e3a"/><path d="M30 30a15 15 0 0 0 30 0a7.5 7.5 0 0 0-15 0a7.5 7.5 0 0 1-15 0" fill="#0047a0"/></g><g fill="#171b1d"><g transform="translate(20 14) rotate(-56.31)"><path d="M-7.5-4.5h15v2H-7.5zm0 3.5h15v2H-7.5zm0 3.5h15v2H-7.5z"/></g><g transform="translate(70 46) rotate(-56.31)"><path d="M-7.5-4.5h6.5v2h-6.5zm8.5 0h6.5v2H1zM-7.5-1h6.5v2h-6.5zM1-1h6.5v2H1zm-8.5 3.5h6.5v2h-6.5zm8.5 0h6.5v2H1z"/></g><g transform="translate(70 14) rotate(56.31)"><path d="M-7.5-4.5h6.5v2h-6.5zm8.5 0h6.5v2H1zM-7.5-1h15v2h-15zm0 3.5h6.5v2h-6.5zm8.5 0h6.5v2H1z"/></g><g transform="translate(20 46) rotate(56.31)"><path d="M-7.5-4.5h15v2H-7.5zm0 3.5h6.5v2h-6.5zM1-1h6.5v2H1zm-8.5 3.5h15v2h-15z"/></g></g></svg>`};
const labels={all:'전체 기록',travel:'여행기',food:'맛집',stay:'숙소',other:'여행 가이드'};
const names=Object.fromEntries(countries.map(c=>[c.key,c.name]));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const path=decodeURIComponent(location.pathname).replace(/index\.html$/,'').split('/').filter(Boolean);
const params=new URLSearchParams(location.search);
const query=(params.get('q')||'').trim();
const country=countries.find(c=>c.key===path[0]);
const category=path[0]==='other'?'other':path[1]||params.get('category')||'all';
if($('searchInput'))$('searchInput').value=query;
function card(p){return `<a class="post" href="${esc(p.url)}"><div class="picture"><img src="${esc(p.thumb)}" alt="${esc(p.title)}" loading="lazy" decoding="async">${p.recommend===true?'<span class="rec">👍 추천</span>':''}</div><div class="meta"><span>${esc(names[p.country]||'여행 준비')} · ${esc(labels[p.category])}</span><span>${esc((p.date||'').replaceAll('-','.'))}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></a>`}
function enhanceArticle(){
  const prose=document.querySelector('article .prose');
  if(!prose)return;
  const firstFigure=prose.firstElementChild?.tagName==='FIGURE'?prose.firstElementChild:null;
  const fieldLabels=['주소','영업시간','주문한 메뉴','주문 메뉴','주차'];
  const fields=[...prose.children].filter(p=>p.tagName==='P'&&p.querySelector('br')&&fieldLabels.includes(p.firstChild?.textContent?.trim()));
  if(firstFigure&&fields.length>=2){
    const lead=document.createElement('div');lead.className='articlelead';
    const quick=document.createElement('aside');quick.className='quick';quick.setAttribute('aria-label','방문 전 정보');
    quick.innerHTML='<h2>방문 전 한눈에</h2><dl></dl>';
    fields.forEach(p=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=p.firstChild.textContent.trim();p.firstChild.remove();if(p.firstChild?.nodeName==='BR')p.firstChild.remove();dd.append(p);row.append(dt,dd);quick.querySelector('dl').append(row)});
    lead.append(firstFigure,quick);document.querySelector('article .post-body').before(lead);
  }
  const headings=[...prose.querySelectorAll('h2')];
  if(headings.length>=2){const body=prose.parentElement;body.classList.add('detail-columns');const toc=document.createElement('nav');toc.className='detail-toc';toc.setAttribute('aria-label','글 목차');toc.innerHTML='<strong>이 글에서 볼 내용</strong>';headings.forEach((h,i)=>{if(!h.id)h.id='section-'+(i+1);const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;toc.append(a)});body.append(toc)}
}
if(document.body.dataset.layout==='article'){enhanceArticle();return;}
async function load(url,cat,key){const r=await fetch(url);if(!r.ok)throw Error(url);return (await r.json()).map(p=>({...p,country:p.country||key,category:cat}));}
function initFeatured(posts){const items=posts.filter(p=>p.category==='travel').sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,8);if(!items.length){document.querySelector('.featured').hidden=true;return}let index=0,timer=null;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let playing=!reduced;
  const show=i=>{index=(i+items.length)%items.length;const p=items[index];$('featureLink').href=p.url;$('featureImage').src=p.thumb;$('featureImage').alt=p.title;$('featureMeta').textContent='여행기록 · '+(p.date||'').replaceAll('-','.');$('featureTitle').textContent=p.title;$('featureExcerpt').textContent=p.excerpt;$('featureCounter').textContent=`${index+1} / ${items.length}`;$('featureDots').innerHTML=items.map((_,j)=>`<button aria-label="${j+1}번째 여행기" aria-pressed="${j===index}" class="${j===index?'active':''}" data-slide="${j}"></button>`).join('');$('featureDots').querySelectorAll('button').forEach(b=>b.onclick=()=>show(+b.dataset.slide))};
  const stop=()=>{clearInterval(timer);timer=null};const start=()=>{stop();if(playing&&!document.hidden)timer=setInterval(()=>show(index+1),5500)};
  $('featurePrev').onclick=()=>{show(index-1);start()};$('featureNext').onclick=()=>{show(index+1);start()};
  const button=()=>{$('featurePause').textContent=playing?'Ⅱ':'▷';$('featurePause').setAttribute('aria-label',playing?'자동 넘김 정지':'자동 넘김 시작')};
  $('featurePause').onclick=()=>{playing=!playing;button();start()};document.querySelector('.featured').addEventListener('mouseenter',stop);document.querySelector('.featured').addEventListener('mouseleave',start);document.querySelector('.featured').addEventListener('focusin',stop);document.querySelector('.featured').addEventListener('focusout',start);document.addEventListener('visibilitychange',start);show(0);button();start();
}
function initHome(posts){
  initFeatured(posts);
  $('countries').innerHTML=countries.map(c=>`<a class="country" href="/${c.key}/">${flags[c.key]||''}<div><h3>${esc(c.name)}</h3><small>${posts.filter(p=>p.country===c.key&&p.category!=='other').length}개의 기록</small></div><span class="round" aria-hidden="true">→</span></a>`).join('');
  $('recent').innerHTML=posts.filter(p=>p.category!=='other').sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,3).map(card).join('');
  $('destinationCollections').innerHTML=countries.filter(c=>c.collection&&posts.some(p=>p.country===c.key)).map(c=>`<section class="travelband"><div><div class="eyebrow">TRAVEL JOURNAL</div><h2>${esc(c.name)}<br>여행 기록 모아보기</h2><p>${esc(c.description||'직접 다녀온 여행 기록을 모았습니다.')}</p><a class="more" href="/${c.key}/">${esc(c.name)} 전체 기록 보기 →</a></div><img src="${esc(c.cover)}" alt="${esc(c.name)} 여행 풍경" loading="lazy"></section>`).join('');
  if(location.hash==='#destinations')$('destinations').scrollIntoView();
}
function initListing(posts){
  let recommend=params.get('recommend')==='true',sort='new';const base=country?posts.filter(p=>p.country===country.key):posts;
  const title=query?'검색 결과':country?country.name+(category==='all'?'':' '+(labels[category]||'')):labels[category]||labels.all;
  $('countryName').textContent=title;$('breadCountry').textContent=title;$('countryEn').textContent=country?.en||'TRAVEL ARCHIVE';$('listFlag').innerHTML=country?flags[country.key]||'':'';$('listFlag').hidden=!country;
  $('countryDescription').textContent=query?'“'+query+'”에 대한 기록':'직접 다녀온 곳의 이야기와 여행 준비 정보';
  const categories=category==='other'?['other']:['all','travel','food','stay'];
  $('filters').innerHTML=categories.map(cat=>{const count=base.filter(p=>cat==='all'?p.category!=='other':p.category===cat).length;const href=country?'/'+country.key+'/'+(cat==='all'?'':cat+'/'):cat==='other'?'/other/':'/?category='+cat;return `<a class="filter ${cat===category?'active':''}" href="${href}" ${cat===category?'aria-current="page"':''}>${labels[cat]} ${count}</a>`}).join('')+(category==='other'?'':'<button class="filter" id="recommendFilter" aria-pressed="'+recommend+'">👍 추천만</button>');
  const render=()=>{let list=(query?posts:base).filter(p=>query||(category==='all'?p.category!=='other':p.category===category)).filter(p=>!recommend||p.recommend===true).filter(p=>!query||(p.title+' '+p.excerpt).toLowerCase().includes(query.toLowerCase()));list.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title,'ko'):sort==='old'?(a.date||'').localeCompare(b.date||''):(b.date||'').localeCompare(a.date||''));$('resultCount').textContent=`${list.length}개의 기록`;$('listPosts').innerHTML=list.length?list.map(card).join(''):'<p class="empty">아직 등록된 기록이 없습니다. 다른 분류를 살펴보세요.</p>';if($('recommendFilter')){$('recommendFilter').classList.toggle('active',recommend);$('recommendFilter').setAttribute('aria-pressed',String(recommend))}};
  if($('recommendFilter'))$('recommendFilter').onclick=()=>{recommend=!recommend;const url=new URL(location.href);if(recommend)url.searchParams.set('recommend','true');else url.searchParams.delete('recommend');history.replaceState(null,'',url);render()};$('sortSelect').onchange=e=>{sort=e.target.value;render()};render();
}
async function main(){try{
  const parts=await Promise.all([...countries.flatMap(c=>['food','travel','stay'].map(cat=>load('/'+c.key+'/'+cat+'/index.json',cat,c.key))),load('/other/index.json','other','')]);const posts=parts.flat();const home=document.body.dataset.layout==='home'&&!params.has('category')&&!query;
  if($('homeView')){$('homeView').hidden=!home;$('listingView').hidden=home}
  if(home)initHome(posts);else initListing(posts);
  $('loadStatus').remove();document.querySelectorAll('ins.adsbygoogle').forEach(ins=>{if(!ins.dataset.adsbygoogleStatus){try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch{}}});
}catch(error){$('loadStatus').className='load-error';$('loadStatus').textContent='기록을 불러오지 못했습니다. 잠시 후 페이지를 새로고침해 주세요.';console.error('Could not load travel records',error)}}
main();
})();
