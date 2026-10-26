import { renderBooks } from './views/books.js';
import { renderMembers } from './views/members.js';
import { renderLoans } from './views/loans.js';
import { renderReports } from './views/reports.js';
import { errorState } from './ui.js';

const views = {
  books: renderBooks,
  members: renderMembers,
  loans: renderLoans,
  reports: renderReports,
};

const root = document.getElementById('app');
let navigation = 0;

// Hash routes look like #/books or #/members/m004.
async function route() {
  const [, requested, param] = location.hash.split('/');
  const name = views[requested] ? requested : 'books';
  const current = ++navigation;

  document.querySelectorAll('nav a').forEach((link) => {
    if (link.dataset.route === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  root.replaceChildren();
  try {
    await views[name](root, param, () => current === navigation);
  } catch (error) {
    if (current === navigation) root.replaceChildren(errorState(error));
  }
}

window.addEventListener('hashchange', route);
route();
