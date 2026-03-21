import React, { useMemo } from 'react';
import { COLORS, FACULTY_COLORS, FACULTY_LABELS } from '../config/theme';
import { QUALIFIED_SCORE_MIN, DEFAULT_ALERT_THRESHOLDS, DEFAULT_CAMPAIGN_TIMELINE } from '../config/defaults';
import { useTheme } from '../config/ThemeContext';
import { KPICard, AlertBadge, SectionTitle, CampaignProgressBar } from '../components/ui';
import { computeFinancials, weightedFinancialParams } from '../processing/financial';
import { computeProjection } from '../processing/projection';
import { PROGRAMS_BY_ENTITY, ENTITY_KEY } from '../config/programs';
import { fmt } from '../utils/formatters';
import { daysAgo } from '../utils/dateHelpers';
import { extractEntityCode } from '../utils/extractEntity';

export default function ViewStrategie({ leads, visits, adSpend, outcomes, experiments, dateRange, financialSettings }) {
  const { colors, cardStyle, accentColor } = useTheme();
  // ── Core metrics ──
  const totalLeads = leads.length;
  const qualified = leads.filter(l => Number(l.score) >= QUALIFIED_SCORE_MIN).length;
  const enrolled = leads.filter(l => l.outcome === 'enrolled' || l.outcome === 'inscrit').length;
  const totalSpend = adSpend.reduce((s, r) => s + (r.spend || 0), 0);
  const coutParInscrit = enrolled > 0 && totalSpend > 0 ? Math.round(totalSpend / enrolled) : null;

  // Trend vs previous period
  const recentDate = daysAgo(30);
  const prevDate = daysAgo(60);
  const last30 = leads.filter(l => (l.created_at || '') >= recentDate);
  const prev30 = leads.filter(l => (l.created_at || '') >= prevDate && (l.created_at || '') < recentDate);
  const trend = prev30.length > 0 ? Math.round((last30.length - prev30.length) / prev30.length * 100) : null;

  // ── Projection ──
  const proj = useMemo(() => computeProjection(leads, adSpend), [leads, adSpend]);

  // ── Financials (only meaningful with real outcomes) ──
  const hasOutcomes = enrolled > 0;
  const wParams = useMemo(() => weightedFinancialParams(leads, financialSettings), [leads, financialSettings]);
  const financials = useMemo(() => hasOutcomes ? computeFinancials({
    totalSpend,
    marketingFixedCosts: wParams.marketingFixedCosts,
    monthsActive: Math.max(1, Math.ceil(proj.elapsed / 30)),
    enrolledCount: enrolled,
    weightedLTV: wParams.weightedLTV,
    avgAnnualFees: wParams.avgAnnualFees,
    registrationFees: wParams.registrationFees,
  }) : null, [totalSpend, enrolled, proj.elapsed, hasOutcomes, wParams]);

  // ── Alerts ──
  const alerts = useMemo(() => {
    const a = [];
    const T = DEFAULT_ALERT_THRESHOLDS;
    // Budget épuisé
    if (totalSpend > 0 && proj.projectedTotalSpend) {
      // placeholder: we don't have a budget cap yet, flag if spend is high
    }
    // Chute leads
    if (trend !== null && trend < -20) a.push({ level: 2, text: `Chute leads : ${trend}% vs période précédente` });
    // Entités en retard
    if (enrolled === 0 && totalLeads > 100) a.push({ level: 1, text: 'Aucun inscrit enregistré — importer les outcomes DSI' });
    // Coût par inscrit élevé
    if (coutParInscrit && coutParInscrit > 5000) a.push({ level: 1, text: `Coût/inscrit élevé : ${fmt.mad(coutParInscrit)}` });
    if (a.length === 0) a.push({ level: 0, text: `${fmt.number(totalLeads)} leads · ${enrolled} inscrits · Campagne en cours` });
    return a;
  }, [totalLeads, enrolled, trend, coutParInscrit]);

  // ── Faculty fill rates (with capacity from settings) ──
  const facultyFill = useMemo(() => {
    const byFac = {};
    leads.forEach(l => {
      const code = extractEntityCode(l);
      if (!byFac[code]) byFac[code] = { leads: 0, qualified: 0, enrolled: 0 };
      byFac[code].leads++;
      if (Number(l.score) >= QUALIFIED_SCORE_MIN) byFac[code].qualified++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byFac[code].enrolled++;
    });
    return Object.entries(byFac).map(([code, d]) => {
      // Sum maxCapacity and enrollmentTarget across programs in this entity
      const programs = PROGRAMS_BY_ENTITY[code] || [];
      let totalCap = 0, totalTarget = 0;
      for (const p of programs) {
        const s = financialSettings?.[p.id] || {};
        totalCap += s.maxCapacity || 0;
        totalTarget += s.enrollmentTarget || 0;
      }
      return {
        code, name: FACULTY_LABELS[code] || code, color: FACULTY_COLORS[code] || COLORS.medium,
        ...d, maxCapacity: totalCap, enrollmentTarget: totalTarget,
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [leads, financialSettings]);


  return (
    <div>
      {/* Campaign progress */}
      <div style={{ marginBottom: 20 }}>
        <CampaignProgressBar start={DEFAULT_CAMPAIGN_TIMELINE.start} end={DEFAULT_CAMPAIGN_TIMELINE.end} />
      </div>

      {/* Alerts */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {alerts.map((a, i) => <AlertBadge key={i} level={a.level} text={a.text} />)}
      </div>

      {/* KPIs stratégiques */}
      {financials ? (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <KPICard label="Inscrits" value={enrolled} sub={`sur ${fmt.number(totalLeads)} leads`} trend={trend} color={colors.good} tooltip="Inscrits confirmés (outcomes DSI)" />
          <KPICard label="Coût / Inscrit" value={coutParInscrit ? fmt.mad(coutParInscrit) : '—'} tooltip="Spend total ÷ inscrits" color={coutParInscrit && coutParInscrit > 5000 ? colors.bad : accentColor} />
          <KPICard label="Budget Consommé" value={fmt.mad(totalSpend)} tooltip="Dépense publicitaire totale" color={colors.dark} />
          <KPICard label="ROAS" value={financials.roas ? `${financials.roas}x` : '—'} tooltip="Revenue / Coût total" color={accentColor} />
          <KPICard label="CAC" value={financials.fullCAC ? fmt.mad(financials.fullCAC) : '—'} tooltip="Coût d'acquisition complet par inscrit" color={financials.fullCAC && financials.fullCAC > 5000 ? colors.bad : colors.good} />
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <KPICard label="Leads Total" value={fmt.number(totalLeads)} trend={trend} />
            <KPICard label="Qualifiés" value={fmt.number(qualified)} sub={`score ≥ ${QUALIFIED_SCORE_MIN}`} color={colors.good} />
            <KPICard label="Budget Consommé" value={totalSpend > 0 ? fmt.mad(totalSpend) : '—'} color={accentColor} />
          </div>
          <div style={{ color: colors.medium, fontSize: 13, padding: '12px 0', borderTop: `1px solid ${colors.border}` }}>
            Les KPIs financiers (ROAS, coût/inscrit, revenue) seront disponibles quand les premières inscriptions seront importées via le rapprochement DSI (wp-admin → Outcomes).
          </div>
        </div>
      )}

      {/* Projection */}
      <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>Projection fin campagne (août 2026)</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
          <div><span style={{ color: colors.medium }}>Rythme actuel :</span> <strong>{proj.currentDailyRate} leads/jour</strong></div>
          <div><span style={{ color: colors.medium }}>Leads projetés :</span> <strong>{fmt.number(proj.projectedLeads)}</strong></div>
          {proj.hasRealConvRate ? (
            <div><span style={{ color: colors.medium }}>Inscrits projetés :</span> <strong>{proj.projectedEnrolled}</strong> ({proj.conversionRate}% taux conv.)</div>
          ) : (
            <div><span style={{ color: colors.warning, fontSize: 12 }}>Projection inscrits non disponible — pas assez de données outcomes</span></div>
          )}
          <div><span style={{ color: colors.medium }}>Jours restants :</span> <strong>{proj.remaining}</strong></div>
        </div>
      </div>

      {/* Remplissage par Entité */}
      <SectionTitle>Remplissage par Entité</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {facultyFill.map((f, i) => {
          const hasCap = f.maxCapacity > 0;
          const fillPct = hasCap ? Math.round(f.enrolled / f.maxCapacity * 100) : null;
          const fillColor = fillPct >= 90 ? colors.good : fillPct >= 60 ? accentColor : fillPct >= 1 ? COLORS.warning : colors.border;

          return (
            <div key={i} style={{
              ...cardStyle, padding: '14px 16px',
              borderLeft: `4px solid ${f.color}`,
              flex: '1 1 175px', minWidth: 170,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: f.color, textTransform: 'uppercase' }}>{f.name}</div>

              {hasCap ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.dark, margin: '4px 0' }}>
                    {f.enrolled} <span style={{ fontSize: 12, fontWeight: 500, color: colors.medium }}>/ {f.maxCapacity}</span>
                  </div>
                  <div style={{ height: 6, background: colors.light, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{
                      height: '100%', width: `${Math.min(fillPct, 100)}%`,
                      background: fillColor, borderRadius: 3, transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.medium }}>
                    <span>{fillPct}% rempli</span>
                    <span>{f.leads} leads · {f.qualified} qual.</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: f.enrolled > 0 ? colors.dark : colors.medium, margin: '4px 0' }}>
                    {f.enrolled} <span style={{ fontSize: 12, fontWeight: 500, color: colors.medium }}>inscrits</span>
                  </div>
                  <div style={{ fontSize: 10, color: colors.medium }}>
                    {f.leads} leads · {f.qualified} qualifiés
                  </div>
                  <div style={{ fontSize: 9, color: colors.border, marginTop: 4, fontStyle: 'italic' }}>
                    Capacité non configurée
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
