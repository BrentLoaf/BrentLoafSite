const quoteBtn = document.getElementById('quoteBtn');
const heroQuote = document.getElementById('heroQuote');
const contact = document.getElementById('contact');
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const year = document.getElementById('year');
const deadlineInput = document.getElementById('deadline');
const includeDeadline = document.getElementById('includeDeadline');
const budgetInput = document.getElementById('budget');

// direct contact copy elements
const emailTextEl = document.getElementById('emailText');
const discordTextEl = document.getElementById('discordText');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const copyDiscordBtn = document.getElementById('copyDiscordBtn');

year.textContent = new Date().getFullYear();

// Copy button behavior with temporary feedback
async function copyToClipboard(text, button){
  if(!navigator.clipboard) {
    // fallback: select & copy
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  } else {
    try { await navigator.clipboard.writeText(text); } catch(e) {}
  }

  // simple visual feedback on the button
  if(button){
    const orig = button.textContent;
    button.textContent = 'Copied';
    button.classList.add('copy-success');
    setTimeout(()=> {
      button.textContent = orig;
      button.classList.remove('copy-success');
    }, 1500);
  }
}

if(copyEmailBtn && emailTextEl){
  copyEmailBtn.addEventListener('click', ()=> copyToClipboard(emailTextEl.textContent.trim(), copyEmailBtn));
}
if(copyDiscordBtn && discordTextEl){
  copyDiscordBtn.addEventListener('click', ()=> copyToClipboard(discordTextEl.textContent.trim(), copyDiscordBtn));
}

function scrollToContact(e){
  e?.preventDefault();
  contact.scrollIntoView({behavior:'smooth', block:'start'});
}
if (quoteBtn) quoteBtn.addEventListener('click', scrollToContact);
if (heroQuote) heroQuote.addEventListener('click', scrollToContact);

/* Prevent typing more than 4 digits in the date year segment.
   Use beforeinput to stop additional numeric characters when the caret
   is inside the year portion (yyyy) so extra digits don't overflow
   into the month part. Fall back to input-based trimming as a safety net. */
if (deadlineInput) {
    // Toggle visibility and required state of the deadline row based on the checkbox
  const deadlineRow = document.getElementById('deadlineRow');
  if (includeDeadline && deadlineRow) {
    // initialize visibility & required state
    const applyState = () => {
      const visible = !!includeDeadline.checked;
      deadlineRow.style.display = visible ? '' : 'none';
      deadlineInput.required = visible;
      if (!visible) {
        // clear any status related to deadline and clear the value to avoid accidental submission
        if (status) status.textContent = '';
        deadlineInput.value = '';
      }
    };
    applyState();
    includeDeadline.addEventListener('change', applyState);
  }

  // Block extra numeric input when caret is in the year segment and year is already 4 chars
  deadlineInput.addEventListener('beforeinput', (e) => {
    // Only handle inserted text (typing/paste/composition insertions)
    if (!e.data) return;
    // Only care about digits
    if (!/^\d+$/.test(e.data)) return;

    const input = e.target;
    const value = input.value || '';
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;

    // Build what the value would be after this insertion
    const newValue = value.slice(0, start) + e.data + value.slice(end);
    const newParts = newValue.split('-');
    const newYear = newParts[0] || '';

    if (newYear.length > 4) {
      // Prevent the default insertion
      e.preventDefault();

      // If any part of the insertion can be accepted (e.g., paste of many digits),
      // insert only the allowed slice so the UI still feels natural.
      const existingYear = value.split('-')[0] || '';
      const allowed = Math.max(0, 4 - existingYear.length);
      if (allowed > 0) {
        const insert = e.data.slice(0, allowed);
        const before = value.slice(0, start);
        const after = value.slice(end);
        input.value = before + insert + after;
        const pos = before.length + insert.length;
        input.setSelectionRange(pos, pos);
      }
    }
  });

  // Safety-net: trim any accidental overlength on input (handles non-beforeinput cases)
  // This normalizes the value to ensure the year is at most 4 digits and preserves a sensible caret position.
  deadlineInput.addEventListener('input', (e) => {
    const input = e.target;
    const prevPos = input.selectionStart ?? input.value.length;
    const raw = input.value || '';

    // Split into parts and enforce that the year (parts[0]) is at most 4 digits.
    const parts = raw.split('-');
    // Remove any non-digit characters from each part to be extra-safe
    parts[0] = (parts[0] || '').replace(/\D/g, '').slice(0, 4);
    if (parts.length > 1) parts[1] = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
    if (parts.length > 2) parts[2] = (parts[2] || '').replace(/\D/g, '').slice(0, 2);

    const newValue = [parts[0], parts[1], parts[2]].filter((p) => p !== undefined && p !== '').join('-');

    // If value changed, update and try to restore a reasonable caret position.
    if (newValue !== raw) {
      input.value = newValue;
      // Place caret either where it was (if still in range) or at the end of the affected segment.
      const pos = Math.min(prevPos, newValue.length);
      input.setSelectionRange(pos, pos);
    }
  });
}

