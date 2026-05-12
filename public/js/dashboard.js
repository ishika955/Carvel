// ── dashboard.js ──

// Save token from URL if coming from Google OAuth
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');
if (urlToken) {
  sessionStorage.setItem('token', urlToken);
  sessionStorage.setItem('role', 'caretaker');
  sessionStorage.setItem('username', 'User');
  window.history.replaceState({}, document.title, '/dashboard.html');
}

const role     = sessionStorage.getItem('role')     || 'caretaker';
const username = sessionStorage.getItem('username') || 'User';
const token    = sessionStorage.getItem('token')    || '';
const authHeader = () => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

// ── PATIENT FILTER (globally tracked) ────────────────
let currentPatient = '';

// ── NAV CONFIG ────────────────────────────────────────
const NAV = {
  caretaker: [
    { icon:'📊', label:'Overview',     page:'ct-overview' },
    { icon:'❤️',  label:'Log Vitals',   page:'ct-vitals' },
    { icon:'💊', label:'Medications',  page:'ct-medications' },
    { icon:'📅', label:'Appointments', page:'ct-appointments' },
  ],
  family: [
    { icon:'📊', label:'Overview',        page:'fam-overview' },
    { icon:'🔔', label:'Alerts',          page:'fam-alerts' },
    { icon:'📋', label:'Health Summary',  page:'fam-health' },
  ]
};

const AVATARS = { caretaker:'🧑‍⚕️', family:'👨‍👩‍👧' };
const ROLES   = { caretaker:'Caretaker', family:'Family Member' };

// ── TOP-LEVEL chart instance ──────────────────────────
let vitalsChartInstance = null;

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  setTopbar();
  loadData();
  const first = NAV[role]?.[0]?.page;
  if (first) goPage(first);
});

// ── BUILD SIDEBAR ────────────────────────────────────
function buildSidebar() {
  document.getElementById('sbAvatar').textContent = AVATARS[role] || '👤';
  document.getElementById('sbName').textContent   = username;
  document.getElementById('sbRole').textContent   = ROLES[role] || role;

  const nav = document.getElementById('sbNav');
  nav.innerHTML = (NAV[role] || []).map(item => `
    <button class="sb-item" data-page="${item.page}" onclick="goPage('${item.page}', this)">
      <span class="sb-item-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join('');
}

// ── GO TO PAGE ───────────────────────────────────────
function goPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`p-${pageId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const match = document.querySelector(`[data-page="${pageId}"]`);
    if (match) match.classList.add('active');
  }

  const item = (NAV[role] || []).find(n => n.page === pageId);
  if (item) document.getElementById('topSection').textContent = item.label;
}

// ── TOPBAR DATE ──────────────────────────────────────
function setTopbar() {
  document.getElementById('topDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const dtInput = document.getElementById('vDate');
  if (dtInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dtInput.value = now.toISOString().slice(0,16);
  }
}

// ── LOAD DATA ────────────────────────────────────────
async function loadData() {
  if (role === 'caretaker') {
    await loadPatientSelector();
    await loadPatients();
    await loadCalendarAppts();
    await loadMedSchedule();
  } else if (role === 'family') {
    await loadPatientSelector();
    await loadAlerts();
    await loadFamilyPatients();
    await loadCalendarAppts();
  } else if (role === 'doctor') {
    await loadDoctorData();
  }
}

// ── PATIENT SELECTOR ─────────────────────────────────
async function loadPatientSelector() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = data.data || [];

    // Unique patient names nikalo
    const names = [...new Set(list.map(e => e.patientName).filter(Boolean))];

    const box = document.getElementById('patientSelectorBox');
    const sel = document.getElementById('patientSelector');
    if (!sel || !box) return;

    // Dropdown populate karo
    sel.innerHTML = `<option value="">— All Patients —</option>` +
      names.map(n => `<option value="${n}">${n}</option>`).join('');

    // Agar patients hain toh dropdown dikhao
    if (names.length > 0) box.style.display = 'block';

  } catch(e) {
    console.error('Patient selector load failed', e);
  }
}

// Jab user dropdown se patient select kare
function onPatientChange(name) {
  currentPatient = name;
  // Sab data naye filter ke saath reload karo
  if (role === 'caretaker') {
    loadPatients();
    loadMedSchedule();
  } else if (role === 'family') {
    loadAlerts();
    loadFamilyPatients();
  }
}

