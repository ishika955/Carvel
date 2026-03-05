// ── login.js ──
// Handles role selection, form validation, and POST /login fetch

let selectedRole = 'caretaker';

// Called when a role tab is clicked
function selectRole(el) {
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  selectedRole = el.getAttribute('data-role');
}

// Toggle password visibility
function togglePassword() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Clear all error messages
function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => {
    e.classList.remove('visible');
    e.style.display = 'none';
  });
  document.getElementById('username').style.borderColor = '';
  document.getElementById('password').style.borderColor = '';
}

// Show a specific error
function showError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
    el.style.display = 'block';
  }
}

// Mark input as invalid
function markInvalid(id) {
  const input = document.getElementById(id);
  if (input) input.style.borderColor = '#c0614a';
}

// Main login handler
async function handleLogin() {
  clearErrors();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // Basic validation
  let valid = true;
  if (!username) {
    showError('username-error', 'Please enter your username');
    markInvalid('username');
    valid = false;
  }
  if (!password) {
    showError('password-error', 'Please enter your password');
    markInvalid('password');
    valid = false;
  }
  if (!valid) return;

  // Show loading state
  const btn = document.getElementById('loginBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        role: selectedRole
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store role info for dashboard use
      sessionStorage.setItem('role', selectedRole);
      sessionStorage.setItem('username', username);
      if (data.token) sessionStorage.setItem('token', data.token);

      // Redirect to dashboard
      window.location.href = 'dashboard.html';

    } else {
      // Show error returned from server
      const msg = data.message || 'Invalid username or password. Please try again.';
      showError('login-error', msg);
      document.getElementById('login-error').style.display = 'block';
      markInvalid('username');
      markInvalid('password');
    }

  } catch (err) {
    // Network or server error
    showError('login-error', 'Unable to connect to server. Please try again.');
    document.getElementById('login-error').style.display = 'block';
    console.error('Login error:', err);

  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// Allow pressing Enter to submit
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});