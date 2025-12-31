/* Reviews rendering and carousel logic (moved from inline script.js) */
function createStarSVG(){
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('aria-hidden','true');
  const path = document.createElementNS(ns,'path');
  path.setAttribute('d','M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.167L12 18.896l-7.336 3.867 1.402-8.167L.132 9.21l8.2-1.192L12 .587z');
  svg.appendChild(path);
  return svg;
}

function renderStars(container, rating){
  container.innerHTML = '';
  const full = Math.floor(rating);
  const frac = Math.max(0, Math.min(1, rating - full));
  for(let i=0;i<5;i++){
    const wrapper = document.createElement('span');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '20px';
    wrapper.style.height = '20px';
    wrapper.style.lineHeight = '0';

    const emptySVG = createStarSVG();
    emptySVG.classList.add('empty');
    emptySVG.style.position = 'absolute';
    emptySVG.style.left = '0';
    emptySVG.style.top = '0';
    emptySVG.style.width = '100%';
    emptySVG.style.height = '100%';
    wrapper.appendChild(emptySVG);

    const filledSVG = createStarSVG();
    filledSVG.classList.add('filled');
    filledSVG.style.position = 'absolute';
    filledSVG.style.left = '0';
    filledSVG.style.top = '0';
    filledSVG.style.width = '100%';
    filledSVG.style.height = '100%';

    let fillPct = 0;
    if(i < full) fillPct = 1;
    else if(i === full) fillPct = frac;
    else fillPct = 0;

    if(fillPct <= 0) filledSVG.style.clipPath = 'inset(0 100% 0 0)';
    else if(fillPct >= 1) filledSVG.style.clipPath = 'none';
    else {
      const rightPct = (1 - fillPct) * 100;
      filledSVG.style.clipPath = `inset(0 ${rightPct}% 0 0)`;
    }

    wrapper.appendChild(filledSVG);
    container.appendChild(wrapper);
  }
}

export function initReviewsCarousel(){
  const track = document.getElementById('reviewsTrack');
  if(!track) return;

  const reviewsData = [
    { name: "Ava J.", rating: 4.9, text: "Incredible plugin work — stable, well-documented, and fast. Server ran smoothly during peak times." },
    { name: "Marcus P.", rating: 4.6, text: "Great communication and delivered exactly what we wanted. Players love the custom items." },
    { name: "Sofia L.", rating: 5.0, text: "Top-tier development and quick iterations. Highly recommended for serious servers." }
  ];

  function buildCards(){
    track.innerHTML = '';
    for(const r of reviewsData){
      const article = document.createElement('article');
      article.className = 'card';
      article.setAttribute('role','listitem');

      const h3 = document.createElement('h3');
      h3.textContent = r.name;

      const stars = document.createElement('div');
      stars.className = 'stars';
      renderStars(stars, r.rating);

      const p = document.createElement('p');
      p.textContent = r.text;

      article.appendChild(h3);
      article.appendChild(stars);
      article.appendChild(p);
      track.appendChild(article);
    }

    // Append shallow clones for smoother continuous motion
    const clones = [];
    Array.from(track.children).forEach((c)=> clones.push(c.cloneNode(true)));
    clones.forEach(c => track.appendChild(c));
  }

  buildCards();

  let rafId = null;
  let lastTs = performance.now();
  const NORMAL_SPEED = 48;
  const HOVER_SPEED = 10;
  let targetSpeed = NORMAL_SPEED;
  let currentSpeed = NORMAL_SPEED;
  let offset = 0;

  function firstChildFullWidth(){
    const first = track.firstElementChild;
    if(!first) return 0;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || 0) || 0;
    const rect = first.getBoundingClientRect();
    return Math.ceil(rect.width + gap);
  }

  const ro = new ResizeObserver(()=> offset = Math.max(0, offset % Math.max(1, firstChildFullWidth())));
  ro.observe(track);

  track.addEventListener('mouseenter', ()=> targetSpeed = HOVER_SPEED, {passive:true});
  track.addEventListener('mouseleave', ()=> targetSpeed = NORMAL_SPEED, {passive:true});
  track.addEventListener('focusin', ()=> targetSpeed = HOVER_SPEED);
  track.addEventListener('focusout', ()=> targetSpeed = NORMAL_SPEED);

  track.addEventListener('pointerenter', (e) => {
    const card = e.target.closest && e.target.closest('.card');
    if (card && track.contains(card)) card.classList.add('is-pointer-over');
  }, {passive:true});

  track.addEventListener('pointerleave', (e) => {
    const card = e.target.closest && e.target.closest('.card');
    if (card && track.contains(card)) card.classList.remove('is-pointer-over');
  }, {passive:true});

  function step(ts){
    const dt = Math.min(60, ts - lastTs) / 1000;
    lastTs = ts;
    currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 8);
    offset += currentSpeed * dt;

    while (track.firstElementChild && offset >= firstChildFullWidth()) {
      offset -= firstChildFullWidth();
      track.appendChild(track.firstElementChild);
    }

    track.style.transform = `translateX(${-offset}px)`;
    rafId = requestAnimationFrame(step);
  }

  rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      if(rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if(!rafId){
      lastTs = performance.now();
      rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });
    }
  });
}