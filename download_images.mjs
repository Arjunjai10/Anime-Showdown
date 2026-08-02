import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, 'packages', 'frontend', 'public', 'characters');

const targets = [
  { id: 'ryuu', query: 'Rengoku' },
  { id: 'sukuna', query: 'Sukuna' },
  { id: 'tanjiro', query: 'Tanjiro' }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://anilist.co/'
      }
    };

    client.get(url, options, (response) => {
      if (response.statusCode === 200 || response.statusCode === 304) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`Server responded with ${response.statusCode} for ${url}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function fetchFromAniList(search) {
  const query = `
    query ($search: String) {
      Page (perPage: 1) {
        characters (search: $search) {
          id
          name { full }
          image { large medium }
        }
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables: { search } })
  });
  if (!res.ok) throw new Error(`AniList error: ${res.statusText}`);
  const json = await res.json();
  const chars = json?.data?.Page?.characters;
  if (chars && chars.length > 0 && chars[0].image) {
    console.log(`Matched "${search}" -> ${chars[0].name.full}`);
    return chars[0].image.large || chars[0].image.medium;
  }
  throw new Error('No character found in AniList');
}

async function main() {
  console.log('Fetching final 3 characters using broadened Page query...');
  for (const item of targets) {
    const destPath = path.join(outputDir, `${item.id}.jpg`);
    try {
      const url = await fetchFromAniList(item.query);
      await downloadFile(url, destPath);
      console.log(` => Saved to public/characters/${item.id}.jpg`);
    } catch (err) {
      console.error(` => Failed ${item.id}: ${err.message}`);
    }
  }
}

main();
