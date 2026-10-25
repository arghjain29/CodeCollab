import { describe, expect, it } from 'vitest';
import { extractMentionNames } from './chat.js';
import {
  FileNameSchema,
  FilePathSchema,
  baseName,
  isWithin,
  joinPath,
  parentOf,
  parseDocName,
} from './files.js';

describe('FileNameSchema', () => {
  it('accepts plain names and trims them', () => {
    expect(FileNameSchema.parse(' app.tsx ')).toBe('app.tsx');
    expect(FileNameSchema.parse('my file.d.ts')).toBe('my file.d.ts');
  });

  it('rejects slashes, dots-only and odd characters', () => {
    for (const bad of ['a/b.ts', 'a\\b', '.', '..', '', '   ', 'what?']) {
      expect(FileNameSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe('path helpers', () => {
  it('joins, splits and compares paths', () => {
    expect(joinPath('', 'a.ts')).toBe('a.ts');
    expect(joinPath('src/lib', 'a.ts')).toBe('src/lib/a.ts');
    expect(parentOf('src/lib/a.ts')).toBe('src/lib');
    expect(parentOf('a.ts')).toBe('');
    expect(baseName('src/lib/a.ts')).toBe('a.ts');
    expect(isWithin('src/lib/a.ts', 'src')).toBe(true);
    expect(isWithin('src', 'src')).toBe(true);
    expect(isWithin('srcs/a.ts', 'src')).toBe(false);
  });
});

describe('FilePathSchema', () => {
  it('accepts normal project paths and tidies slashes', () => {
    expect(FilePathSchema.parse('src/app.ts')).toBe('src/app.ts');
    expect(FilePathSchema.parse('src//components/')).toBe('src/components');
    expect(FilePathSchema.parse('@types/my file.d.ts')).toBe('@types/my file.d.ts');
  });

  it('rejects paths that could escape the project', () => {
    for (const bad of ['../etc/passwd', 'src/../../x', '/abs/path', 'a\\b', './x', 'a/./b', '']) {
      expect(FilePathSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe('parseDocName', () => {
  it('parses file and project document names', () => {
    expect(parseDocName('file:0123456789abcdef01234567')).toEqual({
      kind: 'file',
      id: '0123456789abcdef01234567',
    });
    expect(parseDocName('project:0123456789abcdef01234567')?.kind).toBe('project');
    expect(parseDocName('file:nope')).toBeNull();
    expect(parseDocName('other:0123456789abcdef01234567')).toBeNull();
  });
});

describe('extractMentionNames', () => {
  it('finds @names once each, ignoring emails', () => {
    expect(extractMentionNames('hey @Maya and @dev, ping @maya — mail me@x.com')).toEqual([
      'maya',
      'dev',
    ]);
  });
});
