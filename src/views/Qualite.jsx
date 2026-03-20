import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, ZAxis } from 'recharts';
import { COLORS } from '../../config/theme';
import { QUALIFIED_SCORE_MIN } from '../../config/defaults';
import { KPICard, SectionTitle, AlertBadge } from '../../components/ui';
import { CustomTooltip } from '../../components/charts';
import { computeEngagement } from '../../processing/engagement';
import { computeFormDiagnostics } from '../../processing/formDiagnostics';

export default function ViewQualite({ leads, abandons, outcomes, dateRange }) {
  const [showWaterfall, setShowWaterfall] = useState(false);

  // ── Engagement ──
  const engagementData = useMemo(() => computeEngagement(leads), [leads]);
  const quadrantCounts = useMemo(() => {
    const q = { 'high-high': 0, 'high-low': 0, 'low-high': 0, 'low-low': 0 };
    engagementData.forEach(e => q[e.quadrant]++);
    return q;
  }, [engagementData]);

  // ── Form diagnostics ──
  const formDiag = useMemo(() => computeFormDiagnostics(leads), [leads]);

  // ── Conversion cycle ──
  const cycleData = useMemo(() => {
    const buckets = { '0j': 0, '1-2j': 0, '3-7j': 0, '8-14j': 0, '15-30j': 0, '30j+': 0 };
    leads.forEach(l => {
      const d = Number(l.days_to_convert) || 0;
      if (d === 0) buckets['0j']++;
      else if (d <= 2) buckets['1-2j']++;
      else if (d <= 7) buckets['3-7j']++;
      else if (d <= 14) buckets['8-14j']++;
      else if (d <= 30) buckets['15-30j']++;
      else buckets['30j+']++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [leads]);

  // ── Hot leads count (KPI only — not a list) ──
  const hotNotContactedCount = useMemo(() =>
    leads.filter(l =>
      Number(l.score) >= 70 &&
      (l.outcome === 'pending' || !l.outcome)
    ).length
  , [leads]);

  // ── Contact delay ──
  const contactDelay = useMemo(() => {
    const delays = leads
      .filter(l => l.outcome_updated_at && l.created_at && l.outcome !== 'pending')
      .map(l => Math.round((new Date(l.outcome_updated_at) - new Date(l.created_at)) / 3600000));
    return delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null;
  }, [leads]);

  // ── Device gap alert (shown as AlertBadge, not a block) ──
  const deviceGapAlert = useMemo(() => {
    const gap = Math.abs(formDiag.deviceGap.mobile.avgScore - formDiag.deviceGap.desktop.avgScore);
    return gap > 15 ? gap : null;
  }, [formDiag]);

  return (
    <div>
      {/* Top KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPICard small label="Priorité 1" value={quadrantCounts['high-high']}
          sub="Score ≥60 + Engage ≥50" color={COLORS.good}
          tooltip="Leads à la fois bien scorés et fortement engagés" />
        <KPICard small label="Sous-scorés" value={quadrantCounts['low-high']}
          sub="Score <60 + Engage ≥50" color={COLORS.warning}
          tooltip="Leads engagés mais score faible — heuristique, à valider avec les outcomes" />
        <KPICard small label="Délai 1er Contact" value={contactDelay ? `${contactDelay}h` : '—'}
          color={contactDelay && contactDelay > 48 ? COLORS.bad : COLORS.good}
          tooltip="Temps moyen entre soumission et premier contact (nécessite outcomes DSI)" />
        <KPICard small label="Chauds en attente" value={hotNotContactedCount}
          color={hotNotContactedCount > 10 ? COLORS.bad : hotNotContactedCount > 0 ? COLORS.warning : COLORS.good}
          tooltip="Leads score ≥70 avec outcome = pending" />
      </div>

      {/* Device gap as alert (not a block) */}
      {deviceGapAlert && (
        <div style={{ marginBottom: 16 }}>
          <AlertBadge level={1} text={`Gap mobile/desktop: ${deviceGapAlert} pts de score (mobile: ${formDiag.deviceGap.mobile.avgScore}, desktop: ${formDiag.deviceGap.desktop.avgScore})`} />
        </div>
      )}

      {/* Scatter quadrant — engagement heuristic disclaimer */}
      <SectionTitle>Score × Engagement</SectionTitle>
      <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: COLORS.medium, marginBottom: 12, fontStyle: 'italic' }}>
          Le score d'engagement est une heuristique (attention, scroll, micro-conversions). À valider avec les données d'inscription.
        </div>
        {engagementData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis type="number" dataKey="engagement" name="Engagement" domain={[0, 100]}
                  tick={{ fontSize: 10, fill: COLORS.medium }}
                  label={{ value: 'Engagement', position: 'bottom', fontSize: 10, fill: COLORS.medium }} />
                <YAxis type="number" dataKey="score" name="Score" domain={[0, 100]}
                  tick={{ fontSize: 10, fill: COLORS.medium }}
                  label={{ value: 'Score', angle: -90, position: 'left', fontSize: 10, fill: COLORS.medium }} />
                <ZAxis range={[20, 20]} />
                <Tooltip content={<CustomTooltip />} />
                {/* Cap at 300 points for readability */}
                <Scatter data={engagementData.slice(0, 300)} name="Leads">
                  {engagementData.slice(0, 300).map((e, i) => {
                    const color = e.quadrant === 'high-high' ? COLORS.good
                      : e.quadrant === 'low-high' ? COLORS.warning
                      : e.quadrant === 'high-low' ? COLORS.accent
                      : COLORS.medium;
                    return <Cell key={i} fill={color} fillOpacity={0.5} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 10, marginTop: 8 }}>
              {[
                { color: COLORS.good, label: `Priorité 1 (${quadrantCounts['high-high']})` },
                { color: COLORS.warning, label: `Sous-scorés (${quadrantCounts['low-high']})` },
                { color: COLORS.accent, label: `Score seul (${quadrantCounts['high-low']})` },
                { color: COLORS.medium, label: `Faibles (${quadrantCounts['low-low']})` },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} /> {l.label}
                </div>
              ))}
            </div>
            {engagementData.length > 300 && (
              <div style={{ fontSize: 10, color: COLORS.medium, textAlign: 'center', marginTop: 4 }}>
                Affichage limité à 300 points sur {engagementData.length} pour la lisibilité.
              </div>
            )}
          </>
        ) : (
          <div style={{ color: COLORS.medium, fontSize: 12, textAlign: 'center', padding: 30 }}>Aucune donnée comportementale</div>
        )}
      </div>

      {/* Conversion cycle */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ flex: '1 1 400px', background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 12 }}>Cycle de conversion (days_to_convert)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cycleData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.medium }} />
              <YAxis tick={{ fontSize: 10, fill: COLORS.medium }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device gap compact */}
        <div style={{ flex: '0 1 250px', background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 12 }}>Mobile vs Desktop</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {['mobile', 'desktop'].map(dev => {
              const d = formDiag.deviceGap[dev];
              return (
                <div key={dev} style={{ flex: 1, background: COLORS.light, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.medium, textTransform: 'capitalize' }}>{dev}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.dark, margin: '4px 0' }}>{d.avgScore}</div>
                  <div style={{ fontSize: 10, color: COLORS.medium }}>score moy.</div>
                  <div style={{ fontSize: 10, color: COLORS.medium, marginTop: 4 }}>{d.count} leads · {d.avgDuration}s form</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form waterfall — collapsible */}
      <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        <button onClick={() => setShowWaterfall(!showWaterfall)} style={{
          width: '100%', padding: '14px 20px', border: 'none', background: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>
            Friction Formulaire (temps médian par champ)
          </span>
          <span style={{ fontSize: 14, color: COLORS.medium }}>{showWaterfall ? '▲' : '▼'}</span>
        </button>
        {showWaterfall && (
          <div style={{ padding: '0 20px 20px' }}>
            {formDiag.waterfall.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(150, formDiag.waterfall.length * 36)}>
                <BarChart data={formDiag.waterfall} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: COLORS.medium }} unit="s" />
                  <YAxis dataKey="field" type="category" tick={{ fontSize: 11, fill: COLORS.dark, fontWeight: 600 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="medianSec" fill={COLORS.warning} radius={[0, 4, 4, 0]} name="Temps médian (s)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: COLORS.medium, fontSize: 12, textAlign: 'center', padding: 20 }}>
                Aucune donnée form_field_times disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
