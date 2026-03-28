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

  // Single-pass lead assignment: each lead is assigned to exactly ONE campaign
  // Priority: exact campaign_id > exact campaign_name > substring match > click ID fallback
  const campaigns = Object.values(byCampaign);
  const leadAssignment = new Map(); // lead.id → campaign key

  leads.forEach(lead => {
    if (leadAssignment.has(lead.id)) return;
    let bestMatch = null;
    let bestPriority = 0;

    for (const campaign of campaigns) {
      const key = `${campaign.platform}::${campaign.campaign_id}`;
      let priority = 0;

      if (lead.utm_campaign) {
        if (lead.utm_campaign === campaign.campaign_id) priority = 4;
        else if (lead.utm_campaign === campaign.campaign_name) priority = 3;
        else if (campaign.campaign_name && lead.utm_campaign.toLowerCase().includes(campaign.campaign_name.toLowerCase())) priority = 2;
      } else {
        // Click ID fallback: assign to highest-spend campaign of the platform
        if (campaign.platform === 'meta' && lead.fbclid) priority = 1;
        else if (campaign.platform === 'google' && lead.gclid) priority = 1;
        else if (campaign.platform === 'tiktok' && lead.ttclid) priority = 1;
        else if (campaign.platform === 'linkedin' && lead.li_fat_id) priority = 1;
      }

      if (priority > bestPriority || (priority === bestPriority && priority === 1 && campaign.spend > (bestMatch?.spend || 0))) {
        bestPriority = priority;
        bestMatch = { key, campaign };
      }
    }

    if (bestMatch) {
      leadAssignment.set(lead.id, bestMatch.key);
    }
  });

  // Build results per campaign
  const result = campaigns.map(campaign => {
    const key = `${campaign.platform}::${campaign.campaign_id}`;
    const matchedLeads = leads.filter(l => leadAssignment.get(l.id) === key);

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
  leads.forEach(l => {
    if (l.utm_campaign || l.gclid || l.fbclid || l.ttclid || l.li_fat_id) {
      attributedLeadIds.add(l.id);
    }
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
