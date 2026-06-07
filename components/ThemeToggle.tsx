'use client';

import { useTheme } from '@/lib/theme';

type Theme = 'dark' | 'light' | 'darker';

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: 'light',  label: 'Light',  icon: '☀️' },
  { value: 'dark',   label: 'Dark',   icon: '🌙' },
  { value: 'darker', label: 'Darker', icon: '⬛' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ padding: '0 12px', marginBottom: 12 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 8, paddingLeft: 4,
      }}>
        Theme
      </div>
      <div style={{
        display: 'flex',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}>
        {THEMES.map(t => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            title={t.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '6px 4px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: theme === t.value
                ? 'var(--bg-card)'
                : 'transparent',
              boxShadow: theme === t.value
                ? '0 1px 4px rgba(0,0,0,0.3)'
                : 'none',
            }}
          >
            <span style={{ fontSize: 13 }}>{t.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.04em',
              color: theme === t.value
                ? 'var(--accent)'
                : 'var(--text-muted)',
              textTransform: 'uppercase',
            }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}