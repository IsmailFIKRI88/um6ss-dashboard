import React, { useState } from 'react';
import { useTheme } from '../config/ThemeContext';
import { MARKET_SIZING_DEFAULTS } from '../config/marketSizing';

// ═══════════════════════════════════════════════
// MARKET SIZING PANEL — Fermi parameters config
// ═══════════════════════════════════════════════

const FIELDS = [
  { section: 'TAM — Marché total', fields: [
    { key: 'targetPopulation', label: 'Population cible (bacheliers santé/an)', lowKey: 'targetPopulationLow', highKey: 'targetPopulationHigh' },
  ]},
  { section: 'SAM — Filtres de marché', fields: [
    { key: 'pctSolvable', label: '% solvables (≥65K MAD/an)', lowKey: 'pctSolvableLow', highKey: 'pctSolvableHigh', unit: '%' },
    { key: 'pctPrivateMarket', label: '% marché privé (pas public / préfèrent privé)', lowKey: 'pctPrivateMarketLow', highKey: 'pctPrivateMarketHigh', unit: '%' },
  ]},
  { section: 'SOM — Part de marché UM6SS', fields: [
    { key: 'marketSharePct', label: 'Part de marché cible', lowKey: 'marketSharePctLow', highKey: 'marketSharePctHigh', unit: '%' },
    { key: 'capacityMax', label: 'Capacité max (places/an)', single: true },
  ]},
  { section: 'SOV — Benchmark marché', fields: [
    { key: 'totalMarketSpend', label: 'Spend total marché estimé (MAD/an)', single: true },
  ]},
];

export default function MarketSizingPanel({ settings, setSettings }) {
  const [show, setShow] = useState(false);
  const { colors, cardStyle, accentColor, mode } = useTheme();

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: Number(value) || 0 }));
  };

  const reset = () => setSettings({ ...MARKET_SIZING_DEFAULTS });

  const inputStyle = {
    width: 80, padding: '5px 8px', borderRadius: 6,
    border: `1px solid ${colors.border}`, background: mode.cardBg,
    color: colors.dark, fontSize: 12, textAlign: 'right',
    fontFamily: 'monospace',
  };

  const labelStyle = { fontSize: 11, color: colors.medium, fontWeight: 600 };

  return (
    <div style={{ ...cardStyle, marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setShow(!show)}
        style={{
          width: '100%', padding: '12px 16px', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'transparent', color: colors.dark, fontSize: 13, fontWeight: 700,
        }}
      >
        <span>
          🌍 Modèle de Marché (Fermi)
          <span style={{
            marginLeft: 8, fontSize: 10, fontWeight: 600, color: '#6B85A8',
            background: '#E8EFF7', border: '1px solid #C5D5E8',
            borderRadius: 10, padding: '2px 8px',
          }}>~ ESTIMATION</span>
        </span>
        <span style={{ fontSize: 16 }}>{show ? '▾' : '▸'}</span>
      </button>

      {show && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 11, color: '#6B85A8', marginBottom: 16, lineHeight: 1.5, borderLeft: `3px solid ${accentColor}40`, paddingLeft: 12 }}>
            Ces paramètres alimentent le modèle Fermi TAM/SAM/SOM.
            Les fourchettes (pessimiste/optimiste) propagent l'incertitude dans tous les calculs dérivés.
          </div>

          {FIELDS.map(section => (
            <div key={section.section} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 8 }}>
                {section.section}
              </div>
              {section.fields.map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <div style={labelStyle}>{f.label}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    {f.single ? (
                      <input
                        type="number" style={{ ...inputStyle, width: 120 }}
                        value={settings[f.key] || ''}
                        onChange={e => update(f.key, e.target.value)}
                      />
                    ) : (
                      <>
                        <span style={{ fontSize: 10, color: colors.medium }}>Pess.</span>
                        <input type="number" style={inputStyle} value={settings[f.lowKey] || ''} onChange={e => update(f.lowKey, e.target.value)} />
                        <span style={{ fontSize: 10, color: colors.dark, fontWeight: 700 }}>Base</span>
                        <input type="number" style={{ ...inputStyle, borderColor: accentColor }} value={settings[f.key] || ''} onChange={e => update(f.key, e.target.value)} />
                        <span style={{ fontSize: 10, color: colors.medium }}>Opt.</span>
                        <input type="number" style={inputStyle} value={settings[f.highKey] || ''} onChange={e => update(f.highKey, e.target.value)} />
                      </>
                    )}
                    {f.unit && <span style={{ fontSize: 10, color: colors.medium }}>{f.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <button onClick={reset} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 11,
            border: `1px solid ${colors.border}`, background: colors.light,
            color: colors.medium, cursor: 'pointer',
          }}>
            Réinitialiser les défauts
          </button>
        </div>
      )}
    </div>
  );
}