// Submit form to Formspree and show inline thank-you on success.
form.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  status.textContent = '';

  const data = new FormData(form);
  const required = ['name','email','server_size','budget_range','feature_summary'];
  for(const k of required){
    if(!data.get(k) || String(data.get(k)).trim()===''){
      status.textContent = 'Please complete all required fields.';
      return;
    }
  }

  const email = String(data.get('email'));
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    status.textContent = 'Please enter a valid email address.';
    return;
  }

  // Budget must be a positive number
  const budgetVal = data.get('budget_range');
  const budgetNum = budgetVal === null ? NaN : Number(String(budgetVal).trim());
  if (!isFinite(budgetNum) || budgetNum <= 0) {
    status.textContent = 'Please enter a positive budget in USD.';
    return;
  }

  // Deadline enforcement only when the "Include a deadline?" checkbox is checked.
  const deadlineVal = data.get('deadline');
  if (includeDeadline && includeDeadline.checked) {
    // If checkbox is checked, deadline must be provided
    if (!deadlineVal || String(deadlineVal).trim() === '') {
      status.textContent = 'Please provide a deadline date or uncheck "Include a deadline?".';
      return;
    }

    const dstr = String(deadlineVal).trim();
    // Expecting yyyy-mm-dd format with 4-digit year
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dstr)) {
      status.textContent = 'Please enter a valid deadline date (YYYY-MM-DD).';
      return;
    }
    // Basic check that date is valid
    const dt = new Date(dstr);
    if (Number.isNaN(dt.getTime())) {
      status.textContent = 'Please enter a valid deadline date.';
      return;
    }
    const yearNum = dt.getUTCFullYear();
    if (yearNum < 1000 || yearNum > 9999) {
      status.textContent = 'Please enter a deadline with a four-digit year.';
      return;
    }
  }

  // Optional document_link is allowed empty; if present, ensure it's a valid URL
  const docVal = data.get('document_link');
  if (docVal && String(docVal).trim() !== '') {
    try {
      // This will throw for invalid URLs
      new URL(String(docVal).trim());
    } catch (err) {
      status.textContent = 'Please enter a valid URL for the optional document/link.';
      return;
    }
  }

  status.textContent = 'Sending…';

  try{
    // POST to the form's action (Formspree endpoint)
    const resp = await fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: data
    });

    if(resp.ok){
      // Replace form content with a simple thank-you message (no redirect)
      form.innerHTML = `
        <div style="padding:18px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.02);">
          <h3 style="margin:0 0 8px;color:inherit;font-size:1.05rem">Thank you — request received</h3>
          <p style="margin:0;color:var(--muted)">I will review your details and reply via email shortly.</p>
        </div>
      `;
      status.textContent = '';
    }else{
      const err = await resp.json().catch(()=>null);
      status.textContent = err?.error || 'Submission failed. Please try again later.';
    }
  }catch(err){
    status.textContent = 'An error occurred. Please try again later.';
  }
});

