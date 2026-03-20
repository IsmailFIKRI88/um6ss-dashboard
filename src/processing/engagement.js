import { QUALIFIED_SCORE_MIN } from '../config/defaults';

// ═══════════════════════════════════════════════
// ENGAGEMENT — Score × Engagement analysis
// ═══════════════════════════════════════════════

export function computeEngagement(leads) {
  return leads.map(lead => {
    const timeOnPage = Number(lead.time_on_page) || 0;
    const activeTime = Number(lead.active_time) || 0;
    const scrollDepth = Number(lead.scroll_depth) || 0;
    const brochure = Number(lead.brochure_clicked) || 0;
    const faq = Number(lead.faq_opened) || 0;
    const video = Number(lead.video_played) || 0;
    const programmesViewed = (lead.programmes_viewed || '').split(',').filter(Boolean).length;

    // Attention ratio: active_time / time_on_page (0-1)
    const attentionRatio = timeOnPage > 0 ? Math.min(1, activeTime / timeOnPage) : 0;

    // Composite engagement score (0-100)
    const engagement = Math.min(100, Math.round(
      attentionRatio * 30 +
      (scrollDepth / 100) * 25 +
      brochure * 15 +
      faq * 10 +
      video * 10 +
      Math.min(programmesViewed, 3) * 3.33
    ));

    const score = Number(lead.score) || 0;
    let quadrant;
    if (score >= QUALIFIED_SCORE_MIN && engagement >= 50) quadrant = 'high-high';
    else if (score >= QUALIFIED_SCORE_MIN && engagement < 50) quadrant = 'high-low';
    else if (score < QUALIFIED_SCORE_MIN && engagement >= 50) quadrant = 'low-high';
    else quadrant = 'low-low';

    return {
      id: lead.id,
      score,
      engagement,
      quadrant,
      attentionRatio,
      scrollDepth,
      microConversions: brochure + faq + video,
      programmesViewed,
      channel: lead.channel_group || 'Direct',
      source: lead.source || 'candidature',
      daysToConvert: Number(lead.days_to_convert) || 0,
    };
  });
}

export function engagementByChannel(engagementData) {
  const byChannel = {};
  engagementData.forEach(e => {
    if (!byChannel[e.channel]) byChannel[e.channel] = { scores: [], engagements: [], count: 0 };
    byChannel[e.channel].scores.push(e.score);
    byChannel[e.channel].engagements.push(e.engagement);
    byChannel[e.channel].count++;
  });
  return Object.entries(byChannel).map(([channel, data]) => ({
    channel,
    count: data.count,
    avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
    avgEngagement: Math.round(data.engagements.reduce((a, b) => a + b, 0) / data.count),
  })).sort((a, b) => b.count - a.count);
}
