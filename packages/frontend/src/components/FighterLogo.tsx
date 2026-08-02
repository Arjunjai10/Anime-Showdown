import React from 'react';

interface FighterLogoProps {
  id: string;
  size?: number | string;
  color?: string;
  className?: string;
}

/**
 * High-end Vector Anime Crests and UI Emblems.
 * Replaces text emojis with crisp, state-of-the-art anime themed emblems and logos.
 */
export const FighterLogo: React.FC<FighterLogoProps> = ({
  id,
  size = 48,
  color = 'currentColor',
  className = '',
}) => {
  const s = typeof size === 'number' ? `${size}px` : size;
  const style: React.CSSProperties = {
    width: s,
    height: s,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color,
    flexShrink: 0,
  };

  switch (id) {
    // ── Kaze (Phantom Blade / Ninja) ──────────────────────────────────────────
    case 'kaze':
    case 'Ninja / Speed':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shuriken Star with wind aura */}
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
          <path d="M50 8 L62 38 L92 50 L62 62 L50 92 L38 62 L8 50 L38 38 Z" fill="currentColor" opacity="0.9" />
          <circle cx="50" cy="50" r="14" fill="var(--bg-surface, #0B0E14)" stroke="currentColor" strokeWidth="3" />
          <path d="M50 22 L50 36 M50 64 L50 78 M22 50 L36 50 M64 50 L78 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // ── Ryuu (Eternal Flame / Fighter) ────────────────────────────────────────
    case 'ryuu':
    case 'Fighter / Power':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blazing Flame / Dragon Claw Crest */}
          <path
            d="M50 6 C65 24 86 42 84 66 C82 85 67 94 50 94 C33 94 18 85 16 66 C14 42 35 24 50 6 Z"
            fill="currentColor"
            opacity="0.25"
          />
          <path
            d="M50 16 C60 32 76 46 74 66 C72 80 61 88 50 88 C39 88 28 80 26 66 C24 46 40 32 50 16 Z"
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d="M50 40 C55 52 64 62 60 76 C58 82 54 84 50 84 C46 84 42 82 40 76 C36 62 45 52 50 40 Z"
            fill="var(--bg-surface, #0B0E14)"
          />
          <circle cx="50" cy="74" r="5" fill="currentColor" />
        </svg>
      );

    // ── Tsubaki (Iron Lotus / Tank) ──────────────────────────────────────────
    case 'tsubaki':
    case 'Warrior / Tank':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fortress Shield & Lotus Blossom */}
          <path d="M50 6 L86 22 V54 C86 76 68 90 50 96 C32 90 14 76 14 54 V22 L50 6 Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="4" />
          <path d="M50 14 L78 27 V52 C78 70 64 82 50 88 C36 82 22 70 22 52 V27 L50 14 Z" fill="currentColor" opacity="0.9" />
          {/* Lotus center inside shield */}
          <path d="M50 36 C56 46 64 50 64 64 C64 72 58 76 50 76 C42 76 36 72 36 64 C36 50 44 46 50 36 Z" fill="var(--bg-surface, #0B0E14)" />
          <path d="M40 54 C45 46 50 44 50 44 C50 44 55 46 60 54 C55 58 50 56 50 56 C50 56 45 58 40 54 Z" fill="currentColor" />
        </svg>
      );

    // ── Sora (Stormcaller / Mage) ──────────────────────────────────────────────
    case 'sora':
    case 'Mage / Elemental':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Elemental Thunderstorm Vortex */}
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="3" strokeDasharray="16 8" opacity="0.5" />
          <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          {/* Sharp Lightning Bolt */}
          <path d="M56 10 L28 52 H50 L44 90 L72 48 H50 L56 10 Z" fill="currentColor" stroke="var(--bg-surface, #0B0E14)" strokeWidth="2" />
          <circle cx="50" cy="50" r="4" fill="var(--bg-surface, #0B0E14)" />
        </svg>
      );

    // ── Ren (Thunder Fist / Brawler) ──────────────────────────────────────────
    case 'ren':
    case 'Brawler / Electric':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Spiked Impact Shockwave & Gauntlet */}
          <path d="M12 50 L88 50 M50 12 L50 88 M23 23 L77 77 M23 77 L77 23" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <polygon points="50,15 62,38 85,50 62,62 50,85 38,62 15,50 38,38" fill="currentColor" opacity="0.4" />
          {/* Fist center */}
          <rect x="34" y="36" width="32" height="28" rx="6" fill="currentColor" />
          <path d="M34 46 H66 M34 54 H66 M44 36 V64 M54 36 V64" stroke="var(--bg-surface, #0B0E14)" strokeWidth="2" />
          <path d="M28 44 C28 36 36 28 44 28 H56 C64 28 72 36 72 44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    // ── Hana (Void Walker / Assassin) ─────────────────────────────────────────
    case 'hana':
    case 'Assassin / Shadow':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Eclipse Crescent Moon & Dimensional Slash */}
          <path d="M68 18 C52 14 34 24 28 40 C22 56 32 74 48 80 C36 78 24 64 26 48 C28 32 42 20 68 18 Z" fill="currentColor" opacity="0.9" />
          <circle cx="52" cy="52" r="24" stroke="currentColor" strokeWidth="3" opacity="0.3" />
          {/* Cross slash blades */}
          <path d="M16 84 L84 16 M24 22 L78 76" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M16 84 L84 16 M24 22 L78 76" stroke="var(--bg-surface, #0B0E14)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    // ── Mira (Cursed Sage / Dark Mage) ────────────────────────────────────────
    case 'mira':
    case 'Dark Mage / Curse':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Runic Hexagram & All-Seeing Demonic Eye */}
          <polygon points="50,14 82,68 18,68" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
          <polygon points="50,86 82,32 18,32" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
          {/* Eye */}
          <path d="M22 50 C34 32 66 32 78 50 C66 68 34 68 22 50 Z" fill="currentColor" />
          <circle cx="50" cy="50" r="11" fill="var(--bg-surface, #0B0E14)" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>
      );

    // ── Gale (Wild Tempest / Berserker) ────────────────────────────────────────
    case 'gale':
    case 'Berserker / Wild':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Twin Berserker Axes over Tornado Vortex */}
          <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="12 6" opacity="0.3" />
          <path d="M22 24 C30 16 42 16 50 24 L78 52 C86 60 86 72 78 80 L76 78 C68 70 68 58 76 50 L48 22 C40 14 28 14 20 22 Z" fill="currentColor" opacity="0.7" />
          <path d="M78 24 C70 16 58 16 50 24 L22 52 C14 60 14 72 22 80 L24 78 C32 70 32 58 24 50 L52 22 C60 14 72 14 80 22 Z" fill="currentColor" opacity="0.9" />
          <circle cx="50" cy="50" r="8" fill="currentColor" stroke="var(--bg-surface, #0B0E14)" strokeWidth="3" />
        </svg>
      );

    // ── Game Brand Logo (Crossed Plasma Blades & Burst) ───────────────────────
    case 'game-logo':
    case 'swords':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          {/* Blade 1 */}
          <path d="M20 80 L76 24 L82 28 L26 84 Z" fill="currentColor" opacity="0.9" />
          <path d="M76 24 L86 14 L86 24 Z" fill="currentColor" />
          <line x1="22" y1="82" x2="32" y2="72" stroke="var(--bg-surface, #0B0E14)" strokeWidth="3" />
          {/* Blade 2 */}
          <path d="M80 80 L24 24 L18 28 L74 84 Z" fill="currentColor" opacity="0.9" />
          <path d="M24 24 L14 14 L24 14 Z" fill="currentColor" />
          <line x1="78" y1="82" x2="68" y2="72" stroke="var(--bg-surface, #0B0E14)" strokeWidth="3" />
          {/* Clash Spark */}
          <circle cx="50" cy="50" r="8" fill="currentColor" />
          <path d="M50 34 L54 46 L66 50 L54 54 L50 66 L46 54 L34 50 L46 46 Z" fill="var(--bg-surface, #0B0E14)" />
        </svg>
      );

    // ── Shield Icon (Team / Defense) ──────────────────────────────────────────
    case 'shield':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10 L84 24 V52 C84 74 68 88 50 94 C32 88 16 74 16 52 V24 L50 10 Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
          <path d="M50 24 L72 34 V52 C72 68 60 78 50 82 C40 78 28 68 28 52 V34 L50 24 Z" fill="currentColor" />
        </svg>
      );

    // ── Target Icon (Selection / Step 1) ──────────────────────────────────────
    case 'target':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" opacity="0.3" />
          <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="6" opacity="0.7" />
          <circle cx="50" cy="50" r="10" fill="currentColor" />
          <path d="M50 6 V20 M50 80 V94 M6 50 H20 M80 50 H94" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    // ── Trophy (Victory / Honor) ──────────────────────────────────────────────
    case 'trophy':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M26 20 H74 V44 C74 60 62 70 50 72 C38 70 26 60 26 44 V20 Z" fill="currentColor" />
          <path d="M74 26 H84 C88 26 90 30 90 36 C90 46 82 52 74 52" stroke="currentColor" strokeWidth="6" fill="none" />
          <path d="M26 26 H16 C12 26 10 30 10 36 C10 46 18 52 26 52" stroke="currentColor" strokeWidth="6" fill="none" />
          <rect x="36" y="70" width="28" height="10" fill="currentColor" opacity="0.8" />
          <rect x="24" y="80" width="52" height="10" rx="4" fill="currentColor" />
        </svg>
      );

    // ── Handshake / Draw ──────────────────────────────────────────────────────
    case 'handshake':
    case 'draw':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" opacity="0.3" />
          <path d="M30 60 L44 46 L54 56 L70 40 L60 30 L44 46 L34 36 L20 50 Z" fill="currentColor" />
          <path d="M54 56 L64 66 L78 52 L70 44 Z" fill="currentColor" opacity="0.7" />
        </svg>
      );

    // ── Skull / Defeat ────────────────────────────────────────────────────────
    case 'skull':
    case 'defeat':
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 16 C30 16 18 30 18 50 C18 64 26 74 32 78 V88 H68 V78 C74 74 82 64 82 50 C82 30 70 16 50 16 Z" fill="currentColor" />
          <circle cx="36" cy="52" r="8" fill="var(--bg-surface, #0B0E14)" />
          <circle cx="64" cy="52" r="8" fill="var(--bg-surface, #0B0E14)" />
          <path d="M46 66 L50 58 L54 66 Z" fill="var(--bg-surface, #0B0E14)" />
          <path d="M38 82 V88 M46 82 V88 M54 82 V88 M62 82 V88" stroke="var(--bg-surface, #0B0E14)" strokeWidth="3" />
        </svg>
      );

    // ── Default Fallback Logo ─────────────────────────────────────────────────
    default:
      return (
        <svg viewBox="0 0 100 100" style={style} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="4" opacity="0.4" />
          <polygon points="50,14 82,78 18,78" fill="currentColor" opacity="0.8" />
          <circle cx="50" cy="56" r="10" fill="var(--bg-surface, #0B0E14)" />
        </svg>
      );
  }
};