// ── CARETAKER: patients ───────────────────────────────
async function loadPatients() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = data.data || [];

    // Patient filter lagao
    const filtered = currentPatient
      ? list.filter(e => e.patientName === currentPatient)
      : list;

    let patientsToday = new Set();
    let medsGiven = 0;
    let medsTotal = 0;
    let appointments = 0;

    filtered.forEach(entry => {
      if (entry.type === "vitals")      patientsToday.add(entry.patientName);
      if (entry.type === "medication")  { medsTotal++; if (entry.status === "given") medsGiven++; }
      if (entry.type === "appointment") appointments++;
    });

    setText('ct-statPat',    currentPatient ? 1 : patientsToday.size);
    setText('ct-statMeds',   `${medsGiven}/${medsTotal}`);
    setText('ct-statAlerts', 0);
    setText('ct-statAppt',   appointments);

    // Timeline (Recent Activity)
    const tl = document.getElementById('ct-timeline');
    if (tl) {
      const recent = filtered.slice(0, 4);
      tl.innerHTML = recent.length
        ? recent.map(p => `
            <div class="tl-item">
              <div class="tl-left">
                <div class="tl-dot ${p.type === 'medication' && p.status === 'missed' ? 'warn' : 'ok'}"></div>
                <div class="tl-line"></div>
              </div>
              <div>
                <div class="tl-title">${p.patientName || 'Patient'}</div>
                <div class="tl-sub">${p.type === 'vitals' ? '🌡️ Vitals logged' : p.type === 'medication' ? '💊 ' + (p.medication || '') + ' — ' + (p.status || '') : p.type === 'appointment' ? '📅 Appointment' : p.type}</div>
                <div class="tl-time">${p.date ? new Date(p.date).toLocaleDateString('en-IN') : 'Today'}</div>
              </div>
            </div>`).join('')
        : `<div class="empty">No recent activity</div>`;
    }

    // Previous Vitals (right side of Log Vitals page)
    const pv = document.getElementById('ct-prevVitals');
    if (pv) {
      const vitals = filtered.filter(e => e.type === 'vitals');
      pv.innerHTML = vitals.length
        ? vitals.slice().reverse().map(v => `
            <div class="rpt-row">
              <div class="rpt-icon">📊</div>
              <div style="flex:1">
                <div class="rpt-name">${v.patientName || 'Patient'}</div>
                <div class="rpt-by">Temp: ${v.temperature || '—'}°F · Pulse: ${v.pulse || '—'}bpm · O₂: ${v.oxygen || '—'}%</div>
              </div>
              <div class="rpt-date">${v.date ? new Date(v.date).toLocaleDateString('en-IN') : 'Today'}</div>
            </div>`).join('')
        : `<div class="empty">No previous entries yet</div>`;
    }

  } catch(err) {
    console.error('loadPatients error:', err);
    setDashes(['ct-statPat','ct-statMeds','ct-statAlerts','ct-statAppt']);
  }
}

