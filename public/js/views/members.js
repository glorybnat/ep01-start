import { api } from '../api.js';
import { h, formatDate, pill, emptyState, errorState } from '../ui.js';
import { returnLoan } from '../actions.js';

export async function renderMembers(root, selectedId) {
  const detail = h('section', { class: 'detail', 'aria-live': 'polite' });
  const list = h('ul', { class: 'member-list' });
  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Members'))),
    h('div', { class: 'split' }, list, detail));

  const members = await api.members();
  list.replaceChildren(...members.map((member) =>
    h('li', {},
      h('a', {
        href: `#/members/${member.id}`,
        class: 'member-link',
        'aria-current': member.id === selectedId ? 'true' : null,
      }, h('span', { class: 'member-name' }, member.name),
         h('span', { class: 'muted small' }, member.email)))));

  async function showDetail() {
    if (!selectedId) {
      detail.replaceChildren(emptyState('Select a member to see their loans and fees.'));
      return;
    }
    try {
      detail.replaceChildren(memberDetail(await api.member(selectedId), showDetail));
    } catch (error) {
      detail.replaceChildren(errorState(error));
    }
  }
  await showDetail();
}

function memberDetail(member, refresh) {
  const overdueCount = member.activeLoans.filter((loan) => loan.daysOverdue > 0).length;
  return h('div', {},
    h('h2', { class: 'detail-title' }, member.name),
    h('p', { class: 'muted' }, `${member.email} · member since ${formatDate(member.joinedOn)}`),
    h('div', { class: 'stats' },
      stat('Active loans', member.activeLoans.length),
      stat('Overdue', overdueCount, overdueCount ? 'danger' : null),
      stat('Late fees charged', member.lateFeesChargedFormatted)),
    h('h3', {}, 'Active loans'),
    member.activeLoans.length
      ? h('ul', { class: 'loan-list' }, ...member.activeLoans.map((loan) => activeLoan(loan, refresh)))
      : emptyState('No books out right now.'));
}

function stat(label, value, tone) {
  return h('div', { class: `stat${tone ? ` stat-${tone}` : ''}` },
    h('span', { class: 'stat-value' }, String(value)),
    h('span', { class: 'stat-label' }, label));
}

function activeLoan(loan, refresh) {
  const overdue = loan.daysOverdue > 0;
  const button = h('button', { class: 'btn', type: 'button' }, 'Return');
  button.addEventListener('click', () => returnLoan(button, loan.loanId, refresh));
  return h('li', { class: 'loan-row' },
    h('div', {},
      h('strong', {}, loan.title),
      h('p', { class: 'muted small' }, `Due ${formatDate(loan.dueOn)}`)),
    h('div', { class: 'loan-side' },
      overdue
        ? pill(`${loan.daysOverdue} ${loan.daysOverdue === 1 ? 'day' : 'days'} overdue · ${loan.accruedFeeFormatted}`, 'danger')
        : pill('On time', 'ok'),
      button));
}
