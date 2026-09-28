const fs = require('fs');
const path = require('path');
const config = require('../config');

function filePath(name) {
  return path.join(config.dataDir, `${name}.json`);
}

function readAll(name) {
  try {
    return JSON.parse(fs.readFileSync(filePath(name), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Write to a temp file first so a crash cannot leave half a JSON file behind.
function writeAll(name, items) {
  const target = filePath(name);
  const temp = `${target}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(items, null, 2)}\n`);
  fs.renameSync(temp, target);
}

// Ids look like b021 or l016: a prefix plus a zero-padded running number.
function nextId(prefix, items) {
  const highest = items.reduce((max, item) => {
    const number = Number(item.id.slice(prefix.length));
    return Number.isNaN(number) ? max : Math.max(max, number);
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

module.exports = { readAll, writeAll, nextId };
