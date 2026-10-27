// dom.js – kleiner Helfer zum sicheren Erzeugen von DOM-Elementen.
// Es wird bewusst textContent statt innerHTML verwendet: Daten aus der API
// (Beschreibungen, Namen) können beliebigen Text enthalten und dürfen nie als HTML interpretiert werden (XSS).

/**
 * h('a', { href: '...', class: 'btn' }, 'Text', andereElemente)
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
