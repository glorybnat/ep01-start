// Dates are plain YYYY-MM-DD strings, handled in UTC so results do not
// shift with the server's time zone.
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parse(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function format(date) {
  return date.toISOString().slice(0, 10);
}

function today() {
  return format(new Date());
}

function addDays(isoDate, days) {
  return format(new Date(parse(isoDate).getTime() + days * MS_PER_DAY));
}

// Whole days from `from` to `to`; negative when `to` is earlier.
function daysBetween(from, to) {
  return Math.round((parse(to) - parse(from)) / MS_PER_DAY);
}

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  return format(parse(value)) === value;
}

module.exports = { today, addDays, daysBetween, isValidDate };
