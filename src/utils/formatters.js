// ═══════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════

export const fmt = {
  number: (n) => n == null ? '—' : Number(n).toLocaleString('fr-FR'),
  pct: (n, decimals = 1) => n == null ? '—' : `${Number(n).toFixed(decimals)}%`,
  mad: (n) => n == null ? '—' : `${Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`,
  cpl: (spend, leads) => leads > 0 ? Math.round(spend / leads) : null,
  ratio: (a, b) => b > 0 ? (a / b * 100) : null,
  date: (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—',
  dateShort: (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  },
  duration: (seconds) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  },
  delta: (current, previous) => {
    if (!previous || previous === 0) return null;
    return Math.round((current - previous) / previous * 100);
  },
};

export const getScoreColor = (score, colors) => {
  if (score >= 60) return colors.good;
  if (score >= 40) return colors.warning;
  return colors.bad;
};

export const getTrendColor = (trend, colors) => {
  if (trend > 0) return colors.good;
  if (trend < 0) return colors.bad;
  return colors.medium;
};

export const getChannelColor = (channel, channelColors) => {
  const key = channel?.toLowerCase?.() || '';
  for (const [k, v] of Object.entries(channelColors)) {
    if (key.includes(k)) return v;
  }
  return '#4A4A6A';
};
