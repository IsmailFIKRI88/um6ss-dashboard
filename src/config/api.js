// ═══════════════════════════════════════════════
// API CONFIG
// ═══════════════════════════════════════════════

export const DEFAULT_API_URL = 'http://candidatureum6ss.local/wp-json/um6ss/v1';
export const API_TIMEOUT = 15000;
export const MAX_PER_PAGE = 500;

export const WP_ENDPOINTS = {
  leads: '/leads',
  visits: '/visits',
  abandons: '/abandons',
  outcomes: '/outcomes',
  experiments: '/experiments',
  schema: '/schema',
};

export const ADS_ENDPOINTS = {
  adSpend: '/ad-spend',
  adBreakdowns: '/ad-breakdowns',
  adVideo: '/ad-video',
  adSchema: '/ad-schema',
};

// Platform ad accounts — keys stored in sessionStorage, sent to WP plugin
// which proxies the platform APIs.
export const AD_PLATFORMS = [
  { id: 'meta', label: 'Meta Ads', icon: '📘', color: '#1877F2', placeholder: 'Access Token ou App Secret' },
  { id: 'google', label: 'Google Ads', icon: '🔍', color: '#4285F4', placeholder: 'API Key / OAuth Token' },
  { id: 'linkedin', label: 'LinkedIn Ads', icon: '💼', color: '#0A66C2', placeholder: 'Access Token' },
  { id: 'tiktok', label: 'TikTok Ads', icon: '🎵', color: '#010101', placeholder: 'Access Token' },
];
