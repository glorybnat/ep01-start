// Small DOM helpers. Everything is built with textContent so book titles and
// member names from the API can never be interpreted as HTML.
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
  return node;
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function toast(message, kind = 'ok') {
  const node = h('div', { class: `toast toast-${kind}` }, message);
  document.getElementById('toasts').append(node);
  setTimeout(() => node.remove(), 4200);
}

export function emptyState(message) {
  return h('p', { class: 'empty' }, message);
}

export function errorState(error) {
  return h('p', { class: 'empty empty-error' }, error.message);
}

export function pill(text, tone = 'neutral') {
  return h('span', { class: `pill pill-${tone}` }, text);
}

// Opens a modal <dialog> around `content` and returns { close }.
export function openModal(title, content) {
  const dialog = h('dialog', { class: 'modal' },
    h('div', { class: 'modal-head' },
      h('h2', {}, title),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onClick: () => dialog.close() }, '×')),
    content);
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  return { close: () => dialog.close() };
}

// Runs an async action on a button, disabling it while the request is in flight.
export async function withBusy(button, action) {
  button.disabled = true;
  try {
    return await action();
  } finally {
    button.disabled = false;
  }
}
