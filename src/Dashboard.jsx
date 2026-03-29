import React, { useState, useMemo, useCallback } from 'react';
import { FACULTY_LABELS } from './config/theme';
import { DEFAULT_API_URL } from './config/api';
import { DATE_PRESETS } from './config/defaults';
import { buildDefaultProgramFinancials } from './config/programs';
import { MARKET_SIZING_DEFAULTS, MARKET_SIZING_STORAGE_KEY } from './config/marketSizing';
import { ThemeProvider, DesignModePicker, useTheme } from './config/ThemeContext';
import { useWordPressData } from './data/useWordPressData';
import { useAdSpendData } from './data/useAdSpendData';
import { useOutcomesData } from './data/useOutcomesData';
import { computeDataQuality } from './processing/dataQuality';
import { Header, Navigation, SettingsPanel, Footer } from './components/layout';
import FinancialSettingsPanel from './components/FinancialSettingsPanel';
import MarketSizingPanel from './components/MarketSizingPanel';
import { LoadingOverlay, ErrorBanner, EmptyState } from './components/ui';
import { daysAgo, filterByDateRange } from './utils/dateHelpers';
import { isUnmappedOutcome } from './config/outcomeMapping';

import ViewStrategie from './views/Strategie';
import ViewAcquisition from './views/Acquisition';
import ViewQualiteLeads from './views/QualiteLeads';
import ViewBudget from './views/Budget';
import ViewAdmissions from './views/Admissions';
import ViewRetention from './views/Retention';

// ═══════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════

const ALL_VIEWS = [
  { id: 'strategie', label: 'Stratégie', icon: '⚡' },
  { id: 'acquisition', label: 'Acquisition', icon: '📈' },
  { id: 'qualite-leads', label: 'Qualité Leads', icon: '⭐' },
  { id: 'admissions', label: 'Admissions', icon: '🎓' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'retention', label: 'Rétention', icon: '🔄' },
  { id: 'parametres', label: 'Paramètres', icon: '⚙️', isSettings: true },
];

