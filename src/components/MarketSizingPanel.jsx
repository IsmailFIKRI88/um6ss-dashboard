import React, { useState } from 'react';
import { COLORS } from '../config/theme';
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
    { key: 'capacityMax', label: 'Capacité max', single: true, unit: 'places/an' },
  ]},
  { section: 'SOV — Benchmark marché', fields: [
    { key: 'totalMarketSpend', label: 'Spend total marché estimé', single: true, unit: 'MAD/an' },
  ]},
];

function fmtNum(n) {
  if (n === 0 || n === '' || n === null || n === undefined) return '';
  return Number(n).toLocaleString('fr-FR');
}

function NumericInput({ value, onChange, style, accentBorder }) {
  const [focused, setFocused] = useState(false);
  const display = focused ? (value || '') : fmtNum(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={e => {
        const raw = e.target.value.replace(/\s/g, '').replace(',', '.');
        if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
          onChange(raw === '' ? 0 : Number(raw));
        }
      }}
      style={style}
    />
  );
}

export default function MarketSizingPanel({ settings, setSettings }) {
  const [show, setShow] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { colors, cardStyle, accentColor, mode } = useTheme();
  const isDark = mode.id === 'funky';

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: Number(value) || 0 }));
  };

  const reset = () => { setSettings({ ...MARKET_SIZING_DEFAULTS }); setConfirmReset(false); };

  const inputStyle = {
    width: '100%', padding: '6px 8px', borderRadius: 6,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : colors.border}`,
    background: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
    color: isDark ? '#E8E8F0' : colors.dark,
    fontSize: 12, textAlign: 'right',
    fontFamily: mode.fontMono || 'monospace',
    outline: 'none',
  };

  const inputStyleAccent = { ...inputStyle, borderColor: accentColor };
  const inputStyleSingle = { ...inputStyle, width: 140 };

  const labelStyle = { fontSize: 11, color: colors.medium, fontWeight: 600, fontFamily: mode.font };

  const badgeStyle = isDark
    ? { background: 'rgba(0,229,255,0.10)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }
    : { background: COLORS.fermiBg, border: `1px solid ${COLORS.fermiBorder}`, color: COLORS.fermi };

  return (
    <div style={{ ...cardStyle, marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setShow(!show)}
        style={{
          width: '100%', padding: '12px 16px', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'transparent', color: colors.dark, fontSize: 13, fontWeight: 700,
          fontFamily: mode.font,
        }}
      >
        <span>
          🌍 Modèle de Marché (Fermi)
          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, borderRadius: 10, padding: '2px 8px', ...badgeStyle }}>
            ~ ESTIMATION
          </span>
        </span>
        <span style={{ fontSize: 16 }}>{show ? '▾' : '▸'}</span>
      </button>

      {show && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{
            fontSize: 11, color: isDark ? '#9999BB' : COLORS.fermi,
            marginBottom: 16, lineHeight: 1.5,
            borderLeft: `3px solid ${COLORS.fermi}60`, paddingLeft: 12,
          }}>
            Ces paramètres alimentent le modèle Fermi TAM/SAM/SOM.
            Les fourchettes (pessimiste/optimiste) propagent l'incertitude dans tous les calculs dérivés.
          </div>

          {FIELDS.map((section, si) => (
            <div key={section.section} style={{
              marginBottom: 20, paddingBottom: si < FIELDS.length - 1 ? 16 : 0,
              borderBottom: si < FIELDS.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : colors.border}` : 'none',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 10, fontFamily: mode.font }}>
                {section.section}
              </div>
              {section.fields.map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <div style={labelStyle}>
                    {f.label}
                    {f.unit && <span style={{ fontWeight: 400, color: isDark ? '#777799' : colors.border, marginLeft: 4 }}>({f.unit})</span>}
                  </div>
                  {f.single ? (
                    <div style={{ marginTop: 4 }}>
                      <NumericInput
                        value={settings[f.key]}
                        onChange={v => update(f.key, v)}
                        style={inputStyleSingle}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 8px', marginTop: 6, maxWidth: 320 }}>
                      <span style={{ fontSize: 9, textAlign: 'center', color: colors.medium, fontFamily: mode.font }}>Pessimiste</span>
                      <span style={{ fontSize: 9, textAlign: 'center', color: accentColor, fontWeight: 700, fontFamily: mode.font }}>Base</span>
                      <span style={{ fontSize: 9, textAlign: 'center', color: colors.medium, fontFamily: mode.font }}>Optimiste</span>
                      <NumericInput value={settings[f.lowKey]} onChange={v => update(f.lowKey, v)} style={inputStyle} />
                      <NumericInput value={settings[f.key]} onChange={v => update(f.key, v)} style={inputStyleAccent} />
                      <NumericInput value={settings[f.highKey]} onChange={v => update(f.highKey, v)} style={inputStyle} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Reset with confirmation */}
          {confirmReset ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: colors.bad, fontFamily: mode.font }}>Réinitialiser tous les paramètres ?</span>
              <button onClick={reset} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: colors.bad, border: 'none', color: '#FFF', fontWeight: 700,
              }}>Oui</button>
              <button onClick={() => setConfirmReset(false)} style={{
                padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: 'none', border: `1px solid ${colors.border}`, color: colors.medium,
              }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 11,
              border: `1px solid ${colors.bad}40`,
              background: `${colors.bad}0D`,
              color: colors.bad, cursor: 'pointer', marginTop: 8,
              fontFamily: mode.font,
            }}>
              ↺ Réinitialiser les défauts
            </button>
          )}
        </div>
      )}
    </div>
  );
}
