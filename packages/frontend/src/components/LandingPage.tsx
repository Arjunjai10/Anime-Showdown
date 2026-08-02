import React from 'react';
import { FighterLogo } from './FighterLogo';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'radial-gradient(circle at 50% 20%, var(--overlay-bg) 0%, var(--bg-base) 75%)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '50px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dynamic Ambient Background Glows */}
      <div className="animate-pulse-glow" style={{
        position: 'absolute',
        top: '12%',
        left: '22%',
        width: 420,
        height: 420,
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)',
        filter: 'blur(45px)',
        pointerEvents: 'none',
      }} />
      <div className="animate-pulse-glow" style={{
        position: 'absolute',
        bottom: '10%',
        right: '18%',
        width: 460,
        height: 460,
        background: 'radial-gradient(circle, var(--text-primary) 0%, transparent 70%)',
        filter: 'blur(55px)',
        pointerEvents: 'none',
        animationDelay: '3s',
      }} />

      {/* Main Hero Section */}
      <div className="animate-fade-up" style={{
        width: '100%',
        maxWidth: 1020,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 1,
      }}>
        {/* Floating Animated Game Emblem */}
        <div className="animate-hero-float" style={{
          padding: 20,
          borderRadius: '50%',
          background: 'var(--panel-bg)',
          border: '2px solid var(--border-strong)',
          boxShadow: '0 0 35px var(--accent-glow)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FighterLogo id="game-logo" size={68} color="var(--text-primary)" />
        </div>

        <h1 style={{
          fontSize: '4.2rem',
          fontWeight: 900,
          letterSpacing: '0.09em',
          margin: '0 0 12px',
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase',
          lineHeight: 1.1,
        }}>
          ANIME SHOWDOWN
        </h1>

        <p style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          maxWidth: 720,
          lineHeight: 1.6,
          margin: '0 0 32px',
          letterSpacing: '0.01em',
        }}>
          The Supreme Tactical Anime Battle Arena. Construct legendary squads from Naruto, One Piece, and Bleach, equip combat relics, and execute definitive real-time strategy.
        </p>

        {/* Security / Auth Required Notice Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          borderRadius: 40,
          background: 'var(--panel-header)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 4px 20px var(--shadow-color)',
          marginBottom: 38,
          animation: 'badgePulse 4s infinite',
        }}>
          <FighterLogo id="lock" size={22} color="var(--text-primary)" />
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AUTHORIZED DUELISTS ONLY — LOG IN TO UNLOCK BATTLE ARENA &amp; TEAM BUILDER
          </span>
        </div>

        {/* Primary Call to Action Controls */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 60, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => onOpenAuth('login')}
            style={{
              padding: '16px 42px',
              fontSize: '1.1rem',
              fontWeight: 900,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))',
              color: 'var(--bg-base)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 25px var(--shadow-color), 0 0 20px var(--accent-glow)',
              transition: 'transform 0.18s ease, filter 0.18s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <FighterLogo id="swords" size={22} color="var(--bg-base)" />
            <span>Enter The Arena (Log In)</span>
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            style={{
              padding: '16px 38px',
              fontSize: '1.1rem',
              fontWeight: 900,
              borderRadius: 12,
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-strong)',
              cursor: 'pointer',
              boxShadow: '0 6px 18px var(--shadow-color)',
              transition: 'transform 0.18s ease, background 0.18s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.background = 'var(--active-bg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--panel-bg)';
            }}
          >
            <FighterLogo id="user" size={22} color="var(--text-primary)" />
            <span>Register Free Account</span>
          </button>
        </div>

        {/* 3 Pillar Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 26,
          width: '100%',
        }}>
          <div className="landing-feature-card">
            <div style={{ marginBottom: 18, color: 'var(--text-primary)' }}>
              <FighterLogo id="ryuu" size={44} color="var(--text-primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Legendary Big 3 Roster
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Command champions like Naruto, Luffy, and Ichigo with authentic technique mechanics, signature status afflictions, and dynamic tactical energy management.
            </p>
          </div>

          <div className="landing-feature-card" style={{ animationDelay: '0.15s' }}>
            <div style={{ marginBottom: 18, color: 'var(--text-primary)' }}>
              <FighterLogo id="shield" size={44} color="var(--text-primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Custom Relics &amp; Formats
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Equip Senzu Beans, Hogyoku Fragments, and Berserk Seals across competitive 1v1 Duels, rapid 3v3 Blitz, or complete 6v6 tournament formats.
            </p>
          </div>

          <div className="landing-feature-card" style={{ animationDelay: '0.3s' }}>
            <div style={{ marginBottom: 18, color: 'var(--text-primary)' }}>
              <FighterLogo id="ai" size={44} color="var(--text-primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AI Bots &amp; Real-Time PvP
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Test your tactical build instantly against intelligent Showdown AI CPU bots or enter authoritative zero-latency PvP matchmaking against duelists worldwide.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 46, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <FighterLogo id="star" size={16} color="currentColor" />
          <span>Anime Showdown Engine v1.0 • Authoritative WebSocket Architecture • Secure Network</span>
          <FighterLogo id="star" size={16} color="currentColor" />
        </div>
      </div>
    </div>
  );
};
