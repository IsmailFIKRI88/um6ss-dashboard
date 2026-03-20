// ═══════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════

export function generateCSV(rows, columns = null) {
  if (!rows?.length) return '';
  const cols = columns || Object.keys(rows[0]);
  const header = cols.join(',');
  const body = rows.map(row =>
    cols.map(c => {
      const val = row[c] ?? '';
      const str = String(val);
      // Always quote fields that contain comma, quote, or newline
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  ).join('\n');
  return '\uFEFF' + header + '\n' + body; // BOM for Excel UTF-8
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTableAsCSV(rows, filename = 'export.csv', columns = null) {
  const csv = generateCSV(rows, columns);
  downloadCSV(csv, filename);
}
