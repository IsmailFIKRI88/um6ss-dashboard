// ═══════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════

export const today = () => new Date().toISOString().split('T')[0];

export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const daysBetween = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / 86400000);
};

export const filterByDateRange = (items, dateField, start, end) => {
  return items.filter(item => {
    const d = item[dateField]?.split?.(' ')?.[0] || item[dateField];
    if (!d) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
};

export const groupByDate = (items, dateField) => {
  const groups = {};
  items.forEach(item => {
    const d = item[dateField]?.split?.(' ')?.[0] || item[dateField] || 'unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(item);
  });
  return groups;
};

export const previousPeriod = (startDate, endDate) => {
  const days = daysBetween(startDate, endDate);
  return {
    start: daysAgo(days * 2 + daysBetween(daysAgo(0), endDate)),
    end: startDate,
  };
};
