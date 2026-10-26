import { api } from '../api.js';
import { h, formatDate, pill, emptyState } from '../ui.js';
import { returnLoan } from '../actions.js';

export async function renderReports(root) {
  const overdue = h('div', { class: 'table-wrap' });
  const popular = h('ol', { class: 'bars' });

  async function loadOverdue() {
    const rows = await api.overdue();
    overdue.replaceChildren(rows.length ? overdueTable(rows) : emptyState('Nothing is overdue.'));
  }

  function overdueTable(rows) {
    return h('table', {},
      h('thead', {}, h('tr', {}, ...['Book', 'Member', 'Due', 'Overdue', ''].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, ...rows.map((row) => {
        const button = h('button', { class: 'btn btn-small', type: 'button' }, 'Return');
        button.addEventListener('click', () => returnLoan(button, row.loanId, loadOverdue));
        return h('tr', {},
          h('td', {}, row.title),
          h('td', {}, h('a', { href: `#/members/${row.memberId}` }, row.memberName)),
          h('td', {}, formatDate(row.dueOn)),
          h('td', {}, pill(`${row.daysOverdue} ${row.daysOverdue === 1 ? 'day' : 'days'}`, 'danger')),
          h('td', {}, button));
      })));
  }

  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Reports'))),
    h('section', {}, h('h2', {}, 'Overdue loans'), overdue),
    h('section', {}, h('h2', {}, 'Most borrowed books'), popular));

  const [top] = await Promise.all([api.mostBorrowed(8), loadOverdue()]);
  const max = Math.max(1, ...top.map((entry) => entry.timesBorrowed));
  popular.replaceChildren(...top.map((entry) =>
    h('li', { class: 'bar-row' },
      h('div', { class: 'bar-label' },
        h('strong', {}, entry.title), h('span', { class: 'muted small' }, entry.author)),
      h('div', { class: 'bar-track' },
        h('div', { class: 'bar-fill', style: `width:${(entry.timesBorrowed / max) * 100}%` })),
      h('span', { class: 'bar-count' }, `${entry.timesBorrowed}×`))));
}
