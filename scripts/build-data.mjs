import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('data-source');
const OUT = path.resolve('public/data');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const writeJson = (p, obj) =>
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'seasons'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'players'), { recursive: true });

const seasons = readJson(path.join(SRC, 'seasons.json'));
const meta = readJson(path.join(SRC, 'meta.json'));

const seasonRecords = {};
for (const season of seasons) {
  seasonRecords[season.id] = readJson(
    path.join(SRC, 'records', `${season.id}.json`),
  );
}

function validate() {
  const validBossIds = new Set(Object.keys(meta.bosses));
  for (const season of seasons) {
    for (const boss of season.activeBosses) {
      if (!validBossIds.has(boss)) {
        throw new Error(`Season ${season.id} references unknown boss "${boss}"`);
      }
    }
    for (const r of seasonRecords[season.id]) {
      if (!r.nickname) throw new Error(`Empty nickname in season ${season.id}`);
      for (const bossId of validBossIds) {
        const b = r.bosses[bossId];
        if (!b || typeof b.attempts !== 'number' || typeof b.damage !== 'number') {
          throw new Error(
            `Invalid boss data for ${r.nickname} in ${season.id}.${bossId}`,
          );
        }
        if (b.attempts < 0 || b.attempts > meta.bosses[bossId].maxAttempts) {
          throw new Error(
            `attempts out of range for ${r.nickname} in ${season.id}.${bossId}: ${b.attempts}`,
          );
        }
        if (b.damage < 0) {
          throw new Error(
            `Negative damage for ${r.nickname} in ${season.id}.${bossId}`,
          );
        }
      }
    }
  }
}
validate();

for (const season of seasons) {
  writeJson(path.join(OUT, 'seasons', `${season.id}.json`), {
    season,
    records: seasonRecords[season.id],
  });
}

const allNicknames = new Set();
for (const records of Object.values(seasonRecords)) {
  for (const r of records) allNicknames.add(r.nickname);
}

for (const nickname of allNicknames) {
  const history = [];
  for (const season of seasons) {
    const found = seasonRecords[season.id].find((r) => r.nickname === nickname);
    if (found) {
      history.push({
        seasonId: season.id,
        seasonName: season.name,
        activeBosses: season.activeBosses,
        bosses: found.bosses,
      });
    }
  }
  writeJson(path.join(OUT, 'players', `${nickname}.json`), { nickname, history });
}

const index = {
  version: 1,
  updatedAt: new Date().toISOString().slice(0, 10),
  latestSeasonId: seasons[seasons.length - 1].id,
  seasons: seasons.map(({ id, name, activeBosses }) => ({
    id,
    name,
    activeBosses,
  })),
  players: [...allNicknames].sort((a, b) => a.localeCompare(b, 'ko')),
};
writeJson(path.join(OUT, 'index.json'), index);
writeJson(path.join(OUT, 'meta.json'), meta);

console.log(`✓ ${seasons.length} season files → data/seasons/`);
console.log(`✓ ${allNicknames.size} player files → data/players/`);
console.log(`✓ index.json (latest: ${index.latestSeasonId}, ${index.players.length} players)`);
console.log(`✓ meta.json (${Object.keys(meta.bosses).length} bosses)`);