// ── CARETAKER: med schedule ───────────────────────────
async function loadMedSchedule() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    // FIX: data.data use karo, data.patients nahi
    const list = data.data || [];

    // Patient filter lagao
    const filtered = currentPatient
      ? list.filter(e => e.patientName === currentPatient)
      : list;

    const meds = filtered.filter(e => e.type === 'medication');

    const render = (elId) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.innerHTML = meds.length
        ? meds.map(m => `
            <div class="med-row">
              <div class="dot ${m.status || 'pending'}"></div>
              <div class="med-info">
                <div class="med-name">${m.medication || m.name || 'Unknown'}</div>
                <div class="med-meta">${m.patientName || ''} · ${m.dosage || ''}</div>
              </div>
              <div class="med-time">${m.time || ''}</div>
              <div class="tag ${m.status || 'pending'}">${m.status || 'pending'}</div>
            </div>`).join('')
        : `<div class="empty">No medications scheduled</div>`;
    };

    render('ct-overviewMeds');
    render('ct-medSchedule');

  } catch(err) {
    console.error('loadMedSchedule error:', err);
    ['ct-overviewMeds','ct-medSchedule'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="empty">Could not load medications</div>`;
    });
  }
}

// ── FAMILY: alerts ────────────────────────────────────
async function loadAlerts() {
  try {
    const res  = await fetch('/alerts', { headers: authHeader() });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.data || []);

    // Patient filter lagao (agar patientName field ho alert mein)
    const filtered = currentPatient
      ? list.filter(a => !a.patientName || a.patientName === currentPatient)
      : list;

    const unread = filtered.filter(a => !a.read).length;

    setText('fam-statAlerts',    unread);
    setText('fam-alertBadge',    `${unread} new`);
    setText('fam-allAlertBadge', `${filtered.length} total`);

    if (unread > 0) {
      setText('alertCount', unread);
      document.getElementById('alertPill').classList.add('visible');
      const latest = filtered.find(a => !a.read);
      if (latest) {
        const popup = document.getElementById('fam-popup');
        setText('fam-popupMsg', latest.title || 'New alert!');
        if (popup) popup.style.display = 'flex';
      }
    }

    const icons = { emergency:'🚨', missed_medication:'💊', appointment:'📅', info:'ℹ️' };
    const html = filtered.length
      ? filtered.map(a => `
          <div class="al-row ${a.type === 'info' ? 'info' : a.type === 'ok' ? 'ok' : ''}">
            <div class="al-icon">${icons[a.type] || '🔔'}</div>
            <div>
              <div class="al-title">${a.title || a.message || 'Alert'}</div>
              <div class="al-desc">${a.description || ''}</div>
              <div class="al-time">${a.time || a.createdAt || ''}</div>
            </div>
          </div>`).join('')
      : `<div class="empty">No alerts at this time ✓</div>`;

    ['fam-alertList','fam-allAlerts'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });

  } catch(err) {
    console.error('loadAlerts error:', err);
    ['fam-alertList','fam-allAlerts'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="empty">Could not load alerts</div>`;
    });
  }
}

