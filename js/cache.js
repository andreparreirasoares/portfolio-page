const PREFIX = 'pf-cache:v1:';

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // localStorage blockiert oder JSON defekt
  }
}

export function cacheSet(key, { data, etag = null }) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, etag, savedAt: Date.now() }));
  } catch {
    /* Speicher voll oder gesperrt – Seite funktioniert trotzdem, nur ohne Cache */
  }
}

/** true, wenn der Eintrag jünger als ttl Millisekunden ist. */
export function isFresh(entry, ttl) {
  return Boolean(entry) && Date.now() - entry.savedAt < ttl;
}

export function cacheClear() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignorieren */
  }
}
