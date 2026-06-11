import { useQuery } from '@tanstack/react-query';
import {
  fetchIndex,
  fetchMeta,
  fetchRound,
  fetchPatchnotes,
  fetchNotice,
} from '@/lib/data';

export const useIndex = () =>
  useQuery({ queryKey: ['index'], queryFn: fetchIndex });

export const useMeta = () =>
  useQuery({ queryKey: ['meta'], queryFn: fetchMeta });

export const useRound = (id: string | undefined) =>
  useQuery({
    queryKey: ['round', id],
    queryFn: () => fetchRound(id!),
    enabled: !!id,
  });

export const usePatchnotes = () =>
  useQuery({ queryKey: ['patchnotes'], queryFn: fetchPatchnotes });

export const useNotice = () =>
  useQuery({ queryKey: ['notice'], queryFn: fetchNotice });