// ── FAMILY: patients / vitals / chart ────────────────
async function loadFamilyPatients() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = data.data || [];

    // Patient filter lagao
    const filtered = currentPatient
      ? list.filter(e => e.patientName === currentPatient)
      : list;

    const vitals = filtered.filter(e => e.type === "vitals");
    const meds   = filtered.filter(e => e.type === "medication");
    const appts  = filtered.filter(e => e.type === "appointment");

    if (!vitals.length) {
      // Agar koi vitals nahi toh empty state dikhao
      setText('fam-statStatus', '—');
      setText('fam-temp',  '—');
      setText('fam-pulse', '—');
      setText('fam-bp',    '—');
      setText('fam-o2',    '—');
      setText('fam-vNotes', 'No vitals recorded yet');
      setText('fam-statMeds', '0/0');
      return;
    }

    const latest = vitals[vitals.length - 1];
    const prev   = vitals.length > 1 ? vitals[vitals.length - 2] : null;

    // ── STATUS ──
    let status = "Stable";
    if (Number(latest.temperature) >= 102 || Number(latest.oxygen) < 90) status = "Critical";
    else if (Number(latest.pulse) > 120 || Number(latest.temperature) >= 100) status = "Warning";

    const statusEl = document.getElementById("fam-statStatus");
    if (statusEl) {
      statusEl.textContent = status;
      if (status === "Stable")        statusEl.style.color = "var(--green)";
      else if (status === "Warning")  statusEl.style.color = "#9a7530";
      else                            statusEl.style.color = "var(--red)";
    }

    // ── TREND ──
    let overallTrend = "Stable";
    if (prev) {
      const tempDiff = Number(latest.temperature) - Number(prev.temperature);
      const o2Diff   = Number(latest.oxygen) - Number(prev.oxygen);
      if (tempDiff > 1 || o2Diff < -3)        overallTrend = "Worsening";
      else if (tempDiff < -0.5 || o2Diff > 2) overallTrend = "Improving";
    }
    const trendEl = document.getElementById("fam-statusTrend");
    if (trendEl) {
      trendEl.textContent = overallTrend;
      trendEl.style.color = overallTrend === "Improving" ? "var(--green)" : overallTrend === "Worsening" ? "var(--red)" : "var(--muted)";
    }

    const vitalTrendEl = document.getElementById("fam-vitalTrend");
    if (vitalTrendEl) {
      vitalTrendEl.textContent = overallTrend;
      vitalTrendEl.className = "badge " + (overallTrend === "Improving" ? "green" : overallTrend === "Worsening" ? "red" : "");
    }

    // ── VITAL CARDS ──
    const setVitalCard = (cardId, valId, trendId, value, prevVal, danger, warn) => {
      setText(valId, value || "—");
      const card = document.getElementById(cardId);
      const tEl  = document.getElementById(trendId);
      if (!card) return;
      const num = Number(value);
      if (num >= danger)    card.className = "vital-card danger";
      else if (num >= warn) card.className = "vital-card warning";
      else                  card.className = "vital-card ok";

      if (tEl && prevVal) {
        const diff = num - Number(prevVal);
        if (Math.abs(diff) < 0.5) { tEl.textContent = "Stable";       tEl.className = "vc-trend stable"; }
        else if (diff > 0)        { tEl.textContent = "Worsening ↑";  tEl.className = "vc-trend worsening"; }
        else                      { tEl.textContent = "Improving ↓";  tEl.className = "vc-trend improving"; }
      }
    };

    setVitalCard("vc-temp",  "fam-temp",  "fam-tempTrend",  latest.temperature, prev?.temperature, 102, 99.5);
    setVitalCard("vc-pulse", "fam-pulse", "fam-pulseTrend", latest.pulse,       prev?.pulse,       120, 100);
    setVitalCard("vc-o2",    "fam-o2",    "fam-o2Trend",    latest.oxygen,      prev?.oxygen,       89,  93);
    setText("fam-bp",        latest.bloodPressure || "—");
    setText("fam-vNotes",    latest.notes || "No notes recorded");
    setText("fam-statCheckin", latest.date ? new Date(latest.date).toLocaleDateString("en-IN") : "Today");

    // ── CHART ──
    const last7   = vitals.slice(-7);
    const labels  = last7.map(v => v.date ? new Date(v.date).toLocaleDateString("en-IN", { day:"numeric", month:"short" }) : "—");
    const temps   = last7.map(v => Number(v.temperature) || null);
    const pulses  = last7.map(v => Number(v.pulse) || null);
    const oxygens = last7.map(v => Number(v.oxygen) || null);

    const ctx = document.getElementById("fam-vitalsChart");
    if (ctx) {
      if (vitalsChartInstance) vitalsChartInstance.destroy();
      vitalsChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            { label:"Temperature", data:temps,   borderColor:"#c0614a", backgroundColor:"rgba(192,97,74,.08)",  tension:0.4, pointRadius:4, borderWidth:2 },
            { label:"Pulse",       data:pulses,  borderColor:"#5a7a9f", backgroundColor:"rgba(90,122,159,.08)", tension:0.4, pointRadius:4, borderWidth:2 },
            { label:"Oxygen",      data:oxygens, borderColor:"#5a8f6a", backgroundColor:"rgba(90,143,106,.08)", tension:0.4, pointRadius:4, borderWidth:2 },
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid:{ color:"rgba(0,0,0,.05)" }, ticks:{ font:{ size:10 } } },
            y: { grid:{ color:"rgba(0,0,0,.05)" }, ticks:{ font:{ size:10 } } }
          }
        }
      });
    }

    // ── MEDS SUMMARY ──
    const given = meds.filter(m => m.status === "given").length;
    setText("fam-statMeds", `${given}/${meds.length}`);

    const medHtml = meds.length
      ? meds.map(m => `
          <div class="med-row">
            <div class="dot ${m.status || 'pending'}"></div>
            <div class="med-info">
              <div class="med-name">${m.medication || '—'}</div>
              <div class="med-meta">${m.dosage || ''}</div>
            </div>
            <div class="med-time">${m.time || ''}</div>
            <div class="tag ${m.status || 'pending'}">${m.status || 'pending'}</div>
          </div>`).join("")
      : `<div class="empty">No medication records</div>`;

    ["fam-overviewMeds", "fam-medSummary"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = medHtml;
    });

    // ── VITALS HISTORY ──
    const vh = document.getElementById("fam-vitalHistory");
    if (vh) {
      vh.innerHTML = vitals.length
        ? vitals.slice(-7).reverse().map(v => `
            <div class="rpt-row">
              <div class="rpt-icon">📊</div>
              <div style="flex:1">
                <div class="rpt-name">${v.patientName || "Patient"}</div>
                <div class="rpt-by">Temp: ${v.temperature}°F · Pulse: ${v.pulse}bpm · O₂: ${v.oxygen}%</div>
              </div>
              <div class="rpt-date">${v.date ? new Date(v.date).toLocaleDateString("en-IN") : "Today"}</div>
            </div>`).join("")
        : `<div class="empty">No vitals history</div>`;
    }

  } catch(err) {
    console.error("Family dashboard error:", err);
  }
}

