import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHANNEL_COLORS, CHANNEL_LABELS } from '../config/theme';
import { QUALIFIED_SCORE_MIN, DEFAULT_CAMPAIGN_TIMELINE } from '../config/defaults';
import { useTheme } from '../config/ThemeContext';
import { KPICard, SectionTitle, DataTable, ProgressBar, AlertBadge } from '../components/ui';
import { CustomTooltip } from '../components/charts';
import { COLORS } from '../config/theme';
import { computeFinancials, weightedFinancialParams } from '../processing/financial';
import { computeBudgetPacing } from '../processing/budgetPacing';
import { computeMarketSizing, computeScenarios } from '../processing/marketSizing';
import { fmt } from '../utils/formatters';

export default function ViewBudget({ leads, adSpend, outcomes, dateRange, financialSettings, marketSizingSettings }) {
  const { colors, cardStyle, accentColor, mode } = useTheme();

  const totalLeads = leads.length;
  const qualified = leads.filter(l => Number(l.score) >= QUALIFIED_SCORE_MIN).length;
  const enrolled = leads.filter(l => l.outcome === 'enrolled' || l.outcome === 'inscrit').length;
  const hasOutcomes = enrolled > 0;

  const pacing = useMemo(() => computeBudgetPacing(adSpend), [adSpend]);
  const totalSpend = pacing.totalSpend;

  // ── Financials (only if real outcomes) ──
  const wParams = useMemo(() => weightedFinancialParams(leads, financialSettings), [leads, financialSettings]);
  const financials = useMemo(() => hasOutcomes ? computeFinancials({
    totalSpend,
    marketingFixedCosts: wParams.marketingFixedCosts,
    monthsActive: Math.max(1, Math.ceil(pacing.elapsedDays / 30)),
    enrolledCount: enrolled,
    weightedLTV: wParams.weightedLTV,
    avgAnnualFees: wParams.avgAnnualFees,
    registrationFees: wParams.registrationFees,
  }) : null, [totalSpend, enrolled, pacing.elapsedDays, hasOutcomes, wParams]);

  const coutParInscrit = hasOutcomes && totalSpend > 0 ? Math.round(totalSpend / enrolled) : null;

  // ── P&L Cohorte ──
  const pnl = useMemo(() => {
    if (!financials) return null;
    const cohortRev = financials.cohortRevenue;
    const year1Rev = financials.year1Revenue;
    const cost = financials.fullCost;
    const margin = cohortRev - cost;
    const marginPct = cost > 0 ? ((margin / cost) * 100).toFixed(0) : null;
    return { cohortRev, year1Rev, cost, margin, marginPct };
  }, [financials]);

  // ── Spend mensuel (AreaChart) ──
  const monthlySpend = useMemo(() => {
    const byMonth = {};
    adSpend.forEach(r => {
      const d = r.date || '';
      const month = d.slice(0, 7); // YYYY-MM
      if (!month) return;
      if (!byMonth[month]) byMonth[month] = 0;
      byMonth[month] += r.spend || 0;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, spend]) => ({
        month,
        monthLabel: month.slice(5) + '/' + month.slice(2, 4),
        spend: Math.round(spend),
      }));
  }, [adSpend]);

  // ── Tableau par canal ──
  const channelBreakdown = useMemo(() => {
    const byChannel = {};
    // Spend by platform
    Object.entries(pacing.byPlatform).forEach(([plat, data]) => {
      byChannel[plat] = { channel: plat, spend: data.spend, impressions: data.impressions, clicks: data.clicks, leads: 0, qualified: 0, enrolled: 0 };
    });
    // Leads by channel_group
    leads.forEach(l => {
      const ch = (l.channel_group || 'direct').toLowerCase();
      // Map channel_group to platform key
      let key = ch;
      if (ch.includes('paid social') || ch.includes('meta')) key = 'meta';
      else if (ch.includes('paid search') || ch.includes('google')) key = 'google';
      else if (ch.includes('linkedin')) key = 'linkedin';
      else if (ch.includes('tiktok')) key = 'tiktok';
      if (!byChannel[key]) byChannel[key] = { channel: key, spend: 0, impressions: 0, clicks: 0, leads: 0, qualified: 0, enrolled: 0 };
      byChannel[key].leads++;
      if (Number(l.score) >= QUALIFIED_SCORE_MIN) byChannel[key].qualified++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byChannel[key].enrolled++;
    });
    return Object.values(byChannel).map(ch => ({
      ...ch,
      cpl: ch.leads > 0 ? Math.round(ch.spend / ch.leads) : null,
      coutInscrit: ch.enrolled > 0 ? Math.round(ch.spend / ch.enrolled) : null,
    })).sort((a, b) => b.spend - a.spend);
  }, [pacing.byPlatform, leads]);

  const channelColumns = [
    { key: 'channel', label: 'Canal', render: v => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHANNEL_COLORS[v] || colors.medium, flexShrink: 0 }} />
        <strong style={{ textTransform: 'capitalize' }}>{CHANNEL_LABELS[v] || v}</strong>
      </div>
    )},
    { key: 'spend', label: 'Spend', align: 'right', render: v => fmt.mad(v) },
    { key: 'leads', label: 'Leads', align: 'center', style: () => ({ fontWeight: 700 }) },
    { key: 'cpl', label: 'CPL', align: 'right', render: v => v ? fmt.mad(v) : '—' },
    { key: 'qualified', label: 'Qualifiés', align: 'center', style: () => ({ color: colors.good }) },
    { key: 'enrolled', label: 'Inscrits', align: 'center', style: () => ({ color: accentColor, fontWeight: 700 }) },
    { key: 'coutInscrit', label: 'Coût/Inscrit', align: 'right', render: v => v ? (
      <strong style={{ color: v > 5000 ? colors.bad : colors.good }}>{fmt.mad(v)}</strong>
    ) : <span style={{ color: colors.medium }}>—</span> },
  ];

  // ── Budget alloué — from entity settings, fallback to projected spend ──
  const budgetAlloue = wParams.totalBudgetAlloue > 0 ? wParams.totalBudgetAlloue : pacing.projectedTotalSpend;
  const hasBudgetCap = wParams.totalBudgetAlloue > 0;

  // ── Market sizing for opportunity cost ──
  const marketSizing = useMemo(() => {
    if (!marketSizingSettings) return null;
    return computeMarketSizing(marketSizingSettings, enrolled, wParams.avgAnnualFees, wParams.weightedLTV);
  }, [marketSizingSettings, enrolled, wParams]);

  // ── Budget scenarios ──
  const scenarios = useMemo(() => {
    if (!marketSizing || !financials?.fullCAC) return [];
    return computeScenarios(marketSizing, totalSpend, financials.fullCAC, wParams.weightedLTV, marketSizingSettings);
  }, [marketSizing, financials, totalSpend, wParams, marketSizingSettings]);

  return (
    <div>
      {/* ── KPIs principaux ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPICard label="Spend Total" value={fmt.mad(totalSpend)} sub={`${pacing.pctElapsed}% du temps écoulé`} color={colors.dark} tooltip="Dépense publicitaire totale" />
        <KPICard label="Projection Spend" value={fmt.mad(pacing.projectedTotalSpend)} sub={`${pacing.remainingDays}j restants`} color={accentColor} tooltip="Au rythme actuel, spend projeté fin campagne" />
        {hasOutcomes ? (
          <KPICard label="Coût / Inscrit" value={fmt.mad(coutParInscrit)} sub={`${enrolled} inscrits`} color={coutParInscrit && coutParInscrit > 5000 ? colors.bad : colors.good} tooltip="Spend total ÷ inscrits confirmés" />
        ) : (
          <KPICard label="CPL Global" value={totalLeads > 0 ? fmt.mad(Math.round(totalSpend / totalLeads)) : '—'} sub={`${fmt.number(totalLeads)} leads`} color={accentColor} tooltip="Spend total ÷ leads" />
        )}
        <KPICard label="Burn Rate" value={fmt.mad(pacing.avgDailySpend)} sub="/jour (moy. 14j)" color={colors.medium} />
      </div>

      {/* ── Barre de progression spend vs budget ── */}
      <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>Consommation Budget</div>
          <div style={{ fontSize: 12, color: colors.medium }}>
            {fmt.mad(totalSpend)} / {fmt.mad(budgetAlloue)} {hasBudgetCap ? 'alloué' : 'projeté'}
          </div>
        </div>
        <ProgressBar value={totalSpend} max={budgetAlloue} color={totalSpend > budgetAlloue * 0.9 ? colors.warning : accentColor} height={10} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.medium, marginTop: 6 }}>
          <span>{budgetAlloue > 0 ? Math.round(totalSpend / budgetAlloue * 100) : 0}% consommé</span>
          <span>Campagne {DEFAULT_CAMPAIGN_TIMELINE.start} → {DEFAULT_CAMPAIGN_TIMELINE.end}</span>
        </div>
      </div>

      {/* ── P&L simplifié (seulement si outcomes) ── */}
      {pnl ? (
        <>
          <SectionTitle>P&L Cohorte 2026</SectionTitle>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ ...cardStyle, flex: '1 1 180px', padding: '16px 18px', borderLeft: `4px solid ${financials.fullCAC && financials.fullCAC > 5000 ? colors.bad : colors.good}` }}>
              <div style={{ fontSize: 10, color: colors.medium, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>CAC</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: financials.fullCAC && financials.fullCAC > 5000 ? colors.bad : colors.good, marginTop: 4, fontFamily: mode.font }}>{financials.fullCAC ? fmt.mad(financials.fullCAC) : '—'}</div>
              <div style={{ fontSize: 10, color: colors.medium, marginTop: 2 }}>Coût total ÷ {enrolled} inscrits</div>
            </div>
            <div style={{ ...cardStyle, flex: '1 1 180px', padding: '16px 18px', borderLeft: `4px solid ${accentColor}` }}>
              <div style={{ fontSize: 10, color: colors.medium, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Revenue Année 1</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: accentColor, marginTop: 4, fontFamily: mode.font }}>{fmt.mad(pnl.year1Rev)}</div>
              <div style={{ fontSize: 10, color: colors.medium, marginTop: 2 }}>{enrolled} × (inscription + frais A1)</div>
            </div>
            <div style={{ ...cardStyle, flex: '1 1 180px', padding: '16px 18px', borderLeft: `4px solid ${colors.bad}` }}>
              <div style={{ fontSize: 10, color: colors.medium, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Coûts campagne</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: colors.bad, marginTop: 4, fontFamily: mode.font }}>{fmt.mad(pnl.cost)}</div>
              <div style={{ fontSize: 10, color: colors.medium, marginTop: 2 }}>Media + coûts mktg fixes</div>
            </div>
            <div style={{ ...cardStyle, flex: '1 1 180px', padding: '16px 18px', borderLeft: `4px solid ${pnl.margin >= 0 ? colors.good : colors.bad}` }}>
              <div style={{ fontSize: 10, color: colors.medium, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Marge cohorte</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: pnl.margin >= 0 ? colors.good : colors.bad, marginTop: 4, fontFamily: mode.font }}>
                {pnl.margin >= 0 ? '+' : ''}{fmt.mad(pnl.margin)}
              </div>
              <div style={{ fontSize: 10, color: colors.medium, marginTop: 2 }}>
                Revenue vie entière − coût acquisition{pnl.marginPct != null ? ` · ${pnl.marginPct}%` : ''}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertBadge level={1} text="P&L non disponible — aucune donnée d'inscription importée" />
          </div>
          <div style={{ fontSize: 12, color: colors.medium, marginTop: 10 }}>
            Les métriques financières (P&L, ROAS, coût/inscrit, LTV vs CAC) seront calculées à partir des inscriptions confirmées via le rapprochement DSI (wp-admin → Outcomes).
          </div>
        </div>
      )}

      {/* ── LTV vs CAC (si outcomes) ── */}
      {financials && (
        <>
          <SectionTitle>LTV vs CAC</SectionTitle>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <KPICard small label="LTV" value={fmt.mad(financials.weightedLTV)} sub="par inscrit (avec rétention)" color={colors.good} tooltip="Lifetime Value corrigée : frais × durée × courbe de rétention" />
            <KPICard small label="CAC" value={financials.fullCAC ? fmt.mad(financials.fullCAC) : '—'} sub="coût acquisition complet" color={colors.bad} tooltip="Coût total ÷ inscrits" />
            <KPICard small label="Ratio LTV/CAC" value={financials.ltvCacRatio ? `${financials.ltvCacRatio}x` : '—'}
              color={parseFloat(financials.ltvCacRatio) >= 3 ? colors.good : parseFloat(financials.ltvCacRatio) >= 1 ? colors.warning : colors.bad}
              tooltip="Un ratio ≥ 3x est considéré excellent" />
            <KPICard small label="ROAS" value={financials.roas ? `${financials.roas}x` : '—'} color={accentColor} tooltip="Revenue ÷ coût total" />
            <KPICard small label="Payback" value={financials.paybackMonths ? `${financials.paybackMonths} mois` : '—'} color={colors.medium} tooltip="Mois avant que le revenue couvre le CAC" />
          </div>
        </>
      )}

      {/* ── Break-even + Opportunity Cost ── */}
      {financials && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          {financials.breakEvenInscrits && (
            <div style={{ ...cardStyle, flex: '1 1 220px', padding: '16px 20px', borderTop: `3px solid ${enrolled >= financials.breakEvenInscrits ? colors.good : COLORS.warning}` }}>
              <div style={{ fontSize: 11, color: colors.medium, fontWeight: 600, textTransform: 'uppercase' }}>Seuil de Rentabilité</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: enrolled >= financials.breakEvenInscrits ? colors.good : COLORS.warning, marginTop: 4 }}>
                {financials.breakEvenInscrits} inscrits
              </div>
              <div style={{ fontSize: 11, color: colors.medium }}>
                {enrolled >= financials.breakEvenInscrits
                  ? `✅ Atteint (${enrolled} inscrits) — campagne rentable`
                  : `⚠️ Encore ${financials.breakEvenInscrits - enrolled} inscrits nécessaires`
                }
              </div>
            </div>
          )}
          {marketSizing && marketSizing.headroom > 0 && wParams.weightedLTV > 0 && (
            <div style={{ ...cardStyle, flex: '1 1 220px', padding: '16px 20px', borderTop: `3px dashed ${COLORS.fermi}` }}>
              <div style={{ fontSize: 11, color: COLORS.fermi, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                Coût d'opportunité
                <span style={{ fontSize: 9, background: COLORS.fermiBg, border: `1px solid ${COLORS.fermiBorder}`, borderRadius: 8, padding: '1px 6px' }}>~ MODÈLE</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.dark, marginTop: 4 }}>
                {fmt.mad(marketSizing.headroom * wParams.weightedLTV)}
              </div>
              <div style={{ fontSize: 11, color: colors.medium }}>
                ~{marketSizing.headroom} places non captées × {fmt.mad(wParams.weightedLTV)} LTV
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Scénarios Budget ── */}
      {scenarios.length > 0 && (
        <>
          <SectionTitle>Scénarios Budget</SectionTitle>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            {scenarios.map((s, i) => {
              const isBase = s.label === 'Base';
              const borderColor = i === 0 ? colors.medium : i === 1 ? accentColor : colors.good;
              return (
                <div key={s.label} style={{
                  ...cardStyle, flex: '1 1 200px', padding: '16px 20px',
                  borderTop: `3px solid ${borderColor}`,
                  opacity: isBase ? 1 : 0.9,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: borderColor, textTransform: 'uppercase', marginBottom: 8 }}>
                    {s.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div>
                      <span style={{ color: colors.medium }}>Budget : </span>
                      <strong>{fmt.mad(s.budget)}</strong>
                    </div>
                    <div>
                      <span style={{ color: colors.medium }}>Inscrits : </span>
                      <strong>{s.totalEnrolled}</strong>
                      {s.enrolledDelta !== 0 && (
                        <span style={{ color: s.enrolledDelta > 0 ? colors.good : colors.bad, fontSize: 11 }}>
                          {' '}({s.enrolledDelta > 0 ? '+' : ''}{s.enrolledDelta})
                        </span>
                      )}
                    </div>
                    <div>
                      <span style={{ color: colors.medium }}>Pénétration : </span>
                      <strong>{s.penetration}%</strong>
                    </div>
                    {s.cacMarginal && (
                      <div>
                        <span style={{ color: colors.medium }}>CAC marginal : </span>
                        <strong style={{ color: s.cacMarginal > 30000 ? colors.bad : colors.good }}>{fmt.mad(s.cacMarginal)}</strong>
                      </div>
                    )}
                    {s.roiIncremental && s.enrolledDelta !== 0 && (
                      <div>
                        <span style={{ color: colors.medium }}>ROI incr. : </span>
                        <strong style={{ color: parseInt(s.roiIncremental) > 0 ? colors.good : colors.bad }}>{s.roiIncremental}%</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Décomposition spend par canal ── */}
      <SectionTitle>Répartition Spend par Canal</SectionTitle>
      <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
        {Object.entries(pacing.byPlatform).length > 0 ? (
          Object.entries(pacing.byPlatform).sort(([, a], [, b]) => b.spend - a.spend).map(([plat, data]) => {
            const pct = totalSpend > 0 ? (data.spend / totalSpend * 100) : 0;
            return (
              <div key={plat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHANNEL_COLORS[plat] || colors.medium }} />
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{CHANNEL_LABELS[plat] || plat}</span>
                  </div>
                  <span style={{ color: colors.medium }}>
                    {fmt.mad(data.spend)} <span style={{ fontSize: 10 }}>({fmt.pct(pct, 0)})</span>
                  </span>
                </div>
                <div style={{ height: 8, background: colors.light, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: CHANNEL_COLORS[plat] || accentColor,
                    borderRadius: 4, transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: colors.medium, fontSize: 12, textAlign: 'center', padding: 20 }}>Aucune donnée spend</div>
        )}
      </div>

      {/* ── Évolution spend mensuel ── */}
      {monthlySpend.length > 1 && (
        <>
          <SectionTitle>Évolution Spend Mensuel</SectionTitle>
          <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlySpend}>
                <defs>
                  <linearGradient id="gradBudgetMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: colors.medium }} />
                <YAxis tick={{ fontSize: 10, fill: colors.medium }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="spend" stroke={accentColor} strokeWidth={2} fill="url(#gradBudgetMonthly)" name="Spend (MAD)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Tableau détaillé par canal ── */}
      <DataTable columns={channelColumns} data={channelBreakdown} title="Détail par Canal — Spend, Leads, Coût" exportFilename="budget_canaux.csv" />
    </div>
  );
}
