import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { COLORS as BASE_COLORS, FACULTY_COLORS, FACULTY_LABELS } from './theme';

// ═══════════════════════════════════════════════
// DESIGN MODES — 3 palettes
// ═══════════════════════════════════════════════

const DESIGN_MODES = {
  classique: {
    id: 'classique',
    label: 'Classique',
    font: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    cardBorder: `1px solid ${BASE_COLORS.border}`,
    cardShadow: 'none',
    cardRadius: 12,
    tagOpacity: '18',
    tableHeaderBg: BASE_COLORS.primary,
    tableHeaderColor: BASE_COLORS.white,
    tableStripeBg: BASE_COLORS.light,
    navBg: BASE_COLORS.white,
    navBorder: `1px solid ${BASE_COLORS.border}`,
  },
  contemporain: {
    id: 'contemporain',
    label: 'Contemporain',
    font: "'Space Grotesk', 'DM Sans', 'Segoe UI', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    bg: '#FAFAFA',
    cardBg: '#FFFFFF',
    cardBorder: 'none',
    cardShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    cardRadius: 16,
    tagOpacity: '14',
    tableHeaderBg: BASE_COLORS.dark,
    tableHeaderColor: BASE_COLORS.white,
    tableStripeBg: '#F8F8FB',
    navBg: '#FFFFFF',
    navBorder: 'none',
  },
  funky: {
    id: 'funky',
    label: 'Funky',
    font: "'Inter', 'DM Sans', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    bg: '#0F0F1A',
    cardBg: 'rgba(255,255,255,0.04)',
    cardBorder: '1px solid rgba(255,255,255,0.06)',
    cardShadow: '0 0 20px rgba(0,229,255,0.03)',
    cardRadius: 16,
    tagOpacity: '25',
    tableHeaderBg: 'rgba(255,255,255,0.06)',
    tableHeaderColor: '#E0E0FF',
    tableStripeBg: 'rgba(255,255,255,0.02)',
    navBg: 'rgba(255,255,255,0.03)',
    navBorder: '1px solid rgba(255,255,255,0.06)',
    // Override base colors for dark mode
    overrideColors: {
      dark: '#E8E8F0',
      medium: '#8888AA',
      light: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      white: '#0F0F1A',
      primary: '#00E5FF',
      accent: '#FF3D71',
    },
  },
};

// ═══════════════════════════════════════════════
// ENTITY LOGO — SVG from public/logos/ with fallback
// ═══════════════════════════════════════════════

const ENTITY_LOGO_MAP = {
  FM6SIPS: '/logos/FM6SIPS.svg',
  FM6MD: '/logos/FM6MD.svg',
  FM6P: '/logos/FM6MP.svg',
  FM6MV: '/logos/FM6MV.svg',
  ESM6ISS: '/logos/ESM6ISS.svg',
  FM6M: '/logos/FM6M.svg',
  'FM6M-EN': '/logos/FM6M.svg',
};

