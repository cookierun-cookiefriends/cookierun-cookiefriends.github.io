import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(PROJECT_ROOT, 'data-source');
const OUT = path.join(PROJECT_ROOT, 'public/data');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const writeJson = (p, obj) =>
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'rounds'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'players'), { recursive: true });

const seasons = readJson(path.join(SRC, 'seasons.json'));
const meta = readJson(path.join(SRC, 'meta.json'));

// 라운드 평탄화 + 라운드 → 큰 시즌 매핑
const allRounds = [];
const roundToSeason = {};
for (const season of seasons) {
  for (const round of season.rounds) {
    allRounds.push(round);
    roundToSeason[round.id] = season;
  }
}

// 라운드별 record 읽기
const roundRecords = {};
for (const round of allRounds) {
  roundRecords[round.id] = readJson(
    path.join(SRC, 'records', `${round.id}.json`),
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
    for (const round of season.rounds) {
      for (const boss of round.activeBosses) {
        if (!validBossIds.has(boss)) {
          throw new Error(`Round ${round.id} references unknown boss "${boss}"`);
        }
        if (!season.activeBosses.includes(boss)) {
          throw new Error(
            `Round ${round.id}'s active boss "${boss}" is not in parent season ${season.id}`,
          );
        }
      }
      for (const r of roundRecords[round.id]) {
        if (!r.nickname) throw new Error(`Empty nickname in round ${round.id}`);
        for (const bossId of validBossIds) {
          const b = r.bosses[bossId];
          if (!b || typeof b.attempts !== 'number' || typeof b.damage !== 'number') {
            throw new Error(
              `Invalid boss data for ${r.nickname} in ${round.id}.${bossId}`,
            );
          }
          if (b.attempts < 0 || b.attempts > meta.bosses[bossId].maxAttempts) {
            throw new Error(
              `attempts out of range for ${r.nickname} in ${round.id}.${bossId}: ${b.attempts}`,
            );
          }
          if (b.damage < 0) {
            throw new Error(
              `Negative damage for ${r.nickname} in ${round.id}.${bossId}`,
            );
          }
        }
      }
    }
  }
}
validate();

// 라운드별 split 파일
for (const round of allRounds) {
  const season = roundToSeason[round.id];
  writeJson(path.join(OUT, 'rounds', `${round.id}.json`), {
    round,
    season: {
      id: season.id,
      name: season.name,
      activeBosses: season.activeBosses,
    },
    records: roundRecords[round.id],
  });
}

// 플레이어별 history
const allNicknames = new Set();
for (const records of Object.values(roundRecords)) {
  for (const r of records) allNicknames.add(r.nickname);
}

// 플레이어별 history를 단일 패스로 수집 (라운드 × 레코드 한 번 순회)
const historyByNickname = new Map();
for (const nickname of allNicknames) historyByNickname.set(nickname, []);
for (const round of allRounds) {
  const season = roundToSeason[round.id];
  for (const r of roundRecords[round.id]) {
    historyByNickname.get(r.nickname).push({
      roundId: round.id,
      roundName: round.name,
      seasonId: season.id,
      seasonName: season.name,
      activeBosses: round.activeBosses,
      bosses: r.bosses,
    });
  }
}
for (const [nickname, history] of historyByNickname) {
  writeJson(path.join(OUT, 'players', `${nickname}.json`), { nickname, history });
}

// index: 큰 시즌 + 라운드 인라인
const index = {
  version: 2,
  updatedAt: new Date().toISOString().slice(0, 10),
  latestRoundId: allRounds[allRounds.length - 1].id,
  latestSeasonId: seasons[seasons.length - 1].id,
  seasons: seasons.map((s) => ({
    id: s.id,
    name: s.name,
    activeBosses: s.activeBosses,
    rounds: s.rounds.map((r) => ({
      id: r.id,
      name: r.name,
      activeBosses: r.activeBosses,
    })),
  })),
  players: [...allNicknames].sort((a, b) => a.localeCompare(b, 'ko')),
};
writeJson(path.join(OUT, 'index.json'), index);
writeJson(path.join(OUT, 'meta.json'), meta);

console.log(`✓ ${seasons.length} season(s), ${allRounds.length} round(s) → data/rounds/`);
console.log(`✓ ${allNicknames.size} player files → data/players/`);
console.log(`✓ index.json (latest round: ${index.latestRoundId}, ${index.players.length} players)`);
console.log(`✓ meta.json (${Object.keys(meta.bosses).length} bosses)`);
