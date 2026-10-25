import type { FileEntry } from '@codecollab/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ env: { VITE_API_URL: 'http://api.test' } }));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));

const createFile = vi.fn();
const moveFile = vi.fn();
vi.mock('./files-api', () => ({
  useCreateFile: () => ({ mutateAsync: createFile }),
  useMoveFile: () => ({ mutateAsync: moveFile, mutate: moveFile }),
  useDeleteFile: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { FileTree } = await import('./file-tree');
const { ApiError } = await import('@/lib/api');

const entry = (path: string, kind: 'file' | 'folder' = 'file'): FileEntry => ({
  id: path.replace(/\W/g, '_').padEnd(24, '0'),
  path,
  kind,
  size: 0,
  updatedAt: '2026-10-25T00:00:00.000Z',
});

const ENTRIES = [entry('src', 'folder'), entry('src/app.ts'), entry('docs', 'folder')];

function setup(entries = ENTRIES) {
  const onOpen = vi.fn();
  render(
    <FileTree
      projectId="p1"
      entries={entries}
      activeFileId={null}
      canEdit
      peers={[]}
      onOpen={onOpen}
    />,
  );
  return { user: userEvent.setup(), onOpen };
}

beforeEach(() => {
  createFile.mockReset();
  moveFile.mockReset();
  toastError.mockReset();
});

describe('creating in place', () => {
  it('creates a file inside the selected folder from a typed name', async () => {
    const created = entry('src/util.ts');
    createFile.mockResolvedValue(created);
    const { user, onOpen } = setup();

    await user.click(screen.getByRole('treeitem', { name: /src/ }));
    await user.click(screen.getByRole('button', { name: 'New file' }));
    await user.type(screen.getByRole('textbox', { name: 'New file name' }), 'util.ts{Enter}');

    expect(createFile).toHaveBeenCalledWith({ path: 'src/util.ts', kind: 'file' });
    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(created));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('creates at the top level when nothing is selected', async () => {
    createFile.mockResolvedValue(entry('lib', 'folder'));
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'New folder' }));
    await user.type(screen.getByRole('textbox', { name: 'New folder name' }), 'lib{Enter}');

    expect(createFile).toHaveBeenCalledWith({ path: 'lib', kind: 'folder' });
  });

  it('rejects names with slashes without calling the server', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'New file' }));
    await user.type(screen.getByRole('textbox'), 'a/b.ts{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('Names can’t contain slashes');
    expect(createFile).not.toHaveBeenCalled();
  });

  it('keeps the box open with the server’s message on a conflict', async () => {
    createFile.mockRejectedValue(new ApiError(409, 'CONFLICT', '“src/app.ts” already exists'));
    const { user } = setup();

    await user.click(screen.getByRole('treeitem', { name: /src/ }));
    await user.click(screen.getByRole('button', { name: 'New file' }));
    await user.type(screen.getByRole('textbox'), 'app.ts{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
    expect(screen.getByRole('textbox')).toHaveValue('app.ts');
  });

  it('cancels on Escape', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'New file' }));
    await user.type(screen.getByRole('textbox'), 'x.ts{Escape}');

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(createFile).not.toHaveBeenCalled();
  });
});

describe('renaming in place', () => {
  it('renames a file within its folder', async () => {
    moveFile.mockResolvedValue(entry('src/main.ts'));
    const { user } = setup();

    await user.click(screen.getByRole('treeitem', { name: /src/ }));
    await user.click(screen.getByRole('button', { name: 'Actions for app.ts' }));
    await user.click(await screen.findByRole('menuitem', { name: /Rename/ }));
    const box = await screen.findByRole('textbox', { name: 'Rename app.ts' });
    await user.clear(box);
    await user.type(box, 'main.ts{Enter}');

    expect(moveFile).toHaveBeenCalledWith({ id: entry('src/app.ts').id, path: 'src/main.ts' });
  });
});

describe('drag and drop', () => {
  const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: '', dropEffect: '' });
  const row = (name: string | RegExp) =>
    screen.getByRole('treeitem', { name }).closest('[data-entry-id]')!;

  /** Drag the row named `from` and drop it on `target`. */
  function dragOnto(from: string | RegExp, target: Element) {
    const dt = dataTransfer();
    fireEvent.dragStart(row(from), { dataTransfer: dt });
    fireEvent.dragOver(target, { dataTransfer: dt });
    fireEvent.drop(target, { dataTransfer: dt });
  }

  it('moves a file into the folder it is dropped on', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('treeitem', { name: /src/ }));

    dragOnto('app.ts', row(/docs/));

    expect(moveFile).toHaveBeenCalledWith(
      { id: entry('src/app.ts').id, path: 'docs/app.ts' },
      expect.anything(),
    );
  });

  it('moves to the top level when dropped on empty space', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('treeitem', { name: /src/ }));

    dragOnto('app.ts', screen.getByRole('tree').parentElement!);

    expect(moveFile).toHaveBeenCalledWith(
      { id: entry('src/app.ts').id, path: 'app.ts' },
      expect.anything(),
    );
  });

  it('ignores dropping a folder into itself', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('treeitem', { name: /src/ }));

    dragOnto(/src/, row('app.ts'));

    expect(moveFile).not.toHaveBeenCalled();
  });

  it('refuses a move that would clash with an existing name', async () => {
    const { user } = setup([...ENTRIES, entry('docs/app.ts')]);
    await user.click(screen.getByRole('treeitem', { name: /src/ }));

    dragOnto('app.ts', row(/docs/));

    expect(moveFile).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('“app.ts” already exists in “docs”');
  });
});
