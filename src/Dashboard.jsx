import React, { useState, useMemo, useCallback } from 'react';
import { FACULTY_LABELS } from './config/theme';
import { DEFAULT_API_URL } from './config/api';
import { DATE_PRESETS } from './config/defaults';
import { buildDefaultProgramFinancials } from './config/programs';
import { ThemeProvider, DesignModePicker, useTheme } from './config/ThemeContext';
import { useWordPressData } from './data/useWordPressData';
import { useAdSpendData } from './data/useAdSpendData';
import { useOutcomesData } from './data/useOutcomesData';
import { computeDataQuality } from './processing/dataQuality';
import { Header, Navigation, SettingsPanel, Footer } from './components/layout';
import FinancialSettingsPanel from './components/FinancialSettingsPanel';
import { LoadingOverlay, ErrorBanner, EmptyState } from './components/ui';
import { daysAgo, filterByDateRange } from './utils/dateHelpers';

import ViewStrategie from './views/Strategie';
import ViewAcquisition from './views/Acquisition';
import ViewQualiteLeads from './views/QualiteLeads';
import ViewBudget from './views/Budget';

// ═══════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════

const ALL_VIEWS = [
  { id: 'strategie', label: 'Stratégie', icon: '⚡' },
  { id: 'acquisition', label: 'Acquisition', icon: '📈' },
  { id: 'qualite-leads', label: 'Qualité Leads', icon: '⭐' },
  { id: 'budget', label: 'Budget', icon: '💰' },
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
    if (!config.wpApiKey) return <EmptyState icon="🔑" title="Configurez votre connexion" subtitle="Renseignez l'URL et la clé API WordPress ci-dessus." />;
    if (wp.leads.length === 0 && !wp.loading) return <EmptyState icon="📭" title="Aucun lead" subtitle="Vérifiez que votre site WordPress a des leads et que la clé API est correcte." />;

    const viewProps = {
      leads: filteredLeads, visits: wp.visits, abandons: wp.abandons,
      outcomes: wp.outcomes, experiments: wp.experiments,
      outcomesExtended: outcomes.data,
      adSpend: filteredAdSpend, adBreakdowns: ads.breakdowns,
      adVideo: ads.video, dateRange, financialSettings,
      dataLayers,
    };

    switch (safeActiveView) {
      case 'strategie': return <ViewStrategie {...viewProps} />;
      case 'acquisition': return <ViewAcquisition {...viewProps} />;
      case 'qualite-leads': return <ViewQualiteLeads {...viewProps} />;
      case 'budget': return <ViewBudget {...viewProps} />;
      default: return <ViewStrategie {...viewProps} />;
    }
  };

  return (
    <div style={{ fontFamily: mode.font, background: mode.bg, minHeight: '100vh', color: colors.dark }}>
      <Header leadsCount={wp.leads.length} adsAvailable={ads.available} dataQualityLevel={dataQuality.level} lastRefresh={wp.lastRefresh || ads.lastRefresh} />
      <Navigation views={visibleViews} activeView={safeActiveView} setActiveView={setActiveView} datePreset={datePreset} setDatePreset={setDatePreset} />
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        <SettingsPanel config={config} setConfig={updateConfig} onRefresh={refresh} lastRefresh={wp.lastRefresh} />
        <FinancialSettingsPanel settings={financialSettings} setSettings={updateFinancialSettings} />
        {renderView()}
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
