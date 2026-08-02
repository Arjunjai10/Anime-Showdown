import React, { useState } from 'react';
import { FighterLogo } from './FighterLogo';

export interface FighterGifMeta {
  gif: string;
  color: string;
  name: string;
  title: string;
}

export const FIGHTER_GIFS: Record<string, FighterGifMeta> = {
  kaze: {
    name: 'Kaze',
    title: 'Phantom Blade',
    gif: 'https://media.giphy.com/media/YSeOANLTDZtdm/giphy.gif',
    color: '#6366F1', // Soft indigo
  },
  ryuu: {
    name: 'Ryuu',
    title: 'Eternal Flame',
    gif: 'https://media.giphy.com/media/ul1omlrGG6kpO/giphy.gif',
    color: '#EF4444', // Soft crimson
  },
  tsubaki: {
    name: 'Tsubaki',
    title: 'Iron Lotus',
    gif: 'https://media.giphy.com/media/C5pcN5xLIfHNu/giphy.gif',
    color: '#10B981', // Soft emerald
  },
  sora: {
    name: 'Sora',
    title: 'Stormcaller',
    gif: 'https://media.giphy.com/media/k5qKwe9WnL8n6/giphy.gif',
    color: '#38BDF8', // Soft sky blue
  },
  ren: {
    name: 'Ren',
    title: 'Thunder Fist',
    gif: 'https://media.giphy.com/media/arbUO3vF6t44w/giphy.gif',
    color: '#F59E0B', // Soft amber
  },
  hana: {
    name: 'Hana',
    title: 'Void Walker',
    gif: 'https://media.giphy.com/media/y07IinYfN04cE/giphy.gif',
    color: '#8B5CF6', // Soft violet
  },
  mira: {
    name: 'Mira',
    title: 'Cursed Sage',
    gif: 'https://media.giphy.com/media/2e4d25yEhrvHw7RgyG/giphy.gif',
    color: '#F43F5E', // Soft rose
  },
  gale: {
    name: 'Gale',
    title: 'Wild Tempest',
    gif: 'https://media.giphy.com/media/1zH0e9S98mBgc14z0S/giphy.gif',
    color: '#D97706', // Soft rust
  },
};

interface FighterSpriteProps {
  id: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'battle';
  className?: string;
  showNameTag?: boolean;
  flip?: boolean;
  active?: boolean;
}

export const FighterSprite: React.FC<FighterSpriteProps> = ({
  id,
  size = 'md',
  className = '',
  showNameTag = false,
  flip = false,
  active = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const meta = FIGHTER_GIFS[id.toLowerCase()];

  // Refined, compact, professional UI dimensions & padding
  const dims = {
    sm: { width: 40, height: 40, logoSize: 24, radius: 6 },
    md: { width: 68, height: 68, logoSize: 36, radius: 8 },
    lg: { width: 130, height: 96, logoSize: 48, radius: 8 },
    xl: { width: 180, height: 130, logoSize: 72, radius: 10 },
    battle: { width: 160, height: 160, logoSize: 84, radius: 12 },
  }[size] || { width: 68, height: 68, logoSize: 36, radius: 8 };

  const themeColor = meta?.color || '#38BDF8';

  return (
    <div
      className={`fighter-sprite-box ${className}`}
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: dims.radius,
        border: active ? `2px solid ${themeColor}` : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: active
          ? `0 4px 14px rgba(0, 0, 0, 0.5), 0 0 12px ${themeColor}33`
          : '0 3px 10px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F19',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Subtle background tone */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at top, ${themeColor}1A 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Sprite or SVG Fallback */}
      {meta && meta.gif && !imgError ? (
        <>
          {!imgLoaded && (
            <div style={{ position: 'absolute', zIndex: 1, opacity: 0.4 }}>
              <FighterLogo id={id} size={dims.logoSize} color={themeColor} />
            </div>
          )}
          <img
            src={meta.gif}
            alt={meta.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: flip ? 'scaleX(-1)' : 'none',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              zIndex: 1,
            }}
          />
        </>
      ) : (
        <div style={{ zIndex: 1, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FighterLogo id={id} size={dims.logoSize} color={themeColor} />
        </div>
      )}

      {/* Clean, readable bottom name overlay */}
      {showNameTag && meta && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '14px 6px 5px',
            background: 'linear-gradient(to top, rgba(9, 13, 22, 0.95) 0%, rgba(9, 13, 22, 0.75) 60%, transparent 100%)',
            textAlign: 'center',
            zIndex: 2,
            lineHeight: 1.2,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#FFF', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
            {meta.name}
          </div>
          <div style={{ fontSize: '0.65rem', color: themeColor, fontWeight: 600, textTransform: 'uppercase', marginTop: 1 }}>
            {meta.title}
          </div>
        </div>
      )}
    </div>
  );
};
