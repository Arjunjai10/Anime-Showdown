import React, { useState, useRef } from 'react';
import { FighterLogo } from './FighterLogo';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

/* ── Interactive 3D Tilt Wrapper with Depth Parallax ─────────────────────── */
const Tilt3D: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  maxTilt?: number;
  onClick?: () => void;
  scale?: number;
}> = ({ children, style, className, maxTilt = 10, scale = 1.035, onClick }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0, s: 1 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Calculate tilt rotations in degrees
    const rotateX = ((centerY - y) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    setTilt({ x: rotateX, y: rotateY, s: scale });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, s: 1 });
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${tilt.s}, ${tilt.s}, ${tilt.s})`,
        transformStyle: 'preserve-3d',
        transition: tilt.s > 1 ? 'transform 0.08s ease-out, box-shadow 0.2s ease' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'relics' | 'arena'>('roster');

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'radial-gradient(circle at 50% 10%, var(--bg-surface-3) 0%, #030303 70%, #000000 100%)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px 90px',
      position: 'relative',
      overflow: 'hidden',
      perspective: '2000px',
    }}>
      {/* 3D Isometric Background Cyber Grid & Ambient Beams */}
      <div style={{
        position: 'absolute',
        inset: -200,
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 60%), linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.03) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.03) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03) 76%, transparent 77%, transparent)',
        backgroundSize: '80px 80px',
        transform: 'rotateX(55deg) translateZ(-300px)',
        transformOrigin: '50% 30%',
        pointerEvents: 'none',
        opacity: 0.65,
      }} />
      <div className="animate-pulse-glow" style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 65%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
      }} />
      <div className="animate-pulse-glow" style={{
        position: 'absolute',
        top: '35%',
        right: '12%',
        width: 580,
        height: 580,
        background: 'radial-gradient(circle, rgba(200,200,200,0.18) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        animationDelay: '3.5s',
      }} />

      {/* Main Container */}
      <div className="animate-fade-up" style={{
        width: '100%',
        maxWidth: 1240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 1,
      }}>
        {/* 3D Floating Isometric Badge */}
        <Tilt3D maxTilt={25} style={{
          padding: 20,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #1f1f1f 0%, #0d0d0d 100%)',
          border: '2px solid #FFFFFF',
          boxShadow: '0 15px 35px rgba(0,0,0,0.9), 0 0 45px rgba(255,255,255,0.35)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <div style={{ transform: 'translateZ(35px)', transition: 'transform 0.2s ease' }}>
            <FighterLogo id="game-logo" size={64} color="var(--text-primary)" />
          </div>
        </Tilt3D>

        {/* 3D Metallic Extruded Title */}
        <h1 style={{
          fontSize: '4.8rem',
          fontWeight: 900,
          letterSpacing: '0.12em',
          margin: '0 0 14px',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          lineHeight: 1.05,
          textShadow: '0 1px 0 #d4d4d4, 0 2px 0 #aaaaaa, 0 3px 0 #888888, 0 4px 0 #666666, 0 5px 0 #444444, 0 8px 25px rgba(0,0,0,0.95), 0 0 40px rgba(255,255,255,0.4)',
        }}>
          ANIME SHOWDOWN
        </h1>

        <p style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          maxWidth: 820,
          lineHeight: 1.6,
          margin: '0 0 34px',
          letterSpacing: '0.03em',
          textShadow: '0 4px 15px rgba(0,0,0,0.8)',
        }}>
          Next-Generation 3D Anime Combat Simulation. Command legendary champions from Naruto, One Piece, and Bleach inside an interactive 3D tactical arena.
        </p>

        {/* 3D Floating Security Beacon Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 30px',
          borderRadius: 50,
          background: 'linear-gradient(90deg, #111111, #222222, #111111)',
          border: '1px solid #FFFFFF',
          boxShadow: '0 8px 30px var(--shadow-color), inset 0 0 20px rgba(255,255,255,0.15)',
          marginBottom: 44,
          animation: 'badgePulse 3.5s infinite',
        }}>
          <FighterLogo id="lock" size={22} color="#FFFFFF" />
          <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            AUTHORIZED DUELISTS ONLY — LOG IN TO ENGAGE IN 3D TACTICAL WARFARE
          </span>
        </div>

        {/* 3D TACTILE EXTRUDED BUTTON CONTROLS */}
        <div style={{ display: 'flex', gap: 26, marginBottom: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Primary 3D Extruded Button */}
          <button
            onClick={() => onOpenAuth('login')}
            style={{
              padding: '20px 50px',
              fontSize: '1.2rem',
              fontWeight: 900,
              borderRadius: '16px',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #D4D4D4 100%)',
              color: '#000000',
              border: '2px solid #FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 8px 0 #555555, 0 16px 40px rgba(0,0,0,0.9), 0 0 35px rgba(255,255,255,0.4)',
              transform: 'translateY(0px)',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease, filter 0.15s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              outline: 'none',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 11px 0 #555555, 0 22px 50px rgba(0,0,0,0.95), 0 0 50px rgba(255,255,255,0.6)';
              e.currentTarget.style.filter = 'brightness(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 8px 0 #555555, 0 16px 40px rgba(0,0,0,0.9), 0 0 35px rgba(255,255,255,0.4)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(6px)';
              e.currentTarget.style.boxShadow = '0 2px 0 #555555, 0 6px 18px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.3)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 11px 0 #555555, 0 22px 50px rgba(0,0,0,0.95), 0 0 50px rgba(255,255,255,0.6)';
            }}
          >
            <FighterLogo id="swords" size={26} color="#000000" />
            <span>ENTER THE ARENA (LOG IN)</span>
          </button>

          {/* Secondary 3D Extruded Button */}
          <button
            onClick={() => onOpenAuth('register')}
            style={{
              padding: '20px 44px',
              fontSize: '1.2rem',
              fontWeight: 900,
              borderRadius: '16px',
              background: 'linear-gradient(180deg, #1F1F1F 0%, #0A0A0A 100%)',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 8px 0 #2E2E2E, 0 16px 40px rgba(0,0,0,0.9), inset 0 0 15px rgba(255,255,255,0.15)',
              transform: 'translateY(0px)',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              outline: 'none',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 11px 0 #2E2E2E, 0 22px 50px rgba(0,0,0,0.95), 0 0 30px rgba(255,255,255,0.3)';
              e.currentTarget.style.background = 'linear-gradient(180deg, #2A2A2A 0%, #151515 100%)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 8px 0 #2E2E2E, 0 16px 40px rgba(0,0,0,0.9), inset 0 0 15px rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'linear-gradient(180deg, #1F1F1F 0%, #0A0A0A 100%)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(6px)';
              e.currentTarget.style.boxShadow = '0 2px 0 #2E2E2E, 0 6px 18px rgba(0,0,0,0.9)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 11px 0 #2E2E2E, 0 22px 50px rgba(0,0,0,0.95), 0 0 30px rgba(255,255,255,0.3)';
            }}
          >
            <FighterLogo id="user" size={26} color="#FFFFFF" />
            <span>REGISTER FREE ACCOUNT</span>
          </button>
        </div>

        {/* ── 3D HOLOGRAPHIC HERO CONSOLE BANNER ──────────────────────────────── */}
        <Tilt3D maxTilt={10} scale={1.025} onClick={() => onOpenAuth('login')} style={{
          width: '100%',
          maxWidth: 1120,
          borderRadius: 24,
          background: '#080808',
          border: '3px solid #FFFFFF',
          boxShadow: '0 30px 90px rgba(0,0,0,0.95), 0 0 65px rgba(255,255,255,0.25)',
          marginBottom: 68,
          position: 'relative',
          cursor: 'pointer',
        }}>
          <div style={{ position: 'relative', height: 440, borderRadius: 21, overflow: 'hidden', transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}>
            <img
              src="/assets/3d/hero_clash.png"
              alt="3D Anime Fighting Clash"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            
            {/* Parallax Floating Holographic Top Badges */}
            <div style={{ position: 'absolute', top: 24, left: 28, transform: 'translateZ(45px)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', border: '1px solid #FFFFFF', boxShadow: '0 6px 20px rgba(0,0,0,0.8)' }}>
                <FighterLogo id="energy" size={18} color="#FFFFFF" />
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Unreal 3D Engine Powered
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid #FFFFFF', boxShadow: '0 6px 20px rgba(0,0,0,0.8)' }}>
                <FighterLogo id="star" size={18} color="#FFFFFF" />
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  60 FPS Realtime Matchmaking
                </span>
              </div>
            </div>

            {/* Cinematic Gradient & 3D Pop-Out Caption */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.1) 100%)',
              padding: '38px',
              textAlign: 'left',
              transform: 'translateZ(25px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}>
              <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
                IMMERSIVE 3D COMBAT SPECTACULAR
              </h2>
              <p style={{ fontSize: '1.15rem', color: '#E5E5E5', maxWidth: 780, margin: 0, fontWeight: 700, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
                Experience visceral 3D-styled animation depth, high-speed tactical switching, and definitive PvP tournaments. Hover over cards below to engage 3D parallax!
              </p>
            </div>
          </div>
        </Tilt3D>

        {/* ── 3D PILLAR FEATURE CARDS WITH PARALLAX DEPTH ───────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 34,
          width: '100%',
          maxWidth: 1180,
        }}>
          {/* 3D Tilt Card 1: Roster */}
          <Tilt3D maxTilt={14} style={{
            background: 'linear-gradient(160deg, #151515 0%, #0A0A0A 100%)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 22,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            <div style={{ height: 240, overflow: 'hidden', position: 'relative', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
              <img
                src="/assets/3d/roster_trophy.png"
                alt="3D Roster Trophy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Parallax Floating Tag */}
              <div style={{ position: 'absolute', top: 16, left: 16, transform: 'translateZ(30px)', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', border: '1px solid #FFFFFF', padding: '8px 16px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
                <FighterLogo id="ryuu" size={18} color="#FFFFFF" />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3D Roster Sculptures</span>
              </div>
            </div>
            <div style={{ padding: '30px', textAlign: 'left', transform: 'translateZ(20px)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Legendary Big 3 Champions
              </h3>
              <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, fontWeight: 600 }}>
                Command high-fidelity 3D rendered champions like Naruto, Luffy, and Ichigo with authentic technique mechanics, signature status afflictions, and dynamic tactical energy management.
              </p>
            </div>
          </Tilt3D>

          {/* 3D Tilt Card 2: Relics */}
          <Tilt3D maxTilt={14} style={{
            background: 'linear-gradient(160deg, #151515 0%, #0A0A0A 100%)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 22,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            <div style={{ height: 240, overflow: 'hidden', position: 'relative', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
              <img
                src="/assets/3d/relic_gem.png"
                alt="3D Relic Artifact"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 16, left: 16, transform: 'translateZ(30px)', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', border: '1px solid #FFFFFF', padding: '8px 16px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
                <FighterLogo id="shield" size={18} color="#FFFFFF" />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3D Held Artifacts</span>
              </div>
            </div>
            <div style={{ padding: '30px', textAlign: 'left', transform: 'translateZ(20px)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Custom Relics &amp; Formats
              </h3>
              <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, fontWeight: 600 }}>
                Equip glowing 3D crystal items like Senzu Beans, Hogyoku Fragments, and Berserk Seals across competitive 1v1 Duels, rapid 3v3 Blitz, or complete 6v6 tournament formats.
              </p>
            </div>
          </Tilt3D>

          {/* 3D Tilt Card 3: AI & PvP */}
          <Tilt3D maxTilt={14} style={{
            background: 'linear-gradient(160deg, #151515 0%, #0A0A0A 100%)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 22,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            <div style={{ height: 240, overflow: 'hidden', position: 'relative', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
              <img
                src="/assets/3d/pvp_arena.png"
                alt="3D PvP Arena"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 16, left: 16, transform: 'translateZ(30px)', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', border: '1px solid #FFFFFF', padding: '8px 16px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
                <FighterLogo id="ai" size={18} color="#FFFFFF" />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Holographic Arena</span>
              </div>
            </div>
            <div style={{ padding: '30px', textAlign: 'left', transform: 'translateZ(20px)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Bots &amp; Real-Time PvP
              </h3>
              <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, fontWeight: 600 }}>
                Test your tactical builds instantly against intelligent 3D neural CPU bots or enter authoritative zero-latency PvP matchmaking against duelists worldwide.
              </p>
            </div>
          </Tilt3D>
        </div>

        {/* Footer info banner */}
        <div style={{ marginTop: 64, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <FighterLogo id="star" size={18} color="currentColor" />
          <span>Anime Showdown 3D Engine v2.0 • Interactive Parallax Architecture • Secure Authoritative Network</span>
          <FighterLogo id="star" size={18} color="currentColor" />
        </div>
      </div>
    </div>
  );
};