function DashboardInner() {
  const { mode, activeEntity, colors } = useTheme();
  const [activeView, setActiveView] = useState('strategie');
  const [datePreset, setDatePreset] = useState('30d');

  const [config, setConfig] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('um6ss_dash_config') || '{}');
      return { wpBaseUrl: saved.wpBaseUrl || DEFAULT_API_URL, wpApiKey: saved.wpApiKey || '' };
    } catch { return { wpBaseUrl: DEFAULT_API_URL, wpApiKey: '' }; }
  });

  // ── Financial settings per faculty (persisted in localStorage) ──
  // Deep merge: preserves user-entered values while adding new fields from defaults
  const [financialSettings, setFinancialSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('um6ss_faculty_financials') || 'null');
      if (!saved) return buildDefaultProgramFinancials();
      const defaults = buildDefaultProgramFinancials();
      const merged = {};
      for (const key of Object.keys(defaults)) {
        merged[key] = { ...defaults[key], ...(saved[key] || {}) };
      }
      return merged;
    } catch { return buildDefaultProgramFinancials(); }
  });

  // ── Market sizing Fermi parameters (separate localStorage key) ──
  const [marketSizingSettings, setMarketSizingSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(MARKET_SIZING_STORAGE_KEY) || 'null');
      return saved ? { ...MARKET_SIZING_DEFAULTS, ...saved } : { ...MARKET_SIZING_DEFAULTS };
    } catch { return { ...MARKET_SIZING_DEFAULTS }; }
  });

  const updateMarketSizingSettings = useCallback((updater) => {
    setMarketSizingSettings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(MARKET_SIZING_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateFinancialSettings = useCallback((updater) => {
    setFinancialSettings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('um6ss_faculty_financials', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateConfig = useCallback((updater) => {
    setConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { sessionStorage.setItem('um6ss_dash_config', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const wp = useWordPressData(config.wpApiKey, config.wpBaseUrl);
  const ads = useAdSpendData(config.wpApiKey, config.wpBaseUrl);
  const outcomes = useOutcomesData(config.wpApiKey, config.wpBaseUrl);

  const refresh = useCallback(() => {
    wp.refresh();
    ads.refresh();
    outcomes.refresh();
  }, [wp.refresh, ads.refresh, outcomes.refresh]);

  const dateRange = useMemo(() => {
    const preset = DATE_PRESETS.find(p => p.key === datePreset);
    if (!preset || !preset.days) return { start: null, end: null };
    return { start: daysAgo(preset.days), end: daysAgo(0) };
  }, [datePreset]);

  const filteredLeads = useMemo(() => {
    let leads = wp.leads;
    if (dateRange.start) leads = filterByDateRange(leads, 'created_at', dateRange.start, dateRange.end);
    if (activeEntity) {
      leads = leads.filter(l => {
        const entity = l.lp_entite || l.entity_code || '';
        const label = FACULTY_LABELS[activeEntity] || '';
        return entity.includes(activeEntity) || entity.toLowerCase().includes(label.toLowerCase());
      });
    }
    return leads;
  }, [wp.leads, dateRange, activeEntity]);

  const filteredAdSpend = useMemo(() => {
    if (!dateRange.start) return ads.spend;
    return filterByDateRange(ads.spend, 'date', dateRange.start, dateRange.end);
  }, [ads.spend, dateRange]);

  const dataQuality = useMemo(() => computeDataQuality(filteredLeads), [filteredLeads]);

  // Detect unmapped outcomes (DSI sent values we don't recognize)
  const unmappedOutcomes = useMemo(() => {
    const unknowns = {};
    wp.leads.forEach(l => {
      if (isUnmappedOutcome(l.outcome)) {
        const val = String(l.outcome).toLowerCase().trim();
        unknowns[val] = (unknowns[val] || 0) + 1;
      }
    });
    return Object.entries(unknowns).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
  }, [wp.leads]);

  const dataLayers = useMemo(() => ({
    leads: wp.leads.length > 0,
    ads: ads.available,
    outcomes: outcomes.available,
    outcomesSource: outcomes.source,
    financialRef: Object.values(financialSettings).some(s => s.annualFees > 0),
  }), [wp.leads.length, ads.available, outcomes.available, outcomes.source, financialSettings]);

  const visibleViews = ALL_VIEWS;

  const safeActiveView = visibleViews.find(v => v.id === activeView) ? activeView : 'strategie';

  const renderView = () => {
    if (wp.loading && !wp.leads.length) return <LoadingOverlay message="Chargement depuis WordPress..." />;
    if (wp.error && !wp.leads.length) return <ErrorBanner error={wp.error} onRetry={refresh} />;
    if (!config.wpApiKey) return <EmptyState icon="🔑" title="Configurez votre connexion" subtitle={'Allez dans l\'onglet ⚙️ Paramètres pour renseigner l\'URL et la clé API WordPress.'} />;
    if (wp.leads.length === 0 && !wp.loading) return <EmptyState icon="📭" title="Aucun lead" subtitle="Vérifiez que votre site WordPress a des leads et que la clé API est correcte." />;

    const viewProps = {
      leads: filteredLeads, visits: wp.visits, abandons: wp.abandons,
      outcomes: wp.outcomes, experiments: wp.experiments,
      outcomesExtended: outcomes.data,
      adSpend: filteredAdSpend, adBreakdowns: ads.breakdowns,
      adVideo: ads.video, dateRange, financialSettings,
      marketSizingSettings,
      dataLayers,
      unmappedOutcomes,
      schema: wp.schema,
    };

    switch (safeActiveView) {
      case 'strategie': return <ViewStrategie {...viewProps} />;
      case 'acquisition': return <ViewAcquisition {...viewProps} />;
      case 'qualite-leads': return <ViewQualiteLeads {...viewProps} />;
      case 'admissions': return <ViewAdmissions {...viewProps} />;
      case 'budget': return <ViewBudget {...viewProps} />;
      case 'retention': return <ViewRetention />;
      default: return <ViewStrategie {...viewProps} />;
    }
  };

  return (
    <div style={{ fontFamily: mode.font, background: mode.bg, minHeight: '100vh', color: colors.dark }}>
      <Header leadsCount={wp.leads.length} adsAvailable={ads.available} dataQualityLevel={dataQuality.level} lastRefresh={wp.lastRefresh || ads.lastRefresh} />
      <Navigation views={visibleViews} activeView={safeActiveView} setActiveView={setActiveView} datePreset={datePreset} setDatePreset={setDatePreset} onRefresh={refresh} isLoading={wp.loading} lastRefresh={wp.lastRefresh || ads.lastRefresh} />
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        {/* Alert: unmapped outcomes from DSI */}
        {unmappedOutcomes.length > 0 && safeActiveView !== 'parametres' && (
          <div style={{ background: '#FEF3E2', border: `1px solid #E8820C`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#E8820C' }}>{unmappedOutcomes.reduce((s, u) => s + u.count, 0)} candidatures avec un statut non reconnu</strong>
              <div style={{ color: '#4A4A6A', marginTop: 2 }}>
                Valeurs : {unmappedOutcomes.slice(0, 5).map(u => `"${u.value}" (${u.count})`).join(', ')}
                {unmappedOutcomes.length > 5 && ` et ${unmappedOutcomes.length - 5} autres`}
                . Ces candidatures sont traitées comme "en attente". Configurez le mapping dans le plugin WordPress.
              </div>
            </div>
          </div>
        )}
        {safeActiveView === 'parametres' ? (
          <>
            <SettingsPanel config={config} setConfig={updateConfig} onRefresh={refresh} lastRefresh={wp.lastRefresh} />
            <FinancialSettingsPanel settings={financialSettings} setSettings={updateFinancialSettings} />
            <MarketSizingPanel settings={marketSizingSettings} setSettings={updateMarketSizingSettings} />
          </>
        ) : renderView()}
      </div>
      <Footer />
      <DesignModePicker />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardInner />
    </ThemeProvider>
  );
}
