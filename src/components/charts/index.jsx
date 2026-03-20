import React from 'react';
import { COLORS } from '../../config/theme';

// ═══════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: COLORS.dark, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color || '#fff', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}
        </div>
      ))}
    </div>
  );
};

export const FunnelBar = ({ steps }) => (
  <div>
    {steps.map((step, i) => {
      const maxVal = steps[0]?.value || 1;
      const widthPct = (step.value / maxVal) * 100;
      const convRate = i > 0 && steps[i - 1].value > 0
        ? Math.round(step.value / steps[i - 1].value * 100) : 100;
      return (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
            <span style={{ fontWeight: 600, color: COLORS.dark }}>{step.name}</span>
            <span style={{ color: COLORS.medium }}>
              {step.value.toLocaleString('fr-FR')}
              {i > 0 && <span style={{ color: convRate >= 50 ? COLORS.good : convRate >= 20 ? COLORS.warning : COLORS.bad }}> ({convRate}%)</span>}
            </span>
          </div>
          <div style={{ height: 22, background: COLORS.light, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${widthPct}%`, background: step.fill || COLORS.primary, borderRadius: 6, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      );
    })}
  </div>
);

export const SparkLine = ({ data, dataKey, color = COLORS.primary, width = 200, height = 40 }) => {
  if (!data?.length) return null;
  const values = data.map(d => d[dataKey] || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values.map((v, i) =>
    `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * height * 0.8 - height * 0.1}`
  ).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} />
    </svg>
  );
};
