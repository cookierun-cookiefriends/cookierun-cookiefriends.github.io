import { useQuery } from '@tanstack/react-query';
import {
  fetchIndex,
  fetchMeta,
  fetchSeason,
  fetchPlayer,
} from '@/lib/data';

export const useIndex = () =>
  useQuery({ queryKey: ['index'], queryFn: fetchIndex });

export const useMeta = () =>
  useQuery({ queryKey: ['meta'], queryFn: fetchMeta });

export const useSeason = (id: string | undefined) =>
  useQuery({
    queryKey: ['season', id],
    queryFn: () => fetchSeason(id!),
    enabled: !!id,
  });

export const usePlayer = (nickname: string | undefined) =>
  useQuery({
    queryKey: ['player', nickname],
    queryFn: () => fetchPlayer(nickname!),
    enabled: !!nickname,
  });
