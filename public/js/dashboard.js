// ── dashboard.js ──
const role     = sessionStorage.getItem('role')     || 'caretaker';
const username = sessionStorage.getItem('username') || 'User';
const token    = sessionStorage.getItem('token')    || '';

const authHeader = () => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});
//dc
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

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  setTopbar();
  loadData();
  // open first page
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
  // hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // show target
  const target = document.getElementById(`p-${pageId}`);
  if (target) target.classList.add('active');

  // update sidebar active state
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const match = document.querySelector(`[data-page="${pageId}"]`);
    if (match) match.classList.add('active');
  }

  // update topbar title
  const item = (NAV[role] || []).find(n => n.page === pageId);
  if (item) document.getElementById('topSection').textContent = item.label;
}

// ── TOPBAR DATE ──────────────────────────────────────
function setTopbar() {
  document.getElementById('topDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // pre-fill datetime
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
    await loadPatients();
    await loadMedSchedule();
  } else if (role === 'family') {
    await loadAlerts();
    await loadFamilyPatients();
  } else if (role === 'doctor') {
    await loadDoctorData();
  }
}

// ── CARETAKER: patients ───────────────────────────────
async function loadPatients() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    //const list = Array.isArray(data) ? data : (data.patients || []);
    const list = data.data || [];

    let patientsToday = new Set();
let medsGiven = 0;
let medsTotal = 0;
let appointments = 0;

list.forEach(entry => {

  if (entry.type === "vitals") {
    patientsToday.add(entry.patientName);
  }

  if (entry.type === "medication") {
    medsTotal++;
    if (entry.status === "given") medsGiven++;
  }

  if (entry.type === "appointment") {
    appointments++;
  }

});

setText('ct-statPat', patientsToday.size);
setText('ct-statMeds', `${medsGiven}/${medsTotal}`);
setText('ct-statAlerts', 0);
setText('ct-statAppt', appointments);

    // timeline
    const tl = document.getElementById('ct-timeline');
    if (list.length) {
      tl.innerHTML = list.slice(0,4).map(p => `
        <div class="tl-item">
          <div class="tl-left"><div class="tl-dot ${p.alert ? 'warn' : 'ok'}"></div><div class="tl-line"></div></div>
          <div>
            <div class="tl-title">${p.name || 'Patient'}</div>
            <div class="tl-sub">${p.status || 'Stable'} · ${p.room || ''}</div>
            <div class="tl-time">${p.lastUpdated || 'Today'}</div>
          </div>
        </div>`).join('');
    }
  } catch { setDashes(['ct-statPat','ct-statMeds','ct-statAlerts','ct-statAppt']); }
}

