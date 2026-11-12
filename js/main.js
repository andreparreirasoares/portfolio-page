// main.js – Einstiegspunkt der Seite
import { initTheme, initMenu, initScrollSpy, initYear } from './ui.js';
import { initProjects } from './projects.js';
import { initStats } from './stats.js';
import { initSkillsChart, initStatsCharts } from './charts.js';
import { initAuthUi } from './auth.js';

document.documentElement.classList.add('has-js');

initTheme();
initMenu();
initScrollSpy();
initYear();
initSkillsChart();
initAuthUi();

const projectData = await initProjects();
const statsData = await initStats(projectData);
initStatsCharts(statsData);
