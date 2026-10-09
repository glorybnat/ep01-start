const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const config = require('../src/config');

const seedDir = path.join(__dirname, '..', 'data');

// Copies the seed files into a temp directory and points the data layer at
// it, so tests can write freely. Returns a function that removes the copy.
function useTempData() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shelf-test-'));
  for (const name of ['books', 'members', 'loans']) {
    fs.copyFileSync(path.join(seedDir, `${name}.json`), path.join(dir, `${name}.json`));
  }
  config.dataDir = dir;
  return () => fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = { useTempData };
