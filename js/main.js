// main.js – Einstiegspunkt der Seite
import { initTheme, initMenu, initScrollSpy, initYear } from './ui.js';

document.documentElement.classList.add('has-js');

initTheme();
initMenu();
initScrollSpy();
initYear();
