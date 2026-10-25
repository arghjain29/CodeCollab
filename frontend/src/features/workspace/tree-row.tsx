import { ChevronRight, FileCode2, FileJson, FileText, Folder, FolderOpen } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { presenceClass } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Peer } from './use-project-room';

export const indent = (depth: number) => ({ paddingLeft: `${depth * 12 + 6}px` });

export function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  const Icon =
    ext === 'json' ? FileJson : ['md', 'txt', 'mdx'].includes(ext ?? '') ? FileText : FileCode2;
  return <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />;
}

/** Chevron + icon at the start of a row. */
export function EntryIcon({
  kind,
  name,
  open,
}: {
  kind: 'file' | 'folder';
  name: string;
  open?: boolean;
}) {
  if (kind === 'file') {
    return (
      <>
        <span className="w-3.5 shrink-0" />
        <FileIcon name={name} />
      </>
    );
  }
  return (
    <>
      <ChevronRight
        className={cn('size-3.5 shrink-0 text-ink-muted transition-transform', open && 'rotate-90')}
        aria-hidden
      />
      {open ? (
        <FolderOpen className="size-4 shrink-0 text-ink-muted" aria-hidden />
      ) : (
        <Folder className="size-4 shrink-0 text-ink-muted" aria-hidden />
      )}
    </>
  );
}

/** One file or folder in the tree. While renaming, `editor` replaces the name. */
export function TreeRow({
  id,
  name,
  path,
  kind,
  depth,
  open,
  active,
  selected,
  tabbable,
  peers,
  editor,
  menu,
  onActivate,
  className,
  ...rest
}: {
  id: string;
  name: string;
  path: string;
  kind: 'file' | 'folder';
  depth: number;
  open: boolean;
  active: boolean;
  selected: boolean;
  /** The one row reached with Tab; arrows move between the rest. */
  tabbable: boolean;
  peers: Peer[];
  editor?: ReactNode;
  menu?: ReactNode;
  onActivate: () => void;
} & Omit<ComponentProps<'div'>, 'id'>) {
  return (
    <div
      data-entry-id={id}
      className={cn(
        'group flex items-center rounded-md pr-1 text-sm hover:bg-surface-2',
        selected && 'bg-surface-2',
        active && 'bg-cobalt/10 text-ink hover:bg-cobalt/15',
        className,
      )}
      {...rest}
    >
      {editor ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5" style={indent(depth)}>
          <EntryIcon kind={kind} name={name} open={open} />
          {editor}
        </div>
      ) : (
        <button
          type="button"
          role="treeitem"
          aria-expanded={kind === 'folder' ? open : undefined}
          aria-selected={selected}
          aria-current={active ? 'true' : undefined}
          tabIndex={tabbable ? 0 : -1}
          onClick={onActivate}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
          style={indent(depth)}
          title={path}
        >
          <EntryIcon kind={kind} name={name} open={open} />
          <span className="truncate">{name}</span>
        </button>
      )}

      {peers.length > 0 && (
        <span
          className="mr-1 flex -space-x-1"
          title={`${peers.map((p) => p.user.name).join(', ')} ${peers.length === 1 ? 'is' : 'are'} here`}
        >
          {peers.slice(0, 3).map((p) => (
            <span
              key={p.clientId}
              className={cn('size-2 rounded-full ring-2 ring-surface', presenceClass(p.user.id))}
            />
          ))}
        </span>
      )}

      {!editor && menu}
    </div>
  );
}
