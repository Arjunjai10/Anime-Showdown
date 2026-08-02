import { Schema, model, Document } from 'mongoose';

export interface ITeamSlot {
  characterId: string;
  moveIds: string[];
  relicId?: string;
}

export interface ITeam extends Document {
  name: string;
  format?: string;
  slots: ITeamSlot[];
  characterIds: string[];
  userId: string;
  createdAt: Date;
}

const TeamSlotSchema = new Schema<ITeamSlot>({
  characterId: { type: String, required: true },
  moveIds: { type: [String], default: [] },
  relicId: { type: String, required: false },
}, { _id: false });

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    format: { type: String, default: 'ou_6v6' },
    slots: {
      type: [TeamSlotSchema],
      default: [],
    },
    characterIds: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length >= 1 && v.length <= 6, 'Team must have 1–6 characters'],
    },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const Team = model<ITeam>('Team', TeamSchema);