// ── DOCTOR ────────────────────────────────────────────
async function loadDoctorData() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = data.data || [];

    const patients = [...new Set(list.map(e => e.patientName).filter(Boolean))];
    const vitals   = list.filter(e => e.type === 'vitals');
    const appts    = list.filter(e => e.type === 'appointment');
    const meds     = list.filter(e => e.type === 'medication');

    setText('doc-statPat',  patients.length);
    setText('doc-statRep',  vitals.length);
    setText('doc-statAppt', appts.length);
    setText('doc-statRx',   meds.length);

    const latest = vitals[vitals.length - 1];
    if (latest) {
      setText('doc-temp',  latest.temperature || '—');
      setText('doc-pulse', latest.pulse || '—');
      setText('doc-bp',    latest.bloodPressure || '—');
    }

    const rptHtml = vitals.length
      ? vitals.slice().reverse().map(v => `
          <div class="rpt-row">
            <div class="rpt-icon">📋</div>
            <div style="flex:1">
              <div class="rpt-name">${v.patientName || 'Patient'}</div>
              <div class="rpt-by">Logged by ${v.loggedBy || 'caretaker'} · Temp: ${v.temperature}°F</div>
            </div>
            <div class="rpt-date">${v.date ? new Date(v.date).toLocaleDateString('en-IN') : 'Recent'}</div>
          </div>`).join('')
      : `<div class="empty">No reports yet</div>`;

    ['doc-reportList','doc-allReports'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = rptHtml;
    });

  } catch(err) {
    console.error('loadDoctorData error:', err);
    setDashes(['doc-statPat','doc-statRep','doc-statAppt','doc-statRx']);
  }
}

// ── SUBMIT: Vitals ────────────────────────────────────
async function submitVitals() {
  const body = {
    type:          'vitals',
    patientName:   val('vPatient'),
    date:          val('vDate'),
    temperature:   val('vTemp'),
    pulse:         val('vPulse'),
    bloodPressure: val('vBP'),
    oxygen:        val('vO2'),
    notes:         val('vNotes'),
    loggedBy:      username
  };

  if (!body.patientName) { toast('Please enter patient name', true); return; }

  await postTo('/patients', body, 'Vitals saved', async () => {
    try {
      if (Number(body.temperature) >= 102) {
        await fetch('/alerts', {
          method: 'POST', headers: authHeader(),
          body: JSON.stringify({
            type: "emergency", title: "High Fever",
            message: `${body.patientName} has high fever (${body.temperature}°F)`,
            description: `${body.patientName} has high fever (${body.temperature}°F)`,
            level: "critical", createdAt: new Date().toISOString(), read: false
          })
        });
      }
      if (Number(body.oxygen) < 90) {
        await fetch('/alerts', {
          method: 'POST', headers: authHeader(),
          body: JSON.stringify({
            type: "emergency", title: "Low Oxygen Level",
            message: `${body.patientName} oxygen dropped to ${body.oxygen}%`,
            description: `${body.patientName} oxygen dropped to ${body.oxygen}%`,
            level: "critical", createdAt: new Date().toISOString(), read: false
          })
        });
      }
    } catch(err) { console.error("Alert creation failed:", err); }

    clearForm(['vPatient','vTemp','vPulse','vBP','vO2','vNotes']);
    await loadPatientSelector();
    loadPatients();
    loadMedSchedule();
  });
}

// ── SUBMIT: Medication ────────────────────────────────
async function submitMedication() {
  const body = {
    type:        'medication',
    patientName: val('mPatient'),
    medication:  val('mName'),
    dosage:      val('mDose'),
    time:        val('mTime'),
    status:      val('mStatus'),
    notes:       val('mNotes'),
    loggedBy:    username
  };
  if (!body.patientName || !body.medication) { toast('Fill in patient and medication', true); return; }
  await postTo('/patients', body, 'Medication logged', async () => {
    clearForm(['mPatient','mName','mDose','mTime','mNotes']);
    await loadPatientSelector();
    loadPatients();
    loadMedSchedule();
  });
}

