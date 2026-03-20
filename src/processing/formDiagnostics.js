// ═══════════════════════════════════════════════
// FORM DIAGNOSTICS — Friction analysis
// ═══════════════════════════════════════════════

export function computeFormDiagnostics(leads) {
  const fieldTimes = {};  // field → [ms, ms, ...]
  const errorsByField = {};
  let totalFormDuration = 0;
  let formCount = 0;
  const byDevice = { mobile: { durations: [], errors: [], scores: [] }, desktop: { durations: [], errors: [], scores: [] } };

  leads.forEach(lead => {
    // Parse form_field_times JSON
    if (lead.form_field_times) {
      try {
        const raw = lead.form_field_times.replace(/\\\\/g, '\\').replace(/^"|"$/g, '');
        const times = JSON.parse(raw);
        Object.entries(times).forEach(([field, ms]) => {
          if (!fieldTimes[field]) fieldTimes[field] = [];
          fieldTimes[field].push(Number(ms));
        });
      } catch { /* skip malformed JSON */ }
    }

    // Form errors
    if (lead.form_first_error_field) {
      const field = lead.form_first_error_field;
      if (!errorsByField[field]) errorsByField[field] = 0;
      errorsByField[field]++;
    }

    // Duration
    const duration = Number(lead.form_duration) || 0;
    if (duration > 0) {
      totalFormDuration += duration;
      formCount++;
    }

    // By device
    const device = (lead.device || 'desktop').toLowerCase().includes('mobile') ? 'mobile' : 'desktop';
    byDevice[device].durations.push(duration);
    byDevice[device].errors.push(Number(lead.form_error_count) || 0);
    byDevice[device].scores.push(Number(lead.score) || 0);
  });

  // Waterfall: median time per field
  const waterfall = Object.entries(fieldTimes).map(([field, times]) => {
    const sorted = times.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    return {
      field,
      medianMs: Math.round(median),
      medianSec: Math.round(median / 1000),
      count: times.length,
      errors: errorsByField[field] || 0,
      errorRate: times.length > 0 ? Math.round((errorsByField[field] || 0) / times.length * 100) : 0,
    };
  }).sort((a, b) => b.medianMs - a.medianMs);

  // Device gap
  const avg = arr => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const deviceGap = {
    mobile: {
      count: byDevice.mobile.durations.length,
      avgDuration: avg(byDevice.mobile.durations),
      avgErrors: (avg(byDevice.mobile.errors) * 10) / 10,
      avgScore: avg(byDevice.mobile.scores),
    },
    desktop: {
      count: byDevice.desktop.durations.length,
      avgDuration: avg(byDevice.desktop.durations),
      avgErrors: (avg(byDevice.desktop.errors) * 10) / 10,
      avgScore: avg(byDevice.desktop.scores),
    },
  };

  return {
    waterfall,
    avgFormDuration: formCount > 0 ? Math.round(totalFormDuration / formCount) : 0,
    deviceGap,
    totalErrors: Object.values(errorsByField).reduce((s, n) => s + n, 0),
  };
}
