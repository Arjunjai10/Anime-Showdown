import React, { useState } from 'react';
import { FighterLogo } from './FighterLogo';
import { useSettingsStore } from '../stores/settingsStore';

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
    gif: 'https://media.giphy.com/media/cTk3X2v2hF5dG/giphy.gif',
    color: 'var(--text-primary)',
  },
  ryuu: {
    name: 'Ryuu',
    title: 'Eternal Flame',
    gif: 'https://media.giphy.com/media/ul1omlrGG6kpO/giphy.gif',
    color: 'var(--text-secondary)',
  },
  tsubaki: {
    name: 'Tsubaki',
    title: 'Iron Lotus',
    gif: 'https://media.giphy.com/media/25hfBwL0fG7C0/giphy.gif',
    color: 'var(--text-primary)',
  },
  sora: {
    name: 'Sora',
    title: 'Stormcaller',
    gif: 'https://media.giphy.com/media/13EZZ3rV1CthT2/giphy.gif',
    color: 'var(--text-secondary)',
  },
  ren: {
    name: 'Ren',
    title: 'Thunder Fist',
    gif: 'https://media.giphy.com/media/g5Sz48N7F3u3m/giphy.gif',
    color: 'var(--text-primary)',
  },
  hana: {
    name: 'Hana',
    title: 'Void Walker',
    gif: 'https://media.giphy.com/media/12wsnVFIjCneO4/giphy.gif',
    color: 'var(--text-secondary)',
  },
  mira: {
    name: 'Mira',
    title: 'Cursed Sage',
    gif: 'https://media.giphy.com/media/8qsq9Vgh3mYvR830iB/giphy.gif',
    color: 'var(--text-primary)',
  },
  gale: {
    name: 'Gale',
    title: 'Wild Tempest',
    gif: 'https://media.giphy.com/media/wMqi2Gg3WbS5G/giphy.gif',
    color: 'var(--text-secondary)',
  },
  // ── Naruto (The Hidden Ninja Universe) ──────────────────────────────────
  naruto: {
    name: 'Naruto Uzumaki',
    title: 'Nine-Tails Jinchuriki',
    gif: 'https://media.giphy.com/media/12wsnVFIjCneO4/giphy.gif',
    color: 'var(--text-primary)',
  },
  sasuke: {
    name: 'Sasuke Uchiha',
    title: 'The Avenger',
    gif: 'https://media.giphy.com/media/2yLNN4wTy7SpqqkNjm/giphy.gif',
    color: 'var(--text-secondary)',
  },
  kakashi: {
    name: 'Kakashi Hatake',
    title: 'The Copy Ninja',
    gif: 'https://media.giphy.com/media/13Z5kTWwdR4PNK/giphy.gif',
    color: 'var(--text-primary)',
  },
  madara: {
    name: 'Madara Uchiha',
    title: 'Ghost of the Uchiha',
    gif: 'https://media.giphy.com/media/8XboI2yM8Bv68/giphy.gif',
    color: 'var(--text-secondary)',
  },
  // ── One Piece (The Great Pirate Era) ────────────────────────────────────
  luffy: {
    name: 'Monkey D. Luffy',
    title: 'Straw Hat Emperor',
    gif: 'https://media.giphy.com/media/11U85hTghz9TfG/giphy.gif',
    color: 'var(--text-primary)',
  },
  zoro: {
    name: 'Roronoa Zoro',
    title: 'King of Hell',
    gif: 'https://media.giphy.com/media/13c712F2H9A2b6/giphy.gif',
    color: 'var(--text-secondary)',
  },
  sanji: {
    name: 'Vinsmoke Sanji',
    title: 'Black Leg',
    gif: 'https://media.giphy.com/media/c285wL6KL2Hvi/giphy.gif',
    color: 'var(--text-primary)',
  },
  kaido: {
    name: 'Kaido of the Beasts',
    title: 'Strongest Creature Alive',
    gif: 'https://media.giphy.com/media/wMqi2Gg3WbS5G/giphy.gif',
    color: 'var(--text-secondary)',
  },
  // ── Bleach (The Soul Society) ───────────────────────────────────────────
  ichigo: {
    name: 'Ichigo Kurosaki',
    title: 'Substitute Soul Reaper',
    gif: 'https://media.giphy.com/media/cTk3X2v2hF5dG/giphy.gif',
    color: 'var(--text-primary)',
  },
  aizen: {
    name: 'Sosuke Aizen',
    title: 'Ruler of Illusions',
    gif: 'https://media.giphy.com/media/8qsq9Vgh3mYvR830iB/giphy.gif',
    color: 'var(--text-secondary)',
  },
  byakuya: {
    name: 'Byakuya Kuchiki',
    title: 'Captain of the 6th Division',
    gif: 'https://media.giphy.com/media/25hfBwL0fG7C0/giphy.gif',
    color: 'var(--text-primary)',
  },
  zaraki: {
    name: 'Kenpachi Zaraki',
    title: 'The Bloodthirsty Captain',
    gif: 'https://media.giphy.com/media/ul1omlrGG6kpO/giphy.gif',
    color: 'var(--text-secondary)',
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
  const { animateSprites } = useSettingsStore();

  const meta = FIGHTER_GIFS[id.toLowerCase()];

  const dims = {
    sm: { width: 40, height: 40, logoSize: 24, radius: 6 },
    md: { width: 68, height: 68, logoSize: 36, radius: 8 },
    lg: { width: 130, height: 96, logoSize: 48, radius: 8 },
    xl: { width: 180, height: 130, logoSize: 72, radius: 10 },
    battle: { width: 160, height: 160, logoSize: 84, radius: 12 },
  }[size] || { width: 68, height: 68, logoSize: 36, radius: 8 };

  const themeColor = meta?.color || 'var(--text-primary)';

  return (
    <div
      className={`fighter-sprite-box ${className}`}
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: dims.radius,
        border: active ? `2px solid var(--border-strong)` : '1px solid var(--border)',
        boxShadow: active
          ? `0 4px 14px var(--shadow-color), 0 0 14px var(--accent-glow)`
          : '0 3px 10px var(--shadow-color)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--sprite-bg)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
      }}
    >
      {/* Subtle lighting */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at top, var(--accent-dim) 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Sprite or SVG Fallback */}
      {animateSprites && meta && meta.gif && !imgError ? (
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
          <FighterLogo id={id} size={dims.logoSize} color="var(--text-primary)" />
        </div>
      )}

      {/* Name tag */}
      {showNameTag && meta && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '14px 6px 5px',
            background: 'linear-gradient(to top, var(--bg-base) 0%, var(--overlay-bg) 60%, transparent 100%)',
            textAlign: 'center',
            zIndex: 2,
            lineHeight: 1.2,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            {meta.name}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginTop: 1 }}>
            {meta.title}
          </div>
        </div>
      )}
    </div>
  );
};
