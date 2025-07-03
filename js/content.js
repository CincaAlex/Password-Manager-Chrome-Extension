const INACTIVITY_LIMIT = 120 * 1000;
let inactivityTimer;

function clearSensitiveData() {
  document.querySelectorAll('input[type="password"]').forEach(input => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  document.querySelectorAll('input[type="text"], input[type="email"]').forEach(input => {
    const id = (input.id || "").toLowerCase();
    const name = (input.name || "").toLowerCase();
    if (id.includes("email") || id.includes("user") || name.includes("email") || name.includes("user")) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  document.querySelectorAll('[data-autofilled]').forEach(el => {
    el.removeAttribute('data-autofilled');
  });
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(clearSensitiveData, INACTIVITY_LIMIT);
}

function startActivityTracking() {
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  events.forEach(evt => {
    document.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', resetInactivityTimer);
  });

  resetInactivityTimer();
}

if (document.readyState === 'complete') {
  startActivityTracking();
} else {
  window.addEventListener('load', startActivityTracking);
}
