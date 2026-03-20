import { CHANNEL_LABELS } from '../config/theme';
import { QUALIFIED_SCORE_MIN } from '../config/defaults';

// ═══════════════════════════════════════════════
// RECONCILIATION — Plateforme vs WordPress
// ═══════════════════════════════════════════════

/**
 * Réconcilie les données ads avec les leads WordPress.
 * Jointure : utm_campaign → campaign_name, puis channel_group → platform.
 */
export function reconciliate(leads, adSpend) {
  // Group ad spend by campaign
  const byCampaign = {};
  adSpend.forEach(row => {
    const key = `${row.platform}::${row.campaign_id}`;
    if (!byCampaign[key]) {
      byCampaign[key] = {
        platform: row.platform,
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name || row.campaign_id,
        campaign_status: row.campaign_status || '',
        spend: 0, impressions: 0, clicks: 0,
        platform_leads: 0, reach: 0, frequency: 0,
      };
    }
    const c = byCampaign[key];
    c.spend += row.spend || 0;
    c.impressions += row.impressions || 0;
    c.clicks += row.clicks || 0;
    c.platform_leads += row.platform_conversions || 0;
    c.reach += row.reach || 0;
  });

  // Match leads to campaigns
  const result = Object.values(byCampaign).map(campaign => {
    const matchedLeads = leads.filter(lead => {
      // Match by click IDs (most reliable)
      if (campaign.platform === 'meta' && lead.fbclid) return true;
      if (campaign.platform === 'google' && lead.gclid) return true;
      if (campaign.platform === 'tiktok' && lead.ttclid) return true;
      if (campaign.platform === 'linkedin' && lead.li_fat_id) return true;
      // Match by utm_campaign (requires naming convention)
      if (lead.utm_campaign && campaign.campaign_name) {
        if (lead.utm_campaign === campaign.campaign_name) return true;
        if (lead.utm_campaign.toLowerCase().includes(campaign.campaign_name.toLowerCase())) return true;
      }
      return false;
    });

    const wpLeads = matchedLeads.length;
    const wpQualified = matchedLeads.filter(l => Number(l.score) >= QUALIFIED_SCORE_MIN).length;
    const avgScore = matchedLeads.length > 0
      ? Math.round(matchedLeads.reduce((s, l) => s + (Number(l.score) || 0), 0) / matchedLeads.length)
      : 0;

    return {
      ...campaign,
      wordpress_leads: wpLeads,
      wordpress_leads_qualified: wpQualified,
      phantom_gap: campaign.platform_leads - wpLeads,
      phantom_gap_pct: campaign.platform_leads > 0
        ? Math.round((campaign.platform_leads - wpLeads) / campaign.platform_leads * 100) : 0,
      cpl_platform: campaign.platform_leads > 0 ? Math.round(campaign.spend / campaign.platform_leads) : null,
      cpl_wordpress: wpLeads > 0 ? Math.round(campaign.spend / wpLeads) : null,
      cpl_qualified: wpQualified > 0 ? Math.round(campaign.spend / wpQualified) : null,
      avg_score: avgScore,
    };
  });

  // Non-attributable leads (organic/direct)
  const attributedLeadIds = new Set();
  result.forEach(r => {
    leads.forEach(l => {
      if (l.utm_campaign || l.gclid || l.fbclid || l.ttclid || l.li_fat_id) {
        attributedLeadIds.add(l.id);
      }
    });
  });
  const nonAttributable = leads.filter(l => !attributedLeadIds.has(l.id));

  return {
    campaigns: result.sort((a, b) => b.spend - a.spend),
    nonAttributable: {
      count: nonAttributable.length,
      qualified: nonAttributable.filter(l => Number(l.score) >= QUALIFIED_SCORE_MIN).length,
      avgScore: nonAttributable.length > 0
        ? Math.round(nonAttributable.reduce((s, l) => s + (Number(l.score) || 0), 0) / nonAttributable.length)
        : 0,
    },
    totals: {
      spend: result.reduce((s, r) => s + r.spend, 0),
      platformLeads: result.reduce((s, r) => s + r.platform_leads, 0),
      wpLeads: result.reduce((s, r) => s + r.wordpress_leads, 0),
      wpQualified: result.reduce((s, r) => s + r.wordpress_leads_qualified, 0),
    },
  };
}