// SVGs are 1920x1080 — wide format. Render as wide rectangle, no padding.
export const EntityBadge = ({ code, size = 40 }) => {
  const color = FACULTY_COLORS[code] || BASE_COLORS.medium;
  const logoSrc = ENTITY_LOGO_MAP[code];
  const w = Math.round(size * 1.6);
  const h = size;

  if (logoSrc) {
    const base = import.meta.env.BASE_URL || '/';
    return (
      <img
        src={`${base}${logoSrc.replace(/^\//, '')}`}
        alt={code}
        style={{
          width: w, height: h, objectFit: 'contain', flexShrink: 0,
        }}
      />
    );
  }

  // Fallback: initials (EIMSP, ISMBB)
  const initials = code.length > 6 ? code.slice(0, 3) : code.slice(0, 4);
  return (
    <div style={{
      width: h, height: h, borderRadius: 8,
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: h * 0.3, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

// ═══════════════════════════════════════════════
// THEME CONTEXT
// ═══════════════════════════════════════════════

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Design mode — persisted in sessionStorage
  const [designMode, setDesignModeRaw] = useState(() => {
    try { return sessionStorage.getItem('um6ss_design_mode') || 'contemporain'; }
    catch { return 'contemporain'; }
  });

  const setDesignMode = useCallback((mode) => {
    setDesignModeRaw(mode);
    try { sessionStorage.setItem('um6ss_design_mode', mode); } catch {}
  }, []);

  // Active entity filter
  const [activeEntity, setActiveEntity] = useState(null);

  // Resolved design tokens
  const mode = DESIGN_MODES[designMode] || DESIGN_MODES.contemporain;

  // Merge colors: base + funky overrides + entity accent
  const colors = useMemo(() => {
    const base = { ...BASE_COLORS };
    if (mode.overrideColors) Object.assign(base, mode.overrideColors);
    // Entity accent: replace primary with entity color
    if (activeEntity && FACULTY_COLORS[activeEntity]) {
      base.accent = FACULTY_COLORS[activeEntity];
    }
    return base;
  }, [mode, activeEntity]);

  // The entity-aware accent color (for KPI borders, section titles, chart bars)
  const accentColor = activeEntity && FACULTY_COLORS[activeEntity]
    ? FACULTY_COLORS[activeEntity]
    : colors.primary;

  const value = useMemo(() => ({
    // Design mode
    designMode,
    setDesignMode,
    mode,
    // Entity
    activeEntity,
    setActiveEntity,
    entityColor: accentColor,
    entityName: activeEntity ? (FACULTY_LABELS[activeEntity] || activeEntity) : null,
    // Resolved
    colors,
    accentColor,
    // Helpers for card styling
    cardStyle: {
      background: mode.cardBg,
      borderRadius: mode.cardRadius,
      border: mode.cardBorder,
      boxShadow: mode.cardShadow,
    },
  }), [designMode, setDesignMode, mode, activeEntity, accentColor, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// ═══════════════════════════════════════════════
// DESIGN MODE PICKER (floating button)
// ═══════════════════════════════════════════════

export function DesignModePicker() {
  const { designMode, setDesignMode, colors, mode } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const modes = Object.values(DESIGN_MODES);

  return (
    <div
      style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setOpen(false); }}
    >
      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 48, right: 0, minWidth: 160,
          background: designMode === 'funky' ? '#1A1A2E' : '#FFFFFF',
          borderRadius: 12, padding: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.border}`,
        }}>
          {modes.map(m => (
            <button key={m.id} onClick={() => { setDesignMode(m.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: designMode === m.id ? (colors.primary + '18') : 'transparent',
                color: colors.dark, fontSize: 12, fontWeight: designMode === m.id ? 700 : 500,
                fontFamily: mode.font, textAlign: 'left',
              }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4, border: `2px solid ${colors.border}`,
                background: designMode === m.id ? colors.primary : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#FFF', flexShrink: 0,
              }}>
                {designMode === m.id ? '✓' : ''}
              </span>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: designMode === 'funky' ? 'rgba(255,255,255,0.08)' : 'rgba(46,41,128,0.08)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: hovered || open ? 1 : 0.3,
          transform: open ? 'rotate(30deg)' : 'rotate(0deg)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        title="Changer le design"
      >
        🎨
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ENTITY FILTER DROPDOWN (for header)
// ═══════════════════════════════════════════════

export function EntityFilter() {
  const { activeEntity, setActiveEntity, colors, mode } = useTheme();
  const [open, setOpen] = React.useState(false);

  const entities = Object.entries(FACULTY_LABELS).map(([code, name]) => ({
    code, name, color: FACULTY_COLORS[code] || BASE_COLORS.medium,
  }));

  const current = activeEntity
    ? entities.find(e => e.code === activeEntity)
    : null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
          background: 'rgba(255,255,255,0.12)', border: 'none',
          color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600,
          fontFamily: mode.font,
        }}
      >
        {current ? (
          <>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: current.color }} />
            {current.name}
          </>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>🏥</span>
            Toutes les entités
          </>
        )}
        <span style={{ fontSize: 9, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6, minWidth: 260,
          background: mode.id === 'funky' ? '#1A1A2E' : '#FFFFFF',
          borderRadius: 12, padding: 6,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 100,
          border: `1px solid ${colors.border}`,
        }}>
          {/* All entities */}
          <button
            onClick={() => { setActiveEntity(null); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: !activeEntity ? (colors.primary + '14') : 'transparent',
              color: colors.dark, fontSize: 11, fontWeight: !activeEntity ? 700 : 500,
              fontFamily: mode.font, textAlign: 'left',
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 10, background: BASE_COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#FFF', flexShrink: 0 }}>*</div>
            Toutes les entités
          </button>

          {entities.map(e => (
            <button key={e.code}
              onClick={() => { setActiveEntity(e.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: activeEntity === e.code ? (e.color + '14') : 'transparent',
                color: colors.dark, fontSize: 11, fontWeight: activeEntity === e.code ? 700 : 500,
                fontFamily: mode.font, textAlign: 'left',
              }}
            >
              <EntityBadge code={e.code} size={20} />
              {e.name}
              <span style={{ marginLeft: 'auto', fontSize: 9, color: colors.medium }}>{e.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
