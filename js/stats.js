// stats.js – Statistik-Bereich (Sprachverteilung)
import { h, clear } from './dom.js';
import { CONFIG } from './config.js';
import { attachLanguages, aggregateLanguages } from './github.js';

export async function loadStatsData({ repos }) {
  const withLanguages = await attachLanguages(CONFIG.githubUser, repos);
  return { repos: withLanguages, languages: aggregateLanguages(withLanguages) };
}

function renderLanguageBars(languages) {
  const list = document.getElementById('language-list');
  clear(list);
  languages.slice(0, 8).forEach((l) =>
    list.append(
      h(
        'li',
        { class: 'lang-row' },
        h('span', { class: 'lang-row__name' }, l.name),
        h('span', { class: 'lang-row__bar', role: 'presentation' }, h('span', { style: `width:${l.percent.toFixed(1)}%` })),
        h('span', { class: 'lang-row__value' }, `${l.percent.toFixed(1)} %`)
      )
    )
  );
}

export async function initStats(projectData) {
  const status = document.getElementById('stats-status');
  if (!status || !projectData) return null;
  status.textContent = 'Statistiken werden berechnet …';
  try {
    const data = await loadStatsData(projectData);
    renderLanguageBars(data.languages);
    status.textContent = `Auswertung von ${data.repos.length} Repositories (Quelle: GitHub /languages).`;
    return data;
  } catch (error) {
    console.warn('Statistik konnte nicht geladen werden', error);
    status.textContent = 'Statistiken sind aktuell nicht verfügbar.';
    status.classList.add('status--error');
    return null;
  }
}
