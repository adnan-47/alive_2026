// ============================================================
// CONFIGURATION
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxN3cfMlL2kb0t9POsqcjBLqgOg-AScC1bv90TA4OzshfIeM6tJoUKtu7AwdSFDd_mY/exec";
const ADMIN_PASSWORD = "alive2025admin";
// ============================================================

let allData = [];

// QR CODE (saved in localStorage)
function uploadQR(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    localStorage.setItem('gpay_qr_alive2025', ev.target.result);
    applyQR(ev.target.result);
  };
  reader.readAsDataURL(file);
}
function applyQR(src) {
  const img = document.getElementById('qr-img');
  img.src = src; img.style.display = 'block';
  document.getElementById('qr-empty').style.display = 'none';
  document.getElementById('qr-hint').textContent = 'Scan to pay';
}
(function() {
  const saved = localStorage.getItem('gpay_qr_alive2025');
  if (saved) applyQR(saved);
})();

// FILE UPLOAD
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
  document.getElementById('file-name').textContent = file.name;
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.getElementById('preview-img');
      img.src = ev.target.result; img.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// VALIDATION
function validate() {
  let ok = true;
  const ids = ['name','age','class','school','address','unit','phone','whatsapp','parent-name','parent-phone'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) { if(el) el.classList.add('invalid'); ok = false; }
    else el.classList.remove('invalid');
  });
  const zone = document.getElementById('zone');
  if (!zone.value) {
    zone.classList.add('invalid');
    document.getElementById('zone-err').style.display = 'block';
    ok = false;
  } else {
    zone.classList.remove('invalid');
    document.getElementById('zone-err').style.display = 'none';
  }
  ['phone','whatsapp','parent-phone'].forEach(id => {
    const el = document.getElementById(id);
    const v = el.value.replace(/\s/g,'');
    const errEl = document.getElementById(id+'-err');
    if (v && !/^(\+91)?[6-9]\d{9}$/.test(v)) {
      el.classList.add('invalid');
      if (errEl) errEl.style.display = 'block';
      ok = false;
    } else if (errEl) errEl.style.display = 'none';
  });
  if (!document.getElementById('receipt-file').files.length) {
    document.getElementById('file-err').style.display = 'block'; ok = false;
  } else document.getElementById('file-err').style.display = 'none';
  return ok;
}

// SUBMIT FORM
document.getElementById('reg-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!validate()) return;
  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = 'SUBMITTING...';
  const file = document.getElementById('receipt-file').files[0];
  let base64 = '';
  if (file) {
    base64 = await new Promise(res => {
      const r = new FileReader();
      r.onload = ev => res(ev.target.result);
      r.readAsDataURL(file);
    });
  }
  const payload = {
    name: document.getElementById('name').value.trim(),
    age: document.getElementById('age').value.trim(),
    class: document.getElementById('class').value.trim(),
    school: document.getElementById('school').value.trim(),
    address: document.getElementById('address').value.trim(),
    zone: document.getElementById('zone').value.trim(),
    unit: document.getElementById('unit').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    whatsapp: document.getElementById('whatsapp').value.trim(),
    parentName: document.getElementById('parent-name').value.trim(),
    parentPhone: document.getElementById('parent-phone').value.trim(),
    receipt: base64,
    timestamp: new Date().toLocaleString('en-IN')
  };
  try {
    const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.status === 'ok') {
      document.getElementById('reg-form').style.display = 'none';
      document.getElementById('success-screen').style.display = 'block';
      document.querySelector('.gpay-notice').style.display = 'none';
      window.scrollTo(0, 0);
    } else throw new Error(data.error || 'Unknown error');
  } catch(err) {
    alert('Submission failed. Check your connection.\n\n' + err.message);
    btn.disabled = false; btn.textContent = 'SUBMIT REGISTRATION →';
  }
});

// ADMIN
function checkAdmin() {
  if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) {
    document.getElementById('admin-modal').classList.remove('open');
    document.getElementById('main-page').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    document.querySelector('.admin-link').style.display = 'none';
    loadData();
  } else {
    document.getElementById('admin-err').style.display = 'block';
  }
}
function closeAdminModal() {
  document.getElementById('admin-modal').classList.remove('open');
  document.getElementById('admin-pass').value = '';
  document.getElementById('admin-err').style.display = 'none';
}
function logoutAdmin() {
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('main-page').style.display = 'block';
  document.querySelector('.admin-link').style.display = 'block';
}

// TABS
function switchTab(tab) {
  document.getElementById('tab-analytics').classList.toggle('active', tab === 'analytics');
  document.getElementById('tab-data').classList.toggle('active', tab === 'data');
  document.getElementById('analytics-tab').style.display = tab === 'analytics' ? 'block' : 'none';
  document.getElementById('data-tab').style.display = tab === 'data' ? 'block' : 'none';
}

