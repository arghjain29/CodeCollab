import {
  isWithin,
  type CreateFileInput,
  type FileEntry,
  type FileSnapshot,
} from '@codecollab/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toastError } from '../projects/api';

export const filesKey = (projectId: string) => ['projects', projectId, 'files'] as const;

export const filesQuery = (projectId: string) =>
  queryOptions({
    queryKey: filesKey(projectId),
    queryFn: () => api<FileEntry[]>(`/projects/${projectId}/files`),
  });

export const fetchSnapshot = (projectId: string) =>
  api<FileSnapshot[]>(`/projects/${projectId}/files/snapshot`);

const json = (body: unknown) => ({ body: JSON.stringify(body) });

export function useCreateFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFileInput) =>
      api<FileEntry>(`/projects/${projectId}/files`, { method: 'POST', ...json(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: filesKey(projectId) }),
  });
}

/** Rename or move. The tree updates straight away and rolls back if the server says no. */
export function useMoveFile(projectId: string) {
  const qc = useQueryClient();
  const key = filesKey(projectId);
  return useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) =>
      api<FileEntry>(`/projects/${projectId}/files/${id}`, { method: 'PATCH', ...json({ path }) }),
    onMutate: async ({ id, path }) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<FileEntry[]>(key);
      const from = before?.find((f) => f.id === id)?.path;
      if (before && from) {
        qc.setQueryData<FileEntry[]>(
          key,
          before.map((f) =>
            isWithin(f.path, from) ? { ...f, path: path + f.path.slice(from.length) } : f,
          ),
        );
      }
      return { before };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.before) qc.setQueryData(key, ctx.before);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteFile(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/projects/${projectId}/files/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: filesKey(projectId) }),
    onError: toastError,
  });
}
