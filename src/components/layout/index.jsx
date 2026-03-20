import React from 'react';
import { COLORS } from '../../config/theme';
import { ConfidenceScore } from '../ui';
import { DATE_PRESETS } from '../../config/defaults';

// ═══════════════════════════════════════════════
// LAYOUT — Header, Navigation, Settings, Footer
// ═══════════════════════════════════════════════

export const Header = ({ leadsCount, adsAvailable, dataQualityLevel, lastRefresh }) => (
  <div style={{
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.dark} 100%)`,
    padding: '14px 24px', boxShadow: '0 2px 12px rgba(46,41,128,0.3)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
        <div>
          <div style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>UM6SS — Campagne Acquisition 2026</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
            Dashboard de pilotage
            {leadsCount > 0 && ` · ${leadsCount.toLocaleString('fr-FR')} leads`}
            {adsAvailable && ' · Ads connectées'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {dataQualityLevel && dataQualityLevel !== 'ok' && <ConfidenceScore level={dataQualityLevel} />}
        <div style={{ display: 'flex', gap: 4 }}>
          <div title="WordPress" style={{ width: 8, height: 8, borderRadius: '50%', background: leadsCount > 0 ? COLORS.good : COLORS.medium }} />
          <div title="Ads" style={{ width: 8, height: 8, borderRadius: '50%', background: adsAvailable ? COLORS.good : COLORS.medium }} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
          {lastRefresh ? lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
    </div>
  </div>
);

export const Navigation = ({ views, activeView, setActiveView, datePreset, setDatePreset }) => (
  <div style={{
    background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`,
    padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
      {views.map(v => (
        <button key={v.id} onClick={() => setActiveView(v.id)} style={{
          padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: activeView === v.id ? 700 : 500,
          color: activeView === v.id ? COLORS.primary : COLORS.medium,
          borderBottom: activeView === v.id ? `3px solid ${COLORS.primary}` : '3px solid transparent',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}>
          {v.icon} {v.label}
        </button>
      ))}
    </div>
    {/* Date preset selector */}
    <div style={{ display: 'flex', gap: 4 }}>
      {DATE_PRESETS.map(p => (
        <button key={p.key} onClick={() => setDatePreset(p.key)} style={{
          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${datePreset === p.key ? COLORS.primary : COLORS.border}`,
          background: datePreset === p.key ? COLORS.primary : COLORS.white,
          color: datePreset === p.key ? COLORS.white : COLORS.medium,
        }}>
          {p.label}
        </button>
      ))}
    </div>
  </div>
);

export const SettingsPanel = ({ config, setConfig, onRefresh, lastRefresh }) => {
  const [show, setShow] = React.useState(!config.wpApiKey);
  if (!show) return (
    <button onClick={() => setShow(true)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 11, cursor: 'pointer', color: COLORS.medium, marginBottom: 16 }}>
      ⚙️ Configuration API
    </button>
  );

  return (
    <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark }}>⚙️ Configuration API</div>
        <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: COLORS.medium }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.medium, display: 'block', marginBottom: 4 }}>URL API WordPress</label>
          <input type="text" value={config.wpBaseUrl || ''} onChange={e => setConfig(c => ({ ...c, wpBaseUrl: e.target.value }))}
            placeholder="http://candidatureum6ss.local/wp-json/um6ss/v1"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.medium, display: 'block', marginBottom: 4 }}>Clé API (X-UM6SS-API-Key)</label>
          <input type="password" value={config.wpApiKey || ''} onChange={e => setConfig(c => ({ ...c, wpApiKey: e.target.value }))}
            placeholder="Clé API 64 caractères"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }} />
        </div>
        <button onClick={onRefresh} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: COLORS.primary, color: COLORS.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', height: 36 }}>
          🔄 Connecter
        </button>
      </div>
      {lastRefresh && <div style={{ fontSize: 11, color: COLORS.medium, marginTop: 8 }}>Dernière sync : {lastRefresh.toLocaleTimeString('fr-FR')}</div>}
    </div>
  );
};

export const Footer = () => (
  <div style={{ textAlign: 'center', padding: '20px 24px', color: COLORS.medium, fontSize: 10, borderTop: `1px solid ${COLORS.border}` }}>
    Département Communication Stratégique & Institutionnelle · Université Mohammed VI des Sciences de la Santé · v1.0
  </div>
);