// LOAD DATA
async function loadData() {
  const tbody = document.getElementById('admin-tbody');
  tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;color:var(--muted);padding:2rem">Loading...</td></tr>';
  try {
    const res = await fetch(SCRIPT_URL + '?action=get');
    const data = await res.json();
    allData = data.rows || [];
    renderStats(allData);
    renderAnalytics(allData);
    renderTable(allData);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;color:#e05;padding:2rem">Failed to load. Check Apps Script URL.</td></tr>';
  }
}

function renderStats(rows) {
  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><div class="s-num">${rows.length}</div><div class="s-label">Total Registrations</div></div>
    <div class="stat-card"><div class="s-num">${[...new Set(rows.map(r=>r[5]))].filter(Boolean).length}</div><div class="s-label">Active Zones</div></div>
    <div class="stat-card"><div class="s-num">${[...new Set(rows.map(r=>r[6]))].filter(Boolean).length}</div><div class="s-label">Units</div></div>
    <div class="stat-card"><div class="s-num">${rows.filter(r=>r[11]&&String(r[11]).startsWith('http')).length}</div><div class="s-label">Receipts Uploaded</div></div>
  `;
}

function renderAnalytics(rows) {
  renderBarChart('zone-chart', countBy(rows, 5), 15);
  renderBarChart('class-chart', countBy(rows, 2), 10);
  const dailyCounts = {};
  rows.forEach(r => {
    if (r[12]) {
      const d = String(r[12]).split(',')[0].trim();
      dailyCounts[d] = (dailyCounts[d]||0) + 1;
    }
  });
  renderBarChart('daily-chart', dailyCounts, 10);
}

function countBy(rows, col) {
  const c = {};
  rows.forEach(r => { const v = r[col]||'Unknown'; c[v]=(c[v]||0)+1; });
  return Object.fromEntries(Object.entries(c).sort((a,b)=>b[1]-a[1]));
}

function renderBarChart(id, data, limit) {
  const el = document.getElementById(id);
  const entries = Object.entries(data).slice(0, limit);
  if (!entries.length) { el.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:0.5rem 0">No data yet</div>'; return; }
  const max = Math.max(...entries.map(e=>e[1]), 1);
  el.innerHTML = entries.map(([label, count]) => `
    <div class="bar-row">
      <div class="bar-label" title="${label}">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/max*100)}%"></div></div>
      <div class="bar-count">${count}</div>
    </div>
  `).join('');
}

function renderTable(rows) {
  const tbody = document.getElementById('admin-tbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;color:var(--muted);padding:2rem">No registrations yet.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((r, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${r[0]||'—'}</strong></td>
      <td>${r[1]||'—'}</td>
      <td>${r[2]||'—'}</td>
      <td>${r[3]||'—'}</td>
      <td>${r[5]||'—'}</td>
      <td>${r[6]||'—'}</td>
      <td>${r[7]||'—'}</td>
      <td>${r[8]||'—'}</td>
      <td>${r[9]||'—'}</td>
      <td>${r[10]||'—'}</td>
      <td style="max-width:160px;white-space:normal;font-size:12px">${r[4]||'—'}</td>
      <td>${r[11]&&String(r[11]).startsWith('http')
        ? `<button class="view-img-btn" onclick="openImg('${r[11].replace(/'/g,"\\'")}','${(r[0]||'').replace(/'/g,"\\'")}')">🖼 View</button>`
        : '<span style="color:var(--muted);font-size:12px">—</span>'}</td>
      <td>${r[12]||'—'}</td>
    </tr>
  `).join('');
}

function filterTable() {
  const q = document.getElementById('search-input').value.toLowerCase();
  renderTable(allData.filter(r => r.some(c => String(c||'').toLowerCase().includes(q))));
}

// IMAGE POPUP
function openImg(url, name) {
  document.getElementById('popup-img').src = url;
  document.getElementById('popup-name').textContent = name ? 'Receipt – ' + name : 'Payment Receipt';
  document.getElementById('img-modal').classList.add('open');
}
function closeImgModal(e) {
  if (e.target === document.getElementById('img-modal'))
    document.getElementById('img-modal').classList.remove('open');
}

// EXPORT
function exportCSV() {
  const headers = ['Name','Age','Class','School','Address','Zone','Unit','Phone','WhatsApp','Parent Name','Parent Phone','Receipt URL','Timestamp'];
  const rows = allData.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'alive2025-registrations.csv';
  a.click();
}