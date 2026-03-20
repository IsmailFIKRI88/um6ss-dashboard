import React, { useState, useMemo, useCallback } from 'react';
import { COLORS } from './config/theme';
import { DEFAULT_API_URL } from './config/api';
import { DATE_PRESETS } from './config/defaults';
import { useWordPressData } from './data/useWordPressData';
import { useAdSpendData } from './data/useAdSpendData';
import { computeDataQuality } from './processing/dataQuality';
import { Header, Navigation, SettingsPanel, Footer } from './components/layout';
import { LoadingOverlay, ErrorBanner, EmptyState } from './components/ui';
import { daysAgo, filterByDateRange } from './utils/dateHelpers';

import ViewSituation from './views/Situation';
import ViewArgent from './views/Argent';
import ViewQualite from './views/Qualite';
import ViewEntites from './views/Entites';

// ═══════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════

const ALL_VIEWS = [
  { id: 'situation', label: 'Situation', icon: '⚡', requiresAds: false },
  { id: 'argent', label: 'Argent', icon: '💰', requiresAds: true },
  { id: 'qualite', label: 'Qualité', icon: '⭐', requiresAds: false },
  { id: 'entites', label: 'Entités', icon: '🏥', requiresAds: false },
];

export default function Dashboard() {
  const [activeView, setActiveView] = useState('situation');
  const [datePreset, setDatePreset] = useState('30d');

  const [config, setConfig] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('um6ss_dash_config') || '{}');
      return { wpBaseUrl: saved.wpBaseUrl || DEFAULT_API_URL, wpApiKey: saved.wpApiKey || '' };
    } catch { return { wpBaseUrl: DEFAULT_API_URL, wpApiKey: '' }; }
  });

  const updateConfig = useCallback((updater) => {
    setConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { sessionStorage.setItem('um6ss_dash_config', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const wp = useWordPressData(config.wpApiKey, config.wpBaseUrl);
  const ads = useAdSpendData(config.wpApiKey, config.wpBaseUrl);

  const refresh = useCallback(() => {
    wp.refresh();
    ads.refresh();
  }, [wp.refresh, ads.refresh]);

  const dateRange = useMemo(() => {
    const preset = DATE_PRESETS.find(p => p.key === datePreset);
    if (!preset || !preset.days) return { start: null, end: null };
    return { start: daysAgo(preset.days), end: daysAgo(0) };
  }, [datePreset]);

  const filteredLeads = useMemo(() => {
    if (!dateRange.start) return wp.leads;
    return filterByDateRange(wp.leads, 'created_at', dateRange.start, dateRange.end);
  }, [wp.leads, dateRange]);

  const filteredAdSpend = useMemo(() => {
    if (!dateRange.start) return ads.spend;
    return filterByDateRange(ads.spend, 'date', dateRange.start, dateRange.end);
  }, [ads.spend, dateRange]);

  // Data quality: 3 levels (ok / warning / error)
  const dataQuality = useMemo(() => computeDataQuality(filteredLeads), [filteredLeads]);

  // Argent view only visible when ads data exists
  const visibleViews = useMemo(() =>
    ALL_VIEWS.filter(v => !v.requiresAds || ads.available)
  , [ads.available]);

  // Fallback if active view is hidden
  const safeActiveView = visibleViews.find(v => v.id === activeView) ? activeView : 'situation';

  const renderView = () => {
    if (wp.loading && !wp.leads.length) return <LoadingOverlay message="Chargement depuis WordPress..." />;
    if (wp.error && !wp.leads.length) return <ErrorBanner error={wp.error} onRetry={refresh} />;
    if (!config.wpApiKey) return <EmptyState icon="🔑" title="Configurez votre connexion" subtitle="Renseignez l'URL et la clé API WordPress ci-dessus." />;
    if (wp.leads.length === 0 && !wp.loading) return <EmptyState icon="📭" title="Aucun lead" subtitle="Vérifiez que votre site WordPress a des leads et que la clé API est correcte." />;

    const viewProps = {
      leads: filteredLeads, visits: wp.visits, abandons: wp.abandons,
      outcomes: wp.outcomes, experiments: wp.experiments,
      adSpend: filteredAdSpend, adBreakdowns: ads.breakdowns,
      adVideo: ads.video, dateRange,
    };

    switch (safeActiveView) {
      case 'situation': return <ViewSituation {...viewProps} />;
      case 'argent': return <ViewArgent {...viewProps} />;
      case 'qualite': return <ViewQualite {...viewProps} />;
      case 'entites': return <ViewEntites {...viewProps} />;
      default: return <ViewSituation {...viewProps} />;
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", background: COLORS.light, minHeight: '100vh' }}>
      <Header leadsCount={wp.leads.length} adsAvailable={ads.available} dataQualityLevel={dataQuality.level} lastRefresh={wp.lastRefresh || ads.lastRefresh} />
      <Navigation views={visibleViews} activeView={safeActiveView} setActiveView={setActiveView} datePreset={datePreset} setDatePreset={setDatePreset} />
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        <SettingsPanel config={config} setConfig={updateConfig} onRefresh={refresh} lastRefresh={wp.lastRefresh} />
        {renderView()}
      </div>
      <Footer />
    </div>
  );
}
