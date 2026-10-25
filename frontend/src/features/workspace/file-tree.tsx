import { baseName, joinPath, parentOf, type FileEntry } from '@codecollab/shared';
import {
  ClipboardCopy,
  FilePlus,
  FolderPlus,
  ListCollapse,
  MoreHorizontal,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreateFile, useDeleteFile, useMoveFile } from './files-api';
import { InlineNameInput } from './inline-name-input';
import {
  ancestorsAndSelf,
  buildTree,
  folderFor,
  remapExpanded,
  visibleRows,
  type TreeNode,
} from './tree-model';
import { EntryIcon, TreeRow, indent } from './tree-row';
import type { Peer } from './use-project-room';
import { useTreeDnd } from './use-tree-dnd';

type Editing =
  | { mode: 'create'; kind: 'file' | 'folder'; parent: string }
  | { mode: 'rename'; id: string }
  | null;

interface MenuAction {
  key: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  destructive?: boolean;
  /** Starts with a separator line. */
  separated?: boolean;
  /** Wait for the menu to close first, because the action moves focus. */
  afterClose?: boolean;
  run: () => void;
}

export function FileTree({
  projectId,
  entries,
  activeFileId,
  canEdit,
  peers,
  onOpen,
}: {
  projectId: string;
  entries: FileEntry[];
  activeFileId: string | null;
  canEdit: boolean;
  peers: Peer[];
  onOpen: (entry: FileEntry) => void;
}) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const byPath = useMemo(() => new Set(entries.map((e) => e.path)), [entries]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<FileEntry | null>(null);
  const [menuEntry, setMenuEntry] = useState<FileEntry | null>(null);
  /** An action picked from a menu, run once the menu has closed and let go of focus. */
  const afterMenu = useRef<(() => void) | null>(null);

  const create = useCreateFile(projectId);
  const move = useMoveFile(projectId);

  const selected = selectedId ? byId.get(selectedId) : undefined;
  const listRef = useRef<HTMLUListElement>(null);
  const rows = useMemo(() => visibleRows(tree, expanded), [tree, expanded]);
  /** The row Tab lands on: the selection if it is on screen, else the first row. */
  const tabStop = rows.some((r) => r.entry.id === selectedId) ? selectedId : rows[0]?.entry.id;

  // Who is looking at which file (other people only).
  const peersByFile = useMemo(() => {
    const map = new Map<string, Peer[]>();
    for (const p of peers) {
      if (p.isMe || !p.fileId) continue;
      map.set(p.fileId, [...(map.get(p.fileId) ?? []), p]);
    }
    return map;
  }, [peers]);

  const expand = (paths: string[]) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const p of paths) next.add(p);
      return next;
    });

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const focusRow = (id: string) => {
    setSelectedId(id);
    listRef.current
      ?.querySelector<HTMLElement>(`[data-entry-id="${id}"] [role="treeitem"]`)
      ?.focus();
  };
  /** Focus a row once it is back on screen, e.g. after its name box closes. */
  const refocus = (id: string) => requestAnimationFrame(() => focusRow(id));

  // ---------- Actions ----------

  const startCreate = (kind: 'file' | 'folder', parent: string) => {
    expand(ancestorsAndSelf(parent));
    setEditing({ mode: 'create', kind, parent });
  };

  const submitCreate = async (kind: 'file' | 'folder', parent: string, name: string) => {
    const entry = await create.mutateAsync({ path: joinPath(parent, name), kind });
    setEditing(null);
    setSelectedId(entry.id);
    if (kind === 'file') onOpen(entry);
    else refocus(entry.id);
  };

  const submitRename = async (entry: FileEntry, name: string) => {
    const to = joinPath(parentOf(entry.path), name);
    await move.mutateAsync({ id: entry.id, path: to });
    setEditing(null);
    refocus(entry.id);
    if (entry.kind === 'folder') setExpanded((prev) => remapExpanded(prev, entry.path, to));
  };

  /** Drag and drop: move `entry` into `folder`, keeping its name. */
  const moveInto = (entry: FileEntry, folder: string) => {
    const name = baseName(entry.path);
    const to = joinPath(folder, name);
    if (byPath.has(to)) {
      toast.error(
        `“${name}” already exists in ${folder ? `“${baseName(folder)}”` : 'the top level'}`,
      );
      return;
    }
    expand(ancestorsAndSelf(folder));
    if (entry.kind === 'folder') setExpanded((prev) => remapExpanded(prev, entry.path, to));
    setSelectedId(entry.id);
    move.mutate(
      { id: entry.id, path: to },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : `Couldn’t move ${name}. Try again.`),
      },
    );
  };

  const dnd = useTreeDnd({
    byId,
    enabled: canEdit && !editing,
    onMove: moveInto,
    onOpenFolder: (path) => expand([path]),
  });

  const copyPath = (entry: FileEntry) =>
    navigator.clipboard.writeText(entry.path).then(
      () => toast.success('Path copied'),
      () => toast.error('Couldn’t copy the path'),
    );

  /** What the menus offer for an entry, or for empty space when `entry` is null. */
  const actionsFor = (entry: FileEntry | null): MenuAction[] => {
    const actions: MenuAction[] = [];
    if (canEdit && (!entry || entry.kind === 'folder')) {
      const parent = folderFor(entry);
      actions.push(
        {
          key: 'new-file',
          label: 'New file',
          icon: FilePlus,
          afterClose: true,
          run: () => startCreate('file', parent),
        },
        {
          key: 'new-folder',
          label: 'New folder',
          icon: FolderPlus,
          afterClose: true,
          run: () => startCreate('folder', parent),
        },
      );
    }
    if (entry) {
      if (canEdit) {
        actions.push({
          key: 'rename',
          label: 'Rename',
          icon: Pencil,
          shortcut: 'F2',
          separated: actions.length > 0,
          afterClose: true,
          run: () => setEditing({ mode: 'rename', id: entry.id }),
        });
      }
      actions.push({
        key: 'copy',
        label: 'Copy path',
        icon: ClipboardCopy,
        separated: !canEdit && actions.length > 0,
        run: () => void copyPath(entry),
      });
      if (canEdit) {
        actions.push({
          key: 'delete',
          label: 'Delete',
          icon: Trash2,
          shortcut: 'Del',
          destructive: true,
          separated: true,
          run: () => setDeleting(entry),
        });
      }
    }
    return actions;
  };

  const pick = (action: MenuAction) => {
    if (action.afterClose) afterMenu.current = action.run;
    else action.run();
  };

  const onMenuClosed = (e: Event) => {
    const run = afterMenu.current;
    if (!run) return;
    // Focus is about to go to the name box, so don't hand it back to the trigger.
    e.preventDefault();
    afterMenu.current = null;
    run();
  };

  // ---------- Rendering ----------

  const createRow = (parent: string, depth: number) =>
    editing?.mode === 'create' && editing.parent === parent ? (
      <li role="none" key="__new">
        <div className="flex items-center gap-1.5 rounded-md pr-1" style={indent(depth)}>
          <EntryIcon kind={editing.kind} name="" />
          <InlineNameInput
            label={editing.kind === 'file' ? 'New file name' : 'New folder name'}
            onSubmit={(name) => submitCreate(editing.kind, parent, name)}
            onCancel={() => setEditing(null)}
          />
        </div>
      </li>
    ) : null;

  const renderNode = (node: TreeNode, depth: number) => {
    const { entry } = node;
    const isFolder = entry.kind === 'folder';
    const isOpen = isFolder && expanded.has(entry.path);
    const renaming = editing?.mode === 'rename' && editing.id === entry.id;
    const newHere = createRow(entry.path, depth + 1);

    return (
      <li
        key={entry.id}
        role="none"
        className={cn(
          isFolder &&
            dnd.dropFolder === entry.path &&
            'rounded-md bg-cobalt/5 ring-1 ring-cobalt/30 ring-inset',
        )}
      >
        <TreeRow
          {...dnd.rowProps(entry, isOpen)}
          className={cn(dnd.dragId === entry.id && 'opacity-50')}
          id={entry.id}
          name={node.name}
          path={entry.path}
          kind={entry.kind}
          depth={depth}
          open={isOpen}
          active={entry.id === activeFileId}
          selected={entry.id === selectedId}
          tabbable={entry.id === tabStop}
          peers={peersByFile.get(entry.id) ?? []}
          onActivate={() => {
            setSelectedId(entry.id);
            if (isFolder) toggle(entry.path);
            else onOpen(entry);
          }}
          editor={
            renaming ? (
              <InlineNameInput
                label={`Rename ${node.name}`}
                initial={node.name}
                onSubmit={(name) => submitRename(entry, name)}
                onCancel={() => {
                  setEditing(null);
                  refocus(entry.id);
                }}
              />
            ) : undefined
          }
          menu={
            canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Actions for ${node.name}`}
                    className="rounded p-1 text-ink-muted opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface hover:text-ink data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent onCloseAutoFocus={onMenuClosed}>
                  {actionsFor(entry).map((a) => [
                    a.separated && <DropdownMenuSeparator key={`${a.key}-sep`} />,
                    <DropdownMenuItem
                      key={a.key}
                      destructive={a.destructive}
                      onSelect={() => pick(a)}
                    >
                      <a.icon /> {a.label}
                    </DropdownMenuItem>,
                  ])}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        />
        {isOpen && (node.children.length > 0 || newHere) && (
          <ul role="group">
            {newHere}
            {node.children.map((c) => renderNode(c, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  /** Arrow keys, Home/End, F2 and Delete, as in desktop editors. */
  const onTreeKeyDown = (e: KeyboardEvent) => {
    if (editing || e.altKey || e.ctrlKey || e.metaKey) return;
    const i = rows.findIndex((r) => r.entry.id === selectedId);
    const node = rows[i];
    const entry = node?.entry;
    const isOpenFolder = entry?.kind === 'folder' && expanded.has(entry.path);
    const go = (target: TreeNode | undefined) => target && focusRow(target.entry.id);

    switch (e.key) {
      case 'ArrowDown':
        go(i < 0 ? rows[0] : rows[i + 1]);
        break;
      case 'ArrowUp':
        go(i < 0 ? rows[0] : rows[i - 1]);
        break;
      case 'Home':
        go(rows[0]);
        break;
      case 'End':
        go(rows[rows.length - 1]);
        break;
      case 'ArrowRight':
        if (entry?.kind !== 'folder') return;
        if (!isOpenFolder) toggle(entry.path);
        else if (node?.children.length) go(rows[i + 1]);
        break;
      case 'ArrowLeft': {
        if (!entry) return;
        if (isOpenFolder) toggle(entry.path);
        else go(rows.find((r) => r.entry.path === parentOf(entry.path)));
        break;
      }
      case 'F2':
        if (!canEdit || !entry) return;
        setEditing({ mode: 'rename', id: entry.id });
        break;
      case 'Delete':
        if (!canEdit || !entry) return;
        setDeleting(entry);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  /** Right-click: remember what was clicked so the menu can offer the right actions. */
  const onContextMenu = (e: MouseEvent) => {
    const id = (e.target as Element).closest('[data-entry-id]')?.getAttribute('data-entry-id');
    const entry = id ? (byId.get(id) ?? null) : null;
    if (!entry && !canEdit) {
      e.preventDefault(); // Nothing to offer on empty space for viewers.
      return;
    }
    setMenuEntry(entry);
    setSelectedId(entry?.id ?? null);
  };

  /** A click on empty space clears the selection, so new items go to the top level. */
  const onBackgroundClick = (e: MouseEvent) => {
    if (!(e.target as Element).closest('[data-entry-id]')) setSelectedId(null);
  };

  const rootNew = createRow('', 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-xs font-semibold text-ink-muted">Files</h2>
        <div className="flex">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="New file"
                title="New file"
                onClick={() => startCreate('file', folderFor(selected))}
              >
                <FilePlus />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="New folder"
                title="New folder"
                onClick={() => startCreate('folder', folderFor(selected))}
              >
                <FolderPlus />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Collapse folders"
            title="Collapse folders"
            disabled={expanded.size === 0}
            onClick={() => setExpanded(new Set())}
          >
            <ListCollapse />
          </Button>
        </div>
      </div>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-1.5 pb-3',
              dnd.dropFolder === '' && 'bg-cobalt/5 ring-1 ring-cobalt/30 ring-inset',
            )}
            {...dnd.rootProps}
            onContextMenu={onContextMenu}
            onClick={onBackgroundClick}
          >
            {tree.length === 0 && !rootNew ? (
              <p className="px-3 py-6 text-sm text-ink-muted">
                {canEdit ? 'No files yet. Create one to start.' : 'This project has no files yet.'}
              </p>
            ) : (
              <ul ref={listRef} role="tree" aria-label="Project files" onKeyDown={onTreeKeyDown}>
                {rootNew}
                {tree.map((n) => renderNode(n, 0))}
              </ul>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent onCloseAutoFocus={onMenuClosed}>
          {actionsFor(menuEntry).map((a) => [
            a.separated && <ContextMenuSeparator key={`${a.key}-sep`} />,
            <ContextMenuItem
              key={a.key}
              destructive={a.destructive}
              shortcut={a.shortcut}
              onSelect={() => pick(a)}
            >
              <a.icon /> {a.label}
            </ContextMenuItem>,
          ])}
        </ContextMenuContent>
      </ContextMenu>

      <DeleteDialog
        projectId={projectId}
        entry={deleting}
        onClose={(deleted) => {
          if (deleted && deleting?.id === selectedId) setSelectedId(null);
          setDeleting(null);
        }}
      />
    </div>
  );
}

function DeleteDialog({
  projectId,
  entry,
  onClose,
}: {
  projectId: string;
  entry: FileEntry | null;
  onClose: (deleted: boolean) => void;
}) {
  const del = useDeleteFile(projectId);
  if (!entry) return null;
  const isFolder = entry.kind === 'folder';
  return (
    <Dialog open onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent
        title={`Delete ${baseName(entry.path)}?`}
        description={
          isFolder
            ? 'The folder and everything in it will be deleted for everyone. This can’t be undone.'
            : 'The file will be deleted for everyone. This can’t be undone.'
        }
      >
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            variant="danger"
            disabled={del.isPending}
            onClick={() =>
              del.mutate(entry.id, {
                onSuccess: () => {
                  toast.success(`Deleted ${baseName(entry.path)}`);
                  onClose(true);
                },
              })
            }
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
