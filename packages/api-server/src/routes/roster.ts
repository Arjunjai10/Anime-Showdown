import { Router } from 'express';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Character, Move } from '@anime-showdown/shared-types';

const router = Router();

// Load seed data once at startup — relative path from this file to data/
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../../../../data');

const characters: Character[] = JSON.parse(readFileSync(resolve(dataDir, 'characters.json'), 'utf-8'));
const moves: Move[] = JSON.parse(readFileSync(resolve(dataDir, 'moves.json'), 'utf-8'));
const movesById = new Map(moves.map(m => [m.id, m]));

// GET /api/roster — returns all characters with their moves resolved
router.get('/', (_req, res) => {
  const roster = characters.map(c => ({
    ...c,
    moves: c.moveIds.map(id => movesById.get(id)).filter(Boolean),
  }));
  res.json(roster);
});

// GET /api/roster/:id — single character
router.get('/:id', (req, res) => {
  const char = characters.find(c => c.id === req.params.id);
  if (!char) return res.status(404).json({ error: 'Character not found' });
  const charWithMoves = {
    ...char,
    moves: char.moveIds.map(id => movesById.get(id)).filter(Boolean),
  };
  return res.json(charWithMoves);
});

// GET /api/roster/moves/all — returns all moves (for client-side lookups)
router.get('/moves/all', (_req, res) => {
  res.json(moves);
});

export default router;
