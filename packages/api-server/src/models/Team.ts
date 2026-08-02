import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  characterIds: string[];
  userId: string;
  createdAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    /** Ordered list of character IDs — first is used in battle (v1) */
    characterIds: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length >= 1 && v.length <= 3, 'Team must have 1–3 characters'],
    },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const Team = model<ITeam>('Team', TeamSchema);
