import React from 'react';
import { useSettingsStore, type ThemeMode } from '../stores/settingsStore';
import { FighterLogo } from './FighterLogo';

interface UserSettingsModalProps {
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ onClose }) => {
  const {
    theme,
    animateSprites,
    soundEffects,
    autoScrollLog,
    showLobbyChat,
    setTheme,
    updateSetting,
  } = useSettingsStore();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-bg)',
        backdropFilter: 'blur(6px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          padding: 28,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 16px 50px var(--shadow-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FighterLogo id="shield" size={24} color="var(--text-primary)" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Showdown User Settings
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Customize interface theme and gameplay preferences
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.6rem',
              cursor: 'pointer',
              fontWeight: 700,
              padding: '0 6px',
            }}
            title="Close Settings"
          >
            ×
          </button>
        </div>

        {/* ── Theme Selection Section ────────────────────────────── */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
            Interface Color Theme
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            
            {/* Dark Theme Button */}
            <button
              onClick={() => setTheme('dark')}
              style={{
                padding: '16px 14px',
                background: theme === 'dark' ? '#111111' : 'var(--panel-bg)',
                border: theme === 'dark' ? '2px solid #FFFFFF' : '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                color: theme === 'dark' ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                boxShadow: theme === 'dark' ? '0 0 16px rgba(255, 255, 255, 0.2)' : 'none',
              }}
            >
              <div><FighterLogo id="moon" size={32} color="currentColor" /></div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', color: theme === 'dark' ? '#FFFFFF' : 'var(--text-primary)' }}>
                Dark Theme
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, textAlign: 'center' }}>
                Deep Obsidian & Silver High-Contrast
              </div>
            </button>

            {/* White / Light Theme Button */}
            <button
              onClick={() => setTheme('light')}
              style={{
                padding: '16px 14px',
                background: theme === 'light' ? '#FFFFFF' : 'var(--panel-bg)',
                border: theme === 'light' ? '2px solid #000000' : '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                color: theme === 'light' ? '#000000' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                boxShadow: theme === 'light' ? '0 0 16px rgba(0, 0, 0, 0.25)' : 'none',
              }}
            >
              <div><FighterLogo id="sun" size={32} color="currentColor" /></div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', color: theme === 'light' ? '#000000' : 'var(--text-primary)' }}>
                White Theme
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, textAlign: 'center' }}>
                Pristine Editorial & Solid Black Contrast
              </div>
            </button>
          </div>
        </div>

        {/* ── Gameplay & Combat Preferences ──────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Gameplay & Visual Preferences
          </label>

          {/* Animate Sprites */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Animated Fighter GIFs</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Render animated battle action GIFs vs static vector emblems</div>
            </div>
            <input
              type="checkbox"
              checked={animateSprites}
              onChange={(e) => updateSetting('animateSprites', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          {/* Sound / Match Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Audio & Match Alerts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Play notification chimes when PVP opponent is matched</div>
            </div>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => updateSetting('soundEffects', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          {/* Auto Scroll Log */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Auto-Scroll Combat Log</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Automatically scroll to newest attack actions each turn</div>
            </div>
            <input
              type="checkbox"
              checked={autoScrollLog}
              onChange={(e) => updateSetting('autoScrollLog', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          {/* Lobby Chat */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Show Global Lobby Chat</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Display worldwide duelist chat window in main lobby</div>
            </div>
            <input
              type="checkbox"
              checked={showLobbyChat}
              onChange={(e) => updateSetting('showLobbyChat', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              border: '1px solid var(--border-strong)',
              borderRadius: 6,
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 10px var(--shadow-color)',
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
