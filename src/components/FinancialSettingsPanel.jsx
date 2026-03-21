import React, { useRef, useState, useMemo } from 'react';
import { FACULTY_LABELS, FACULTY_COLORS } from '../config/theme';
import { PROGRAMS, PROGRAMS_BY_ENTITY, ENTITY_KEY, computeProgramLTV } from '../config/programs';
import { useTheme } from '../config/ThemeContext';
import { fmt } from '../utils/formatters';

// ── Field definitions ──
const SIMPLE_FIELDS = [
  { key: 'annualFees',      label: 'Frais/an',   unit: 'MAD', placeholder: '65000' },
  { key: 'programYears',    label: 'Durée',       unit: 'ans', placeholder: '3', step: '0.5' },
  { key: 'maxCapacity',     label: 'Capacité',    unit: '',    placeholder: '60' },
  { key: 'enrollmentTarget',label: 'Objectif',    unit: '',    placeholder: '50' },
];

const ADVANCED_FIELDS = [
  { key: 'registrationFees',label: 'Frais inscr.', unit: 'MAD', placeholder: '10000' },
  { key: 'annualFees',      label: 'Frais/an',     unit: 'MAD', placeholder: '65000' },
  { key: 'programYears',    label: 'Durée',         unit: 'ans', placeholder: '3', step: '0.5' },
  { key: 'retentionY1',     label: 'Rét. A1',       unit: '%',   placeholder: '88' },
  { key: 'retentionOngoing', label: 'Rét. A2+',     unit: '%',   placeholder: '97' },
  { key: 'maxCapacity',     label: 'Capacité',      unit: '',    placeholder: '60' },
  { key: 'enrollmentTarget',label: 'Objectif',      unit: '',    placeholder: '50' },
];

const CYCLE_BADGE = {
  'Licence':                    { label: 'Licence',   bg: '#E3F2FD', color: '#1565C0' },
  'Master':                     { label: 'Master',    bg: '#F3E5F5', color: '#7B1FA2' },
  'Doctorat':                   { label: 'Doctorat',  bg: '#FFF3E0', color: '#E65100' },
  "Diplôme d'Ingénieur d'État": { label: 'Ingénieur', bg: '#E8F5E9', color: '#2E7D32' },
};

const BULK_FIELDS = [
  { key: 'annualFees',   label: 'Frais/an',  placeholder: '65000' },
  { key: 'maxCapacity',  label: 'Capacité',  placeholder: '60' },
  { key: 'enrollmentTarget', label: 'Objectif', placeholder: '50' },
];

