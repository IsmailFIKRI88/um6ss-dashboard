import React from 'react';
import { COLORS } from '../../config/theme';
import { useTheme } from '../../config/ThemeContext';
import { exportTableAsCSV } from '../../utils/csvExport';

// ═══════════════════════════════════════════════
// SHARED UI COMPONENTS (theme-aware)
// ═══════════════════════════════════════════════

export const KPICard = ({ label, value, sub, trend, color, tooltip, small }) => {
  const { mode, accentColor, colors, cardStyle } = useTheme();
  const borderColor = color || accentColor;
  return (
    <div style={{
      ...cardStyle,
      padding: small ? '14px 16px' : '20px 24px',
      flex: 1, minWidth: small ? 140 : 180,
      borderTop: `3px solid ${borderColor}`,
    }} title={tooltip || ''}>
      <div style={{ fontSize: 11, color: colors.medium, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{
        fontSize: small ? 24 : 32, fontWeight: 700, color: colors.dark, marginTop: 4,
        fontFamily: mode.font,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: colors.medium, marginTop: 2 }}>{sub}</div>}
      {trend != null && trend !== undefined && (
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: trend >= 0 ? colors.good : colors.bad }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          <span style={{ color: colors.medium, fontWeight: 400 }}> vs période préc.</span>
        </div>
      )}
    </div>
  );
};

export const AlertBadge = ({ level, text }) => {
  const { colors } = useTheme();
  const bg = level === 2 ? '#FDE8E8' : level === 1 ? '#FEF3E2' : '#E8F5E8';
  const fg = level === 2 ? colors.bad : level === 1 ? colors.warning : colors.good;
  const icon = level === 2 ? '🔴' : level === 1 ? '🟠' : '🟢';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: bg,
      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: fg,
    }}>
      {icon} {text}
    </div>
  );
};

export const SectionTitle = ({ children }) => {
  const { accentColor, colors, mode } = useTheme();
  return (
    <h2 style={{
      fontSize: 16, fontWeight: 700, color: colors.dark, margin: '28px 0 16px',
      fontFamily: mode.font,
      borderBottom: `2px solid ${accentColor}`, paddingBottom: 8, display: 'inline-block',
    }}>{children}</h2>
  );
};

export const ProgressBar = ({ value, max, color, height = 6 }) => {
  const { colors, accentColor } = useTheme();
  return (
    <div style={{ height, background: colors.light, borderRadius: height / 2, overflow: 'hidden', width: '100%' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`,
        background: color || accentColor, borderRadius: height / 2, transition: 'width 0.6s ease',
      }} />
    </div>
  );
};

export const LoadingOverlay = ({ message }) => {
  const { colors, accentColor } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: colors.medium }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTop: `3px solid ${accentColor}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
      <div style={{ fontSize: 14 }}>{message || 'Chargement...'}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export const ErrorBanner = ({ error, onRetry }) => {
  const { colors, cardStyle } = useTheme();
  return (
    <div style={{ background: '#FDE8E8', border: `1px solid ${colors.bad}`, borderRadius: cardStyle.borderRadius, padding: '16px 20px', margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: colors.bad, fontSize: 13 }}>Erreur de connexion</div>
        <div style={{ fontSize: 12, color: colors.dark, marginTop: 2 }}>{error}</div>
      </div>
      {onRetry && <button onClick={onRetry} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${colors.bad}`, background: '#FFFFFF', color: colors.bad, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Réessayer</button>}
    </div>
  );
};

export const EmptyState = ({ icon = '📭', title, subtitle }) => {
  const { colors } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.medium }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
};

/**
 * Sortable data table with CSV export (theme-aware).
 */
export const DataTable = ({ columns, data, title, sortable = true, exportFilename }) => {
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('desc');
  const { mode, colors, cardStyle, accentColor } = useTheme();

  const sorted = React.useMemo(() => {
    if (!sortCol || !sortable) return data;
    return [...data].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      const cmp = typeof va === 'number' ? va - vb : String(va || '').localeCompare(String(vb || ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir, sortable]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  return (
    <div style={{ ...cardStyle, overflow: 'auto', marginBottom: 20 }}>
      {(title || exportFilename) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>{title}</div>}
          {exportFilename && data.length > 0 && (
            <button onClick={() => exportTableAsCSV(data, exportFilename, columns.map(c => c.key))}
              style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.light, fontSize: 11, cursor: 'pointer', color: colors.medium }}>
              📥 CSV
            </button>
          )}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: mode.tableHeaderBg, color: mode.tableHeaderColor }}>
            {columns.map(col => (
              <th key={col.key} onClick={() => sortable && toggleSort(col.key)} style={{
                padding: '10px 12px', textAlign: col.align || 'left', fontWeight: 600, fontSize: 11,
                cursor: sortable ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none',
              }}>
                {col.label}
                {sortCol === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id || i} style={{ borderBottom: `1px solid ${colors.border}`, background: i % 2 === 0 ? mode.cardBg : mode.tableStripeBg }}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '10px 12px', textAlign: col.align || 'left', ...col.style?.(row) }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: colors.medium, fontSize: 12 }}>Aucune donnée</div>}
    </div>
  );
};

export const CampaignProgressBar = ({ start, end }) => {
  const { colors, accentColor, mode } = useTheme();
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  const total = Math.max(1, (e - s) / 86400000);
  const elapsed = Math.max(0, Math.min(total, (now - s) / 86400000));
  const pctTime = Math.round(elapsed / total * 100);
  const dayNum = Math.round(elapsed);
  const totalDays = Math.round(total);
  const isDark = mode.id === 'funky';

  return (
    <div style={{ background: isDark ? 'rgba(255,255,255,0.1)' : colors.light, borderRadius: 6, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: isDark ? 'rgba(255,255,255,0.7)' : colors.medium }}>
      <span>Jour {dayNum}/{totalDays}</span>
      <div style={{ flex: 1, height: 4, background: isDark ? 'rgba(255,255,255,0.15)' : colors.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pctTime}%`, background: isDark ? 'rgba(255,255,255,0.6)' : accentColor, borderRadius: 2 }} />
      </div>
      <span>{pctTime}% écoulé</span>
    </div>
  );
};

export { ConditionalSection } from './ConditionalSection';

export const ConfidenceScore = ({ level }) => {
  const config = {
    ok: { color: COLORS.good, label: 'Données OK', bg: 'rgba(42,160,55,0.15)' },
    warning: { color: COLORS.warning, label: 'Vérifier', bg: 'rgba(232,130,12,0.15)' },
    error: { color: COLORS.bad, label: 'Problème', bg: 'rgba(205,24,27,0.15)' },
  };
  const c = config[level] || config.ok;
  return (
    <div title={`Fiabilité données: ${c.label}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
      borderRadius: 6, background: 'rgba(255,255,255,0.12)', fontSize: 10, color: 'rgba(255,255,255,0.8)',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </div>
  );
};
