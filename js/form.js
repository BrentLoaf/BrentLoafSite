/* Form handling and deadline input normalization */
export function initForm(){
  const form = document.getElementById('contactForm');
  if(!form) return;

  const status = document.getElementById('formStatus');
  const includeDeadline = document.getElementById('includeDeadline');
  const deadlineInput = document.getElementById('deadline');

  // Toggle deadline row visibility & required state
  const deadlineRow = document.getElementById('deadlineRow');
  if (includeDeadline && deadlineRow && deadlineInput) {
    const applyState = () => {
      const visible = !!includeDeadline.checked;
      deadlineRow.style.display = visible ? '' : 'none';
      deadlineInput.required = visible;
      if (!visible) {
        if (status) status.textContent = '';
        deadlineInput.value = '';
      }
    };
    applyState();
    includeDeadline.addEventListener('change', applyState);
  }

  // Enforce reasonable year length in date text entry with beforeinput and input handlers
  if (deadlineInput) {
    deadlineInput.addEventListener('beforeinput', (e) => {
      if (!e.data) return;
      if (!/^\d+$/.test(e.data)) return;

      const input = e.target;
      const value = input.value || '';
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? start;
      const newValue = value.slice(0, start) + e.data + value.slice(end);
      const newYear = (newValue.split('-')[0] || '');
      if (newYear.length > 4) {
        e.preventDefault();
        const existingYear = (value.split('-')[0] || '');
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

    deadlineInput.addEventListener('input', (e) => {
      const input = e.target;
      const prevPos = input.selectionStart ?? input.value.length;
      const raw = input.value || '';
      const parts = raw.split('-');
      parts[0] = (parts[0] || '').replace(/\D/g, '').slice(0, 4);
      if (parts.length > 1) parts[1] = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
      if (parts.length > 2) parts[2] = (parts[2] || '').replace(/\D/g, '').slice(0, 2);
      const newValue = [parts[0], parts[1], parts[2]].filter((p) => p !== undefined && p !== '').join('-');
      if (newValue !== raw) {
        input.value = newValue;
        const pos = Math.min(prevPos, newValue.length);
        input.setSelectionRange(pos, pos);
      }
    });
  }

  // Submission handling (Formspree)
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (status) status.textContent = '';

    const data = new FormData(form);
    const required = ['name','email','server_size','budget_range','feature_summary'];
    for(const k of required){
      if(!data.get(k) || String(data.get(k)).trim()===''){
        if (status) status.textContent = 'Please complete all required fields.';
        return;
      }
    }

    const email = String(data.get('email'));
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      if (status) status.textContent = 'Please enter a valid email address.';
      return;
    }

    const budgetVal = data.get('budget_range');
    const budgetNum = budgetVal === null ? NaN : Number(String(budgetVal).trim());
    if (!isFinite(budgetNum) || budgetNum <= 0) {
      if (status) status.textContent = 'Please enter a positive budget in USD.';
      return;
    }

    const deadlineVal = data.get('deadline');
    if (includeDeadline && includeDeadline.checked) {
      if (!deadlineVal || String(deadlineVal).trim() === '') {
        if (status) status.textContent = 'Please provide a deadline date or uncheck "Include a deadline?".';
        return;
      }
      const dstr = String(deadlineVal).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dstr)) {
        if (status) status.textContent = 'Please enter a valid deadline date (YYYY-MM-DD).';
        return;
      }
      const dt = new Date(dstr);
      if (Number.isNaN(dt.getTime())) {
        if (status) status.textContent = 'Please enter a valid deadline date.';
        return;
      }
      const yearNum = dt.getUTCFullYear();
      if (yearNum < 1000 || yearNum > 9999) {
        if (status) status.textContent = 'Please enter a deadline with a four-digit year.';
        return;
      }
    }

    const docVal = data.get('document_link');
    if (docVal && String(docVal).trim() !== '') {
      try { new URL(String(docVal).trim()); } catch (err) {
        if (status) status.textContent = 'Please enter a valid URL for the optional document/link.';
        return;
      }
    }

    if (status) status.textContent = 'Sending…';

    try{
      const resp = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });

      if(resp.ok){
        form.innerHTML = `
          <div style="padding:18px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.02);">
            <h3 style="margin:0 0 8px;color:inherit;font-size:1.05rem">Thank you — request received</h3>
            <p style="margin:0;color:var(--muted)">I will review your details and reply via email shortly.</p>
          </div>
        `;
        if (status) status.textContent = '';
      } else {
        const err = await resp.json().catch(()=>null);
        if (status) status.textContent = err?.error || 'Submission failed. Please try again later.';
      }
    }catch(err){
      if (status) status.textContent = 'An error occurred. Please try again later.';
    }
  });
}