/* Continuous horizontal carousel for "Potential Plugin Features" */
(function(){
  const track = document.getElementById('featuresTrack');
  if(!track) return;

  let rafId = null;
  let lastTs = performance.now();

  // speed in pixels per second (normal and slowed hover speed)
  const NORMAL_SPEED = 60; // px/s — adjust for comfortable reading
  const HOVER_SPEED = 12;  // px/s when hovered
  let targetSpeed = NORMAL_SPEED;
  let currentSpeed = NORMAL_SPEED;

  // current offset (how far the track has been translated)
  let offset = 0;

  // ensure there is at least one clone so continuous flow is smooth when moving items
  // We'll rely on DOM cycling (move first child to end when fully scrolled off)
  // Helper to get width of first child including gap
  function firstChildFullWidth(){
    const first = track.firstElementChild;
    if(!first) return 0;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || 0) || 0;
    const rect = first.getBoundingClientRect();
    return Math.ceil(rect.width + gap);
  }

  // Resize observer to avoid visual glitches when layout changes
  const ro = new ResizeObserver(()=> {
    // clamp offset to non-negative and less than first child width
    offset = Math.max(0, offset % Math.max(1, firstChildFullWidth()));
  });
  ro.observe(track);

  // Hover handling: smoothly change targetSpeed.
  // Also listen for pointerenter/pointerleave on cards to ensure slow-down triggers
  track.addEventListener('mouseenter', ()=> targetSpeed = HOVER_SPEED, {passive:true});
  track.addEventListener('mouseleave', ()=> targetSpeed = NORMAL_SPEED, {passive:true});
  track.addEventListener('focusin', ()=> targetSpeed = HOVER_SPEED);
  track.addEventListener('focusout', ()=> targetSpeed = NORMAL_SPEED);

  // When pointer enters an individual card, add a focused attribute to improve accessibility visuals.
  track.addEventListener('pointerenter', (e) => {
    const card = e.target.closest && e.target.closest('.card');
    if (card && track.contains(card)) {
      card.classList.add('is-pointer-over');
    }
  }, {passive:true});

  track.addEventListener('pointerleave', (e) => {
    const card = e.target.closest && e.target.closest('.card');
    if (card && track.contains(card)) {
      card.classList.remove('is-pointer-over');
    }
  }, {passive:true});

  function step(ts){
    const dt = Math.min(60, ts - lastTs) / 1000; // in seconds, cap to avoid big jumps
    lastTs = ts;

    // ease currentSpeed toward targetSpeed for smooth slowing/return
    currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 8); // fast lerp

    // advance offset based on currentSpeed
    offset += currentSpeed * dt;

    // If the first child has fully moved off (its width <= offset), move it to the end
    const firstWidth = firstChildFullWidth();
    if(firstWidth > 0 && offset >= firstWidth){
      // move as many full items as necessary (handle slow frames)
      while(track.firstElementChild && offset >= firstChildFullWidth()){
        const child = track.firstElementChild;
        offset -= firstChildFullWidth();
        track.appendChild(child);
      }
    }

    // apply transform (negative offset) — move track left as offset grows so cards appear to scroll right
    track.style.transform = `translateX(${-offset}px)`;

    rafId = requestAnimationFrame(step);
  }

  // Start loop
  rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });

  // Pause animations when page hidden to save CPU
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      if(rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      if(!rafId){
        lastTs = performance.now();
        rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });
      }
    }
  });
})(); 
// carousel: no JS changes required for hover scaling; styling handles the hover scale & vertical alignment

