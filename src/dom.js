// Tiny DOM helpers. All string children are set via textContent — this is the
// XSS rule: NEVER use innerHTML for user input here.

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class' || k === 'className') {
      el.className = v;
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else if (k === 'dataset' && typeof v === 'object') {
      Object.assign(el.dataset, v);
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden') {
      if (v) el.setAttribute(k, '');
    } else if (v === true) {
      el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) {
      appendChildren(el, c);
    } else if (c instanceof Node) {
      el.appendChild(c);
    } else {
      // STRICT: textContent path keeps us safe from injection.
      el.appendChild(document.createTextNode(String(c)));
    }
  }
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function mount(parent, child) {
  clear(parent);
  parent.appendChild(child);
  return child;
}
