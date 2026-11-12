// auth.js – optionale Authentifizierung gegenüber der GitHub-API
//
// Ohne Token erlaubt GitHub nur 60 Anfragen pro Stunde und IP. Mit einem Token sind es 5000.

const TOKEN_KEY = 'pf-github-token';

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token.trim());
  } catch {
    /* ignorieren */
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignorieren */
  }
}

/** Authorization-Header, falls ein Token vorhanden ist. */
export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Verbindet das Formular im Abschnitt Projekte mit der Token-Verwaltung. */
export function initAuthUi() {
  const form = document.getElementById('token-form');
  const input = document.getElementById('token-input');
  const state = document.getElementById('token-state');
  const clearBtn = document.getElementById('token-clear');
  if (!form || !input || !state) return;

  const refresh = () => {
    const active = Boolean(getToken());
    state.textContent = active ? 'Token aktiv (nur in diesem Tab).' : 'Kein Token – es gilt das Standard-Limit von 60 Anfragen/Stunde.';
    clearBtn.hidden = !active;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    setToken(input.value);
    input.value = '';
    location.reload(); // Daten mit dem neuen Limit frisch laden
  });
  clearBtn.addEventListener('click', () => {
    clearToken();
    location.reload();
  });
  refresh();
}