/* Portfolio carousel: ensure DOM structure is always present, then dynamically discover videos in /portfolio/ */
(function(){
  const track = document.getElementById('portfolioTrack');
  if(!track) return;

  const VIDEO_EXTENSIONS = ['.mp4','.webm','.mov','.ogg','.mkv','.mpg','.mpeg','.avi','.qt'];

  // create a generic empty card (placeholder) so carousel is visible even if no videos found
  function createPlaceholderCard(){
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('role','listitem');
    // create an inner empty block so styling shows the card area
    const placeholder = document.createElement('div');
    placeholder.style.width = '100%';
    placeholder.style.height = '100%';
    placeholder.style.minHeight = '140px';
    placeholder.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.color = 'rgba(255,255,255,0.06)';
    placeholder.textContent = '';
    article.appendChild(placeholder);
    return article;
  }

  // create an article.card element with a video child for a given src
  function createVideoCard(src){
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('role','listitem');
    const v = document.createElement('video');
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = 'metadata';
    v.setAttribute('playsinline','');
    v.style.background = '#000';
    article.appendChild(v);
    return article;
  }

  // Parse an index HTML response for links pointing to video files
  async function fetchDirectoryListing(dirUrl){
    try {
      const resp = await fetch(dirUrl, {cache: 'no-cache'});
      if(!resp.ok) return [];
      const text = await resp.text();
      // If server returned JSON (some setups), try parse it
      try {
        const json = JSON.parse(text);
        if(Array.isArray(json)){
          const names = json.map(i => (typeof i === 'string' ? i : (i.name || i.filename))).filter(Boolean);
          return names.filter(n => VIDEO_EXTENSIONS.some(ext => n.toLowerCase().endsWith(ext)));
        }
      } catch (e){ /* not JSON, continue to parse as HTML */ }

      // Parse HTML for anchor hrefs
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const anchors = Array.from(doc.querySelectorAll('a'));
      const found = anchors.map(a => a.getAttribute('href') || '').filter(Boolean)
        .map(h => {
          if(h.startsWith('./')) h = h.slice(2);
          if(h.startsWith('/')) h = h.slice(1);
          return h;
        })
        .filter(h => VIDEO_EXTENSIONS.some(ext => h.toLowerCase().endsWith(ext)));
      return found;
    } catch (err) {
      return [];
    }
  }

  // Discover files using multiple strategies and return absolute-ish paths usable by the page
  async function discoverPortfolioFiles(){
    const files = [];
    for(let i = 1; i <= 5; i++){
      files.push(`portfolio/${i}.mp4`);
    }
    return files;
  }

  // Ensure track always contains at least placeholder cards so structure is visible
  function ensureStructure(){
    if(track.children.length === 0){
      // create a few placeholder cards so the carousel area is visible
      for(let i=0;i<3;i++){
        track.appendChild(createPlaceholderCard());
      }
      // duplicate placeholders to allow the scrolling script to operate (it cycles DOM children)
      const clones = Array.from(track.children).map(c => c.cloneNode(true));
      clones.forEach(c => track.appendChild(c));
    }
  }

  // populate track with discovered video cards; if none found, keep placeholders
  async function populate(){
    const files = await discoverPortfolioFiles();
    if(!files || !files.length) {
      // nothing found — leave existing placeholders intact (ensureStructure called earlier)
      return;
    }
    // clear and add real video cards
    track.innerHTML = '';
    files.forEach(src => {
      const card = createVideoCard(src);
      track.appendChild(card);
    });
    // duplicate children to support smooth continuous flow
    const clones = Array.from(track.children).map(c => c.cloneNode(true));
    clones.forEach(c => track.appendChild(c));
    // start playing videos (muted enables autoplay on most browsers)
    Array.from(track.querySelectorAll('video')).forEach(v => v.play().catch(()=>{}));
  }

  // Initialize: ensure structure first, then try to populate with real videos, then start carousel runtime logic
  (async function initCarousel(){
    ensureStructure();
    // attempt discovery/population, but don't block the UI if it fails
    populate().catch(()=>{});
    // The runtime carousel logic (kept functionally identical to other carousels)
    let rafId = null;
    let lastTs = performance.now();
    const NORMAL_SPEED = 56; // px/s
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

    function playVisibleVideos(){
      const vids = Array.from(track.querySelectorAll('video'));
      vids.forEach(v => {
        if (v.paused) v.play().catch(()=>{});
      });
    }

    track.addEventListener('pointerenter', ()=> playVisibleVideos());
    track.addEventListener('pointerleave', ()=> playVisibleVideos());

    function step(ts){
      const dt = Math.min(60, ts - lastTs) / 1000;
      lastTs = ts;
      currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 8);
      offset += currentSpeed * dt;

      const firstWidth = firstChildFullWidth();
      if(firstWidth > 0 && offset >= firstWidth){
        while(track.firstElementChild && offset >= firstChildFullWidth()){
          offset -= firstChildFullWidth();
          const moved = track.firstElementChild;
          track.appendChild(moved);
          const v = moved.querySelector('video');
          if(v) v.play().catch(()=>{});
        }
      }

      track.style.transform = `translateX(${-offset}px)`;
      playVisibleVideos();
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });

    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){
        if(rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else {
        if(!rafId){
          lastTs = performance.now();
          rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });
        }
        playVisibleVideos();
      }
    });
  })();
})();

