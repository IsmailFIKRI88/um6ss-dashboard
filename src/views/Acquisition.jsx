import React, { useMemo, useState } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS, CHANNEL_COLORS, CHANNEL_LABELS } from '../config/theme';
import { QUALIFIED_SCORE_MIN } from '../config/defaults';
import { useTheme } from '../config/ThemeContext';
import { SectionTitle, DataTable, KPICard } from '../components/ui';
import { CustomTooltip } from '../components/charts';
import { reconciliate } from '../processing/reconciliation';
import { computeBudgetPacing } from '../processing/budgetPacing';
import { reattribute } from '../processing/attribution';
import { fmt } from '../utils/formatters';
import { groupByDate, daysAgo } from '../utils/dateHelpers';

export default function ViewAcquisition({ leads, adSpend, adBreakdowns, dateRange }) {
  const { colors, cardStyle, accentColor, mode } = useTheme();
  const [attributionModel, setAttributionModel] = useState('last-touch');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | paused
  const [drillChannel, setDrillChannel] = useState(null);
  const [drillCampaign, setDrillCampaign] = useState(null);

  const attributedLeads = useMemo(() => reattribute(leads, attributionModel), [leads, attributionModel]);
  const recon = useMemo(() => reconciliate(attributedLeads, adSpend), [attributedLeads, adSpend]);
  const pacing = useMemo(() => computeBudgetPacing(adSpend), [adSpend]);

  // ── Niveau 1 : KPIs globaux par canal ──
  const channelSummary = useMemo(() => {
    const byChannel = {};
    recon.campaigns.forEach(c => {
      const ch = c.platform || 'unknown';
      if (!byChannel[ch]) byChannel[ch] = { channel: ch, spend: 0, leads: 0, qualified: 0, campaigns: 0, impressions: 0, clicks: 0 };
      byChannel[ch].spend += c.spend;
      byChannel[ch].leads += c.wordpress_leads;
      byChannel[ch].qualified += c.wordpress_leads_qualified;
      byChannel[ch].campaigns++;
      byChannel[ch].impressions += c.impressions;
      byChannel[ch].clicks += c.clicks;
    });
    return Object.values(byChannel).map(ch => ({
      ...ch,
      cpl: ch.leads > 0 ? Math.round(ch.spend / ch.leads) : null,
      cpl_qualified: ch.qualified > 0 ? Math.round(ch.spend / ch.qualified) : null,
      ctr: ch.impressions > 0 ? ((ch.clicks / ch.impressions) * 100).toFixed(2) : null,
    })).sort((a, b) => b.spend - a.spend);
  }, [recon.campaigns]);

  // ── Trends: current period vs previous period ──
  const trends = useMemo(() => {
    const recentDate = daysAgo(14);
    const prevDate = daysAgo(28);
    const recent = leads.filter(l => (l.created_at || '') >= recentDate);
    const prev = leads.filter(l => (l.created_at || '') >= prevDate && (l.created_at || '') < recentDate);
    const recentSpend = adSpend.filter(r => (r.date || '') >= recentDate).reduce((s, r) => s + (r.spend || 0), 0);
    const prevSpend = adSpend.filter(r => (r.date || '') >= prevDate && (r.date || '') < recentDate).reduce((s, r) => s + (r.spend || 0), 0);
    const recentCPL = recent.length > 0 ? recentSpend / recent.length : 0;
    const prevCPL = prev.length > 0 ? prevSpend / prev.length : 0;
    return {
      leads: prev.length > 0 ? Math.round((recent.length - prev.length) / prev.length * 100) : null,
      cpl: prevCPL > 0 ? Math.round((recentCPL - prevCPL) / prevCPL * 100) : null,
      spend: prevSpend > 0 ? Math.round((recentSpend - prevSpend) / prevSpend * 100) : null,
    };
  }, [leads, adSpend]);

  // ── Niveau 2 : campagnes du canal sélectionné (with status filter) ──
  const channelCampaigns = useMemo(() => {
    if (!drillChannel) return [];
    let campaigns = recon.campaigns.filter(c => c.platform === drillChannel);
    if (statusFilter !== 'all') {
      campaigns = campaigns.filter(c => (c.campaign_status || '').toLowerCase().includes(statusFilter));
    }
    return campaigns;
  }, [recon.campaigns, drillChannel, statusFilter]);

  // ── Évolution CPL dans le temps ──
  const cplTimeline = useMemo(() => {
    const spendByDate = {};
    adSpend.forEach(r => {
      const d = r.date || '';
      if (!spendByDate[d]) spendByDate[d] = 0;
      spendByDate[d] += r.spend || 0;
    });
    const leadsByDate = groupByDate(attributedLeads, 'created_at');
    const dates = [...new Set([...Object.keys(spendByDate), ...Object.keys(leadsByDate)])].sort();

    let cumulSpend = 0;
    let cumulLeads = 0;
    return dates.map(date => {
      cumulSpend += spendByDate[date] || 0;
      cumulLeads += (leadsByDate[date] || []).length;
      return {
        date,
        dateLabel: fmt.dateShort(date),
        dailySpend: spendByDate[date] || 0,
        dailyLeads: (leadsByDate[date] || []).length,
        cpl: cumulLeads > 0 ? Math.round(cumulSpend / cumulLeads) : null,
      };
    }).filter(d => d.cpl !== null);
  }, [adSpend, attributedLeads]);

  // ── Table campagnes columns ──
  const campaignColumns = [
    { key: 'campaign_name', label: 'Campagne', render: (v, row) => (
      <span style={{ cursor: 'pointer', color: COLORS.accent, fontWeight: 600 }} onClick={() => setDrillCampaign(row)}>
        {(v || '').length > 40 ? v.slice(0, 38) + '...' : v}
      </span>
    )},
    { key: 'campaign_status', label: 'Statut', align: 'center', render: v => {
      if (!v) return '';
      const colors = { active: COLORS.good, enabled: COLORS.good, paused: COLORS.warning, removed: COLORS.bad };
      return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: (colors[v] || COLORS.medium) + '18', color: colors[v] || COLORS.medium, fontWeight: 600 }}>{v}</span>;
    }},
    { key: 'spend', label: 'Spend', align: 'right', render: v => fmt.mad(v) },
    { key: 'wordpress_leads', label: 'Leads WP', align: 'center', style: () => ({ fontWeight: 700 }) },
    { key: 'wordpress_leads_qualified', label: 'Qualifiés', align: 'center', style: () => ({ color: COLORS.good, fontWeight: 700 }) },
    { key: 'cpl_wordpress', label: 'CPL Réel', align: 'right', render: v => v ? fmt.mad(v) : '—' },
    { key: 'cpl_qualified', label: 'CPL Qualifié', align: 'right', render: v => (
      <strong style={{ color: v && v > 500 ? COLORS.bad : v ? COLORS.good : COLORS.medium }}>{v ? fmt.mad(v) : '—'}</strong>
    )},
    { key: 'phantom_gap_pct', label: 'Gap', align: 'center', render: v => (
      <span style={{ color: Math.abs(v) > 25 ? COLORS.bad : COLORS.medium, fontWeight: 600 }}>{v}%</span>
    )},
    { key: 'avg_score', label: 'Score', align: 'center' },
  ];

  return (
    <div>
      {/* Attribution toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: colors.medium }}>Attribution :</span>
        {['last-touch', 'first-touch'].map(m => (
          <button key={m} onClick={() => setAttributionModel(m)} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${attributionModel === m ? accentColor : colors.border}`,
            background: attributionModel === m ? accentColor : mode.cardBg,
            color: attributionModel === m ? '#FFFFFF' : colors.medium,
            fontFamily: mode.font,
          }}>{m === 'last-touch' ? 'Last-Touch' : 'First-Touch'}</button>
        ))}
      </div>
      {attributionModel === 'first-touch' && (
        <div style={{ fontSize: 11, color: colors.warning, marginBottom: 16, fontStyle: 'italic' }}>
          En first-touch, les leads sont attribués au canal de découverte. Le spend reste lié aux campagnes last-touch — les CPL en first-touch ne sont pas comparables directement.
        </div>
      )}

      {/* Summary KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPICard small label="Spend Total" value={fmt.mad(recon.totals.spend)} trend={trends.spend} color={colors.dark} tooltip="Total des dépenses publicitaires sur la période" />
        <KPICard small label="Candidatures" value={fmt.number(recon.totals.wpLeads)} trend={trends.leads} tooltip="Leads WordPress réconciliés avec les campagnes" />
        <KPICard small label="Qualifiés" value={fmt.number(recon.totals.wpQualified)} color={colors.good} tooltip="Candidatures avec score de qualité ≥ 60" />
        <KPICard small label="CPL Moyen" value={recon.totals.wpLeads > 0 ? fmt.mad(Math.round(recon.totals.spend / recon.totals.wpLeads)) : '—'} trend={trends.cpl ? -trends.cpl : null} color={accentColor} tooltip="Coût par candidature réelle (spend ÷ leads WordPress). Trend inversé : baisse = amélioration." />
        <KPICard small label="Non-attribués" value={fmt.number(recon.nonAttributable.count)} sub={`score moy: ${recon.nonAttributable.avgScore}`} color={colors.medium} tooltip="Candidatures organiques/directes sans tracking publicitaire" />
      </div>

      {/* ── Niveau 1 : Cards par canal ── */}
      <SectionTitle>Performance par Canal</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {channelSummary.map(ch => {
          const isSelected = drillChannel === ch.channel;
          return (
            <div key={ch.channel}
              onClick={() => { setDrillChannel(isSelected ? null : ch.channel); setDrillCampaign(null); }}
              style={{
                ...cardStyle, padding: '14px 16px', cursor: 'pointer',
                border: isSelected ? `2px solid ${CHANNEL_COLORS[ch.channel] || accentColor}` : cardStyle.border,
                borderTop: `4px solid ${CHANNEL_COLORS[ch.channel] || colors.medium}`,
                flex: '1 1 180px', minWidth: 170, transition: 'border-color 0.15s',
              }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: CHANNEL_COLORS[ch.channel] || colors.dark, textTransform: 'capitalize', marginBottom: 8 }}>
                {CHANNEL_LABELS[ch.channel] || ch.channel}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: colors.medium }}>Spend</span>
                <strong>{fmt.mad(ch.spend)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: colors.medium }}>Leads WP</span>
                <strong>{ch.leads}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: colors.medium }}>CPL Réel</span>
                <strong style={{ color: ch.cpl && ch.cpl > 500 ? colors.bad : colors.good }}>{ch.cpl ? fmt.mad(ch.cpl) : '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: colors.medium }}>Qualifiés</span>
                <strong style={{ color: colors.good }}>{ch.qualified}</strong>
              </div>
              <div style={{ fontSize: 10, color: colors.medium, marginTop: 6 }}>
                {ch.campaigns} campagne{ch.campaigns > 1 ? 's' : ''} · CTR {ch.ctr ? `${ch.ctr}%` : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Niveau 2 : Table campagnes du canal sélectionné ── */}
      {drillChannel && (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['all', 'active', 'paused'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${statusFilter === s ? accentColor : colors.border}`,
                background: statusFilter === s ? accentColor : mode.cardBg,
                color: statusFilter === s ? '#FFFFFF' : colors.medium,
                fontFamily: mode.font,
              }}>
                {s === 'all' ? 'Toutes' : s === 'active' ? '🟢 Actives' : '⏸️ Pausées'}
              </button>
            ))}
          </div>
          <DataTable
            columns={campaignColumns}
            data={channelCampaigns}
            title={`Campagnes — ${CHANNEL_LABELS[drillChannel] || drillChannel}`}
            exportFilename={`campagnes_${drillChannel}.csv`}
          />

          {/* ── Niveau 3 : Drill-down créas ── */}
          {drillCampaign && (
            <CampaignCreatives campaign={drillCampaign} adSpend={adSpend} adBreakdowns={adBreakdowns} onClose={() => setDrillCampaign(null)} />
          )}
        </>
      )}

      {/* ── Évolution CPL ── */}
      {cplTimeline.length > 2 && (
        <>
          <SectionTitle>Évolution CPL dans le temps</SectionTitle>
          <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: colors.medium, marginBottom: 12, fontStyle: 'italic' }}>
              CPL cumulé glissant (spend cumulé ÷ leads cumulés). Tendance à la baisse = efficacité croissante.
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={cplTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: colors.medium }} />
                <YAxis tick={{ fontSize: 10, fill: colors.medium }} tickFormatter={v => `${v} MAD`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="cpl" stroke={accentColor} strokeWidth={2} dot={false} name="CPL cumulé (MAD)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Budget Pacing ── */}
      <SectionTitle>Budget Pacing</SectionTitle>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ ...cardStyle, flex: '2 1 400px', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>Burn Rate — Spend cumulé</div>
          <div style={{ fontSize: 10, color: colors.medium, marginBottom: 12 }}>
            {pacing.pctElapsed}% du temps écoulé · {fmt.mad(pacing.avgDailySpend)}/jour en moyenne (14j)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={pacing.cumulSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: colors.medium }} tickFormatter={d => fmt.dateShort(d)} />
              <YAxis tick={{ fontSize: 10, fill: colors.medium }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumul" stroke={accentColor} strokeWidth={2} fill={accentColor + '15'} name="Spend cumulé (MAD)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, flex: '1 1 250px', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>Répartition par plateforme</div>
          {Object.entries(pacing.byPlatform).sort(([, a], [, b]) => b.spend - a.spend).map(([plat, data]) => (
            <div key={plat} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{CHANNEL_LABELS[plat] || plat}</span>
                <span style={{ color: colors.medium }}>{fmt.mad(data.spend)}</span>
              </div>
              <div style={{ height: 6, background: colors.light, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pacing.totalSpend > 0 ? (data.spend / pacing.totalSpend) * 100 : 0}%`, background: CHANNEL_COLORS[plat] || colors.medium, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: colors.medium, marginTop: 16, borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
            Spend actuel : <strong>{fmt.mad(pacing.totalSpend)}</strong><br />
            Projection fin campagne : <strong>{fmt.mad(pacing.projectedTotalSpend)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drill-down créas d'une campagne ──
function CampaignCreatives({ campaign, adSpend, adBreakdowns, onClose }) {
  const campaignAds = useMemo(() => {
    const ads = adSpend.filter(r => r.campaign_id === campaign.campaign_id && r.ad_id);
    // Aggregate by ad_id (multiple days → one row)
    const byAd = {};
    ads.forEach(r => {
      if (!byAd[r.ad_id]) byAd[r.ad_id] = { ad_id: r.ad_id, ad_name: r.ad_name || r.ad_id, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      byAd[r.ad_id].spend += r.spend || 0;
      byAd[r.ad_id].impressions += r.impressions || 0;
      byAd[r.ad_id].clicks += r.clicks || 0;
      byAd[r.ad_id].conversions += r.platform_conversions || 0;
    });
    return Object.values(byAd).map(a => ({
      ...a,
      ctr: a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : null,
      cpc: a.clicks > 0 ? Math.round(a.spend / a.clicks) : null,
    })).sort((a, b) => b.spend - a.spend);
  }, [adSpend, campaign.campaign_id]);

  const campaignBreakdowns = useMemo(() =>
    (adBreakdowns || []).filter(r => r.campaign_id === campaign.campaign_id)
  , [adBreakdowns, campaign.campaign_id]);

  return (
    <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, border: `2px solid ${COLORS.accent}`, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark }}>{campaign.campaign_name}</div>
          <div style={{ fontSize: 11, color: COLORS.medium }}>
            {campaign.platform} · {fmt.mad(campaign.spend)} · {campaign.wordpress_leads} leads WP · CPL {campaign.cpl_wordpress ? fmt.mad(campaign.cpl_wordpress) : '—'}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: COLORS.medium }}>✕</button>
      </div>

      {/* Creatives table */}
      {campaignAds.length > 0 ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, marginBottom: 8 }}>
            Créatives ({campaignAds.length}) — comparaison même campagne
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: COLORS.light }}>
                  {['Créa', 'Impressions', 'Clicks', 'CTR', 'Spend', 'CPC', 'Conv.'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Créa' ? 'left' : 'center', fontWeight: 600, color: COLORS.medium }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignAds.slice(0, 30).map((ad, i) => {
                  const bestCtr = Math.max(...campaignAds.map(a => parseFloat(a.ctr) || 0));
                  const isBestCtr = campaignAds.length > 1 && parseFloat(ad.ctr) === bestCtr && bestCtr > 0;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(ad.ad_name || '').slice(0, 50)}
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt.number(ad.impressions)}</td>
                      <td style={{ textAlign: 'center' }}>{fmt.number(ad.clicks)}</td>
                      <td style={{ textAlign: 'center', fontWeight: isBestCtr ? 700 : 400, color: isBestCtr ? COLORS.good : undefined }}>
                        {ad.ctr ? `${ad.ctr}%` : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>{fmt.mad(ad.spend)}</td>
                      <td style={{ textAlign: 'center' }}>{ad.cpc ? fmt.mad(ad.cpc) : '—'}</td>
                      <td style={{ textAlign: 'center' }}>{ad.conversions || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ color: COLORS.medium, fontSize: 12, padding: 20, textAlign: 'center' }}>
          Pas de données créatives pour cette campagne
        </div>
      )}

      {/* Breakdowns */}
      {campaignBreakdowns.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, marginBottom: 8, marginTop: 16 }}>Breakdowns démographiques</div>
          {['age', 'gender', 'publisher_platform', 'device'].map(dim => {
            const dimData = campaignBreakdowns.filter(r => r.dimension === dim);
            if (!dimData.length) return null;
            return (
              <div key={dim} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: COLORS.medium, fontWeight: 600, marginBottom: 4, textTransform: 'capitalize' }}>{dim}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {dimData.sort((a, b) => b.spend - a.spend).map((d, i) => (
                    <div key={i} style={{ background: COLORS.light, borderRadius: 6, padding: '6px 10px', fontSize: 10 }}>
                      <strong>{d.dimension_value}</strong>: {fmt.mad(d.spend)} · {fmt.number(d.clicks)} clicks
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
