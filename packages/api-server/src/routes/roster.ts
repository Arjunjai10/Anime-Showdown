import { Router } from 'express';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Character, Move } from '@anime-showdown/shared-types';

const router = Router();

// Load seed data once at startup
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../../../../data');

const characters: Character[] = JSON.parse(readFileSync(resolve(dataDir, 'characters.json'), 'utf-8'));
const moves: Move[] = JSON.parse(readFileSync(resolve(dataDir, 'moves.json'), 'utf-8'));
const movesById = new Map(moves.map(m => [m.id, m]));

// GET /api/roster — all characters (no moves expanded)
router.get('/', (_req, res) => {
  res.json(characters);
});

// GET /api/roster/moves/all — all moves (MUST come before /:id)
router.get('/moves/all', (_req, res) => {
  res.json(moves);
});

// GET /api/roster/:id — single character with moves resolved
router.get('/:id', (req, res) => {
  const char = characters.find(c => c.id === req.params.id);
  if (!char) return res.status(404).json({ error: 'Character not found' });
  return res.json({
    ...char,
    moves: char.moveIds.map(id => movesById.get(id)).filter(Boolean),
  });
});

export default router;
