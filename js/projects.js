// projects.js – Projektliste mit Suche, Filter, Sortierung und Pagination
import { h, clear } from './dom.js';
import { CONFIG, PLACEHOLDER_USER } from './config.js';
import { loadPortfolioRepos, fetchRateLimit } from './github.js';
import { stats } from './http.js';

const dateFormat = new Intl.DateTimeFormat('de-CH', { year: 'numeric', month: 'short', day: 'numeric' });

const SORTERS = {
  updated: (a, b) => new Date(b.pushedAt) - new Date(a.pushedAt),
  stars: (a, b) => b.stars - a.stars || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
};

const state = { repos: [], query: '', language: '', sort: 'updated', page: 1 };

/* ---------- Rendering ---------- */

function repoCard(repo) {
  return h(
    'li',
    { class: 'card repo-card' },
    h('h3', {}, h('a', { href: repo.url, target: '_blank', rel: 'noopener noreferrer' }, repo.name)),
    h('p', {}, repo.description),
    repo.topics.length ? h('ul', { class: 'chips', 'aria-label': 'Themen' }, repo.topics.slice(0, 4).map((t) => h('li', { class: 'chip' }, t))) : null,
    h(
      'p',
      { class: 'repo-meta' },
      repo.language ? h('span', {}, `● ${repo.language}`) : null,
      h('span', { title: 'Sterne' }, `★ ${repo.stars}`),
      h('span', { title: 'Forks' }, `⑂ ${repo.forks}`),
      h('span', {}, `Aktualisiert: ${dateFormat.format(new Date(repo.pushedAt))}`)
    )
  );
}

function getFiltered() {
  const q = state.query.trim().toLowerCase();
  return state.repos
    .filter((r) => !state.language || r.language === state.language)
    .filter((r) => !q || `${r.name} ${r.description} ${r.topics.join(' ')}`.toLowerCase().includes(q))
    .sort(SORTERS[state.sort]);
}

/** Baut die Seitenzahlen: 1 … 4 5 [6] 7 8 … 20 */
function pageNumbers(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

function renderPager(totalPages) {
  const nav = document.getElementById('projects-pager');
  clear(nav);
  if (totalPages <= 1) return;

  const go = (page) => {
    state.page = page;
    render();
    document.getElementById('projects-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pageButton = (label, page, { disabled = false, current = false, aria } = {}) =>
    h('button', { type: 'button', class: 'pager__btn', disabled, 'aria-current': current ? 'page' : null, 'aria-label': aria, onclick: () => go(page) }, label);

  nav.append(pageButton('‹', state.page - 1, { disabled: state.page === 1, aria: 'Vorherige Seite' }));
  pageNumbers(state.page, totalPages).forEach((p) =>
    nav.append(p === '…' ? h('span', { class: 'pager__gap', 'aria-hidden': 'true' }, '…') : pageButton(String(p), p, { current: p === state.page, aria: `Seite ${p}` }))
  );
  nav.append(pageButton('›', state.page + 1, { disabled: state.page === totalPages, aria: 'Nächste Seite' }));
}

function render() {
  const list = document.getElementById('projects-list');
  const count = document.getElementById('projects-count');
  const filtered = getFiltered();
  const totalPages = Math.max(1, Math.ceil(filtered.length / CONFIG.pageSize));
  state.page = Math.min(state.page, totalPages);

  const start = (state.page - 1) * CONFIG.pageSize;
  const pageItems = filtered.slice(start, start + CONFIG.pageSize);

  clear(list);
  if (pageItems.length === 0) {
    list.append(h('li', { class: 'repo-empty' }, 'Keine Projekte gefunden. Passe Suche oder Filter an.'));
  } else {
    pageItems.forEach((r) => list.append(repoCard(r)));
  }

  count.textContent = `${filtered.length} von ${state.repos.length} Projekten · Seite ${state.page} von ${totalPages}`;
  renderPager(totalPages);
}

/* ---------- Toolbar ---------- */

function fillLanguageFilter() {
  const select = document.getElementById('filter-language');
  const languages = [...new Set(state.repos.map((r) => r.language).filter(Boolean))].sort();
  languages.forEach((l) => select.append(h('option', { value: l }, l)));
}

function bindToolbar() {
  let timer;
  document.getElementById('filter-query').addEventListener('input', (e) => {
    clearTimeout(timer); // Debounce: nicht bei jedem Tastendruck neu rendern
    timer = setTimeout(() => {
      state.query = e.target.value;
      state.page = 1;
      render();
    }, 200);
  });
  document.getElementById('filter-language').addEventListener('change', (e) => {
    state.language = e.target.value;
    state.page = 1;
    render();
  });
  document.getElementById('filter-sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    render();
  });
}

/* ---------- API-Statistik & Fehlermeldungen ---------- */

const timeFormat = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' });

async function renderApiStats() {
  const el = document.getElementById('api-stats');
  if (!el || CONFIG.githubUser === PLACEHOLDER_USER) return;
  const rate = await fetchRateLimit();
  const parts = [`Netzwerk-Anfragen: ${stats.network}`, `Cache-Treffer: ${stats.cacheHits}`, `304 Not Modified: ${stats.notModified}`];
  if (rate) parts.push(`GitHub-Limit: ${rate.remaining}/${rate.limit} übrig (Reset ${timeFormat.format(rate.resetAt)})`);
  el.textContent = parts.join(' · ');
}

function describeError(error) {
  if (error?.rateLimited) {
    const when = error.resetAt ? ` Zurückgesetzt um ${timeFormat.format(error.resetAt)}.` : '';
    return `GitHub-Limit erreicht.${when} Es werden Demo-Daten angezeigt – mit einem Token (siehe unten) steigt das Limit.`;
  }
  if (error?.status === 404) return `Benutzer "${CONFIG.githubUser}" wurde auf GitHub nicht gefunden. Es werden Demo-Daten angezeigt.`;
  return 'GitHub ist gerade nicht erreichbar. Es werden Demo-Daten angezeigt.';
}

/* ---------- Start ---------- */

export async function initProjects() {
  const status = document.getElementById('projects-status');
  if (!status) return;

  status.textContent = 'Projekte werden geladen …';
  const { repos, source, error } = await loadPortfolioRepos();
  state.repos = repos;

  fillLanguageFilter();
  bindToolbar();
  render();

  if (error) {
    status.textContent = describeError(error);
    status.classList.add('status--error');
  } else {
    status.textContent =
      source === 'demo'
        ? 'Demo-Daten werden angezeigt. Trage deinen GitHub-Benutzernamen in js/config.js ein.'
        : `${repos.length} Projekte live von GitHub geladen.`;
  }
  renderApiStats();

  return { repos, source };
}
