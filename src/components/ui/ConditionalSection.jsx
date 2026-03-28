import React from 'react';
import { COLORS } from '../../config/theme';
import { useTheme } from '../../config/ThemeContext';

// ═══════════════════════════════════════════════
// CONDITIONAL SECTION — Data-availability wrapper
// ═══════════════════════════════════════════════

/**
 * Renders children when available=true.
 * Otherwise renders a styled empty state with an actionable message.
 *
 * @param {boolean}   available  - Is the data layer active?
 * @param {string}   [title]     - Section title (always shown)
 * @param {string}    message    - Why it's empty + what to do
 * @param {string}   [icon]      - Icon for the empty state (default: '📊')
 * @param {boolean}  [compact]   - Reduce padding for secondary sections
 * @param {ReactNode} children   - Content shown when available
 */
export function ConditionalSection({ available, title, message, icon = '📊', compact = false, children }) {
  const { colors, cardStyle, accentColor, mode } = useTheme();

  return (
    <div style={{ marginBottom: compact ? 20 : 32 }}>
      {title && (
        <h2 style={{
          fontSize: 16, fontWeight: 700, color: colors.dark,
          margin: '28px 0 16px', fontFamily: mode.font,
          borderBottom: `2px solid ${accentColor}`,
          paddingBottom: 8, display: 'inline-block',
        }}>
          {title}
        </h2>
      )}

      {available ? (
        children
      ) : (
        <div style={{
          ...cardStyle,
          padding: compact ? '14px 18px' : '20px 24px',
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: colors.border,
          background: mode.id === 'funky'
            ? 'rgba(255,255,255,0.02)'
            : COLORS.light,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: accentColor + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {icon}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>
            Données non disponibles
          </div>

          <div style={{
            fontSize: 12, color: colors.medium, maxWidth: 420, lineHeight: 1.6,
          }}>
            {message || 'Cette section sera disponible lorsque les données seront connectées.'}
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: COLORS.warning + '18',
            border: `1px solid ${COLORS.warning}30`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 11, fontWeight: 600, color: COLORS.warning,
          }}>
            ⏳ En attente de données
          </div>
        </div>
      )}
    </div>
  );
}
