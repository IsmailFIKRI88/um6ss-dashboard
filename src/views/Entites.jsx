import React, { useMemo, useState } from 'react';
import { COLORS, FACULTY_LABELS, FACULTY_COLORS } from '../config/theme';
import { QUALIFIED_SCORE_MIN } from '../config/defaults';
import { SectionTitle, DataTable, KPICard } from '../components/ui';
import { fmt } from '../utils/formatters';

export default function ViewEntites({ leads, adSpend, experiments, dateRange }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  // ── Faculty aggregation ──
  const facultyData = useMemo(() => {
    const byFac = {};
    leads.forEach(l => {
      let code = extractEntity(l);
      if (!byFac[code]) byFac[code] = { leads: 0, qualified: 0, enrolled: 0, scores: [], programmes: new Set() };
      byFac[code].leads++;
      if (Number(l.score) >= QUALIFIED_SCORE_MIN) byFac[code].qualified++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byFac[code].enrolled++;
      byFac[code].scores.push(Number(l.score) || 0);
      if (l.programme_label) byFac[code].programmes.add(l.programme_label);
    });
    return Object.entries(byFac).map(([code, d]) => ({
      code, name: FACULTY_LABELS[code] || code,
      color: FACULTY_COLORS[code] || COLORS.medium,
      leads: d.leads, qualified: d.qualified, enrolled: d.enrolled,
      programmes: d.programmes.size,
      avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
    })).sort((a, b) => b.leads - a.leads);
  }, [leads]);

  // ── Programme heatmap ──
  const programmeData = useMemo(() => {
    const byProg = {};
    leads.forEach(l => {
      const prog = l.programme_label || l.programme_id || 'Non spécifié';
      const entity = extractEntity(l);
      if (!byProg[prog]) byProg[prog] = { entity, leads: 0, qualified: 0, enrolled: 0, scores: [], campus: new Set() };
      byProg[prog].leads++;
      if (Number(l.score) >= QUALIFIED_SCORE_MIN) byProg[prog].qualified++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byProg[prog].enrolled++;
      byProg[prog].scores.push(Number(l.score) || 0);
      if (l.campus_label) byProg[prog].campus.add(l.campus_label);
    });
    return Object.entries(byProg).map(([name, d]) => ({
      name, entity: d.entity,
      entityName: FACULTY_LABELS[d.entity] || d.entity,
      color: FACULTY_COLORS[d.entity] || COLORS.medium,
      leads: d.leads, qualified: d.qualified, enrolled: d.enrolled,
      campus: [...d.campus],
      avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
    })).sort((a, b) => b.leads - a.leads);
  }, [leads]);

  const filteredProgrammes = selectedEntity
    ? programmeData.filter(p => p.entity === selectedEntity)
    : programmeData;

  // ── A/B experiments ──
  const activeExperiments = useMemo(() =>
    (experiments || []).filter(e => e.status === 'active' || e.status === 'running')
  , [experiments]);

  return (
    <div>
      {/* Entity filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setSelectedEntity(null)} style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: `2px solid ${!selectedEntity ? COLORS.primary : COLORS.border}`,
          background: !selectedEntity ? COLORS.primary : COLORS.white,
          color: !selectedEntity ? COLORS.white : COLORS.dark,
        }}>Toutes</button>
        {facultyData.map(f => (
          <button key={f.code} onClick={() => setSelectedEntity(f.code)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `2px solid ${selectedEntity === f.code ? f.color : COLORS.border}`,
            background: selectedEntity === f.code ? f.color : COLORS.white,
            color: selectedEntity === f.code ? COLORS.white : COLORS.dark,
          }}>{f.name}</button>
        ))}
      </div>

      {/* Faculty table */}
      <DataTable
        title="Performance par Entité"
        columns={[
          { key: 'name', label: 'Entité', render: (v, row) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: row.color, flexShrink: 0 }} />
              <strong>{v}</strong>
            </div>
          )},
          { key: 'leads', label: 'Leads', align: 'center', style: () => ({ fontWeight: 700 }) },
          { key: 'qualified', label: 'Qualifiés', align: 'center', style: () => ({ color: COLORS.good }) },
          { key: 'enrolled', label: 'Inscrits', align: 'center', style: () => ({ color: COLORS.primary, fontWeight: 700 }) },
          { key: 'programmes', label: 'Programmes', align: 'center' },
          { key: 'avgScore', label: 'Score Moy.', align: 'center', render: v => (
            <span style={{ color: v >= 60 ? COLORS.good : v >= 40 ? COLORS.warning : COLORS.bad, fontWeight: 600 }}>{v}</span>
          )},
        ]}
        data={selectedEntity ? facultyData.filter(f => f.code === selectedEntity) : facultyData}
        exportFilename="entites.csv"
      />

      {/* Programme heatmap */}
      <SectionTitle>Programmes ({filteredProgrammes.length})</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
        {filteredProgrammes.map((p, i) => {
          const maxLeads = Math.max(...filteredProgrammes.map(x => x.leads), 1);
          const opacity = p.leads === 0 ? 0.15 : 0.25 + (p.leads / maxLeads) * 0.75;
          const isSelected = selectedProgramme === p.name;
          return (
            <div key={i}
              onClick={() => setSelectedProgramme(isSelected ? null : p.name)}
              title={`${p.name}\n${p.leads} leads · Score ${p.avgScore} · ${p.campus.join(', ')}`}
              style={{
                width: 115, padding: '10px 8px', borderRadius: 8, textAlign: 'center',
                background: p.color, opacity, color: COLORS.white,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                border: isSelected ? `3px solid ${COLORS.dark}` : `1px solid ${p.color}`,
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{p.leads}</div>
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
        const prog = programmeData.find(p => p.name === selectedProgramme);
        if (!prog) return null;
        const progLeads = leads.filter(l => (l.programme_label || l.programme_id) === selectedProgramme);
        const byCampus = {};
        progLeads.forEach(l => {
          const c = l.campus_label || 'Non spécifié';
          if (!byCampus[c]) byCampus[c] = { leads: 0, qualified: 0, enrolled: 0 };
          byCampus[c].leads++;
          if (Number(l.score) >= QUALIFIED_SCORE_MIN) byCampus[c].qualified++;
          if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byCampus[c].enrolled++;
        });

        const progExps = activeExperiments.filter(e =>
          e.programme_id === selectedProgramme || (e.lp_slug && progLeads.some(l => l.lp_slug === e.lp_slug))
        );

        return (
          <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, border: `2px solid ${prog.color}`, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark }}>{prog.name}</div>
                <div style={{ fontSize: 11, color: COLORS.medium }}>{prog.entityName} · Score moy: {prog.avgScore} · {prog.campus.join(', ')}</div>
              </div>
              <button onClick={() => setSelectedProgramme(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: COLORS.medium }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
              <KPICard small label="Leads" value={prog.leads} color={prog.color} />
              <KPICard small label="Qualifiés" value={prog.qualified} color={COLORS.good} />
              <KPICard small label="Inscrits" value={prog.enrolled} color={COLORS.primary} />
            </div>

            {/* Campus breakdown */}
            {Object.keys(byCampus).length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, marginBottom: 8 }}>Par Campus</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(byCampus).map(([campus, d]) => (
                    <div key={campus} style={{ background: COLORS.light, borderRadius: 8, padding: '10px 14px', flex: '1 1 120px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>{campus}</div>
                      <div style={{ fontSize: 10, color: COLORS.medium }}>{d.leads} leads · {d.qualified} qualifiés · {d.enrolled} inscrits</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active A/B tests */}
            {progExps.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0F7FF', borderRadius: 8, fontSize: 12 }}>
                <strong>🔬 A/B Tests actifs :</strong> {progExps.map(e => e.hypothesis || e.id).join(', ')}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Helper: extract entity code from lead ──
function extractEntity(lead) {
  const entite = lead.lp_entite || '';
  const slug = lead.lp_slug || '';
  if (slug.includes('sciences-infirmieres') || entite.toLowerCase().includes('infirm')) return 'FM6SIPS';
  if (slug.includes('medecine-dentaire') || entite.toLowerCase().includes('dentaire')) return 'FM6MD';
  if (slug.includes('pharmacie') || entite.toLowerCase().includes('pharmacie')) return 'FM6P';
  if (slug.includes('veterinaire') || entite.toLowerCase().includes('vétérinaire')) return 'FM6MV';
  if (slug.includes('ingenieur') || entite.toLowerCase().includes('ingénieur')) return 'ESM6ISS';
  if (slug.includes('medecine') || entite.toLowerCase().includes('médecine')) return 'FM6M';
  if (slug.includes('biosciences') || entite.toLowerCase().includes('biosciences')) return 'ISMBB';
  if (slug.includes('sante-publique') || entite.toLowerCase().includes('santé publique')) return 'EIMSP';
  return lead.entity_code || 'Autre';
}
