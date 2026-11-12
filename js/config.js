export const CONFIG = {
  githubUser: 'andreparreirasoares',

  // Anzahl Projekte pro Seite (Pagination im Browser)
  pageSize: 6,

  // Wie lange API-Antworten im Cache als neu gelten (Millisekunden)
  cacheTtlMs: 10 * 60 * 1000,

  // Für wie viele Repos die Sprach-Details nachgeladen werden
  languageRepoLimit: 12,
};


export const SKILL_CATEGORIES = {
  frontend: { label: 'Frontend', color: '#2563eb' },
  backend: { label: 'Backend', color: '#eb2525' },
  tools: { label: 'Tools & Daten', color: '#10b981' },
  quality: { label: 'Qualität', color: '#f59e0b' },
};

export const SKILLS = [
  { name: 'HTML', level: 85, category: 'frontend' },
  { name: 'CSS', level: 85, category: 'frontend' },
  { name: 'JavaScript', level: 70, category: 'frontend' },
  { name: 'Java', level: 80, category: 'backend' },
  { name: 'C++', level: 65, category: 'backend' },
  { name: 'Python', level: 50, category: 'backend' },
  { name: 'Spring Boot', level: 70, category: 'backend' },
  { name: 'Git', level: 65, category: 'tools' },
  { name: 'REST-APIs', level: 60, category: 'tools' },
  { name: 'Accessibility', level: 55, category: 'quality' },
  { name: 'Testing', level: 45, category: 'quality' },
];

export const PLACEHOLDER_USER = 'DEIN-GITHUB-USERNAME';
