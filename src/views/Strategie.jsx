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
import { computeMarketSizing, computeSOVMetrics } from '../processing/marketSizing';
import { MarketFunnel } from '../components/charts/MarketFunnel';

export default function ViewStrategie({ leads, visits, adSpend, outcomes, experiments, dateRange, financialSettings, marketSizingSettings }) {
  const { colors, cardStyle, accentColor, mode } = useTheme();
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

  // ── Market Sizing (Fermi) ──
  const marketSizing = useMemo(() => {
    if (!marketSizingSettings) return null;
    return computeMarketSizing(marketSizingSettings, enrolled, wParams.avgAnnualFees, wParams.weightedLTV);
  }, [marketSizingSettings, enrolled, wParams]);

  const sovMetrics = useMemo(() => {
    if (!marketSizingSettings || totalSpend <= 0) return null;
    const currentSOM = marketSizing?.penetrationRate || 0;
    return computeSOVMetrics(totalSpend, marketSizingSettings.totalMarketSpend, currentSOM);
  }, [marketSizingSettings, totalSpend, marketSizing]);

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
          <KPICard label="Inscrits" value={enrolled} sub={`sur ${fmt.number(totalLeads)} candidatures`} trend={trend} color={colors.good} tooltip="Nombre d'étudiants inscrits confirmés (données DSI)" />
          <KPICard label="Coût / Inscrit" value={coutParInscrit ? fmt.mad(coutParInscrit) : '—'} tooltip="Budget publicitaire total divisé par le nombre d'inscrits" color={coutParInscrit && coutParInscrit > 5000 ? colors.bad : accentColor} />
          <KPICard label="Budget Consommé" value={fmt.mad(totalSpend)} tooltip="Total des dépenses publicitaires (Meta + Google + LinkedIn + TikTok)" color={colors.dark} />
          <KPICard label="ROAS" value={financials.roas ? `${financials.roas}x` : '—'} tooltip="Retour sur investissement pub : chaque MAD investi rapporte X MAD en frais de scolarité" color={accentColor} />
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <KPICard label="Candidatures" value={fmt.number(totalLeads)} trend={trend} tooltip="Formulaires de candidature reçus sur toutes les landing pages" />
            <KPICard label="Qualifiés" value={fmt.number(qualified)} sub={`score ≥ ${QUALIFIED_SCORE_MIN}`} color={colors.good} tooltip="Candidatures avec un score de qualité suffisant pour être contactées" />
            <KPICard label="Budget Consommé" value={totalSpend > 0 ? fmt.mad(totalSpend) : '—'} color={accentColor} tooltip="Total des dépenses publicitaires" />
          </div>
          <div style={{ color: colors.medium, fontSize: 13, padding: '12px 0', borderTop: `1px solid ${colors.border}` }}>
            Les indicateurs financiers (rentabilité, coût par inscrit) seront disponibles quand les premières inscriptions seront importées. Allez dans ⚙️ Paramètres pour configurer la connexion DSI.
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

      {/* Remplissage par Entité — ABOVE Fermi (most actionable for DG) */}
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

      {/* Potentiel de Marché (Fermi) — strategic context, below operational data */}
      {marketSizing && (
        <>
          <div style={{ height: 1, background: colors.border, margin: '24px 0 8px' }} />
          <SectionTitle>Potentiel de Marché</SectionTitle>
          <div style={{ marginBottom: 8, fontSize: 11, color: COLORS.fermi, lineHeight: 1.5, borderLeft: `3px solid ${accentColor}40`, paddingLeft: 12 }}>
            Modèle Fermi — estimations basées sur des hypothèses démographiques et marché.
            Configurable dans ⚙️ Paramètres &gt; Modèle de Marché.
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <MarketFunnel tam={marketSizing.tam} sam={marketSizing.sam} som={marketSizing.som} enrolled={enrolled} />
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Penetration */}
              <div style={{ ...cardStyle, padding: '16px 20px', borderTop: `3px dashed ${COLORS.fermi}` }}>
                <div style={{ fontSize: 11, color: COLORS.fermi, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Part du marché captée
                  <span style={{ fontSize: 9, background: COLORS.fermiBg, border: `1px solid ${COLORS.fermiBorder}`, borderRadius: 8, padding: '1px 6px' }}>~ MODÈLE</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: marketSizing.penetrationRate >= 80 ? colors.good : marketSizing.penetrationRate >= 50 ? accentColor : COLORS.warning, marginTop: 4 }}>
                  ~{marketSizing.penetrationRate}%
                </div>
                <div style={{ fontSize: 12, color: COLORS.fermi, fontFamily: mode.fontMono || 'monospace' }}>
                  {marketSizing.penetrationRange.low}% — {marketSizing.penetrationRange.high}%
                </div>
                <div style={{ fontSize: 11, color: colors.medium, marginTop: 4 }}>
                  {enrolled} inscrits sur un marché capturable estimé à ~{marketSizing.som.base.toLocaleString('fr-FR')}
                </div>
              </div>

              {/* Headroom */}
              <div style={{ ...cardStyle, padding: '16px 20px', borderTop: `3px dashed ${COLORS.fermi}` }}>
                <div style={{ fontSize: 11, color: COLORS.fermi, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Marge de croissance
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: colors.dark, marginTop: 4 }}>
                  ~{marketSizing.headroom.toLocaleString('fr-FR')} étudiants
                </div>
                <div style={{ fontSize: 11, color: colors.medium }}>
                  places captables avant saturation du marché adressable
                </div>
                {marketSizing.headroomLTV && (
                  <div style={{ fontSize: 12, color: accentColor, fontWeight: 600, marginTop: 4 }}>
                    ≈ {fmt.mad(marketSizing.headroomLTV)} de revenus potentiels
                  </div>
                )}
              </div>

              {/* SOV/ESOV */}
              {sovMetrics && (
                <div style={{ ...cardStyle, padding: '16px 20px', borderTop: `3px dashed ${sovMetrics.isGrowing ? colors.good : COLORS.warning}` }}>
                  <div style={{ fontSize: 11, color: COLORS.fermi, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Visibilité publicitaire (SOV)
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13 }}>
                    <div title="Part de nos dépenses pub dans le total du marché">
                      <span style={{ color: colors.medium }}>Notre part : </span>
                      <strong>{sovMetrics.sov}%</strong>
                    </div>
                    <div title="Notre part de marché en inscrits">
                      <span style={{ color: colors.medium }}>Part marché : </span>
                      <strong>{sovMetrics.som}%</strong>
                    </div>
                    <div title="Écart entre visibilité et part de marché. Positif = croissance prédite.">
                      <span style={{ color: colors.medium }}>Écart : </span>
                      <strong style={{ color: sovMetrics.isGrowing ? colors.good : COLORS.warning }}>
                        {sovMetrics.esov > 0 ? '+' : ''}{sovMetrics.esov} pts
                      </strong>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: colors.medium, marginTop: 6 }}>
                    {sovMetrics.isGrowing
                      ? `Visibilité supérieure à la part de marché → croissance attendue`
                      : `Visibilité inférieure à la part de marché → risque de déclin à 18 mois`
                    }
                  </div>
                  {!sovMetrics.calibrated && (
                    <div style={{ fontSize: 10, color: COLORS.fermi, marginTop: 4, fontStyle: 'italic' }}>
                      Coefficient non calibré — à valider après 2 campagnes
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
