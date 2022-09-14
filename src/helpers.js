export const datesAreOnSameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export const getTotals = (input) => {
  return Object.keys(input)
    .filter(type => !excludeFromTotals.includes(type))
    .reduce((acc, type) => acc + getTotalsByType(input, type), 0);
}

export const getTotalsByType = (input, type) => {
  return Object.keys(input[type] ?? {})
    .reduce((acc, status) => acc + input[type][status], 0);
}

export const getByStatus = (input, status = 'captured') => {
  return Object.keys(input)
    .filter(type => !excludeFromTotals.includes(type))
    .reduce((acc, type) => acc + getByStatusAndType(input, type, status), 0);
}

export const getByStatusAndType = (input, type, status) => {
  return input[type]?.[status] ?? 0;
}

export const excludeFromTotals = [
  'man-portable air defence systems',
  'anti-tank guided missiles',
  'total',
];

export const sortByName = (a, b) => {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();

  if (aName.includes('unknown') && !bName.includes('unknown')) return 1;
  if (bName.includes('unknown') && !aName.includes('unknown')) return -1;

  return a.name.localeCompare(b.name);
}
