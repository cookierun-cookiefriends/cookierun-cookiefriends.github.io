const BASE = import.meta.env.BASE_URL;

export type BossId = 'dragon' | 'angel' | 'machine';

export interface BossRecord {
  attempts: number;
  damage: number;
}

export interface PlayerBosses {
  dragon: BossRecord;
  angel: BossRecord;
  machine: BossRecord;
}

export interface PlayerRecord {
  nickname: string;
  bosses: PlayerBosses;
}

export interface SeasonMeta {
  id: string;
  name: string;
  activeBosses: BossId[];
}

export interface BossMeta {
  id: BossId;
  name: string;
  fullName: string;
  color: string;
  maxAttempts: number;
}

export interface Index {
  version: number;
  updatedAt: string;
  latestSeasonId: string;
  seasons: SeasonMeta[];
  players: string[];
}

export interface Meta {
  bosses: Record<BossId, BossMeta>;
  bossOrder: BossId[];
}

export interface SeasonData {
  season: SeasonMeta;
  records: PlayerRecord[];
}

export interface PlayerHistoryEntry {
  seasonId: string;
  seasonName: string;
  activeBosses: BossId[];
  bosses: PlayerBosses;
}

export interface PlayerData {
  nickname: string;
  history: PlayerHistoryEntry[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export const fetchIndex = () => fetchJson<Index>('data/index.json');
export const fetchMeta = () => fetchJson<Meta>('data/meta.json');
export const fetchSeason = (id: string) =>
  fetchJson<SeasonData>(`data/seasons/${encodeURIComponent(id)}.json`);
export const fetchPlayer = (nickname: string) =>
  fetchJson<PlayerData>(`data/players/${encodeURIComponent(nickname)}.json`);