export default function FinancialSettingsPanel({ settings, setSettings }) {
  const [show, setShow] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const fileRef = useRef(null);
  const { mode, colors, cardStyle, accentColor } = useTheme();

  const fields = advancedMode ? ADVANCED_FIELDS : SIMPLE_FIELDS;

  const inputStyle = {
    width: '100%', padding: '5px 6px', borderRadius: 4,
    border: `1px solid ${colors.border}`, fontSize: 11,
    fontFamily: mode.fontMono, boxSizing: 'border-box',
    background: mode.id === 'funky' ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
    color: colors.dark, textAlign: 'center',
  };

  const update = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value === '' ? 0 : Number(value) },
    }));
  };

  const bulkUpdate = (entityCode, field, value) => {
    const programs = PROGRAMS_BY_ENTITY[entityCode] || [];
    setSettings(prev => {
      const next = { ...prev };
      for (const p of programs) {
        next[p.id] = { ...next[p.id], [field]: value === '' ? 0 : Number(value) };
      }
      return next;
    });
  };

  // ── Global summary ──
  const globalSummary = useMemo(() => {
    let configured = 0;
    for (const p of PROGRAMS) {
      const s = settings[p.id];
      if (s && s.annualFees > 0) configured++;
    }
    return { configured, total: PROGRAMS.length };
  }, [settings]);

  // ── Entity summary ──
  const entitySummary = (entityCode) => {
    const programs = PROGRAMS_BY_ENTITY[entityCode] || [];
    const entitySettings = settings[ENTITY_KEY(entityCode)] || {};
    let configured = 0, totalCap = 0, totalTarget = 0, ltvSum = 0, ltvCount = 0;
    for (const p of programs) {
      const s = settings[p.id] || {};
      if (s.annualFees > 0) {
        configured++;
        const ltv = computeProgramLTV(s);
        ltvSum += ltv;
        ltvCount++;
      }
      totalCap += s.maxCapacity || 0;
      totalTarget += s.enrollmentTarget || 0;
    }
    return {
      total: programs.length, configured, totalCap, totalTarget,
      avgLTV: ltvCount > 0 ? Math.round(ltvSum / ltvCount) : 0,
      budget: entitySettings.budgetAlloue || 0,
    };
  };

  // ── CSV import ──
  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return;
        const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());

        const findCol = (...terms) => headers.findIndex(h => terms.some(t => h.includes(t)));
        const idIdx = findCol('id', 'program_id');
        const nameIdx = findCol('programme', 'program', 'nom');
        const entityIdx = findCol('entite', 'entité', 'entity');
        const regFeesIdx = findCol('inscription', 'registration');
        const feesIdx = findCol('scolarit', 'frais', 'fees');
        const yearsIdx = findCol('durée', 'duree', 'years', 'ans');
        const retY1Idx = findCol('ret_a1', 'retention_a1', 'rét');
        const retOnIdx = findCol('ret_a2', 'retention_a2', 'ongoing');
        const capIdx = findCol('capacit', 'capacity');
        const targetIdx = findCol('objectif', 'target');
        const budgetIdx = findCol('budget');
        const mktgIdx = findCol('mktg', 'marketing', 'couts_mktg');

        if (idIdx === -1 && nameIdx === -1) {
          alert('Colonne "id" ou "programme" introuvable. Utilisez le template CSV.');
          return;
        }

        const newSettings = { ...settings };
        let imported = 0;
        const entityBudgets = {};

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(sep).map(c => c.trim());
          let program = null;
          if (idIdx >= 0 && cols[idIdx]) program = PROGRAMS.find(p => p.id === cols[idIdx]);
          if (!program && nameIdx >= 0 && cols[nameIdx]) {
            const name = cols[nameIdx].toLowerCase();
            const entity = entityIdx >= 0 ? cols[entityIdx] : '';
            program = PROGRAMS.find(p => {
              const nm = p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase());
              return entity ? nm && (p.entity === entity || (FACULTY_LABELS[p.entity] || '').toLowerCase().includes(entity.toLowerCase())) : nm;
            });
          }
          if (!program) continue;

          const prev = newSettings[program.id] || {};
          const setNum = (idx, key) => { if (idx >= 0 && cols[idx]) prev[key] = Number(cols[idx]) || 0; };
          setNum(regFeesIdx, 'registrationFees');
          setNum(feesIdx, 'annualFees');
          setNum(yearsIdx, 'programYears');
          setNum(retY1Idx, 'retentionY1');
          setNum(retOnIdx, 'retentionOngoing');
          setNum(capIdx, 'maxCapacity');
          setNum(targetIdx, 'enrollmentTarget');
          newSettings[program.id] = prev;
          imported++;

          // Entity-level from first occurrence
          const ek = ENTITY_KEY(program.entity);
          if (!entityBudgets[ek]) entityBudgets[ek] = {};
          if (budgetIdx >= 0 && cols[budgetIdx] && !entityBudgets[ek].budgetAlloue) {
            entityBudgets[ek].budgetAlloue = Number(cols[budgetIdx]) || 0;
          }
          if (mktgIdx >= 0 && cols[mktgIdx] && !entityBudgets[ek].marketingFixedCosts) {
            entityBudgets[ek].marketingFixedCosts = Number(cols[mktgIdx]) || 0;
          }
        }

        for (const [ek, vals] of Object.entries(entityBudgets)) {
          newSettings[ek] = { ...(newSettings[ek] || {}), ...vals };
        }

        setSettings(newSettings);
        alert(`${imported} programme(s) importé(s).`);
      } catch (err) { alert('Erreur : ' + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── CSV export ──
  const exportCSV = () => {
    const header = 'id;entite;programme;cycle;frais_inscription;frais_scolarite_an;duree_ans;retention_a1;retention_a2_plus;capacite;objectif_inscrits;budget_entite;couts_mktg_mois';
    const entityBudgets = {};
    Object.keys(PROGRAMS_BY_ENTITY).forEach(code => {
      entityBudgets[code] = settings[ENTITY_KEY(code)] || {};
    });
    const rows = PROGRAMS.map(p => {
      const s = settings[p.id] || {};
      const e = entityBudgets[p.entity] || {};
      return [p.id, p.entity, p.name, p.cycle, s.registrationFees||0, s.annualFees||0, s.programYears||0, s.retentionY1||0, s.retentionOngoing||0, s.maxCapacity||0, s.enrollmentTarget||0, e.budgetAlloue||'', e.marketingFixedCosts||''].join(';');
    });
    const blob = new Blob(['\ufeff' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'um6ss_parametres_financiers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Collapsed button ──
  if (!show) return (
    <button onClick={() => setShow(true)} style={{
      padding: '6px 14px', borderRadius: 8, border: `1px solid ${colors.border}`,
      background: mode.cardBg, fontSize: 11, cursor: 'pointer', color: colors.medium,
      marginBottom: 16, fontFamily: mode.font,
    }}>
      💰 Paramètres Financiers
      <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.7 }}>
        {globalSummary.configured}/{globalSummary.total} configurés
      </span>
    </button>
  );

  // ── Pill toggle ──
  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding: '3px 10px', borderRadius: 10, fontSize: 9, fontWeight: 600, cursor: 'pointer',
      border: `1px solid ${active ? accentColor : colors.border}`,
      background: active ? accentColor : 'transparent',
      color: active ? '#FFF' : colors.medium, fontFamily: mode.font,
    }}>{children}</button>
  );

  return (
    <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.dark, fontFamily: mode.font }}>
            💰 Paramètres Financiers
          </span>
          <span style={{ fontSize: 10, color: colors.medium }}>{globalSummary.configured}/{globalSummary.total} programmes configurés</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <Pill active={!advancedMode} onClick={() => setAdvancedMode(false)}>Simple</Pill>
            <Pill active={advancedMode} onClick={() => setAdvancedMode(true)}>Avancé</Pill>
          </div>
          <button onClick={exportCSV} title="Exporter le template CSV" style={{
            padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.border}`,
            background: 'none', fontSize: 10, cursor: 'pointer', color: colors.medium, fontFamily: mode.font,
          }}>📥 CSV</button>
          <button onClick={() => fileRef.current?.click()} title="Importer depuis CSV/Excel" style={{
            padding: '4px 10px', borderRadius: 6, border: `1px solid ${accentColor}`,
            background: 'none', fontSize: 10, cursor: 'pointer', color: accentColor, fontFamily: mode.font,
          }}>📤 Import</button>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
          <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: colors.medium, padding: '0 4px' }}>✕</button>
        </div>
      </div>

      {advancedMode && (
        <div style={{ fontSize: 10, color: colors.medium, marginBottom: 12, lineHeight: 1.5 }}>
          Mode avancé : frais d'inscription (one-shot A1), rétention A1 (% retenus après année 1), rétention A2+ (% retenus chaque année suivante). La LTV intègre la courbe de rétention réelle.
        </div>
      )}

      {/* ── Entity accordion ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(FACULTY_LABELS).map(([entityCode, entityName]) => {
          const color = FACULTY_COLORS[entityCode] || colors.medium;
          const programs = PROGRAMS_BY_ENTITY[entityCode] || [];
          const summary = entitySummary(entityCode);
          const isExpanded = expandedEntity === entityCode;
          const eSettings = settings[ENTITY_KEY(entityCode)] || {};

          return (
            <div key={entityCode} style={{ ...cardStyle, borderLeft: `4px solid ${color}`, overflow: 'hidden' }}>
              {/* ── Entity header ── */}
              <button
                onClick={() => setExpandedEntity(isExpanded ? null : entityCode)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                  cursor: 'pointer', fontFamily: mode.font, textAlign: 'left', gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{entityName}</span>
                  <span style={{ fontSize: 10, color: colors.medium, whiteSpace: 'nowrap' }}>
                    {summary.configured}/{summary.total} prog.
                    {summary.avgLTV > 0 && <> · LTV {fmt.mad(summary.avgLTV)}</>}
                    {summary.totalCap > 0 && <> · {summary.totalCap} places</>}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: colors.medium, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
              </button>

              {/* ── Expanded content ── */}
              {isExpanded && (
                <div style={{ padding: '0 14px 14px' }}>
                  {/* Entity-level fields: budget + marketing costs */}
                  <div style={{
                    display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
                    padding: '10px 12px', marginBottom: 10, borderRadius: 6,
                    background: mode.id === 'funky' ? 'rgba(255,255,255,0.04)' : `${color}08`,
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ flex: '0 0 160px' }}>
                      <label style={{ fontSize: 9, fontWeight: 600, color, display: 'block', marginBottom: 2 }}>Budget campagne (MAD)</label>
                      <input type="number" value={eSettings.budgetAlloue || ''} placeholder="0"
                        onChange={e => update(ENTITY_KEY(entityCode), 'budgetAlloue', e.target.value)}
                        style={{ ...inputStyle, textAlign: 'left', borderColor: color + '40' }} />
                    </div>
                    <div style={{ flex: '0 0 160px' }}>
                      <label style={{ fontSize: 9, fontWeight: 600, color, display: 'block', marginBottom: 2 }}>Coûts mktg/mois (MAD)</label>
                      <input type="number" value={eSettings.marketingFixedCosts || ''} placeholder="0"
                        onChange={e => update(ENTITY_KEY(entityCode), 'marketingFixedCosts', e.target.value)}
                        style={{ ...inputStyle, textAlign: 'left', borderColor: color + '40' }} />
                    </div>
                    {/* Bulk fill separator */}
                    <div style={{ width: 1, height: 28, background: colors.border, margin: '0 4px' }} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: colors.medium, alignSelf: 'center' }}>Appliquer à tous :</span>
                    {BULK_FIELDS.map(f => (
                      <div key={f.key} style={{ flex: '0 0 90px' }}>
                        <label style={{ fontSize: 9, color: colors.medium, display: 'block', marginBottom: 2 }}>{f.label}</label>
                        <input type="number" placeholder={f.placeholder}
                          onChange={e => { if (e.target.value) bulkUpdate(entityCode, f.key, e.target.value); }}
                          style={{ ...inputStyle, fontSize: 10 }} />
                      </div>
                    ))}
                  </div>

                  {/* ── Programs table ── */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                          <th style={{ textAlign: 'left', padding: '6px 8px', color: colors.medium, fontWeight: 600, fontSize: 10 }}>Programme</th>
                          <th style={{ textAlign: 'center', padding: '6px 4px', color: colors.medium, fontWeight: 600, fontSize: 10, width: 60 }}>Cycle</th>
                          {fields.map(f => (
                            <th key={f.key} style={{ textAlign: 'center', padding: '6px 4px', color: colors.medium, fontWeight: 600, fontSize: 9, width: advancedMode ? 72 : 78 }}>
                              {f.label}{f.unit && <span style={{ fontWeight: 400, opacity: 0.6 }}> {f.unit}</span>}
                            </th>
                          ))}
                          <th style={{ textAlign: 'right', padding: '6px 8px', color: colors.medium, fontWeight: 600, fontSize: 10, width: 75 }}>LTV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programs.map((p, i) => {
                          const s = settings[p.id] || {};
                          const ltv = computeProgramLTV(s);
                          const badge = CYCLE_BADGE[p.cycle] || { label: p.cycle, bg: colors.light, color: colors.medium };
                          const isConfigured = s.annualFees > 0;

                          return (
                            <tr key={p.id} style={{
                              borderBottom: `1px solid ${colors.border}`,
                              background: i % 2 === 0 ? 'transparent' : (mode.id === 'funky' ? 'rgba(255,255,255,0.02)' : '#FAFAFF'),
                              opacity: isConfigured ? 1 : 0.7,
                            }}>
                              <td style={{ padding: '5px 8px', color: colors.dark, maxWidth: 200 }}>
                                <div style={{ fontSize: 11, lineHeight: 1.3 }}>{p.name}</div>
                              </td>
                              <td style={{ padding: '4px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                                  fontSize: 8, fontWeight: 600, background: badge.bg, color: badge.color,
                                  letterSpacing: 0.3,
                                }}>{badge.label}</span>
                              </td>
                              {fields.map(f => (
                                <td key={f.key} style={{ padding: '3px 2px' }}>
                                  <input
                                    type="number"
                                    step={f.step}
                                    value={s[f.key] || ''}
                                    placeholder={f.placeholder}
                                    onChange={e => update(p.id, f.key, e.target.value)}
                                    style={{ ...inputStyle, fontSize: 10 }}
                                  />
                                </td>
                              ))}
                              <td style={{
                                padding: '5px 8px', textAlign: 'right', fontWeight: 600,
                                fontSize: 10, fontFamily: mode.fontMono,
                                color: ltv > 0 ? colors.good : colors.border,
                              }}>
                                {ltv > 0 ? fmt.mad(ltv) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 9, color: colors.medium, fontStyle: 'italic', marginTop: 12, lineHeight: 1.5 }}>
        Exportez le template CSV, remplissez dans Excel (séparateur ; , ou tab), puis importez. Données persistées en localStorage.
      </div>
    </div>
  );
}
