import { Router } from 'express';
import { Team } from '../models/Team.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import type { TeamDoc, TeamSlot } from '@anime-showdown/shared-types';

const router = Router();

// All team routes require authentication
router.use(requireAuth);

// GET /api/teams — user's teams
router.get('/', async (req: AuthRequest, res) => {
  try {
    const teams = await Team.find({ userId: req.userId }).lean();
    const body: TeamDoc[] = teams.map(t => ({
      id: t._id.toString(),
      name: t.name,
      format: t.format ?? 'ou_6v6',
      slots: t.slots ?? t.characterIds.map(cid => ({ characterId: cid, moveIds: [] })),
      characterIds: t.characterIds,
      userId: t.userId,
      createdAt: t.createdAt.toISOString(),
    }));
    res.json(body);
  } catch (err) {
    console.error('[Teams] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/teams — create a new team
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, format = 'ou_6v6', slots, characterIds } = req.body as { name: string; format?: string; slots?: TeamSlot[]; characterIds?: string[] };
    
    const finalSlots: TeamSlot[] = slots && slots.length > 0 ? slots : (characterIds || []).map(id => ({ characterId: id, moveIds: [] }));
    const finalCharacterIds: string[] = finalSlots.map(s => s.characterId);

    if (!name || finalCharacterIds.length === 0) {
      return res.status(400).json({ error: 'name and at least 1 character are required' });
    }
    const team = await Team.create({ name, format, slots: finalSlots, characterIds: finalCharacterIds, userId: req.userId });
    const body: TeamDoc = {
      id: team.id,
      name: team.name,
      format: team.format ?? 'ou_6v6',
      slots: team.slots ?? [],
      characterIds: team.characterIds,
      userId: team.userId,
      createdAt: team.createdAt.toISOString(),
    };
    return res.status(201).json(body);
  } catch (err) {
    console.error('[Teams] POST error:', err);
    return res.status(500).json({ error: 'Failed to create team' });
  }
});

// PUT /api/teams/:id — update a team
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const update = { ...req.body };
    if (update.slots && Array.isArray(update.slots)) {
      update.characterIds = update.slots.map((s: TeamSlot) => s.characterId);
    }
    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!team) return res.status(404).json({ error: 'Team not found' });
    return res.json({
      id: team.id,
      name: team.name,
      format: team.format ?? 'ou_6v6',
      slots: team.slots ?? team.characterIds.map(cid => ({ characterId: cid, moveIds: [] })),
      characterIds: team.characterIds,
      userId: team.userId,
      createdAt: team.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[Teams] PUT error:', err);
    return res.status(500).json({ error: 'Failed to update team' });
  }
});

// DELETE /api/teams/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const deleted = await Team.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ error: 'Team not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('[Teams] DELETE error:', err);
    return res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
