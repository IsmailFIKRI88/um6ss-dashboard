import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS, FACULTY_COLORS, FACULTY_LABELS } from '../config/theme';
import { useTheme } from '../config/ThemeContext';
import { KPICard, SectionTitle, DataTable, ConditionalSection } from '../components/ui';
import { CustomTooltip } from '../components/charts';
import { computeRetention, computeNPS, computeAlumni } from '../processing/retention';
import { useStaticData } from '../data/useStaticData';
import { fmt } from '../utils/formatters';

// ═══════════════════════════════════════════════
// VIEW: RÉTENTION — "Combien on garde ? Qualité diplômés ?"
// Audience: VP Académique, DG, Finance
// ═══════════════════════════════════════════════

export default function ViewRetention() {
  const { colors, cardStyle, accentColor, mode } = useTheme();

  // Load static data
  const scolarite = useStaticData('scolarite-sample.json');
  const alumni = useStaticData('alumni-sample.json');

  const retention = useMemo(() => computeRetention(scolarite.data), [scolarite.data]);
  const nps = useMemo(() => computeNPS(scolarite.data), [scolarite.data]);
  const alumniMetrics = useMemo(() => computeAlumni(alumni.data), [alumni.data]);

  const hasAnyData = scolarite.available || alumni.available;

  if (!hasAnyData && !scolarite.loading && !alumni.loading) {
    return (
      <ConditionalSection
        available={false}
        title="Rétention & Alumni"
        message="Les données de scolarité et d'insertion professionnelle ne sont pas encore connectées. Déposez les fichiers JSON dans public/data/ ou configurez l'API dans ⚙️ Paramètres."
        icon="🔄"
      />
    );
  }

  const npsColor = nps?.score >= 50 ? colors.good : nps?.score >= 30 ? accentColor : nps?.score >= 0 ? COLORS.warning : colors.bad;

  return (
    <div>
      {/* Source badge */}
      <div style={{ marginBottom: 16, fontSize: 11, color: COLORS.fermi, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: COLORS.fermiBg, border: `1px solid ${COLORS.fermiBorder}`, borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
          DONNÉES EXEMPLE
        </span>
        Ces données proviennent de fichiers statiques de démonstration, pas du SI académique.
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        {retention && (
          <>
            <KPICard label="Rétention A1" value={`${retention.latestRetentionY1}%`}
              sub={`Cohorte ${retention.latestCohortYear}`}
              color={retention.latestRetentionY1 >= 90 ? colors.good : retention.latestRetentionY1 >= 85 ? accentColor : COLORS.warning}
              tooltip="Pourcentage d'étudiants de 1ère année réinscrits en 2ème année" />
            <KPICard label="Rétention Moyenne" value={`${retention.avgRetentionY1}%`}
              sub={`${retention.totalCohorts} cohortes`}
              color={accentColor}
              tooltip="Moyenne du taux de rétention année 1 sur toutes les cohortes" />
          </>
        )}
        {nps && (
          <KPICard label="NPS Étudiants" value={nps.score}
            sub={`${nps.responses} réponses`}
            color={npsColor}
            tooltip="Net Promoter Score : % promoteurs − % détracteurs. >50 = excellent, >30 = bon, >0 = moyen" />
        )}
        {alumniMetrics && (
          <>
            <KPICard label="Insertion Pro" value={`${alumniMetrics.employmentRate}%`}
              sub="à 6 mois post-diplôme"
              color={alumniMetrics.employmentRate >= 80 ? colors.good : alumniMetrics.employmentRate >= 60 ? accentColor : COLORS.warning}
              tooltip="Pourcentage de diplômés en emploi 6 mois après obtention du diplôme" />
            <KPICard label="Alumni Suivis" value={fmt.number(alumniMetrics.totalAlumni)}
              sub={`${alumniMetrics.cohortsTracked} promotions`}
              color={colors.medium} />
          </>
        )}
      </div>

      {/* Retention by cohort chart */}
      {retention && retention.cohorts.length > 1 && (
        <>
          <SectionTitle>Rétention par Cohorte</SectionTitle>
          <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={retention.cohorts}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="cohort" tick={{ fontSize: 11, fill: colors.medium }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: colors.medium }} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="retention_y1_pct" name="Rétention A1 (%)" fill={accentColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {retention.trend !== null && (
              <div style={{ fontSize: 12, color: retention.trend >= 0 ? colors.good : colors.bad, marginTop: 8, textAlign: 'center' }}>
                {retention.trend >= 0 ? '▲' : '▼'} {Math.abs(retention.trend)} pts vs cohorte précédente
              </div>
            )}
          </div>
        </>
      )}

      {/* NPS breakdown */}
      {nps && (
        <>
          <SectionTitle>Satisfaction Étudiante (NPS)</SectionTitle>
          <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 42, fontWeight: 700, color: npsColor }}>{nps.score}</div>
                <div style={{ fontSize: 11, color: colors.medium, fontWeight: 600, textTransform: 'uppercase' }}>NPS</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {/* Stacked bar */}
                <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${nps.promoters}%`, background: colors.good, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#FFF', fontWeight: 700 }}>
                    {nps.promoters}%
                  </div>
                  <div style={{ width: `${nps.passives}%`, background: colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: colors.dark, fontWeight: 600 }}>
                    {nps.passives}%
                  </div>
                  <div style={{ width: `${nps.detractors}%`, background: colors.bad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#FFF', fontWeight: 700 }}>
                    {nps.detractors}%
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.medium }}>
                  <span>🟢 Promoteurs ({nps.promoters}%)</span>
                  <span>⚪ Passifs ({nps.passives}%)</span>
                  <span>🔴 Détracteurs ({nps.detractors}%)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Alumni by cohort */}
      {alumniMetrics && alumniMetrics.byCohort.length > 0 && (
        <>
          <SectionTitle>Insertion Professionnelle par Promotion</SectionTitle>
          <DataTable
            title="Taux d'emploi à 6 mois"
            columns={[
              { key: 'year', label: 'Promotion', style: () => ({ fontWeight: 700 }) },
              { key: 'graduates', label: 'Diplômés', align: 'center' },
              { key: 'employed_6m_pct', label: 'Emploi à 6 mois', align: 'center', render: v =>
                v != null
                  ? <strong style={{ color: v >= 80 ? colors.good : v >= 60 ? accentColor : COLORS.warning }}>{v}%</strong>
                  : <span style={{ color: colors.medium, fontSize: 10 }}>En cours de suivi</span>
              },
            ]}
            data={alumniMetrics.byCohort}
            exportFilename="alumni_cohorts.csv"
          />
        </>
      )}

      {/* Alumni by faculty */}
      {alumniMetrics && alumniMetrics.byFaculty.length > 0 && (
        <>
          <SectionTitle>Insertion par Entité</SectionTitle>
          <DataTable
            title="Taux d'emploi par faculté"
            columns={[
              { key: 'faculty_code', label: 'Entité', render: (v) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: FACULTY_COLORS[v] || colors.medium, flexShrink: 0 }} />
                  <strong>{FACULTY_LABELS[v] || v}</strong>
                </div>
              )},
              { key: 'total_alumni', label: 'Alumni', align: 'center', style: () => ({ fontWeight: 700 }) },
              { key: 'employment_rate_pct', label: 'Taux d\'emploi', align: 'center', render: v =>
                <strong style={{ color: v >= 80 ? colors.good : v >= 60 ? accentColor : COLORS.warning }}>{v}%</strong>
              },
            ]}
            data={alumniMetrics.byFaculty}
            exportFilename="alumni_entites.csv"
          />
        </>
      )}
    </div>
  );
}
