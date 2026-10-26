// Thin wrapper over the Shelf JSON API. Errors carry the server's message.
async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((body && body.error) || `Request failed (${response.status})`);
  }
  return body;
}

const post = (path, data) =>
  request(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined });

export const api = {
  books: (q) => request(q ? `/books?q=${encodeURIComponent(q)}` : '/books'),
  addBook: (data) => post('/books', data),
  members: () => request('/members'),
  member: (id) => request(`/members/${encodeURIComponent(id)}`),
  loans: (status) => request(status ? `/loans?status=${status}` : '/loans'),
  borrow: (memberId, bookId) => post('/loans', { memberId, bookId }),
  returnLoan: (id) => post(`/loans/${encodeURIComponent(id)}/return`),
  overdue: () => request('/reports/overdue'),
  mostBorrowed: (limit = 5) => request(`/reports/most-borrowed?limit=${limit}`),
};
