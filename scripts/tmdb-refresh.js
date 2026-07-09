// === tmdb-refresh.js ====================================
// Refresh missing fields from TMDB API after updating db.
//
// Usage:
// 1. Update FIELDS
// 2. make tmdb-refresh
// ========================================================

const { Client } = require('pg');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const REQUEST_DELAY_MS = 250;

const FIELDS = [{ column: 'description', extract: (detail) => detail.overview || null }];

if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is not set');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDetail(tmdbId, type) {
  const path = type === 'MOVIE' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  const res = await fetch(`${TMDB_BASE}${path}?api_key=${TMDB_API_KEY}&language=en-US`);
  if (!res.ok) throw new Error(`TMDB ${path} -> HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const missingClause = FIELDS.map((f) => `"${f.column}" IS NULL`).join(' OR ');
  const { rows } = await client.query(`SELECT id, "tmdbId", type, title FROM "Title" WHERE ${missingClause}`);

  console.log(`${rows.length} title(s) missing at least one field: ${FIELDS.map((f) => f.column).join(', ')}`);

  let updated = 0;
  for (const row of rows) {
    try {
      const detail = await fetchDetail(row.tmdbId, row.type);
      const setClause = FIELDS.map((f, i) => `"${f.column}" = $${i + 1}`).join(', ');
      const values = FIELDS.map((f) => f.extract(detail));
      await client.query(`UPDATE "Title" SET ${setClause} WHERE id = $${values.length + 1}`, [
        ...values,
        row.id,
      ]);
      updated++;
      console.log(`[ok] ${row.title} (id=${row.id})`);
    } catch (err) {
      console.error(`[err] ${row.title} (id=${row.id}): ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`Updated ${updated}/${rows.length} title(s).`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
