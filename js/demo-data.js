// demo-data.js – Beispieldaten im Format der GitHub-API.
// Werden angezeigt, solange die API nicht erreichbar ist (z. B. Rate-Limit) und nichts im Cache liegt.

const repo = (id, name, description, language, stars, forks, size, pushed, topics, languages) => ({
  id,
  name,
  description,
  html_url: `https://github.com/demo/${name}`,
  homepage: null,
  language,
  stargazers_count: stars,
  forks_count: forks,
  size,
  fork: false,
  topics,
  pushed_at: pushed,
  _languages: languages,
});

export const DEMO_REPOS = [
  repo(1, 'portfolio-page', 'Diese Portfolio-Seite mit GitHub-API, Chart.js und Leaflet.', 'JavaScript', 3, 0, 420, '2026-10-20T10:00:00Z', ['portfolio', 'javascript'], { JavaScript: 21000, CSS: 9800, HTML: 6400 }),
  repo(2, 'wetter-dashboard', 'Wetter-Dashboard mit Open-Meteo-API und Diagrammen.', 'JavaScript', 5, 1, 310, '2026-09-30T08:30:00Z', ['api', 'chart'], { JavaScript: 14500, CSS: 5200, HTML: 3100 }),
  repo(3, 'todo-app', 'Aufgabenverwaltung mit Local Storage.', 'TypeScript', 2, 0, 180, '2026-08-12T14:00:00Z', ['typescript', 'pwa'], { TypeScript: 12000, CSS: 3900, HTML: 1800 }),
  repo(4, 'python-automation', 'Skripte zur Automatisierung wiederkehrender Aufgaben.', 'Python', 1, 0, 95, '2026-07-02T09:00:00Z', ['python', 'automation'], { Python: 8700, Shell: 900 }),
  repo(5, 'sql-uebungen', 'Übungen zu SQL und Datenbankdesign.', 'PLpgSQL', 0, 0, 60, '2026-05-21T16:20:00Z', ['sql', 'database'], { PLpgSQL: 4300 }),
  repo(6, 'java-bank', 'Objektorientierte Bank-Simulation.', 'Java', 4, 2, 240, '2026-03-17T11:45:00Z', ['java', 'oop'], { Java: 17800 }),
  repo(7, 'rezept-finder', 'Rezeptsuche über eine REST-API mit Filterfunktion.', 'JavaScript', 2, 0, 150, '2026-02-08T19:10:00Z', ['rest', 'search'], { JavaScript: 9100, CSS: 4400, HTML: 2200 }),
  repo(8, 'cpp-snake', 'Snake-Spiel in der Konsole.', 'C++', 1, 0, 70, '2025-12-01T20:00:00Z', ['game', 'cpp'], { 'C++': 6200 }),
  repo(9, 'docker-playground', 'Experimente mit Docker und Docker Compose.', 'Dockerfile', 0, 0, 25, '2025-10-15T07:30:00Z', ['docker', 'devops'], { Dockerfile: 1200, Shell: 800 }),
];
