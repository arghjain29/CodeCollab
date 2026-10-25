import { isWithin, parentOf, type FileEntry } from '@codecollab/shared';

export interface TreeNode {
  entry: FileEntry;
  name: string;
  children: TreeNode[];
}

/** Turn the flat, path-sorted list into a tree: folders first, then files, A–Z. */
export function buildTree(entries: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = [];
  const byPath = new Map<string, TreeNode>();
  for (const entry of [...entries].sort((a, b) => a.path.localeCompare(b.path))) {
    const node: TreeNode = { entry, name: entry.path.split('/').pop()!, children: [] };
    byPath.set(entry.path, node);
    const parent = byPath.get(parentOf(entry.path));
    (parent ? parent.children : root).push(node);
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort(
      (a, b) =>
        Number(b.entry.kind === 'folder') - Number(a.entry.kind === 'folder') ||
        a.name.localeCompare(b.name),
    );
    nodes.forEach((n) => sort(n.children));
  };
  sort(root);
  return root;
}

/** Rows currently on screen, top to bottom, with their parent. Used for arrow keys. */
export function visibleRows(tree: TreeNode[], expanded: Set<string>) {
  const rows: TreeNode[] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      rows.push(n);
      if (n.entry.kind === 'folder' && expanded.has(n.entry.path)) walk(n.children);
    }
  };
  walk(tree);
  return rows;
}

/** Where new items go for a selected entry: inside a folder, next to a file, or the root. */
export const folderFor = (entry: FileEntry | null | undefined) =>
  !entry ? '' : entry.kind === 'folder' ? entry.path : parentOf(entry.path);

/** Every folder from the root down to `folder`, so it can be revealed. */
export const ancestorsAndSelf = (folder: string) =>
  folder ? folder.split('/').map((_, i, parts) => parts.slice(0, i + 1).join('/')) : [];

/** Rewrite expanded folder paths after `from` was renamed or moved to `to`. */
export function remapExpanded(expanded: Set<string>, from: string, to: string) {
  const next = new Set<string>();
  for (const p of expanded) next.add(isWithin(p, from) ? to + p.slice(from.length) : p);
  return next;
}

/** Can `entry` be dropped into `folder`? Not where it already is, and not into itself. */
export const canDropInto = (entry: FileEntry, folder: string) =>
  parentOf(entry.path) !== folder && !(entry.kind === 'folder' && isWithin(folder, entry.path));
