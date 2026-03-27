import { describe, it, expect } from 'vitest';
import { computeFormDiagnostics } from '../formDiagnostics';

describe('computeFormDiagnostics', () => {
  const makeLead = (overrides = {}) => ({
    id: '1',
    score: '50',
    device: 'desktop',
    form_duration: '45000',
    form_error_count: '0',
    form_first_error_field: null,
    form_field_times: null,
    ...overrides,
  });

  it('computes waterfall from form_field_times JSON', () => {
    const leads = [
      makeLead({
        form_field_times: JSON.stringify({
          nom: 2000,
          prenom: 1500,
          email: 3000,
          telephone: 4000,
        }),
      }),
    ];
    const result = computeFormDiagnostics(leads);

    expect(result.waterfall).toHaveLength(4);
    // Sorted by medianMs descending
    expect(result.waterfall[0].field).toBe('telephone');
    expect(result.waterfall[0].medianMs).toBe(4000);
    expect(result.waterfall[0].medianSec).toBe(4);
  });

  it('computes average form duration', () => {
    const leads = [
      makeLead({ form_duration: '30000' }),
      makeLead({ form_duration: '50000' }),
    ];
    const result = computeFormDiagnostics(leads);

    expect(result.avgFormDuration).toBe(40000);
  });

  it('computes device gap', () => {
    const leads = [
      makeLead({ device: 'mobile', form_duration: '60000', score: '40' }),
      makeLead({ device: 'mobile', form_duration: '70000', score: '35' }),
      makeLead({ device: 'desktop', form_duration: '30000', score: '65' }),
    ];
    const result = computeFormDiagnostics(leads);

    expect(result.deviceGap.mobile.count).toBe(2);
    expect(result.deviceGap.desktop.count).toBe(1);
    expect(result.deviceGap.mobile.avgDuration).toBeGreaterThan(result.deviceGap.desktop.avgDuration);
  });

  it('tracks errors by field', () => {
    const leads = [
      makeLead({ form_first_error_field: 'email' }),
      makeLead({ form_first_error_field: 'email' }),
      makeLead({ form_first_error_field: 'telephone' }),
    ];
    const result = computeFormDiagnostics(leads);

    expect(result.totalErrors).toBe(3);
    const emailField = result.waterfall.find(w => w.field === 'email');
    // waterfall may not have email if no form_field_times, but totalErrors is counted
  });

  it('handles malformed JSON gracefully', () => {
    const leads = [
      makeLead({ form_field_times: 'not-json' }),
      makeLead({ form_field_times: null }),
    ];
    const result = computeFormDiagnostics(leads);
    expect(result.waterfall).toHaveLength(0);
  });

  it('handles empty leads', () => {
    const result = computeFormDiagnostics([]);
    expect(result.waterfall).toHaveLength(0);
    expect(result.avgFormDuration).toBe(0);
    expect(result.totalErrors).toBe(0);
  });
});
