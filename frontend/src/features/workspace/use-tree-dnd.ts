import type { FileEntry } from '@codecollab/shared';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { canDropInto, folderFor } from './tree-model';

const MIME = 'application/x-codecollab-entry';
/** How long to hover over a closed folder while dragging before it opens. */
const OPEN_DELAY_MS = 600;

/**
 * Drag files and folders onto folders to move them, like VS Code. Dropping on a file
 * means "into that file's folder", and dropping on empty space means the top level.
 */
export function useTreeDnd({
  byId,
  enabled,
  onMove,
  onOpenFolder,
}: {
  byId: Map<string, FileEntry>;
  enabled: boolean;
  onMove: (entry: FileEntry, folder: string) => void;
  onOpenFolder: (path: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  /** Folder that would receive the drop: a path, '' for the top level, or null for none. */
  const [dropFolder, setDropFolder] = useState<string | null>(null);
  const hover = useRef<{ path: string; timer: number } | null>(null);

  const clearHover = () => {
    if (hover.current) window.clearTimeout(hover.current.timer);
    hover.current = null;
  };
  useEffect(() => clearHover, []);

  const reset = () => {
    clearHover();
    setDragId(null);
    setDropFolder(null);
  };

  const dragged = dragId ? byId.get(dragId) : undefined;

  const over = (e: DragEvent, folder: string, closedFolder?: string) => {
    if (!dragged || !canDropInto(dragged, folder)) {
      e.dataTransfer.dropEffect = 'none';
      setDropFolder(null);
      clearHover();
      return;
    }
    e.preventDefault(); // Allows the drop.
    e.dataTransfer.dropEffect = 'move';
    setDropFolder(folder);
    if (closedFolder !== hover.current?.path) {
      clearHover();
      if (closedFolder) {
        hover.current = {
          path: closedFolder,
          timer: window.setTimeout(() => onOpenFolder(closedFolder), OPEN_DELAY_MS),
        };
      }
    }
  };

  const drop = (e: DragEvent, folder: string) => {
    e.preventDefault();
    const entry = dragged;
    reset();
    if (entry && canDropInto(entry, folder)) onMove(entry, folder);
  };

  const rowProps = (entry: FileEntry, open: boolean) =>
    enabled
      ? {
          draggable: true,
          onDragStart: (e: DragEvent) => {
            e.dataTransfer.setData(MIME, entry.id);
            e.dataTransfer.effectAllowed = 'move';
            setDragId(entry.id);
          },
          onDragEnd: reset,
          onDragOver: (e: DragEvent) => {
            e.stopPropagation();
            const closed = entry.kind === 'folder' && !open ? entry.path : undefined;
            over(e, folderFor(entry), closed);
          },
          onDrop: (e: DragEvent) => {
            e.stopPropagation();
            drop(e, folderFor(entry));
          },
        }
      : {};

  const rootProps = enabled
    ? {
        onDragOver: (e: DragEvent) => over(e, ''),
        onDrop: (e: DragEvent) => drop(e, ''),
        onDragLeave: (e: DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropFolder(null);
        },
      }
    : {};

  return { dragId, dropFolder, rowProps, rootProps };
}
