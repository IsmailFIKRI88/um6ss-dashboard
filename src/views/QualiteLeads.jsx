import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SCORE_LABELS, CHANNEL_COLORS, CHANNEL_LABELS, FACULTY_LABELS, FACULTY_COLORS } from '../config/theme';
import { QUALIFIED_SCORE_MIN } from '../config/defaults';
import { useTheme } from '../config/ThemeContext';
import { KPICard, SectionTitle, AlertBadge, DataTable } from '../components/ui';
import { CustomTooltip } from '../components/charts';
import { computeFormDiagnostics } from '../processing/formDiagnostics';
import { fmt } from '../utils/formatters';
import { extractEntityCode } from '../utils/extractEntity';

export default function ViewQualiteLeads({ leads, adSpend, abandons, outcomes, dateRange }) {
  const { colors, cardStyle, accentColor, mode } = useTheme();
  const [showWaterfall, setShowWaterfall] = useState(false);
  const totalLeads = leads.length;
  const enrolled = leads.filter(l => l.outcome === 'enrolled' || l.outcome === 'inscrit').length;
  const totalSpend = adSpend.reduce((s, r) => s + (r.spend || 0), 0);

  // ── Form diagnostics ──
  const formDiag = useMemo(() => computeFormDiagnostics(leads), [leads]);

  // ── Contact delay ──
  const contactDelay = useMemo(() => {
    const delays = leads
      .filter(l => l.outcome_updated_at && l.created_at && l.outcome !== 'pending')
      .map(l => Math.round((new Date(l.outcome_updated_at) - new Date(l.created_at)) / 3600000));
    return delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null;
  }, [leads]);

  // ── Hot leads ──
  const hotNotContactedCount = useMemo(() =>
    leads.filter(l => Number(l.score) >= 70 && (l.outcome === 'pending' || !l.outcome)).length
  , [leads]);

  // ── Device gap alert ──
  const deviceGapAlert = useMemo(() => {
    const gap = Math.abs(formDiag.deviceGap.mobile.avgScore - formDiag.deviceGap.desktop.avgScore);
    return gap > 15 ? gap : null;
  }, [formDiag]);

  // ── Scoring buckets ──
  const scoringBuckets = useMemo(() => {
    const buckets = Object.entries(SCORE_LABELS)
      .sort(([, a], [, b]) => b.min - a.min)
      .map(([label, cfg]) => ({ label, color: cfg.color, min: cfg.min, count: 0 }));
    leads.forEach(l => {
      const score = Number(l.score) || 0;
      for (const bucket of buckets) {
        if (score >= bucket.min) { bucket.count++; break; }
      }
    });
    return buckets.reverse();
  }, [leads]);

  // ── CPL par bucket ──
  const cplByBucket = useMemo(() => {
    if (totalSpend === 0 || totalLeads === 0) return scoringBuckets;
    const avgCpl = totalSpend / totalLeads;
    return scoringBuckets.map(b => ({
      ...b,
      cpl: b.count > 0 ? Math.round(avgCpl) : null,
      totalCost: b.count > 0 ? Math.round(avgCpl * b.count) : 0,
    }));
  }, [scoringBuckets, totalSpend, totalLeads]);

  // ── Qualité par canal ──
  const qualityByChannel = useMemo(() => {
    const byChannel = {};
    leads.forEach(l => {
      const ch = l.channel_group || l._attributed_channel || 'direct';
      const key = ch.toLowerCase();
      if (!byChannel[key]) byChannel[key] = { channel: key, count: 0, scores: [], qualified: 0, enrolled: 0 };
      byChannel[key].count++;
      byChannel[key].scores.push(Number(l.score) || 0);
      if (Number(l.score) >= QUALIFIED_SCORE_MIN) byChannel[key].qualified++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byChannel[key].enrolled++;
    });
    return Object.values(byChannel).map(ch => ({
      ...ch,
      avgScore: ch.scores.length > 0 ? Math.round(ch.scores.reduce((a, b) => a + b, 0) / ch.scores.length) : 0,
      qualifiedPct: ch.count > 0 ? Math.round(ch.qualified / ch.count * 100) : 0,
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [leads]);

  // ── Géographie ──
  const geoData = useMemo(() => {
    const byCountry = {};
    const byCity = {};
    let hasGeo = false;
    leads.forEach(l => {
      const cc = l.geo_country_code || '';
      const country = l.geo_country || cc;
      const city = l.geo_city || '';
      if (!cc) return;
      hasGeo = true;
      if (!byCountry[cc]) byCountry[cc] = { code: cc, country, count: 0, qualified: 0, avgScores: [] };
      byCountry[cc].count++;
      if (Number(l.score) >= QUALIFIED_SCORE_MIN) byCountry[cc].qualified++;
      byCountry[cc].avgScores.push(Number(l.score) || 0);
      if (city) {
        const cityKey = `${city}|${cc}`;
        if (!byCity[cityKey]) byCity[cityKey] = { city, country, code: cc, count: 0, qualified: 0 };
        byCity[cityKey].count++;
        if (Number(l.score) >= QUALIFIED_SCORE_MIN) byCity[cityKey].qualified++;
      }
    });
    const countries = Object.values(byCountry).map(c => ({
      ...c,
      avgScore: c.avgScores.length > 0 ? Math.round(c.avgScores.reduce((a, b) => a + b, 0) / c.avgScores.length) : 0,
    })).sort((a, b) => b.count - a.count);
    const cities = Object.values(byCity).sort((a, b) => b.count - a.count).slice(0, 15);
    return { hasGeo, countries, cities };
  }, [leads]);

  // ── Taux conversion par entité ──
  const conversionByEntity = useMemo(() => {
    const byEntity = {};
    leads.forEach(l => {
      const code = extractEntityCode(l);
      if (!byEntity[code]) byEntity[code] = { code, leads: 0, enrolled: 0, scores: [] };
      byEntity[code].leads++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byEntity[code].enrolled++;
      byEntity[code].scores.push(Number(l.score) || 0);
    });
    return Object.values(byEntity).map(e => ({
      ...e,
      name: FACULTY_LABELS[e.code] || e.code,
      color: FACULTY_COLORS[e.code] || colors.medium,
      convRate: e.leads > 0 ? ((e.enrolled / e.leads) * 100).toFixed(1) : '0.0',
      avgScore: e.scores.length > 0 ? Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length) : 0,
    })).sort((a, b) => b.leads - a.leads);
  }, [leads, colors.medium]);

  // ── Taux conversion par programme ──
  const conversionByProgramme = useMemo(() => {
    const byProg = {};
    leads.forEach(l => {
      const prog = l.programme_label || l.programme_id || 'Non spécifié';
      if (!byProg[prog]) byProg[prog] = { programme: prog, leads: 0, enrolled: 0 };
      byProg[prog].leads++;
      if (l.outcome === 'enrolled' || l.outcome === 'inscrit') byProg[prog].enrolled++;
    });
    return Object.values(byProg).map(p => ({
      ...p,
      convRate: p.leads > 0 ? ((p.enrolled / p.leads) * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.leads - a.leads);
  }, [leads]);

  // ── Volume leads par semaine ──
  const weeklyVolume = useMemo(() => {
    const byWeek = {};
    leads.forEach(l => {
      const d = new Date(l.created_at);
      if (isNaN(d)) return;
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      const weekKey = monday.toISOString().split('T')[0];
      if (!byWeek[weekKey]) byWeek[weekKey] = 0;
      byWeek[weekKey]++;
    });
    const weeks = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, weekLabel: fmt.dateShort(week), leads: count }));
    return weeks.map((w, i) => {
      const slice = weeks.slice(Math.max(0, i - 2), i + 1);
      const ma = Math.round(slice.reduce((s, x) => s + x.leads, 0) / slice.length);
      return { ...w, tendance: ma };
    });
  }, [leads]);

  // ── Conversion cycle ──
  const cycleData = useMemo(() => {
    const buckets = { '0j': 0, '1-2j': 0, '3-7j': 0, '8-14j': 0, '15-30j': 0, '30j+': 0 };
    leads.forEach(l => {
      const d = Number(l.days_to_convert) || 0;
      if (d === 0) buckets['0j']++;
      else if (d <= 2) buckets['1-2j']++;
      else if (d <= 7) buckets['3-7j']++;
      else if (d <= 14) buckets['8-14j']++;
      else if (d <= 30) buckets['15-30j']++;
      else buckets['30j+']++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [leads]);

  // ── Table columns ──
  const channelColumns = [
    { key: 'channel', label: 'Canal', render: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHANNEL_COLORS[v] || colors.medium, flexShrink: 0 }} />
        <strong style={{ textTransform: 'capitalize' }}>{CHANNEL_LABELS[v] || v}</strong>
      </div>
    )},
    { key: 'count', label: 'Leads', align: 'center', style: () => ({ fontWeight: 700 }) },
    { key: 'avgScore', label: 'Score Moy.', align: 'center', render: v => (
      <span style={{ color: v >= 60 ? colors.good : v >= 40 ? colors.warning : colors.bad, fontWeight: 600 }}>{v}</span>
    )},
    { key: 'qualifiedPct', label: '% Qualifiés', align: 'center', render: v => `${v}%` },
    { key: 'qualified', label: 'Qualifiés', align: 'center', style: () => ({ color: colors.good }) },
    { key: 'enrolled', label: 'Inscrits', align: 'center', style: () => ({ color: accentColor, fontWeight: 700 }) },
  ];

  const entityColumns = [
    { key: 'name', label: 'Entité', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 3, background: row.color, flexShrink: 0 }} />
        <strong>{v}</strong>
      </div>
    )},
    { key: 'leads', label: 'Leads', align: 'center' },
    { key: 'enrolled', label: 'Inscrits', align: 'center', style: () => ({ color: accentColor, fontWeight: 700 }) },
    { key: 'convRate', label: 'Taux Conv.', align: 'center', render: (v) => (
      <span style={{ fontWeight: 600, color: parseFloat(v) > 0 ? colors.good : colors.medium }}>{v}%</span>
    )},
    { key: 'avgScore', label: 'Score Moy.', align: 'center', render: v => (
      <span style={{ color: v >= 60 ? colors.good : v >= 40 ? colors.warning : colors.bad, fontWeight: 600 }}>{v}</span>
    )},
  ];

  const cityColumns = [
    { key: 'city', label: 'Ville', render: (v, row) => <strong>{v}</strong> },
    { key: 'country', label: 'Pays' },
    { key: 'count', label: 'Leads', align: 'center', style: () => ({ fontWeight: 700 }) },
    { key: 'qualified', label: 'Qualifiés', align: 'center', style: () => ({ color: colors.good }) },
  ];

  const progColumns = [
    { key: 'programme', label: 'Programme' },
    { key: 'leads', label: 'Leads', align: 'center' },
    { key: 'enrolled', label: 'Inscrits', align: 'center', style: () => ({ color: accentColor, fontWeight: 700 }) },
    { key: 'convRate', label: 'Taux Conv.', align: 'center', render: (v) => (
      <span style={{ fontWeight: 600, color: parseFloat(v) > 0 ? colors.good : colors.medium }}>{v}%</span>
    )},
  ];

  return (
    <div>
      {/* Top KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPICard small label="Leads Total" value={fmt.number(totalLeads)} />
        <KPICard small label="Taux Conversion" value={totalLeads > 0 ? fmt.pct(enrolled / totalLeads * 100) : '—'}
          sub={`${enrolled} inscrits`} color={enrolled > 0 ? colors.good : colors.medium}
          tooltip="Lead → inscrit (nécessite outcomes DSI)" />
        <KPICard small label="Délai 1er Contact" value={contactDelay ? `${contactDelay}h` : '—'}
          color={contactDelay && contactDelay > 48 ? colors.bad : colors.good}
          tooltip="Temps moyen soumission → premier contact" />
        <KPICard small label="Chauds en attente" value={hotNotContactedCount}
          color={hotNotContactedCount > 10 ? colors.bad : hotNotContactedCount > 0 ? colors.warning : colors.good}
          tooltip="Leads score ≥70 avec outcome = pending" />
      </div>

      {/* Device gap alert */}
      {deviceGapAlert && (
        <div style={{ marginBottom: 16 }}>
          <AlertBadge level={1} text={`Gap mobile/desktop : ${deviceGapAlert} pts de score (mobile: ${formDiag.deviceGap.mobile.avgScore}, desktop: ${formDiag.deviceGap.desktop.avgScore})`} />
        </div>
      )}

      {/* ── Répartition par bucket de scoring ── */}
      <SectionTitle>Répartition des Leads par Score</SectionTitle>
      <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
        {totalLeads > 0 ? (
          <>
            {cplByBucket.map(bucket => {
              const pct = totalLeads > 0 ? (bucket.count / totalLeads * 100) : 0;
              return (
                <div key={bucket.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: bucket.color, minWidth: 100 }}>{bucket.label}</span>
                    <span style={{ color: colors.medium, fontSize: 11 }}>
                      {fmt.number(bucket.count)} ({fmt.pct(pct, 0)})
                      {bucket.cpl != null && <span style={{ marginLeft: 8, color: colors.dark }}>· CPL ~ {fmt.mad(bucket.cpl)}</span>}
                    </span>
                  </div>
                  <div style={{ height: 22, background: colors.light, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, background: bucket.color,
                      borderRadius: 6, transition: 'width 0.6s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: pct > 8 ? 8 : 0,
                    }}>
                      {pct > 8 && <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 600 }}>{fmt.pct(pct, 0)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 10, color: colors.medium, marginTop: 12, fontStyle: 'italic' }}>
              CPL approximatif : spend total réparti uniformément. Le CPL réel par bucket nécessite l'attribution lead-level.
            </div>
          </>
        ) : (
          <div style={{ color: colors.medium, fontSize: 12, textAlign: 'center', padding: 30 }}>Aucun lead</div>
        )}
      </div>

      {/* ── Qualité par canal ── */}
      <DataTable columns={channelColumns} data={qualityByChannel} title="Qualité par Canal — Score moyen et % qualifiés" exportFilename="qualite_canal.csv" />

      {/* ── Origine géographique (conditionnel — affiché uniquement si geo_country_code renseigné) ── */}
      {geoData.hasGeo && (
        <>
          <SectionTitle>Origine Géographique</SectionTitle>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
            {/* Top pays — barres horizontales */}
            <div style={{ ...cardStyle, flex: '1 1 350px', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 14 }}>Top Pays</div>
              {geoData.countries.slice(0, 10).map(c => {
                const maxCount = geoData.countries[0]?.count || 1;
                const pct = (c.count / maxCount) * 100;
                return (
                  <div key={c.code} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>
                        {c.country || c.code} <span style={{ color: colors.medium, fontWeight: 400 }}>{c.code}</span>
                      </span>
                      <span style={{ color: colors.medium }}>
                        {c.count} leads · score {c.avgScore}
                      </span>
                    </div>
                    <div style={{ height: 6, background: colors.light, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top villes — table compacte */}
            {geoData.cities.length > 0 && (
              <div style={{ flex: '1 1 300px' }}>
                <DataTable columns={cityColumns} data={geoData.cities} title="Top Villes" exportFilename="geo_villes.csv" />
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Taux conversion par entité ── */}
      <DataTable columns={entityColumns} data={conversionByEntity} title="Conversion Lead → Inscrit par Entité" exportFilename="conversion_entite.csv" />

      {/* ── Taux conversion par programme ── */}
      {conversionByProgramme.length > 0 && enrolled > 0 && (
        <DataTable columns={progColumns} data={conversionByProgramme.slice(0, 25)} title={`Conversion par Programme (top ${Math.min(25, conversionByProgramme.length)})`} exportFilename="conversion_programme.csv" />
      )}

      {/* ── Volume leads par semaine ── */}
      {weeklyVolume.length > 1 && (
        <>
          <SectionTitle>Volume Leads par Semaine</SectionTitle>
          <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyVolume}>
                <defs>
                  <linearGradient id="gradWeeklyQL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 9, fill: colors.medium }} />
                <YAxis tick={{ fontSize: 10, fill: colors.medium }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads" stroke={accentColor} strokeWidth={2} fill="url(#gradWeeklyQL)" name="Leads" />
                <Area type="monotone" dataKey="tendance" stroke={colors.warning} strokeWidth={1.5} strokeDasharray="5 3" fill="none" name="Tendance (moy. 3 sem.)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Cycle de conversion + Mobile vs Desktop ── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ ...cardStyle, flex: '1 1 400px', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>Cycle de conversion (days_to_convert)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cycleData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.medium }} />
              <YAxis tick={{ fontSize: 10, fill: colors.medium }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={accentColor} radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, flex: '0 1 250px', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>Mobile vs Desktop</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {['mobile', 'desktop'].map(dev => {
              const d = formDiag.deviceGap[dev];
              return (
                <div key={dev} style={{ flex: 1, background: colors.light, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.medium, textTransform: 'capitalize' }}>{dev}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: colors.dark, margin: '4px 0' }}>{d.avgScore}</div>
                  <div style={{ fontSize: 10, color: colors.medium }}>score moy.</div>
                  <div style={{ fontSize: 10, color: colors.medium, marginTop: 4 }}>{d.count} leads · {d.avgDuration}s form</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Friction formulaire — collapsible ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <button onClick={() => setShowWaterfall(!showWaterfall)} style={{
          width: '100%', padding: '14px 20px', border: 'none', background: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          fontFamily: mode.font,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>
            Friction Formulaire (temps médian par champ)
          </span>
          <span style={{ fontSize: 14, color: colors.medium }}>{showWaterfall ? '▲' : '▼'}</span>
        </button>
        {showWaterfall && (
          <div style={{ padding: '0 20px 20px' }}>
            {formDiag.waterfall.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(150, formDiag.waterfall.length * 36)}>
                <BarChart data={formDiag.waterfall} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: colors.medium }} unit="s" />
                  <YAxis dataKey="field" type="category" tick={{ fontSize: 11, fill: colors.dark, fontWeight: 600 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="medianSec" fill={colors.warning} radius={[0, 4, 4, 0]} name="Temps médian (s)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: colors.medium, fontSize: 12, textAlign: 'center', padding: 20 }}>
                Aucune donnée form_field_times disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
