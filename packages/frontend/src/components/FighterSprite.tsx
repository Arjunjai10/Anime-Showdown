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
  // ── Original Showdown Universe (Matched to Iconic Anime Portraits) ──────
  kaze: { name: 'Kaze', title: 'Phantom Blade', gif: '/characters/kaze.jpg', color: 'var(--text-primary)' },
  ryuu: { name: 'Ryuu', title: 'Eternal Flame', gif: '/characters/ryuu.jpg', color: 'var(--text-secondary)' },
  tsubaki: { name: 'Tsubaki', title: 'Iron Lotus', gif: '/characters/tsubaki.jpg', color: 'var(--text-primary)' },
  sora: { name: 'Sora', title: 'Stormcaller', gif: '/characters/sora.jpg', color: 'var(--text-secondary)' },
  ren: { name: 'Ren', title: 'Thunder Fist', gif: '/characters/ren.jpg', color: 'var(--text-primary)' },
  hana: { name: 'Hana', title: 'Void Walker', gif: '/characters/hana.jpg', color: 'var(--text-secondary)' },
  mira: { name: 'Mira', title: 'Cursed Sage', gif: '/characters/mira.jpg', color: 'var(--text-primary)' },
  gale: { name: 'Gale', title: 'Wild Tempest', gif: '/characters/gale.jpg', color: 'var(--text-secondary)' },

  // ── Naruto (The Hidden Ninja Universe) ──────────────────────────────────
  naruto: { name: 'Naruto Uzumaki', title: 'Nine-Tails Jinchuriki', gif: '/characters/naruto.jpg', color: 'var(--text-primary)' },
  sasuke: { name: 'Sasuke Uchiha', title: 'The Avenger', gif: '/characters/sasuke.jpg', color: 'var(--text-secondary)' },
  kakashi: { name: 'Kakashi Hatake', title: 'The Copy Ninja', gif: '/characters/kakashi.jpg', color: 'var(--text-primary)' },
  madara: { name: 'Madara Uchiha', title: 'Ghost of the Uchiha', gif: '/characters/madara.jpg', color: 'var(--text-secondary)' },

  // ── One Piece (The Great Pirate Era) ────────────────────────────────────
  luffy: { name: 'Monkey D. Luffy', title: 'Straw Hat Emperor', gif: '/characters/luffy.jpg', color: 'var(--text-primary)' },
  zoro: { name: 'Roronoa Zoro', title: 'King of Hell', gif: '/characters/zoro.jpg', color: 'var(--text-secondary)' },
  sanji: { name: 'Vinsmoke Sanji', title: 'Black Leg', gif: '/characters/sanji.jpg', color: 'var(--text-primary)' },
  kaido: { name: 'Kaido of the Beasts', title: 'Strongest Creature Alive', gif: '/characters/kaido.jpg', color: 'var(--text-secondary)' },

  // ── Bleach (The Soul Society) ───────────────────────────────────────────
  ichigo: { name: 'Ichigo Kurosaki', title: 'Substitute Soul Reaper', gif: '/characters/ichigo.jpg', color: 'var(--text-primary)' },
  aizen: { name: 'Sosuke Aizen', title: 'Ruler of Illusions', gif: '/characters/aizen.jpg', color: 'var(--text-secondary)' },
  byakuya: { name: 'Byakuya Kuchiki', title: 'Captain of the 6th Division', gif: '/characters/byakuya.jpg', color: 'var(--text-primary)' },
  zaraki: { name: 'Kenpachi Zaraki', title: 'The Bloodthirsty Captain', gif: '/characters/zaraki.jpg', color: 'var(--text-secondary)' },

  // ── Dragon Ball (Saiyans & Galactic Tyrants) ────────────────────────────
  goku: { name: 'Son Goku', title: 'Saiyan Emperor of Martial Arts', gif: '/characters/goku.jpg', color: 'var(--text-primary)' },
  vegeta: { name: 'Vegeta', title: 'Proud Prince of Saiyans', gif: '/characters/vegeta.jpg', color: 'var(--text-secondary)' },
  frieza: { name: 'Frieza', title: 'Galactic Tyrant', gif: '/characters/frieza.jpg', color: 'var(--text-primary)' },

  // ── Jujutsu Kaisen (Cursed Sorcery) ─────────────────────────────────────
  gojo: { name: 'Satoru Gojo', title: 'The Strongest Sorcerer Alive', gif: '/characters/gojo.jpg', color: 'var(--text-primary)' },
  sukuna: { name: 'Ryomen Sukuna', title: 'King of Curses', gif: '/characters/sukuna.jpg', color: 'var(--text-secondary)' },
  yuji: { name: 'Yuji Itadori', title: 'The Cursed Vessel', gif: '/characters/yuji.jpg', color: 'var(--text-primary)' },

  // ── Demon Slayer, Titan & Hero Legends ──────────────────────────────────
  tanjiro: { name: 'Tanjiro Kamado', title: 'Sun Breath Demon Slayer', gif: '/characters/tanjiro.jpg', color: 'var(--text-primary)' },
  levi: { name: 'Levi Ackerman', title: 'Humanity\'s Strongest Soldier', gif: '/characters/levi.jpg', color: 'var(--text-secondary)' },
  saitama: { name: 'Saitama', title: 'Hero for Fun', gif: '/characters/saitama.jpg', color: 'var(--text-primary)' },
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

      {/* Authentic High-Resolution Internet Character Image with Vector Emblem Fallback */}
      {!imgError ? (
        <img
          src={meta?.gif || `/characters/${id}.jpg`}
          alt={meta?.name || id}
          onError={() => setImgError(true)}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            transform: flip ? 'scaleX(-1)' : 'none',
            transition: 'transform 0.3s ease, filter 0.3s ease',
            filter: active ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.7))' : 'none',
            zIndex: 1,
          }}
        />
      ) : (
        <div
          style={{
            zIndex: 1,
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: flip ? 'scaleX(-1)' : 'none',
            filter: active ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.7))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
            transition: 'transform 0.3s ease, filter 0.3s ease',
          }}
        >
          <FighterLogo id={id} size={dims.logoSize} color={themeColor} />
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
