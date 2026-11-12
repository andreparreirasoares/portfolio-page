// charts.js – Diagramme mit Chart.js (Third-Party-Library, per CDN geladen)
import { SKILLS, SKILL_CATEGORIES } from './config.js';
import { h } from './dom.js';

const PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
const charts = [];

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function chartAvailable() {
  if (typeof window.Chart === 'undefined') {
    console.warn('Chart.js konnte nicht geladen werden (CDN blockiert?). Diagramme werden übersprungen.');
    return false;
  }
  return true;
}

/** Farben aus den CSS-Variablen holen, damit Charts auch im Dark Mode passen. */
function themeColors() {
  return { text: cssVar('--text-muted'), grid: cssVar('--border'), surface: cssVar('--bg-elevated') };
}

function applyTheme(chart) {
  const { text, grid, surface } = themeColors();
  const o = chart.options;
  o.plugins.legend.labels.color = text;
  if (o.scales?.x) {
    o.scales.x.ticks.color = text;
    o.scales.x.grid.color = grid;
  }
  if (o.scales?.y) {
    o.scales.y.ticks.color = text;
    o.scales.y.grid.color = grid;
  }
  if (o.scales?.r) {
    o.scales.r.ticks.color = text;
    o.scales.r.ticks.backdropColor = 'transparent';
    o.scales.r.grid.color = grid;
    o.scales.r.angleLines.color = grid;
    o.scales.r.pointLabels.color = cssVar('--text');
  }
  if (chart.config.type === 'doughnut') chart.data.datasets[0].borderColor = surface;
  chart.update('none');
}

function register(chart) {
  charts.push(chart);
  applyTheme(chart);
  return chart;
}

document.addEventListener('themechange', () => charts.forEach(applyTheme));

/* ---------- 1. Skills (horizontale Balken) – wird erst gezeichnet, wenn sichtbar ---------- */

function renderSkillsLegend() {
  const legend = document.getElementById('skills-legend');
  if (!legend) return;
  Object.values(SKILL_CATEGORIES).forEach((c) =>
    legend.append(h('li', {}, h('span', { class: 'swatch', style: `background:${c.color}` }), c.label))
  );
}

export function initSkillsChart() {
  const canvas = document.getElementById('skills-chart');
  if (!canvas) return;
  renderSkillsLegend();
  if (!chartAvailable()) return;

  const draw = () =>
    register(
      new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels: SKILLS.map((s) => s.name),
          datasets: [
            {
              label: 'Kenntnisstand',
              data: SKILLS.map((s) => s.level),
              backgroundColor: SKILLS.map((s) => SKILL_CATEGORIES[s.category].color),
              borderRadius: 6,
              barThickness: 18,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 900, easing: 'easeOutQuart' },
          scales: {
            x: { min: 0, max: 100, ticks: { stepSize: 25, callback: (v) => `${v} %` }, grid: {} },
            y: { ticks: {}, grid: { display: false } },
          },
          plugins: {
            legend: { display: false, labels: {} },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} %` } },
          },
        },
      })
    );

  new IntersectionObserver((entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) {
      draw();
      obs.disconnect();
    }
  }).observe(canvas);
}

/* ---------- 2. Sprachverteilung (Doughnut) ---------- */

function drawLanguageChart(languages) {
  const canvas = document.getElementById('language-chart');
  if (!canvas) return;

  const top = languages.slice(0, 6);
  const rest = languages.slice(6).reduce((sum, l) => sum + l.bytes, 0);
  const labels = top.map((l) => l.name);
  const data = top.map((l) => l.bytes);
  if (rest > 0) {
    labels.push('Andere');
    data.push(rest);
  }

  register(
    new window.Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: PALETTE, borderWidth: 3 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { position: 'bottom', labels: {} },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                return ` ${ctx.label}: ${((ctx.parsed / total) * 100).toFixed(1)} % (${(ctx.parsed / 1024).toFixed(1)} KB)`;
              },
            },
          },
        },
      },
    })
  );
  canvas.setAttribute('aria-label', `Sprachverteilung: ${top.map((l) => `${l.name} ${l.percent.toFixed(0)} Prozent`).join(', ')}`);
}

/* ---------- 3. Code-Menge pro Repository (horizontale Balken) ---------- */

function drawRepoChart(repos) {
  const canvas = document.getElementById('repo-chart');
  if (!canvas) return;

  const rows = repos
    .map((r) => ({ name: r.name, kb: Object.values(r.languages ?? {}).reduce((a, b) => a + b, 0) / 1024 }))
    .filter((r) => r.kb > 0)
    .sort((a, b) => b.kb - a.kb)
    .slice(0, 8);

  register(
    new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.name),
        datasets: [{ label: 'Code (KB)', data: rows.map((r) => Number(r.kb.toFixed(1))), backgroundColor: PALETTE[0], borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { beginAtZero: true, ticks: {}, grid: {} }, y: { ticks: {}, grid: { display: false } } },
        plugins: { legend: { display: false, labels: {} } },
      },
    })
  );
  canvas.setAttribute('aria-label', `Code-Menge pro Repository: ${rows.map((r) => `${r.name} ${r.kb.toFixed(0)} KB`).join(', ')}`);
}

export function initStatsCharts(statsData) {
  if (!statsData || !chartAvailable()) return;
  drawLanguageChart(statsData.languages);
  drawRepoChart(statsData.repos);
}
