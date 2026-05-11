(() => {
  'use strict';

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────

  function sanitize(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>"'`]/g, '').trim().slice(0, maxLen || 200);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidTime(t) {
    return /^\d{2}:\d{2}$/.test(t);
  }

  function $(id) { return document.getElementById(id); }

  // ─────────────────────────────────────────────
  // TOAST SYSTEM
  // ─────────────────────────────────────────────

  function toast(msg, type) {
    const container = $('sc-toasts');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'sc-toast ' + (type || 'info');
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ─────────────────────────────────────────────
  // AVAILABILITY TABLE
  // ─────────────────────────────────────────────

  const DAYS = [
    { key: 'Mon', label: 'Monday' },
    { key: 'Tue', label: 'Tuesday' },
    { key: 'Wed', label: 'Wednesday' },
    { key: 'Thu', label: 'Thursday' },
    { key: 'Fri', label: 'Friday' },
    { key: 'Sat', label: 'Saturday' },
    { key: 'Sun', label: 'Sunday' }
  ];

  function buildTimeSelect(id, defaultVal) {
    const sel = document.createElement('select');
    sel.className = 'sc-tsel sc-time-sel';
    sel.id = id;
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const val = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        if (val === defaultVal) opt.selected = true;
        sel.appendChild(opt);
      }
    }
    return sel;
  }

  function buildStatusSelect(key) {
    const sel = document.createElement('select');
    sel.className = 'sc-tsel';
    sel.id = 'sc-status-' + key;
    [
      { value: 'working', label: 'Available' },
      { value: 'off',     label: 'Not Available' },
      { value: 'leave',   label: 'On Leave' }
    ].forEach(({ value, label }) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => updateTimeVisibility(key));
    return sel;
  }

  function updateTimeVisibility(key) {
    const status  = $('sc-status-' + key).value;
    const working = status === 'working';

    $('sc-srow-' + key).style.display   = working ? '' : 'none';
    $('sc-erow-' + key).style.display   = working ? '' : 'none';
    $('sc-sbadge-' + key).style.display = working ? 'none' : '';
    $('sc-ebadge-' + key).style.display = 'none';

    const badge = $('sc-sbadge-' + key);
    while (badge.firstChild) badge.removeChild(badge.firstChild);
    if (!working) {
      const span = document.createElement('span');
      span.className = 'sc-st-badge ' + (status === 'leave' ? 'sc-st-leave' : 'sc-st-off');
      span.textContent = status === 'leave' ? 'On Leave' : 'Not Available';
      badge.appendChild(span);
    }
  }

  function buildAvailabilityTable() {
    const tbody = $('sc-avail-body');
    if (!tbody) return;

    DAYS.forEach(day => {
      const row = document.createElement('tr');

      // Day cell
      const dayCell = document.createElement('td');
      const dayName = document.createElement('div');
      dayName.className = 'sc-day-name';
      dayName.textContent = day.label;
      const dayAbbr = document.createElement('div');
      dayAbbr.className = 'sc-day-abbr';
      dayAbbr.textContent = day.key;
      dayCell.appendChild(dayName);
      dayCell.appendChild(dayAbbr);

      // Status cell
      const statusCell = document.createElement('td');
      statusCell.appendChild(buildStatusSelect(day.key));

      // Start cell
      const startCell  = document.createElement('td');
      const startRow   = document.createElement('div');
      startRow.className = 'sc-time-cell';
      startRow.id = 'sc-srow-' + day.key;
      startRow.appendChild(buildTimeSelect('sc-start-' + day.key, '06:00'));
      const startBadge = document.createElement('div');
      startBadge.id = 'sc-sbadge-' + day.key;
      startBadge.style.display = 'none';
      startCell.appendChild(startRow);
      startCell.appendChild(startBadge);

      // End cell
      const endCell  = document.createElement('td');
      const endRow   = document.createElement('div');
      endRow.className = 'sc-time-cell';
      endRow.id = 'sc-erow-' + day.key;
      const timeSep = document.createElement('span');
      timeSep.className = 'sc-time-sep';
      timeSep.textContent = '→';
      endRow.appendChild(timeSep);
      endRow.appendChild(buildTimeSelect('sc-end-' + day.key, '17:00'));
      const endBadge = document.createElement('div');
      endBadge.id = 'sc-ebadge-' + day.key;
      endBadge.style.display = 'none';
      endCell.appendChild(endRow);
      endCell.appendChild(endBadge);

      row.appendChild(dayCell);
      row.appendChild(statusCell);
      row.appendChild(startCell);
      row.appendChild(endCell);
      tbody.appendChild(row);
    });
  }

  // ─────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────

  function validate() {
    let ok = true;
    const checks = [
      { id: 'sc-manager-email', errId: 'sc-manager-email-err', msg: "Please enter the manager's email", test: isValidEmail },
      { id: 'sc-name',          errId: 'sc-name-err',          msg: 'Full name is required',            test: v => v.length > 0 },
      { id: 'sc-email',         errId: 'sc-email-err',         msg: 'Valid email address required',     test: isValidEmail },
      { id: 'sc-role',          errId: 'sc-role-err',          msg: 'Please select your primary role',  test: v => v.length > 0 },
      { id: 'sc-basis',         errId: 'sc-basis-err',         msg: 'Please select employment type',    test: v => v.length > 0 }
    ];

    checks.forEach(c => {
      const el    = $(c.id);
      const errEl = $(c.errId);
      const v     = el.value.trim();
      const fail  = !v || (c.test && !c.test(v));
      el.classList.toggle('error', fail);
      errEl.textContent = fail ? c.msg : '';
      if (fail) ok = false;
    });

    if (!ok) {
      const first = document.querySelector('.sc-input.error, .sc-sel.error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return ok;
  }

  // ─────────────────────────────────────────────
  // PAYLOAD BUILDER
  // ─────────────────────────────────────────────

  function buildPayload() {
    const av = {};
    DAYS.forEach(day => {
      const type    = $('sc-status-' + day.key).value;
      const startEl = $('sc-start-'  + day.key);
      const endEl   = $('sc-end-'    + day.key);
      const s = startEl ? startEl.value : '';
      const e = endEl   ? endEl.value   : '';
      av[day.key] = {
        type,
        start: (type === 'working' && isValidTime(s)) ? s : '',
        end:   (type === 'working' && isValidTime(e)) ? e : ''
      };
    });

    return {
      _schema:        'trades-avail-v1',
      _type:          'availability-only',
      _generated:     new Date().toISOString(),
      memberName:     sanitize($('sc-name').value, 100),
      email:          sanitize($('sc-email').value, 150),
      phone:          sanitize($('sc-phone').value, 20),
      role:           $('sc-role').value,
      employmentType: $('sc-basis').value,
      lic:            sanitize($('sc-lic').value, 80),
      ticket:         sanitize($('sc-ticket').value, 120),
      availability:   av
    };
  }

  // ─────────────────────────────────────────────
  // FILE HELPERS
  // ─────────────────────────────────────────────

  function makeFilename(name) {
    const slug = (name || 'worker')
      .replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    return 'trades-avail-' + slug + '-' + new Date().toISOString().slice(0, 10) + '.json';
  }

  function downloadFile(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openEmail(managerEmail, memberName, filename) {
    const subj = encodeURIComponent('Trades & Field Services Roster Availability — ' + memberName);
    const body = encodeURIComponent(
      'Hi,\n\nPlease find my weekly availability submission attached as:\n    ' + filename +
      '\n\nTo import it into the Trades & Field Services Roster, go to:\n    Backup → Import Availability → select the attached file\n\n' +
      'Submitted by: '  + memberName + '\nSubmitted at: ' + new Date().toLocaleString() +
      '\n\n— Sent via Trades & Field Services Roster Availability Form'
    );
    window.location.href =
      'mailto:' + encodeURIComponent(managerEmail) + '?subject=' + subj + '&body=' + body;
  }

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────

  function setSubmitBtnState(loading) {
    const btn = $('sc-submit-btn');
    btn.disabled = loading;
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    const ic = document.createElement('span');
    const lb = document.createElement('span');
    if (loading) {
      ic.textContent = '⏳';
      lb.textContent = 'Preparing…';
    } else {
      ic.textContent = '📎';
      lb.textContent = 'Download File & Open Email';
    }
    btn.appendChild(ic);
    btn.appendChild(lb);
  }

  function handleSubmit() {
    if (!validate()) {
      toast('Please fix the highlighted fields', 'error');
      return;
    }

    setSubmitBtnState(true);

    const payload  = buildPayload();
    const filename = makeFilename(payload.memberName);
    const manager  = sanitize($('sc-manager-email').value, 150);

    try {
      downloadFile(payload, filename);
      setTimeout(() => openEmail(manager, payload.memberName, filename), 400);

      $('sc-form-area').style.display = 'none';
      $('sc-success').classList.add('open');
      $('sc-filename-display').textContent = filename;
      toast('File downloaded ✓', 'success');
    } catch {
      setSubmitBtnState(false);
      toast('Something went wrong. Try again.', 'error');
    }
  }

  // ─────────────────────────────────────────────
  // SHARE JSON (Web Share API — iOS + Android)
  // ─────────────────────────────────────────────

  async function handleShare() {
    if (!navigator.canShare) {
      toast('Sharing not supported on this device', 'error');
      return;
    }

    const payload  = buildPayload();
    const filename = makeFilename(payload.memberName);
    const json     = JSON.stringify(payload, null, 2);
    const file     = new File([json], filename, { type: 'application/json' });

    try {
      await navigator.share({
        title: 'Trades & Field Services Availability',
        text:  'Weekly availability for ' + (payload.memberName || 'worker'),
        files: [file]
      });
      toast('Shared successfully!', 'success');
    } catch {
      toast('Share cancelled', 'error');
    }
  }

  // ─────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────

  function handleReset() {
    $('sc-success').classList.remove('open');
    $('sc-form-area').style.display = '';
    setSubmitBtnState(false);
  }

  // ─────────────────────────────────────────────
  // BOOT
  // ─────────────────────────────────────────────

  function init() {
    buildAvailabilityTable();

    const submitBtn = $('sc-submit-btn');
    if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

    const shareBtn = $('sc-share');
    if (shareBtn) shareBtn.addEventListener('click', handleShare);

    const resetBtn = $('sc-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