// ── SUBMIT: Prescription ──────────────────────────────
async function submitPrescription() {
  const body = {
    type:         'prescription',
    patientName:  val('rxPatient'),
    medication:   val('rxMed'),
    dosage:       val('rxDose'),
    frequency:    val('rxFreq'),
    notes:        val('rxNotes'),
    prescribedBy: username
  };
  if (!body.patientName || !body.medication) { toast('Fill in patient and medication', true); return; }
  await postTo('/patients', body, 'Prescription updated', () => {
    clearForm(['rxPatient','rxMed','rxDose','rxNotes']);
  });
}

// ── HELPERS ───────────────────────────────────────────
async function postTo(url, body, successMsg, onSuccess) {
  try {
    const res = await fetch(url, { method:'POST', headers: authHeader(), body: JSON.stringify(body) });
    if (res.ok) { toast(successMsg); onSuccess?.(); }
    else        { toast('Server returned an error', true); }
  } catch { toast('Could not connect to server', true); }
}

function val(id)        { return document.getElementById(id)?.value?.trim() || ''; }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function setDashes(ids) { ids.forEach(id => setText(id, '—')); }
function clearForm(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }

function toast(msg, isErr = false) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }

async function uploadImage() {
  const fileInput = document.getElementById("profileImage");
  if (!fileInput.files[0]) { alert("Please select an image"); return; }

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  try {
    const response = await fetch("/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (data.success) {
      const preview = document.getElementById("profilePreview");
      preview.src = data.imageUrl + "?t=" + new Date().getTime();
      alert("Image uploaded successfully");
    } else {
      alert("Upload failed");
    }
  } catch(err) {
    console.log(err);
    alert("Server error");
  }
}

// ═══════════════════════════════════════════════════════
// APPOINTMENT CALENDAR
// ═══════════════════════════════════════════════════════

let calDate = new Date();
let calSelectedDate = null;
let calAppointments = [];

// Load all appointments from DB
async function loadCalendarAppts() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = data.data || [];
    calAppointments = list.filter(e => e.type === 'appointment');
    renderCalendar();
    renderFamCalendar();
    renderUpcomingList();
  } catch(e) {
    console.error('Calendar load failed', e);
  }
}

// ── UPCOMING LIST (below the calendar) ──────────────────
function renderUpcomingList() {
  const el = document.getElementById('ct-upcomingList');
  if (!el) return;

  const today = new Date();

  // Patient filter lagao upcoming list mein bhi
  const appts = currentPatient
    ? calAppointments.filter(a => a.patientName === currentPatient)
    : calAppointments;

  const upcoming = appts
    .filter(a => a.date && new Date(a.date + 'T00:00:00') >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!upcoming.length) {
    el.innerHTML = `<div class="empty">No upcoming appointments scheduled</div>`;
    return;
  }

  el.innerHTML = upcoming.map(a => {
    const d = new Date(a.date + 'T00:00:00');
    return `
      <div class="appt-upcoming-card">
        <div class="appt-upcoming-date">
          <div class="appt-upcoming-day">${d.getDate()}</div>
          <div class="appt-upcoming-mon">${d.toLocaleDateString('en-IN',{month:'short'})}</div>
        </div>
        <div class="appt-upcoming-info">
          <div class="appt-upcoming-doctor">Dr. ${a.doctor || '—'}</div>
          <div class="appt-upcoming-sub">
            ${a.time ? '🕐 ' + a.time : 'Time TBD'}
            ${a.reason ? ' · ' + a.reason : ''}
          </div>
          <div class="appt-upcoming-patient">${a.patientName || ''}</div>
        </div>
      </div>`;
  }).join('');
}

