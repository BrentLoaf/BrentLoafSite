/* Features carousel (previously inline in script.js) */
export function initFeaturesCarousel(){
  const track = document.getElementById('featuresTrack');
  if (!track) return;

  let rafId = null;
  let lastTs = performance.now();
  const NORMAL_SPEED = 60;
  const HOVER_SPEED = 12;
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

  const ro = new ResizeObserver(()=> {
    offset = Math.max(0, offset % Math.max(1, firstChildFullWidth()));
  });
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