async function loadMedSchedule() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.patients || []);
    const meds = list.flatMap(p => (p.medications || []).map(m => ({ ...m, patient: p.name })));

    const render = (elId) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.innerHTML = meds.length
        ? meds.slice(0,6).map(m => `
            <div class="med-row">
              <div class="dot ${m.status||'pending'}"></div>
              <div class="med-info">
                <div class="med-name">${m.name || m.medication || 'Unknown'}</div>
                <div class="med-meta">${m.patient}</div>
              </div>
              <div class="med-time">${m.time||''}</div>
              <div class="tag ${m.status||'pending'}">${m.status||'pending'}</div>
            </div>`).join('')
        : `<div class="empty">No medications scheduled</div>`;
    };
    render('ct-overviewMeds');
    render('ct-medSchedule');
  } catch {
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
    const list = Array.isArray(data) ? data : (data.alerts || []);
    const unread = list.filter(a => !a.read).length;

    setText('fam-statAlerts', unread);
    setText('fam-alertBadge', `${unread} new`);
    setText('fam-allAlertBadge', `${list.length} total`);

    if (unread > 0) {
      setText('alertCount', unread);
      document.getElementById('alertPill').classList.add('visible');
    }

    const icons = { emergency:'🚨', missed_medication:'💊', appointment:'📅', info:'ℹ️' };
    const html = list.length
      ? list.map(a => `
          <div class="al-row ${a.type==='info'?'info':a.type==='ok'?'ok':''}">
            <div class="al-icon">${icons[a.type]||'🔔'}</div>
            <div>
              <div class="al-title">${a.title || a.message || 'Alert'}</div>
              <div class="al-desc">${a.description||''}</div>
              <div class="al-time">${a.time || a.createdAt ||''}</div>
            </div>
          </div>`).join('')
      : `<div class="empty">No alerts at this time ✓</div>`;

    ['fam-alertList','fam-allAlerts'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  } catch {
    ['fam-alertList','fam-allAlerts'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="empty">Could not load alerts</div>`;
    });
  }
}

async function loadFamilyPatients() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = data.data || [];

    const vitals = list.filter(e => e.type === "vitals");
    const meds   = list.filter(e => e.type === "medication");

    if (!vitals.length) return;

    const latest = vitals[vitals.length - 1];

    let status = "Stable";

if (Number(latest.temperature) >= 102) {
  status = "Critical";
}
else if (Number(latest.oxygen) < 90) {
  status = "Critical";
}
else if (Number(latest.pulse) > 120) {
  status = "Warning";
}

setText('fam-statStatus', status);
    setText('fam-statCheckin', latest.date || 'Today');

    setText('fam-temp',  latest.temperature || '—');
    setText('fam-pulse', latest.pulse || '—');
    setText('fam-bp',    latest.bloodPressure || '—');
    setText('fam-o2',    latest.oxygen || '—');
    setText('fam-vNotes', latest.notes || 'No notes recorded');

    const given = meds.filter(m => m.status === "given").length;
    setText('fam-statMeds', `${given}/${meds.length}`);

    const medEl = document.getElementById('fam-medSummary');
    if (medEl) {
      medEl.innerHTML = meds.length
        ? meds.map(m => `
          <div class="med-row">
            <div class="dot ${m.status || 'pending'}"></div>
            <div class="med-info">
              <div class="med-name">${m.medication}</div>
            </div>
            <div class="med-time">${m.time}</div>
            <div class="tag ${m.status || 'pending'}">${m.status || 'pending'}</div>
          </div>
        `).join('')
        : `<div class="empty">No medication records</div>`;
    }

    const vh = document.getElementById('fam-vitalHistory');
    if (vh) {
      vh.innerHTML = vitals.length
        ? vitals.slice(-5).reverse().map(v => `
          <div class="rpt-row">
            <div class="rpt-icon">📊</div>
            <div style="flex:1">
              <div class="rpt-name">${v.patientName}</div>
              <div class="rpt-by">Temp: ${v.temperature} · Pulse: ${v.pulse}</div>
            </div>
            <div class="rpt-date">${v.date}</div>
          </div>
        `).join('')
        : `<div class="empty">No vitals history</div>`;
    }

  } catch (err) {
    console.error(err);
  }
}

// ── DOCTOR ────────────────────────────────────────────
async function loadDoctorData() {
  try {
    const res  = await fetch('/patients', { headers: authHeader() });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.patients || []);

    setText('doc-statPat',  list.length);
    setText('doc-statRep',  list.reduce((a,p) => a + (p.vitalLogs?.length||0), 0));
    setText('doc-statAppt', list.filter(p => p.appointment).length);
    setText('doc-statRx',   list.reduce((a,p) => a + (p.medications?.length||0), 0));

    const p = list[0];
    if (p) {
      const v = p.vitals || (p.vitalLogs?.[0]) || {};
      setText('doc-temp',  v.temperature||'—');
      setText('doc-pulse', v.pulse||'—');
      setText('doc-bp',    v.bloodPressure||v.bp||'—');
    }

    const rptHtml = list.length
      ? list.map(p => `
          <div class="rpt-row">
            <div class="rpt-icon">📋</div>
            <div style="flex:1">
              <div class="rpt-name">${p.name||'Patient'}</div>
              <div class="rpt-by">Logged by caretaker · ${p.vitalLogs?.length||0} entries</div>
            </div>
            <div class="rpt-date">${p.lastUpdated||'Recent'}</div>
          </div>`).join('')
      : `<div class="empty">No reports yet</div>`;

    ['doc-reportList','doc-allReports'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = rptHtml;
    });
  } catch { setDashes(['doc-statPat','doc-statRep','doc-statAppt','doc-statRx']); }
}

// ── SUBMIT: Vitals ────────────────────────────────────
async function submitVitals() {

  const body = {
    type: 'vitals',
    patientName: val('vPatient'),
    date: val('vDate'),
    temperature: val('vTemp'),
    pulse: val('vPulse'),
    bloodPressure: val('vBP'),
    oxygen: val('vO2'),
    notes: val('vNotes'),
    loggedBy: username
  };

  if (!body.patientName) {
    toast('Please enter patient name', true);
    return;
  }

  await postTo('/patients', body, 'Vitals saved', async () => {

    try {

      // 🚨 HIGH FEVER ALERT
      if (Number(body.temperature) >= 102) {
        await fetch('/alerts', {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            type: "emergency",
            title: "High Fever",
            description: `${body.patientName} has high fever (${body.temperature}°F)`,
            createdAt: new Date().toISOString(),
            read: false
          })
        });
      }

      // 🚨 LOW OXYGEN ALERT
      if (Number(body.oxygen) < 90) {
        await fetch('/alerts', {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            type: "emergency",
            title: "Low Oxygen Level",
            description: `${body.patientName} oxygen dropped to ${body.oxygen}%`,
            createdAt: new Date().toISOString(),
            read: false
          })
        });
      }

    } catch (err) {
      console.error("Alert creation failed:", err);
    }

    clearForm(['vPatient','vTemp','vPulse','vBP','vO2','vNotes']);

    // refresh dashboard
    loadPatients();
    loadMedSchedule();

  });

}
// ── SUBMIT: Medication ────────────────────────────────
async function submitMedication() {
  const body = {
    type:'medication',
    patientName: val('mPatient'), medication: val('mName'),
    dosage: val('mDose'), time: val('mTime'),
    status: val('mStatus'), notes: val('mNotes'),
    loggedBy: username
  };
  if (!body.patientName || !body.medication) { toast('Fill in patient and medication', true); return; }
  await postTo('/patients', body, 'Medication logged', () => {
    clearForm(['mPatient','mName','mDose','mTime','mNotes']);
   loadPatients();
loadMedSchedule();
  });
}

// ── SUBMIT: Appointment ───────────────────────────────
async function submitAppointment() {
  const body = {
    type:'appointment',
    patientName: val('aPatient'), doctor: val('aDoctor'),
    date: val('aDate'), time: val('aTime'), reason: val('aReason'),
    bookedBy: username
  };
  if (!body.patientName || !body.date) { toast('Fill in patient and date', true); return; }
  await postTo('/patients', body, 'Appointment booked', () => {
    clearForm(['aPatient','aDoctor','aDate','aTime','aReason']);
  });
}

// ── SUBMIT: Prescription ──────────────────────────────
async function submitPrescription() {
  const body = {
    type:'prescription',
    patientName: val('rxPatient'), medication: val('rxMed'),
    dosage: val('rxDose'), frequency: val('rxFreq'),
    notes: val('rxNotes'), prescribedBy: username
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
function clearForm(ids) { ids.forEach(id => { const el = document.getElementById(id); if(el) el.value=''; }); }

function toast(msg, isErr=false) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.className = 'toast' + (isErr?' err':'');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function logout() { sessionStorage.clear(); window.location.href='login.html'; }
