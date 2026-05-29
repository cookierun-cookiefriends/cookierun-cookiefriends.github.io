const BASE = import.meta.env.BASE_URL;

export type BossId = 'dragon' | 'angel' | 'machine' | 'licorice';

export interface BossRecord {
  attempts: number;
  damage: number;
}

export interface PlayerBosses {
  dragon: BossRecord;
  angel: BossRecord;
  machine: BossRecord;
  licorice: BossRecord;
}

export interface RoundMeta {
  id: string;
  name: string;
  activeBosses: BossId[];
}

export interface SeasonMeta {
  id: string;
  name: string;
  activeBosses: BossId[];
  rounds: RoundMeta[];
}

export interface BossMeta {
  id: BossId;
  name: string;
  fullName: string;
  color: string;
  maxAttempts: number;
}

export interface PlayerRecord {
  nickname: string;
  bosses: PlayerBosses;
}

export interface Index {
  version: number;
  updatedAt: string;
  latestRoundId: string;
  latestSeasonId: string;
  seasons: SeasonMeta[];
  players: string[];
}

export interface Meta {
  bosses: Record<BossId, BossMeta>;
  bossOrder: BossId[];
}

export interface RoundData {
  round: RoundMeta;
  season: {
    id: string;
    name: string;
    activeBosses: BossId[];
  };
  records: PlayerRecord[];
}

export interface PlayerHistoryEntry {
  roundId: string;
  roundName: string;
  seasonId: string;
  seasonName: string;
  activeBosses: BossId[];
  bosses: PlayerBosses;
}

export interface PlayerData {
  nickname: string;
  history: PlayerHistoryEntry[];
}

// 패치노트 — type은 한국어 자유 문자열 (신규/개선/수정/성능/디자인/삭제 등)
export interface PatchChange {
  type: string;
  text: string;
}

export interface PatchVersion {
  version: string;
  title?: string;
  changes: PatchChange[];
}

export interface Patchnotes {
  versions: PatchVersion[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export const fetchIndex = () => fetchJson<Index>('data/index.json');
export const fetchMeta = () => fetchJson<Meta>('data/meta.json');
export const fetchRound = (id: string) =>
  fetchJson<RoundData>(`data/rounds/${encodeURIComponent(id)}.json`);
export const fetchPlayer = (nickname: string) =>
  fetchJson<PlayerData>(`data/players/${encodeURIComponent(nickname)}.json`);
export const fetchPatchnotes = () => fetchJson<Patchnotes>('patchnotes.json');
