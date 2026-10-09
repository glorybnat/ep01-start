const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { useTempData } = require('./helpers');
const { createApp } = require('../src/app');

describe('HTTP API', () => {
  let cleanup;
  let server;
  let baseUrl;

  before(async () => {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());
  beforeEach(() => {
    cleanup = useTempData();
  });
  afterEach(() => cleanup());

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return { status: response.status, body: await response.json() };
  }

  it('answers the health check', async () => {
    const { status, body } = await request('/health');
    assert.equal(status, 200);
    assert.deepEqual(body, { status: 'ok' });
  });

  it('searches books by query string', async () => {
    const { status, body } = await request('/books?q=dune');
    assert.equal(status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Dune');
  });

  it('returns 404 with a message for an unknown book', async () => {
    const { status, body } = await request('/books/b999');
    assert.equal(status, 404);
    assert.match(body.error, /not found/);
  });

  it('returns 400 when adding a book without a title', async () => {
    const { status } = await request('/books', {
      method: 'POST',
      body: JSON.stringify({ author: 'Nobody' }),
    });
    assert.equal(status, 400);
  });

  it('returns 409 when borrowing a book with no copies left', async () => {
    const { status } = await request('/loans', {
      method: 'POST',
      body: JSON.stringify({ memberId: 'm001', bookId: 'b003' }),
    });
    assert.equal(status, 409);
  });

  it('returns a loan with its fee when it is returned', async () => {
    const { status, body } = await request('/loans/l009/return', { method: 'POST' });
    assert.equal(status, 200);
    assert.ok(body.returnedOn);
    assert.ok(body.lateFee > 0);
  });
});
