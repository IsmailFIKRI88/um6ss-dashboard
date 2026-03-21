import React from 'react';
import { COLORS } from '../../config/theme';
import { useTheme, EntityFilter, EntityBadge } from '../../config/ThemeContext';
import { ConfidenceScore } from '../ui';
import { DATE_PRESETS } from '../../config/defaults';
import { AD_PLATFORMS } from '../../config/api';

// ═══════════════════════════════════════════════
// LAYOUT — Header, Navigation, Settings, Footer
// ═══════════════════════════════════════════════

export const Header = ({ leadsCount, adsAvailable, dataQualityLevel, lastRefresh }) => {
  const { accentColor, activeEntity, entityName, mode, setActiveEntity } = useTheme();
  const gradientStart = activeEntity ? accentColor : COLORS.primary;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${gradientStart} 0%, ${COLORS.dark} 100%)`,
      padding: '14px 24px', boxShadow: '0 2px 12px rgba(46,41,128,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {activeEntity ? (
            <EntityBadge code={activeEntity} size={38} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
          )}
          <div>
            <div style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, letterSpacing: -0.3, fontFamily: mode.font }}>
              {activeEntity ? entityName : 'UM6SS — Campagne Acquisition 2026'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              {activeEntity ? (
                <>
                  <span>{activeEntity}</span>
                  <span style={{ margin: '0 6px' }}>·</span>
                  <button onClick={() => setActiveEntity(null)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: 'rgba(255,255,255,0.7)', fontSize: 11, textDecoration: 'underline',
                    fontFamily: mode.font,
                  }}>Toutes les entités</button>
                </>
              ) : (
                <>
                  Dashboard de pilotage
                  {leadsCount > 0 && ` · ${leadsCount.toLocaleString('fr-FR')} leads`}
                  {adsAvailable && ' · Ads connectées'}
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EntityFilter />
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
};

export const Navigation = ({ views, activeView, setActiveView, datePreset, setDatePreset }) => {
  const { mode, accentColor, colors } = useTheme();

  return (
    <div style={{
      background: mode.navBg, borderBottom: mode.navBorder,
      padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: mode.id === 'contemporain' ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
    }}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {views.map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeView === v.id ? 700 : 500,
            color: activeView === v.id ? accentColor : colors.medium,
            borderBottom: activeView === v.id ? `3px solid ${accentColor}` : '3px solid transparent',
            transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: mode.font,
          }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {DATE_PRESETS.map(p => (
          <button key={p.key} onClick={() => setDatePreset(p.key)} style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${datePreset === p.key ? accentColor : colors.border}`,
            background: datePreset === p.key ? accentColor : (mode.id === 'funky' ? 'transparent' : '#FFFFFF'),
            color: datePreset === p.key ? '#FFFFFF' : colors.medium,
            fontFamily: mode.font,
          }}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const SettingsPanel = ({ config, setConfig, onRefresh, lastRefresh }) => {
  const [show, setShow] = React.useState(!config.wpApiKey);
  const [showPlatforms, setShowPlatforms] = React.useState(false);
  const { mode, colors, cardStyle, accentColor } = useTheme();

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 6,
    border: `1px solid ${colors.border}`, fontSize: 12,
    fontFamily: mode.fontMono, boxSizing: 'border-box',
    background: mode.id === 'funky' ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
    color: colors.dark,
  };

  const labelStyle = { fontSize: 11, fontWeight: 600, color: colors.medium, display: 'block', marginBottom: 4 };

  if (!show) return (
    <button onClick={() => setShow(true)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, background: mode.cardBg, fontSize: 11, cursor: 'pointer', color: colors.medium, marginBottom: 16, fontFamily: mode.font }}>
      ⚙️ Configuration API
    </button>
  );

  const platformKeys = config.platformKeys || {};
  const connectedCount = AD_PLATFORMS.filter(p => platformKeys[p.id]).length;

  return (
    <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, fontFamily: mode.font }}>⚙️ Configuration API</div>
        <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: colors.medium }}>✕</button>
      </div>

      {/* WordPress connection */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 300px' }}>
          <label style={labelStyle}>URL API WordPress</label>
          <input type="text" value={config.wpBaseUrl || ''} onChange={e => setConfig(c => ({ ...c, wpBaseUrl: e.target.value }))}
            placeholder="http://candidatureum6ss.local/wp-json/um6ss/v1"
            style={inputStyle} />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <label style={labelStyle}>Clé API (X-UM6SS-API-Key)</label>
          <input type="password" value={config.wpApiKey || ''} onChange={e => setConfig(c => ({ ...c, wpApiKey: e.target.value }))}
            placeholder="Clé API 64 caractères"
            style={inputStyle} />
        </div>
        <button onClick={onRefresh} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: accentColor, color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', height: 36, fontFamily: mode.font }}>
          🔄 Connecter
        </button>
      </div>
      {lastRefresh && <div style={{ fontSize: 11, color: colors.medium, marginTop: 8 }}>Dernière sync : {lastRefresh.toLocaleTimeString('fr-FR')}</div>}

      {/* Platform API keys — collapsible */}
      <div style={{ marginTop: 16, borderTop: `1px solid ${colors.border}`, paddingTop: 14 }}>
        <button onClick={() => setShowPlatforms(!showPlatforms)} style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: mode.font,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>Plateformes Ads</span>
          <span style={{ fontSize: 10, color: colors.medium }}>
            {connectedCount > 0 ? `${connectedCount}/${AD_PLATFORMS.length} connectées` : 'non configurées'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: colors.medium }}>{showPlatforms ? '▲' : '▼'}</span>
        </button>

        {/* Status dots */}
        {!showPlatforms && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {AD_PLATFORMS.map(p => (
              <div key={p.id} title={`${p.label}: ${platformKeys[p.id] ? 'Connectée' : 'Non configurée'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: colors.medium }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: platformKeys[p.id] ? p.color : colors.border }} />
                {p.label}
              </div>
            ))}
          </div>
        )}

        {showPlatforms && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {AD_PLATFORMS.map(p => {
              const hasKey = !!platformKeys[p.id];
              return (
                <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 auto' }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasKey ? p.color : colors.border }} />
                      <span>{p.icon} {p.label}</span>
                      {hasKey && <span style={{ fontSize: 9, color: p.color, fontWeight: 700 }}>CONNECTÉE</span>}
                    </label>
                    <input
                      type="password"
                      value={platformKeys[p.id] || ''}
                      onChange={e => setConfig(c => ({
                        ...c,
                        platformKeys: { ...(c.platformKeys || {}), [p.id]: e.target.value },
                      }))}
                      placeholder={p.placeholder}
                      style={{ ...inputStyle, borderLeft: `3px solid ${hasKey ? p.color : colors.border}` }}
                    />
                  </div>
                  {hasKey && (
                    <button onClick={() => setConfig(c => {
                      const keys = { ...(c.platformKeys || {}) };
                      delete keys[p.id];
                      return { ...c, platformKeys: keys };
                    })} style={{
                      padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`,
                      background: 'none', fontSize: 10, cursor: 'pointer', color: colors.bad,
                      fontWeight: 600, height: 36, whiteSpace: 'nowrap', fontFamily: mode.font,
                    }}>
                      Retirer
                    </button>
                  )}
                </div>
              );
            })}
            <div style={{ fontSize: 10, color: colors.medium, fontStyle: 'italic', marginTop: 4 }}>
              Les clés sont envoyées au plugin WordPress qui sert de proxy vers les APIs plateformes. Elles sont stockées en session uniquement (pas de persistance serveur depuis ce dashboard).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Footer = () => {
  const { colors, mode } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: '20px 24px', color: colors.medium, fontSize: 10, borderTop: `1px solid ${colors.border}`, fontFamily: mode.font }}>
      Département Communication Stratégique & Institutionnelle · Université Mohammed VI des Sciences de la Santé · v1.1
    </div>
  );
};
