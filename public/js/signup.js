// ── signup.js ──
let selectedRole = 'caretaker';

function selectRole(el) {
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  selectedRole = el.getAttribute('data-role');
}

function togglePw(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Password strength checker
function checkStrength() {
  const pw       = document.getElementById('password').value;
  const fill     = document.getElementById('strengthFill');
  const label    = document.getElementById('strengthLabel');
  const strength = document.getElementById('pwStrength');

  if (!pw) { strength.classList.remove('visible'); return; }
  strength.classList.add('visible');

  let score = 0;
  if (pw.length >= 6)               score++;
  if (pw.length >= 10)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;

  const levels = [
    { pct:'20%', color:'#c0614a', text:'Very weak' },
    { pct:'40%', color:'#c4714a', text:'Weak' },
    { pct:'60%', color:'#c4a96b', text:'Fair' },
    { pct:'80%', color:'#7a9e7e', text:'Strong' },
    { pct:'100%',color:'#5a8f6a', text:'Very strong' },
  ];
  const lvl = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width     = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent    = lvl.text;
  label.style.color    = lvl.color;
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => {
    e.classList.remove('visible'); e.style.display = 'none';
  });
  ['username','password','confirmPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('invalid');
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('visible'); el.style.display = 'block'; }
}

function markInvalid(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('invalid');
}

async function handleSignup() {
  clearErrors();

  const username        = document.getElementById('username').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  let valid = true;

  if (!username) {
    showError('username-error', 'Please choose a username');
    markInvalid('username'); valid = false;
  } else if (username.length < 3) {
    showError('username-error', 'Username must be at least 3 characters');
    markInvalid('username'); valid = false;
  }

  if (!password) {
    showError('password-error', 'Please create a password');
    markInvalid('password'); valid = false;
  } else if (password.length < 6) {
    showError('password-error', 'Password must be at least 6 characters');
    markInvalid('password'); valid = false;
  }

  if (!confirmPassword) {
    showError('confirm-error', 'Please confirm your password');
    markInvalid('confirmPassword'); valid = false;
  } else if (password !== confirmPassword) {
    showError('confirm-error', 'Passwords do not match');
    markInvalid('confirmPassword'); valid = false;
  }

  if (!valid) return;

  // Loading state
  const btn = document.getElementById('signupBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: selectedRole })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Show success screen
      document.getElementById('formSection').style.display = 'none';
      document.getElementById('successScreen').classList.add('visible');

    } else {
      const msg = data.message || 'Could not create account. Please try again.';
      showError('signup-error', msg);
      document.getElementById('signup-error').style.display = 'block';
    }

  } catch (err) {
    showError('signup-error', 'Unable to connect to server. Please try again.');
    document.getElementById('signup-error').style.display = 'block';
    console.error('Signup error:', err);

  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignup();
  });
});