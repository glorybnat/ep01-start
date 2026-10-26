import { api } from '../api.js';
import { h, formatDate, todayIso, pill, emptyState, errorState } from '../ui.js';
import { returnLoan } from '../actions.js';

const FILTERS = [
  { label: 'All', status: '' },
  { label: 'Active', status: 'active' },
  { label: 'Returned', status: 'returned' },
];

export async function renderLoans(root) {
  let status = '';
  const [books, members] = await Promise.all([api.books(), api.members()]);
  const bookTitle = new Map(books.map((book) => [book.id, book.title]));
  const memberName = new Map(members.map((member) => [member.id, member.name]));

  const body = h('div', { class: 'table-wrap' });
  const tabs = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Filter loans' });

  function drawTabs() {
    tabs.replaceChildren(...FILTERS.map((filter) =>
      h('button', {
        type: 'button',
        class: 'seg',
        'aria-pressed': String(filter.status === status),
        onClick: () => {
          status = filter.status;
          drawTabs();
          load();
        },
      }, filter.label)));
  }

  async function load() {
    try {
      const loans = (await api.loans(status)).reverse();
      body.replaceChildren(loans.length ? table(loans) : emptyState('No loans to show.'));
    } catch (error) {
      body.replaceChildren(errorState(error));
    }
  }

  function table(loans) {
    const today = todayIso();
    return h('table', {},
      h('thead', {}, h('tr', {}, ...['Loan', 'Book', 'Member', 'Borrowed', 'Due', 'Status', ''].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, ...loans.map((loan) => {
        const active = loan.returnedOn === null;
        const overdue = active && loan.dueOn < today;
        const button = h('button', { class: 'btn btn-small', type: 'button' }, 'Return');
        button.addEventListener('click', () => returnLoan(button, loan.id, load));
        return h('tr', {},
          h('td', { class: 'mono' }, loan.id),
          h('td', {}, bookTitle.get(loan.bookId) || loan.bookId),
          h('td', {}, memberName.get(loan.memberId) || loan.memberId),
          h('td', {}, formatDate(loan.borrowedOn)),
          h('td', {}, formatDate(loan.dueOn)),
          h('td', {}, active
            ? pill(overdue ? 'Overdue' : 'Out', overdue ? 'danger' : 'neutral')
            : pill(loan.lateFee > 0 ? `Returned · ${loan.lateFeeFormatted} fee` : 'Returned', loan.lateFee > 0 ? 'warn' : 'ok')),
          h('td', {}, active ? button : null));
      })));
  }

  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Loans')), tabs),
    body);
  drawTabs();
  await load();
}
