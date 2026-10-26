import { api } from '../api.js';
import { h, toast, pill, openModal, emptyState, errorState, withBusy } from '../ui.js';

export async function renderBooks(root) {
  let query = '';
  let latest = 0;

  const count = h('p', { class: 'muted' });
  const grid = h('div', { class: 'book-grid' });
  const search = h('input', {
    class: 'search',
    type: 'search',
    placeholder: 'Search by title or author',
    'aria-label': 'Search books',
  });

  async function load() {
    const request = ++latest;
    try {
      const books = await api.books(query);
      if (request !== latest) return;
      count.textContent = `${books.length} ${books.length === 1 ? 'book' : 'books'}`;
      grid.replaceChildren(...(books.length
        ? books.map((book) => bookCard(book, load))
        : [emptyState('No books match your search.')]));
    } catch (error) {
      if (request === latest) grid.replaceChildren(errorState(error));
    }
  }

  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      query = search.value.trim();
      load();
    }, 200);
  });

  root.append(
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, 'Books'), count),
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => addBookDialog(load) }, 'Add book')),
    search,
    grid);
  await load();
}

function bookCard(book, refresh) {
  const out = book.available === 0;
  const meta = [book.year, book.isbn && `ISBN ${book.isbn}`].filter(Boolean).join(' · ');
  return h('article', { class: 'card book' },
    h('h2', {}, book.title),
    h('p', { class: 'author' }, book.author),
    h('p', { class: 'muted small' }, meta),
    h('div', { class: 'card-foot' },
      pill(out ? 'All out' : `${book.available} of ${book.copies} available`, out ? 'warn' : 'ok'),
      h('button', {
        class: 'btn',
        type: 'button',
        disabled: out,
        onClick: () => borrowDialog(book, refresh),
      }, 'Borrow')));
}

async function borrowDialog(book, refresh) {
  let members;
  try {
    members = await api.members();
  } catch (error) {
    toast(error.message, 'error');
    return;
  }

  const select = h('select', { id: 'borrow-member', required: true },
    h('option', { value: '' }, 'Choose a member…'),
    ...members.map((member) => h('option', { value: member.id }, member.name)));
  const message = h('p', { class: 'form-error', role: 'alert' });
  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Borrow');
  const form = h('form', { class: 'form' },
    h('p', {}, `Lend “${book.title}” to a member.`),
    h('label', { for: 'borrow-member' }, 'Member', select),
    message,
    h('div', { class: 'form-actions' }, submit));
  const modal = openModal('Borrow book', form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    try {
      const loan = await withBusy(submit, () => api.borrow(select.value, book.id));
      toast(`Borrowed. Due back ${loan.dueOn}.`);
      modal.close();
      refresh();
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

function addBookDialog(refresh) {
  const field = (id, label, attrs = {}) =>
    h('label', { for: id }, label, h('input', { id, name: id, ...attrs }));
  const message = h('p', { class: 'form-error', role: 'alert' });
  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Add book');
  const form = h('form', { class: 'form' },
    field('title', 'Title', { required: true, maxlength: 200 }),
    field('author', 'Author', { required: true, maxlength: 200 }),
    h('div', { class: 'form-row' },
      field('year', 'Year', { type: 'number', min: 1000 }),
      field('copies', 'Copies', { type: 'number', min: 1, max: 50, value: 1 })),
    field('isbn', 'ISBN (optional)', { inputmode: 'numeric' }),
    message,
    h('div', { class: 'form-actions' }, submit));
  const modal = openModal('Add book', form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    try {
      const book = await withBusy(submit, () => api.addBook(data));
      toast(`Added “${book.title}”.`);
      modal.close();
      refresh();
    } catch (error) {
      message.textContent = error.message;
    }
  });
}
