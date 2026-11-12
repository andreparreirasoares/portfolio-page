// github.js – Zugriff auf die GitHub REST-API (über die gemeinsame Cache-Schicht)
import { CONFIG, PLACEHOLDER_USER } from './config.js';
import { DEMO_REPOS } from './demo-data.js';
import { cachedJson, stats } from './http.js';
import { authHeaders } from './auth.js';

const API = 'https://api.github.com';

function buildHeaders() {
  return { Accept: 'application/vnd.github+json', ...authHeaders() };
}

/**
 * Fragt das aktuelle API-Limit ab. Dieser Endpunkt zählt selbst nicht zum Limit.
 */
export async function fetchRateLimit() {
  try {
    stats.network++;
    const res = await fetch(`${API}/rate_limit`, { headers: buildHeaders() });
    if (!res.ok) return null;
    const { resources } = await res.json();
    return { limit: resources.core.limit, remaining: resources.core.remaining, resetAt: new Date(resources.core.reset * 1000) };
  } catch {
    return null;
  }
}

/**
 * Lädt ALLE öffentlichen Repositories eines Benutzers.
 * Die GitHub-API liefert maximal 100 Einträge pro Seite (server-seitige Pagination),
 * deshalb werden so lange weitere Seiten geholt, bis eine Seite nicht mehr voll ist.
 * Jede Seite wird einzeln gecacht.
 */
export async function fetchRepos(user, { maxPages = 5 } = {}) {
  const perPage = 100;
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `${API}/users/${encodeURIComponent(user)}/repos?per_page=${perPage}&page=${page}&sort=pushed`;
    const { data } = await cachedJson(url, { headers: buildHeaders(), ttl: CONFIG.cacheTtlMs });
    all.push(...data);
    if (data.length < perPage) break;
  }
  return all;
}

/** Reduziert die API-Antwort auf die Felder, die wir wirklich brauchen. */
export function normalizeRepo(r) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? 'Keine Beschreibung vorhanden.',
    url: r.html_url,
    homepage: r.homepage || null,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    sizeKb: r.size,
    topics: r.topics ?? [],
    pushedAt: r.pushed_at,
    isFork: r.fork,
    languages: r._languages ?? null, // nur Demo-Daten bringen das schon mit
  };
}

/** Liefert { repos, source } – source ist 'api' oder 'demo'. */
export async function loadPortfolioRepos() {
  if (CONFIG.githubUser === PLACEHOLDER_USER) {
    return { repos: DEMO_REPOS.map(normalizeRepo), source: 'demo' };
  }
  try {
    const raw = await fetchRepos(CONFIG.githubUser);
    return { repos: raw.filter((r) => !r.fork).map(normalizeRepo), source: 'api' };
  } catch (error) {
    console.warn('GitHub-API nicht verfügbar, zeige Demo-Daten:', error);
    return { repos: DEMO_REPOS.map(normalizeRepo), source: 'demo', error };
  }
}

/**
 * DATENKOMBINATION: Die Repo-Liste enthält pro Repo nur die Hauptsprache.
 * Die genaue Verteilung (Bytes pro Sprache) liefert ein zweiter Endpunkt
 * /repos/{user}/{repo}/languages. Hier werden beide Datenquellen parallel
 * abgefragt und zu einem Datensatz pro Repository zusammengeführt.
 * Einzelne Fehler (z. B. Rate-Limit) verwerfen nicht alles: Promise.allSettled.
 */
export async function attachLanguages(user, repos, { limit = CONFIG.languageRepoLimit } = {}) {
  const targets = repos.slice(0, limit);
  const results = await Promise.allSettled(
    targets.map((r) => {
      if (r.languages) return Promise.resolve({ data: r.languages });
      const url = `${API}/repos/${encodeURIComponent(user)}/${encodeURIComponent(r.name)}/languages`;
      return cachedJson(url, { headers: buildHeaders(), ttl: CONFIG.cacheTtlMs * 6 });
    })
  );
  return targets.map((repo, i) => ({
    ...repo,
    languages: results[i].status === 'fulfilled' ? results[i].value.data : {},
  }));
}

/** Summiert die Bytes aller Repos je Sprache und berechnet Prozentwerte. */
export function aggregateLanguages(repos) {
  const totals = new Map();
  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages ?? {})) {
      totals.set(lang, (totals.get(lang) ?? 0) + bytes);
    }
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes, percent: (bytes / sum) * 100 }))
    .sort((a, b) => b.bytes - a.bytes);
}
