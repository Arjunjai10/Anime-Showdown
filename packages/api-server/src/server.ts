import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT ?? process.env.API_PORT ?? '3001', 10);
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/anime-showdown';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[API] Connected to MongoDB');
  } catch (err) {
    console.error('[API] MongoDB connection failed:', err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[API] Server running on http://localhost:${PORT}`);
  });
}

main();