// ── CARETAKER CALENDAR ──────────────────────────────────
function renderCalendar() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const title = document.getElementById('calMonthTitle');
  if (title) title.textContent = calDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const year  = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  let html = days.map(d => `<div class="appt-day-name">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="appt-cell other-month"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getDate()===d && today.getMonth()===month && today.getFullYear()===year;

    // Patient filter calendar mein bhi
    const allDayAppts = calAppointments.filter(a => a.date && a.date.startsWith(dateStr));
    const dayAppts = currentPatient
      ? allDayAppts.filter(a => a.patientName === currentPatient)
      : allDayAppts;

    const chips = dayAppts.map(a =>
      `<div class="appt-chip" title="${a.patientName} — Dr.${a.doctor}">
        🩺 ${a.patientName || 'Patient'}
      </div>`
    ).join('');

    html += `
      <div class="appt-cell ${isToday ? 'today' : ''} ${dayAppts.length ? 'has-appt' : ''}"
           onclick="openCalModal('${dateStr}')">
        <div class="appt-cell-num">${d}</div>
        ${chips}
      </div>`;
  }

  grid.innerHTML = html;
}

function calPrev() { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); }
function calNext() { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); }

function openCalModal(dateStr) {
  calSelectedDate = dateStr;
  const modal = document.getElementById('calModal');
  const d = new Date(dateStr + 'T00:00:00');

  const weekday = document.getElementById('calModalWeekday');
  if (weekday) weekday.textContent = d.toLocaleDateString('en-IN', { weekday: 'long' });

  document.getElementById('calModalDate').textContent =
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const dayAppts = calAppointments.filter(a => a.date && a.date.startsWith(dateStr));
  const existingLabel = dayAppts.length
    ? `<div class="appt-existing-label">${dayAppts.length} appointment${dayAppts.length > 1 ? 's' : ''} on this day</div>`
    : `<div class="appt-existing-label" style="opacity:.5">No appointments on this day</div>`;

  const cards = dayAppts.map(a => `
    <div class="appt-existing-card">
      <div class="appt-existing-icon">🩺</div>
      <div style="flex:1">
        <div class="appt-existing-name">${a.patientName}</div>
        <div class="appt-existing-meta">
          Dr. ${a.doctor || '—'} · ${a.time || 'Time TBD'}
          ${a.reason ? ' · ' + a.reason : ''}
        </div>
      </div>
      <button class="appt-del-btn" onclick="deleteCalAppt(${a.id})">🗑 Delete</button>
    </div>`).join('');

  document.getElementById('calModalAppts').innerHTML = existingLabel + cards;
  modal.classList.add('open');
}

function closeCalModal() {
  document.getElementById('calModal').classList.remove('open');
  calSelectedDate = null;
  ['calPatient','calDoctor','calTime','calReason'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

async function saveCalAppt() {
  const patient = document.getElementById('calPatient').value.trim();
  const doctor  = document.getElementById('calDoctor').value.trim();
  const time    = document.getElementById('calTime').value;
  const reason  = document.getElementById('calReason').value.trim();

  if (!patient || !calSelectedDate) { toast('Patient name aur date required hai', true); return; }

  const body = {
    type: 'appointment',
    patientName: patient,
    doctor: doctor,
    date: calSelectedDate,
    time: time,
    reason: reason,
    bookedBy: username
  };

  await postTo('/patients', body, 'Appointment saved!', async () => {
    closeCalModal();
    await loadCalendarAppts();
  });
}

async function deleteCalAppt(id) {
  if (!confirm('Delete this appointment?')) return;
  try {
    const res = await fetch(`/patients/${id}`, {
      method: 'DELETE', headers: authHeader()
    });
    if (res.ok) {
      toast('Appointment deleted');
      await loadCalendarAppts();
      closeCalModal();
    } else {
      toast('Delete failed', true);
    }
  } catch { toast('Server error', true); }
}

// ── FAMILY CALENDAR (read-only) ─────────────────────────
let famCalDate = new Date();

function renderFamCalendar() {
  const grid = document.getElementById('famCalGrid');
  if (!grid) return;

  const title = document.getElementById('famCalMonthTitle');
  if (title) title.textContent = famCalDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const year  = famCalDate.getFullYear();
  const month = famCalDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  let html = days.map(d => `<div class="appt-day-name">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="appt-cell other-month"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getDate()===d && today.getMonth()===month && today.getFullYear()===year;

    // Patient filter family calendar mein bhi
    const allDayAppts = calAppointments.filter(a => a.date && a.date.startsWith(dateStr));
    const dayAppts = currentPatient
      ? allDayAppts.filter(a => a.patientName === currentPatient)
      : allDayAppts;

    const dots = dayAppts.map(a =>
      `<div class="appt-chip">🩺 ${a.patientName}</div>`
    ).join('');

    html += `
      <div class="appt-cell ${isToday ? 'today' : ''} ${dayAppts.length ? 'has-appt' : ''}">
        <div class="appt-cell-num">${d}</div>
        ${dots}
      </div>`;
  }

  grid.innerHTML = html;
}

function famCalPrev() { famCalDate.setMonth(famCalDate.getMonth() - 1); renderFamCalendar(); }
function famCalNext() { famCalDate.setMonth(famCalDate.getMonth() + 1); renderFamCalendar(); }