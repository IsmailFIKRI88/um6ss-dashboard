import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS, FACULTY_COLORS, FACULTY_LABELS } from '../config/theme';
import { QUALIFIED_SCORE_MIN, DEFAULT_ALERT_THRESHOLDS, DEFAULT_CAMPAIGN_TIMELINE } from '../config/defaults';
import { KPICard, AlertBadge, SectionTitle, ProgressBar, CampaignProgressBar } from '../components/ui';
import { CustomTooltip, FunnelBar } from '../components/charts';
import { buildFunnel, funnelConversionRates } from '../processing/funnel';
import { computeFinancials, weightedFinancialParams } from '../processing/financial';
import { computeProjection } from '../processing/projection';
import { PROGRAMS_BY_ENTITY } from '../config/programs';
import { fmt } from '../utils/formatters';
import { daysAgo, groupByDate } from '../utils/dateHelpers';

export default function ViewSituation({ leads, visits, adSpend, outcomes, experiments, dateRange, financialSettings }) {
  const [mode, setMode] = useState('pilotage'); // pilotage | direction

  // ── Core metrics ──
  const totalLeads = leads.length;
  const qualified = leads.filter(l => Number(l.score) >= QUALIFIED_SCORE_MIN).length;
  const enrolled = leads.filter(l => l.outcome === 'enrolled' || l.outcome === 'inscrit').length;
  const scoreMoyen = totalLeads > 0 ? Math.round(leads.reduce((s, l) => s + (Number(l.score) || 0), 0) / totalLeads) : 0;
  const totalSpend = adSpend.reduce((s, r) => s + (r.spend || 0), 0);
  const cplQualifie = qualified > 0 && totalSpend > 0 ? Math.round(totalSpend / qualified) : null;

  // Trend vs previous period
  const recentDate = daysAgo(30);
  const prevDate = daysAgo(60);
  const last30 = leads.filter(l => (l.created_at || '') >= recentDate);
  const prev30 = leads.filter(l => (l.created_at || '') >= prevDate && (l.created_at || '') < recentDate);
  const trend = prev30.length > 0 ? Math.round((last30.length - prev30.length) / prev30.length * 100) : null;

  // Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLeads = leads.filter(l => (l.created_at || '').startsWith(todayStr)).length;

  // Bot rate
  const botRate = totalLeads > 0 ? (leads.reduce((s, l) => s + (Number(l.bot_score) || 0), 0) / totalLeads).toFixed(1) : '0';

  // ── Alerts ──
  const alerts = useMemo(() => {
    const a = [];
    const T = DEFAULT_ALERT_THRESHOLDS;
    if (cplQualifie && cplQualifie > T.cpl_qualifie_max) a.push({ level: 2, text: `CPL qualifié ${fmt.mad(cplQualifie)} > seuil ${fmt.mad(T.cpl_qualifie_max)}` });
    if (scoreMoyen < T.score_moyen_min) a.push({ level: 1, text: `Score moyen ${scoreMoyen}/100 < seuil ${T.score_moyen_min}` });
    if (parseFloat(botRate) > T.bot_rate_max_pct) a.push({ level: 1, text: `Taux bots ${botRate}% > seuil ${T.bot_rate_max_pct}%` });
    if (a.length === 0) a.push({ level: 0, text: `${totalLeads} leads · Score ${scoreMoyen}/100` });
    return a;
  }, [cplQualifie, scoreMoyen, botRate, totalLeads]);

  // ── Funnel ──
  const funnel = useMemo(() => funnelConversionRates(buildFunnel(leads, visits, adSpend, outcomes)), [leads, visits, adSpend, outcomes]);

  // ── Daily sparkline data ──
  const dailyData = useMemo(() => {
    const groups = groupByDate(leads, 'created_at');
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, items]) => ({
      date, dateLabel: fmt.dateShort(date), leads: items.length,
    }));
  }, [leads]);

  // ── Projection ──
  const proj = useMemo(() => computeProjection(leads, adSpend), [leads, adSpend]);

  // ── Financials (for direction mode — only meaningful with real outcomes) ──
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

  // ── Faculty fill rates (direction mode — with capacity) ──
  const facultyFill = useMemo(() => {
    const byFac = {};
    leads.forEach(l => {
      const entity = l.lp_entite || l.entity_code || 'Autre';
      let code = 'Autre';
      for (const [k, v] of Object.entries(FACULTY_LABELS)) {
        if (entity.toLowerCase().includes(v.toLowerCase()) || entity.includes(k)) { code = k; break; }
      }
      if (!byFac[code]) byFac[code] = { leads: 0, qualified: 0, enrolled: 0 };
      byFac[code].leads++;
      if (Number(l.score) >= QUALIFIED_SCORE_MIN) byFac[code].qualified++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byFac[code].enrolled++;
    });
    return Object.entries(byFac).map(([code, d]) => {
      const programs = PROGRAMS_BY_ENTITY[code] || [];
      let totalCap = 0;
      for (const p of programs) totalCap += (financialSettings?.[p.id]?.maxCapacity || 0);
      return {
        code, name: FACULTY_LABELS[code] || code, color: FACULTY_COLORS[code] || COLORS.medium,
        ...d, maxCapacity: totalCap,
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [leads, financialSettings]);

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {['pilotage', 'direction'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `2px solid ${mode === m ? COLORS.primary : COLORS.border}`,
            background: mode === m ? COLORS.primary : COLORS.white,
            color: mode === m ? COLORS.white : COLORS.medium,
          }}>{m === 'pilotage' ? '⚡ Pilotage' : '🏛️ Direction'}</button>
        ))}
      </div>

      {/* Alerts */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {alerts.map((a, i) => <AlertBadge key={i} level={a.level} text={a.text} />)}
      </div>

      {mode === 'pilotage' ? (
        <>
          {/* Campaign progress — only in Situation view */}
          <div style={{ marginBottom: 20 }}>
            <CampaignProgressBar start={DEFAULT_CAMPAIGN_TIMELINE.start} end={DEFAULT_CAMPAIGN_TIMELINE.end} />
          </div>

          {/* KPIs ops */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <KPICard label="Leads Total" value={fmt.number(totalLeads)} trend={trend} tooltip="Nombre total de leads collectés" />
            <KPICard label="Spend Total" value={totalSpend > 0 ? fmt.mad(totalSpend) : '—'} tooltip="Dépense publicitaire totale" color={COLORS.accent} />
            <KPICard label="CPL Qualifié" value={cplQualifie ? fmt.mad(cplQualifie) : '—'} tooltip={`Coût par lead score ≥ ${QUALIFIED_SCORE_MIN}`} color={cplQualifie && cplQualifie > 500 ? COLORS.bad : COLORS.good} />
            <KPICard label="Score Moyen" value={scoreMoyen} sub="/100" color={scoreMoyen >= 60 ? COLORS.good : COLORS.warning} tooltip="Score qualité moyen de tous les leads" />
            <KPICard label="Aujourd'hui" value={todayLeads} sub="leads" color={COLORS.accent} />
          </div>

          {/* Funnel + Sparkline */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ flex: '1 1 400px', background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 16 }}>Funnel d'acquisition</div>
              <FunnelBar steps={funnel.filter(s => s.value > 0)} />
            </div>
            <div style={{ flex: '1 1 350px', background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 12 }}>Leads / jour (30j)</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: COLORS.medium }} />
                  <YAxis tick={{ fontSize: 10, fill: COLORS.medium }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="leads" stroke={COLORS.primary} strokeWidth={2} fill="url(#gradLeads)" name="Leads" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* ── Direction mode ── */
        <>
          {/* Financial KPIs — only if real enrollment data exists */}
          {financials ? (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <KPICard label="Coût Total Campagne" value={fmt.mad(financials.fullCost)} tooltip="Media spend + coûts fixes" color={COLORS.dark} />
              <KPICard label="CAC" value={financials.fullCAC ? fmt.mad(financials.fullCAC) : '—'} tooltip="Coût d'acquisition complet par inscrit" color={financials.fullCAC && financials.fullCAC > 5000 ? COLORS.bad : COLORS.good} />
              <KPICard label="ROAS" value={financials.roas ? `${financials.roas}x` : '—'} tooltip="Revenue / Coût total" color={COLORS.primary} />
              <KPICard label="Payback" value={financials.paybackMonths ? `${financials.paybackMonths} mois` : '—'} tooltip="Mois avant que le revenue couvre le CAC" color={COLORS.accent} />
              <KPICard label="Inscrits" value={enrolled} sub={`sur ${totalLeads} leads`} color={COLORS.good} />
            </div>
          ) : (
            <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                <KPICard label="Leads Total" value={fmt.number(totalLeads)} color={COLORS.primary} />
                <KPICard label="Spend Total" value={totalSpend > 0 ? fmt.mad(totalSpend) : '—'} color={COLORS.accent} />
                <KPICard label="Score Moyen" value={scoreMoyen} sub="/100" color={scoreMoyen >= 60 ? COLORS.good : COLORS.warning} />
              </div>
              <div style={{ color: COLORS.medium, fontSize: 13, padding: '12px 0', borderTop: `1px solid ${COLORS.border}` }}>
                Les KPIs financiers (ROAS, payback, revenue) seront disponibles quand les premières inscriptions seront importées via le rapprochement DSI (wp-admin → Outcomes).
              </div>
            </div>
          )}

          {/* Projection */}
          <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 12 }}>Projection Septembre</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
              <div><span style={{ color: COLORS.medium }}>Rythme actuel:</span> <strong>{proj.currentDailyRate} leads/jour</strong></div>
              <div><span style={{ color: COLORS.medium }}>Leads projetés:</span> <strong>{fmt.number(proj.projectedLeads)}</strong></div>
              {proj.hasRealConvRate ? (
                <div><span style={{ color: COLORS.medium }}>Inscrits projetés:</span> <strong>{proj.projectedEnrolled}</strong> ({proj.conversionRate}% taux conv.)</div>
              ) : (
                <div><span style={{ color: COLORS.warning, fontSize: 12 }}>Projection inscrits non disponible — pas assez de données outcomes</span></div>
              )}
              <div><span style={{ color: COLORS.medium }}>Jours restants:</span> <strong>{proj.remaining}</strong></div>
            </div>
          </div>

          {/* Faculty fill rates */}
          <SectionTitle>Remplissage par Entité</SectionTitle>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {facultyFill.map((f, i) => {
              const hasCap = f.maxCapacity > 0;
              const fillPct = hasCap ? Math.round(f.enrolled / f.maxCapacity * 100) : null;
              const fillColor = fillPct >= 90 ? COLORS.good : fillPct >= 60 ? COLORS.accent : fillPct >= 1 ? COLORS.warning : COLORS.border;

              return (
                <div key={i} style={{
                  background: COLORS.white, borderRadius: 10, padding: '14px 16px',
                  border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${f.color}`,
                  flex: '1 1 175px', minWidth: 170,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: f.color, textTransform: 'uppercase' }}>{f.name}</div>
                  {hasCap ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.dark, margin: '4px 0' }}>
                        {f.enrolled} <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.medium }}>/ {f.maxCapacity}</span>
                      </div>
                      <div style={{ height: 6, background: COLORS.light, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', width: `${Math.min(fillPct, 100)}%`, background: fillColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.medium }}>
                        <span>{fillPct}% rempli</span>
                        <span>{f.leads} leads</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.dark, margin: '4px 0' }}>{f.leads}</div>
                      <div style={{ fontSize: 10, color: COLORS.medium }}>{f.qualified} qualifiés · {f.enrolled} inscrits</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
