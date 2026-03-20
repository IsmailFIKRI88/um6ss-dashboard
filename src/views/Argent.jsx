import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { COLORS, CHANNEL_COLORS, CHANNEL_LABELS } from '../../config/theme';
import { SectionTitle, DataTable, KPICard, AlertBadge } from '../../components/ui';
import { CustomTooltip } from '../../components/charts';
import { reconciliate } from '../../processing/reconciliation';
import { computeBudgetPacing } from '../../processing/budgetPacing';
import { reattribute } from '../../processing/attribution';
import { fmt, getChannelColor } from '../../utils/formatters';

export default function ViewArgent({ leads, adSpend, adBreakdowns, dateRange }) {
  const [attributionModel, setAttributionModel] = useState('last-touch');
  const [drillCampaign, setDrillCampaign] = useState(null);

  const attributedLeads = useMemo(() => reattribute(leads, attributionModel), [leads, attributionModel]);
  const recon = useMemo(() => reconciliate(attributedLeads, adSpend), [attributedLeads, adSpend]);
  const pacing = useMemo(() => computeBudgetPacing(adSpend), [adSpend]);

  // Table columns
  const reconColumns = [
    { key: 'platform', label: 'Plateforme', render: (v) => <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{v}</span> },
    { key: 'campaign_name', label: 'Campagne', render: (v, row) => (
      <span style={{ cursor: 'pointer', color: COLORS.accent, fontWeight: 600 }} onClick={() => setDrillCampaign(row)}>
        {(v || '').length > 40 ? v.slice(0, 38) + '…' : v}
      </span>
    )},
    { key: 'campaign_status', label: 'Statut', align: 'center', render: v => {
      if (!v) return '';
      const colors = { active: COLORS.good, enabled: COLORS.good, paused: COLORS.warning, removed: COLORS.bad };
      return <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: (colors[v] || COLORS.medium) + '18', color: colors[v] || COLORS.medium, fontWeight: 600 }}>{v}</span>;
    }},
    { key: 'spend', label: 'Spend', align: 'right', render: v => fmt.mad(v) },
    { key: 'platform_leads', label: 'Leads Plat.', align: 'center' },
    { key: 'wordpress_leads', label: 'Leads WP', align: 'center', style: () => ({ fontWeight: 700 }) },
    { key: 'wordpress_leads_qualified', label: 'Qualifiés', align: 'center', style: () => ({ color: COLORS.good, fontWeight: 700 }) },
    { key: 'phantom_gap_pct', label: 'Gap', align: 'center', render: (v) => (
      <span style={{ color: Math.abs(v) > 25 ? COLORS.bad : COLORS.medium, fontWeight: 600 }}>{v}%</span>
    )},
    { key: 'cpl_platform', label: 'CPL Plat.', align: 'right', render: v => v ? fmt.mad(v) : '—' },
    { key: 'cpl_wordpress', label: 'CPL Réel', align: 'right', render: v => v ? fmt.mad(v) : '—' },
    { key: 'cpl_qualified', label: 'CPL Qualifié', align: 'right', render: (v) => (
      <strong style={{ color: v && v > 500 ? COLORS.bad : v ? COLORS.good : COLORS.medium }}>{v ? fmt.mad(v) : '—'}</strong>
    )},
    { key: 'avg_score', label: 'Score', align: 'center' },
  ];

  return (
    <div>
      {/* Attribution toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: COLORS.medium }}>Attribution :</span>
        {['last-touch', 'first-touch'].map(m => (
          <button key={m} onClick={() => setAttributionModel(m)} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${attributionModel === m ? COLORS.primary : COLORS.border}`,
            background: attributionModel === m ? COLORS.primary : COLORS.white,
            color: attributionModel === m ? COLORS.white : COLORS.medium,
          }}>{m === 'last-touch' ? 'Last-Touch' : 'First-Touch'}</button>
        ))}
      </div>
      {attributionModel === 'first-touch' && (
        <div style={{ fontSize: 11, color: COLORS.warning, marginBottom: 16, fontStyle: 'italic' }}>
          En first-touch, les leads sont attribués au canal de découverte. Le spend reste lié aux campagnes last-touch — les CPL en first-touch ne sont pas comparables directement.
        </div>
      )}

      {/* Summary KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPICard small label="Spend Total" value={fmt.mad(recon.totals.spend)} color={COLORS.dark} />
        <KPICard small label="Leads Plateforme" value={fmt.number(recon.totals.platformLeads)} color={COLORS.accent} />
        <KPICard small label="Leads WordPress" value={fmt.number(recon.totals.wpLeads)} color={COLORS.primary} />
        <KPICard small label="Leads Qualifiés" value={fmt.number(recon.totals.wpQualified)} color={COLORS.good} />
        <KPICard small label="Non-attribués" value={fmt.number(recon.nonAttributable.count)} sub={`score moy: ${recon.nonAttributable.avgScore}`} color={COLORS.medium} tooltip="Leads organic/direct sans UTM" />
      </div>

      {/* Reconciliation table */}
      <DataTable columns={reconColumns} data={recon.campaigns} title="Table de Vérité — Campagnes" exportFilename="reconciliation.csv" />

      {/* Drill-down campaign */}
      {drillCampaign && (
        <CampaignDrillDown campaign={drillCampaign} adSpend={adSpend} adBreakdowns={adBreakdowns} onClose={() => setDrillCampaign(null)} />
      )}

      {/* Burn rate chart */}
      <SectionTitle>Burn Rate</SectionTitle>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ flex: '2 1 400px', background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 12 }}>Spend cumulé</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={pacing.cumulSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: COLORS.medium }} tickFormatter={d => fmt.dateShort(d)} />
              <YAxis tick={{ fontSize: 10, fill: COLORS.medium }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumul" stroke={COLORS.primary} strokeWidth={2} fill={COLORS.primary + '15'} name="Spend cumulé (MAD)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: '1 1 250px', background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 16 }}>Répartition par plateforme</div>
          {Object.entries(pacing.byPlatform).sort(([,a],[,b]) => b.spend - a.spend).map(([plat, data]) => (
            <div key={plat} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{plat}</span>
                <span style={{ color: COLORS.medium }}>{fmt.mad(data.spend)}</span>
              </div>
              <div style={{ height: 6, background: COLORS.light, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pacing.totalSpend > 0 ? (data.spend / pacing.totalSpend) * 100 : 0}%`, background: CHANNEL_COLORS[plat] || COLORS.medium, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: COLORS.medium, marginTop: 16 }}>
            Projection fin campagne : <strong>{fmt.mad(pacing.projectedTotalSpend)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drill-down campaign detail ──
function CampaignDrillDown({ campaign, adSpend, adBreakdowns, onClose }) {
  const campaignAds = adSpend.filter(r => r.campaign_id === campaign.campaign_id && r.ad_id);
  const campaignBreakdowns = adBreakdowns.filter(r => r.campaign_id === campaign.campaign_id);

  return (
    <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, border: `2px solid ${COLORS.accent}`, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark }}>{campaign.campaign_name}</div>
          <div style={{ fontSize: 11, color: COLORS.medium }}>{campaign.platform} · {fmt.mad(campaign.spend)}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: COLORS.medium }}>✕</button>
      </div>

      {campaignAds.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, marginBottom: 8 }}>Creatives ({campaignAds.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: COLORS.light }}>
                  {['Ad', 'Impressions', 'Clicks', 'Spend', 'CTR', 'Conv.'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Ad' ? 'left' : 'center', fontWeight: 600, color: COLORS.medium }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignAds.slice(0, 20).map((ad, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{(ad.ad_name || ad.ad_id || '').slice(0, 50)}</td>
                    <td style={{ textAlign: 'center' }}>{fmt.number(ad.impressions)}</td>
                    <td style={{ textAlign: 'center' }}>{fmt.number(ad.clicks)}</td>
                    <td style={{ textAlign: 'center' }}>{fmt.mad(ad.spend)}</td>
                    <td style={{ textAlign: 'center' }}>{fmt.pct(ad.ctr)}</td>
                    <td style={{ textAlign: 'center' }}>{ad.platform_conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {campaignBreakdowns.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, marginBottom: 8, marginTop: 16 }}>Breakdowns</div>
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
