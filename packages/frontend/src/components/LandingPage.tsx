import React from 'react';
import { FighterLogo } from './FighterLogo';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'radial-gradient(circle at 50% 15%, var(--bg-surface-2) 0%, var(--bg-base) 80%)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dynamic Ambient Background Glows */}
      <div className="animate-pulse-glow" style={{
        position: 'absolute',
        top: '8%',
        left: '15%',
        width: 500,
        height: 500,
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div className="animate-pulse-glow" style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: 550,
        height: 550,
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        animationDelay: '3s',
      }} />

      {/* Main Container */}
      <div className="animate-fade-up" style={{
        width: '100%',
        maxWidth: 1180,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 1,
      }}>
        {/* Top Floating Game Emblem */}
        <div className="animate-hero-float" style={{
          padding: 18,
          borderRadius: '50%',
          background: 'var(--panel-bg)',
          border: '2px solid var(--border-strong)',
          boxShadow: '0 0 35px var(--accent-glow)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FighterLogo id="game-logo" size={54} color="var(--text-primary)" />
        </div>

        <h1 style={{
          fontSize: '4.6rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
          margin: '0 0 10px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #A3A3A3 50%, #737373 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase',
          lineHeight: 1.05,
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          ANIME SHOWDOWN
        </h1>

        <p style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          maxWidth: 760,
          lineHeight: 1.6,
          margin: '0 0 28px',
          letterSpacing: '0.02em',
        }}>
          The Supreme 3D Tactical Anime Battle Arena. Construct legendary squads from Naruto, One Piece, and Bleach, equip combat relics, and execute definitive real-time PVP combat.
        </p>

        {/* Security / Auth Required Notice Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 26px',
          borderRadius: 40,
          background: 'var(--panel-header)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 6px 25px var(--shadow-color)',
          marginBottom: 36,
          animation: 'badgePulse 4s infinite',
        }}>
          <FighterLogo id="lock" size={20} color="var(--text-primary)" />
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AUTHORIZED DUELISTS ONLY — LOG IN OR REGISTER TO UNLOCK 3D BATTLE ARENA &amp; ROSTER
          </span>
        </div>

        {/* Primary Call to Action Controls */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 50, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => onOpenAuth('login')}
            style={{
              padding: '18px 46px',
              fontSize: '1.15rem',
              fontWeight: 900,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FFFFFF, #E5E5E5)',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 35px var(--shadow-color), 0 0 25px var(--accent-glow)',
              transition: 'transform 0.18s ease, filter 0.18s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
          >
            <FighterLogo id="swords" size={24} color="#000000" />
            <span>Enter The Arena (Log In)</span>
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            style={{
              padding: '18px 42px',
              fontSize: '1.15rem',
              fontWeight: 900,
              borderRadius: 12,
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-strong)',
              cursor: 'pointer',
              boxShadow: '0 8px 22px var(--shadow-color)',
              transition: 'all 0.18s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.background = 'var(--active-bg)';
              e.currentTarget.style.boxShadow = '0 12px 30px var(--shadow-color), 0 0 20px rgba(255,255,255,0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = 'var(--panel-bg)';
              e.currentTarget.style.boxShadow = '0 8px 22px var(--shadow-color)';
            }}
          >
            <FighterLogo id="user" size={24} color="var(--text-primary)" />
            <span>Register Free Account</span>
          </button>
        </div>

        {/* ── 3D HERO CENTERPIECE BANNER ──────────────────────────────────────── */}
        <div style={{
          width: '100%',
          maxWidth: 1060,
          height: 400,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 56,
          border: '2px solid var(--border-strong)',
          boxShadow: '0 20px 60px var(--shadow-color), 0 0 45px var(--accent-glow)',
          cursor: 'pointer',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.015)';
          e.currentTarget.style.boxShadow = '0 28px 80px var(--shadow-color), 0 0 65px var(--text-primary)';
          const img = e.currentTarget.querySelector('img');
          if (img) img.style.transform = 'scale(1.06)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 20px 60px var(--shadow-color), 0 0 45px var(--accent-glow)';
          const img = e.currentTarget.querySelector('img');
          if (img) img.style.transform = 'scale(1)';
        }}
        onClick={() => onOpenAuth('login')}
        >
          <img
            src="/assets/3d/hero_clash.png"
            alt="3D Anime Fighting Clash"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'block',
            }}
          />
          {/* Cinematic Dark Gradient Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.4) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '36px',
            textAlign: 'left',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-strong)', width: 'fit-content', marginBottom: 12 }}>
              <FighterLogo id="clash" size={14} color="#FFFFFF" />
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Unreal 3D Combat Engine • Zero-Latency WebSockets
              </span>
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
              Next-Gen Anime Battle Simulation
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#D4D4D4', maxWidth: 680, margin: '6px 0 0', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              Experience intense high-speed tactical turns, signature status ailments, and dynamic 3D-styled visual immersion.
            </p>
          </div>
        </div>

        {/* ── 3D PILLAR FEATURE CARDS ─────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          width: '100%',
          maxWidth: 1100,
        }}>
          {/* Card 1: Roster */}
          <div className="landing-feature-card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 210, overflow: 'hidden', position: 'relative', borderBottom: '1px solid var(--border)' }}>
              <img
                src="/assets/3d/roster_trophy.png"
                alt="3D Roster Trophy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FighterLogo id="ryuu" size={16} color="#FFFFFF" />
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase' }}>Big 3 Roster</span>
              </div>
            </div>
            <div style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Legendary Big 3 Champions
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Command 3D-styled champions like Naruto, Luffy, and Ichigo with authentic technique mechanics, signature status afflictions, and dynamic tactical energy management.
              </p>
            </div>
          </div>

          {/* Card 2: Relics */}
          <div className="landing-feature-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', animationDelay: '0.15s' }}>
            <div style={{ height: 210, overflow: 'hidden', position: 'relative', borderBottom: '1px solid var(--border)' }}>
              <img
                src="/assets/3d/relic_gem.png"
                alt="3D Relic Artifact"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FighterLogo id="shield" size={16} color="#FFFFFF" />
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase' }}>Held Relics</span>
              </div>
            </div>
            <div style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Custom Relics &amp; Formats
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Equip 3D rendered items like Senzu Beans, Hogyoku Fragments, and Berserk Seals across competitive 1v1 Duels, rapid 3v3 Blitz, or complete 6v6 tournament formats.
              </p>
            </div>
          </div>

          {/* Card 3: AI & PvP */}
          <div className="landing-feature-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', animationDelay: '0.3s' }}>
            <div style={{ height: 210, overflow: 'hidden', position: 'relative', borderBottom: '1px solid var(--border)' }}>
              <img
                src="/assets/3d/pvp_arena.png"
                alt="3D PvP Arena"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FighterLogo id="ai" size={16} color="#FFFFFF" />
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase' }}>AI Bots &amp; PvP</span>
              </div>
            </div>
            <div style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                AI Bots &amp; Real-Time PvP
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Test your tactical builds instantly against intelligent Showdown AI CPU bots or enter authoritative zero-latency PvP matchmaking against duelists worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div style={{ marginTop: 56, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <FighterLogo id="star" size={16} color="currentColor" />
          <span>Anime Showdown Engine v1.0 • High-Fidelity 3D Assets • Secure Authoritative Network</span>
          <FighterLogo id="star" size={16} color="currentColor" />
        </div>
      </div>
    </div>
  );
};
