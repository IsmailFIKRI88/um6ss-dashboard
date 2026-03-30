import React, { useMemo, useState } from 'react';
import { COLORS, FACULTY_LABELS, FACULTY_COLORS } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import { KPICard, SectionTitle, DataTable, AlertBadge } from '../components/ui';
import { computeAdmissionFunnel, computeAdmissionsByEntity, computeAdmissionsByProgramme } from '../processing/admissions';
import { fmt } from '../utils/formatters';

// ═══════════════════════════════════════════════
// VIEW: ADMISSIONS — "Mon programme se remplit ?"
// Audience: Directeurs de faculté, responsables admissions
// ═══════════════════════════════════════════════

export default function ViewAdmissions({ leads, outcomes, financialSettings, dataLayers }) {
  const { colors, cardStyle, accentColor, mode } = useTheme();
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  // ── Funnel global ──
  const funnel = useMemo(() => computeAdmissionFunnel(leads, financialSettings), [leads, financialSettings]);

  // ── By entity ──
  const byEntity = useMemo(() => computeAdmissionsByEntity(leads, financialSettings), [leads, financialSettings]);

  // ── By programme ──
  const byProgramme = useMemo(() => computeAdmissionsByProgramme(leads, financialSettings), [leads, financialSettings]);

  const filteredProgrammes = selectedEntity
    ? byProgramme.filter(p => p.entity === selectedEntity)
    : byProgramme;

  return (
    <div>
      {/* Top KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPICard label="Candidatures" value={fmt.number(funnel.total)}
          tooltip="Nombre total de formulaires de candidature reçus" />
        <KPICard label="Qualifiés" value={fmt.number(funnel.qualified)}
          sub={`score ≥ 60`} color={colors.good}
          tooltip="Candidatures avec un score de qualité suffisant pour être traitées" />
        <KPICard label="Contactés" value={fmt.number(funnel.contacted)}
          sub={funnel.contactRate > 0 ? `${funnel.contactRate}% du total` : undefined}
          color={accentColor}
          tooltip="Candidats ayant reçu un premier contact de l'équipe admissions" />
        <KPICard label="Inscrits" value={fmt.number(funnel.enrolled)}
          sub={funnel.conversionRate > 0 ? `${funnel.conversionRate}% conversion` : undefined}
          color={funnel.enrolled > 0 ? colors.good : colors.medium}
          tooltip="Étudiants dont l'inscription est confirmée (données DSI)" />
        {funnel.yieldRate !== null && (
          <KPICard label="Yield Rate" value={`${funnel.yieldRate}%`}
            sub="contactés → inscrits"
            color={funnel.yieldRate >= 50 ? colors.good : funnel.yieldRate >= 30 ? accentColor : COLORS.warning}
            tooltip="Pourcentage de candidats contactés qui finalisent leur inscription" />
        )}
      </div>

      {/* Alerts */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {funnel.pendingHot > 0 && (
          <AlertBadge level={funnel.pendingHot > 20 ? 2 : 1}
            text={`${funnel.pendingHot} candidat${funnel.pendingHot > 1 ? 's' : ''} chaud${funnel.pendingHot > 1 ? 's' : ''} en attente de contact (score ≥70)`} />
        )}
        {funnel.enrolled === 0 && funnel.total > 50 && (
          <AlertBadge level={1} text="Aucune inscription confirmée — importez les données DSI dans ⚙️ Paramètres" />
        )}
      </div>

      {/* Entity filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => { setSelectedEntity(null); setSelectedProgramme(null); }} style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: `2px solid ${!selectedEntity ? accentColor : colors.border}`,
          background: !selectedEntity ? accentColor : mode.cardBg,
          color: !selectedEntity ? '#FFFFFF' : colors.dark,
          fontFamily: mode.font,
        }}>Toutes les entités</button>
        {byEntity.map(e => (
          <button key={e.code} onClick={() => { setSelectedEntity(e.code); setSelectedProgramme(null); }} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `2px solid ${selectedEntity === e.code ? (FACULTY_COLORS[e.code] || accentColor) : colors.border}`,
            background: selectedEntity === e.code ? (FACULTY_COLORS[e.code] || accentColor) : mode.cardBg,
            color: selectedEntity === e.code ? '#FFFFFF' : colors.dark,
            fontFamily: mode.font,
          }}>
            {e.name}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>{e.total}</span>
          </button>
        ))}
      </div>

      {/* Entity table */}
      <DataTable
        title="Pipeline par Entité"
        columns={[
          { key: 'name', label: 'Entité', render: (v, row) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: FACULTY_COLORS[row.code] || colors.medium, flexShrink: 0 }} />
              <strong>{v}</strong>
            </div>
          )},
          { key: 'total', label: 'Candidatures', align: 'center', style: () => ({ fontWeight: 700 }) },
          { key: 'qualified', label: 'Qualifiés', align: 'center', style: () => ({ color: colors.good }) },
          { key: 'contacted', label: 'Contactés', align: 'center' },
          { key: 'enrolled', label: 'Inscrits', align: 'center', style: () => ({ color: COLORS.primary, fontWeight: 700 }) },
          { key: 'avgScore', label: 'Score Moy.', align: 'center', render: v => (
            <span style={{ color: v >= 60 ? colors.good : v >= 40 ? COLORS.warning : colors.bad, fontWeight: 600 }}>{v}</span>
          )},
          { key: 'fillRate', label: 'Remplissage', align: 'center', render: (v, row) => {
            if (v === null) return <span style={{ color: colors.border, fontSize: 10 }}>—</span>;
            const fillColor = v >= 80 ? colors.good : v >= 50 ? accentColor : COLORS.warning;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 6, background: colors.light, borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
                  <div style={{ height: '100%', width: `${Math.min(v, 100)}%`, background: fillColor, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: fillColor }}>{v}%</span>
              </div>
            );
          }},
        ]}
        data={selectedEntity ? byEntity.filter(e => e.code === selectedEntity) : byEntity}
        exportFilename="admissions_entites.csv"
      />

      {/* Programme heatmap */}
      <SectionTitle>Programmes ({filteredProgrammes.length})</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
        {filteredProgrammes.map((p, i) => {
          const maxLeads = Math.max(...filteredProgrammes.map(x => x.total), 1);
          const opacity = p.total === 0 ? 0.15 : 0.25 + (p.total / maxLeads) * 0.75;
          const isSelected = selectedProgramme === p.name;
          const progColor = FACULTY_COLORS[p.entity] || colors.medium;
          return (
            <div key={i}
              onClick={() => setSelectedProgramme(isSelected ? null : p.name)}
              title={`${p.name}\n${p.total} candidatures · Score ${p.avgScore} · ${p.campus.join(', ') || 'Campus principal'}`}
              style={{
                width: 115, padding: '10px 8px', borderRadius: 8, textAlign: 'center',
                background: progColor, opacity, color: '#FFFFFF',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                border: isSelected ? `3px solid ${colors.dark}` : `1px solid ${progColor}`,
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{p.total}</div>
              <div style={{ marginTop: 2, lineHeight: 1.2, opacity: 0.9 }}>
                {p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name}
              </div>
              {p.campus.length > 1 && (
                <div style={{ fontSize: 8, marginTop: 2, opacity: 0.7 }}>{p.campus.length} campus</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Programme drill-down */}
      {selectedProgramme && (() => {
        const prog = byProgramme.find(p => p.name === selectedProgramme);
        if (!prog) return null;
        const progColor = FACULTY_COLORS[prog.entity] || accentColor;

        return (
          <div style={{ ...cardStyle, padding: 20, border: `2px solid ${progColor}`, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{prog.name}</div>
                <div style={{ fontSize: 11, color: colors.medium }}>
                  {prog.entityName} · Score moy: {prog.avgScore} · {prog.campus.join(', ') || 'Campus principal'}
                </div>
              </div>
              <button onClick={() => setSelectedProgramme(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: colors.medium }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
              <KPICard small label="Candidatures" value={fmt.number(prog.total)} color={progColor} />
              <KPICard small label="Qualifiés" value={fmt.number(prog.qualified)} color={colors.good} />
              <KPICard small label="Contactés" value={fmt.number(prog.contacted)} color={accentColor} />
              <KPICard small label="Inscrits" value={fmt.number(prog.enrolled)} color={COLORS.primary} />
              {prog.capacity > 0 && (
                <KPICard small label="Remplissage" value={`${prog.fillRate}%`}
                  sub={`${prog.enrolled} / ${prog.capacity}`}
                  color={prog.fillRate >= 80 ? colors.good : prog.fillRate >= 50 ? accentColor : COLORS.warning} />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