/* User Reviews carousel - data loaded from external reviews.json (with fallback) */
(async function(){
  const track = document.getElementById('reviewsTrack');
  if(!track) return;

  // Fallback data used if fetching reviews.json fails for any reason
  const FALLBACK_REVIEWS = [{ name: "494", rating: 5, text: "File not found." }];

  // Try to fetch reviews.json from the site root; fall back to the embedded list on error.
  let reviewsData = FALLBACK_REVIEWS;
  try {
    const resp = await fetch('reviews.json', {cache: 'no-cache'});
    if(resp.ok){
      const json = await resp.json();
      // Normalize JSON entries to expected shape (name, rating/stars, text/review)
      if(Array.isArray(json) && json.length){
        reviewsData = json.map(item => ({
          name: item.name || item.username || "Anonymous",
          rating: Number(item.stars ?? item.rating ?? 0) || 0,
          text: item.review ?? item.text ?? ""
        }));
      }
    }
  } catch (err) {
    // swallow errors and use fallback
  }

  // Helper to create a star SVG (full star). We'll render fractional stars by clipping width.
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

      if(fillPct <= 0){
        filledSVG.style.clipPath = 'inset(0 100% 0 0)';
      } else if(fillPct >= 1){
        filledSVG.style.clipPath = 'none';
      } else {
        const rightPct = (1 - fillPct) * 100;
        filledSVG.style.clipPath = `inset(0 ${rightPct}% 0 0)`;
      }

      wrapper.appendChild(filledSVG);
      container.appendChild(wrapper);
    }
  }

  // populate DOM with review cards
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
    // Duplicate items to ensure smooth continuous flow
    const clones = [];
    Array.from(track.children).forEach((c)=> {
      clones.push(c.cloneNode(true));
    });
    clones.forEach(c => track.appendChild(c));
  }

  buildCards();

  // Scrolling behavior: similar to features carousel
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
    if (card && track.contains(card)) {
      card.classList.add('is-pointer-over');
    }
  }, {passive:true});

  track.addEventListener('pointerleave', (e) => {
    const card = e.target.closest && e.target.closest('.card');
    if (card && track.contains(card)) {
      card.classList.remove('is-pointer-over');
    }
  }, {passive:true});

  function step(ts){
    const dt = Math.min(60, ts - lastTs) / 1000;
    lastTs = ts;
    currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 8);
    offset += currentSpeed * dt;

    const firstWidth = firstChildFullWidth();
    if(firstWidth > 0 && offset >= firstWidth){
      while(track.firstElementChild && offset >= firstChildFullWidth()){
        offset -= firstChildFullWidth();
        track.appendChild(track.firstElementChild);
      }
    }

    track.style.transform = `translateX(${-offset}px)`;
    rafId = requestAnimationFrame(step);
  }

  rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      if(rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      if(!rafId){
        lastTs = performance.now();
        rafId = requestAnimationFrame((t)=>{ lastTs = t; step(t); });
      }
    }
  });
})();