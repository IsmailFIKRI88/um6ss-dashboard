import React from 'react';
import { COLORS } from '../../config/theme';
import { useTheme } from '../../config/ThemeContext';

// ═══════════════════════════════════════════════
// MARKET FUNNEL — TAM → SAM → SOM → Inscrits
// ═══════════════════════════════════════════════

const STAGES = [
  { key: 'tam', label: 'TAM (Marché total)', icon: '🌍' },
  { key: 'sam', label: 'SAM (Adressable)', icon: '🎯' },
  { key: 'som', label: 'SOM (Capturable)', icon: '📊' },
];

function fmtK(n) {
  if (n == null) return '—';
  if (n >= 10000) return `~${Math.round(n / 1000)}K`;
  if (n >= 1000) return `~${(Math.round(n / 100) / 10).toFixed(1)}K`;
  return `~${Math.round(n / 10) * 10}`;
}

export function MarketFunnel({ tam, sam, som, enrolled = 0 }) {
  const { colors, cardStyle, accentColor, mode } = useTheme();
  const maxVal = tam?.high || tam?.base || 1;

  const stages = [
    { ...STAGES[0], ...tam, color: COLORS.fermi },
    { ...STAGES[1], ...sam, color: '#418CCB' },
    { ...STAGES[2], ...som, color: accentColor },
  ];

  return (
    <div style={{ ...cardStyle, padding: '20px 24px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>
        Entonnoir de marché
        <span style={{
          marginLeft: 8, fontSize: 10, fontWeight: 600, color: COLORS.fermi,
          background: COLORS.fermiBg, border: `1px solid ${COLORS.fermiBorder}`,
          borderRadius: 10, padding: '2px 8px',
        }}>~ MODÈLE</span>
      </div>

      {stages.map((s, i) => {
        const widthBase = Math.max(8, (s.base / maxVal) * 100);
        const widthHigh = Math.max(8, (s.high / maxVal) * 100);
        return (
          <div key={s.key} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.medium }}>
                {s.icon} {s.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark, fontFamily: 'monospace' }}>
                {fmtK(s.base)}
              </span>
            </div>
            <div style={{ position: 'relative', height: 20, background: colors.light, borderRadius: 4, overflow: 'hidden' }}>
              {/* Uncertainty range (high) — hatched */}
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${widthHigh}%`, borderRadius: 4,
                background: `repeating-linear-gradient(45deg, transparent, transparent 3px, ${s.color}18 3px, ${s.color}18 6px)`,
              }} />
              {/* Base value — solid */}
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${widthBase}%`, borderRadius: 4,
                background: s.color, opacity: 0.7,
                borderRight: `2px dashed ${s.color}`,
              }} />
            </div>
            <div style={{ fontSize: 10, color: COLORS.fermi, marginTop: 2, fontFamily: 'monospace' }}>
              {fmtK(s.low)} — {fmtK(s.high)}
            </div>
          </div>
        );
      })}

      {/* Enrolled — real data, solid style */}
      <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.dark }}>
            ✅ Inscrits réels
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.good, fontFamily: 'monospace' }}>
            {enrolled.toLocaleString('fr-FR')}
          </span>
        </div>
        <div style={{ position: 'relative', height: 20, background: colors.light, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4, background: COLORS.good,
            width: `${Math.max(2, (enrolled / maxVal) * 100)}%`,
          }} />
        </div>
      </div>
    </div>
  );
}
