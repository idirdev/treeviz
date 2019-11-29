import { describe, it, expect } from 'vitest';
import { shouldIgnore, mergePatterns } from '../src/filters';
import { formatFileSize, formatPermissions } from '../src/stats';

describe('shouldIgnore', () => {
  it('ignores files matching exact pattern', () => {
    expect(shouldIgnore('node_modules', ['node_modules'])).toBe(true);
  });

  it('does not ignore non-matching files', () => {
    expect(shouldIgnore('src', ['node_modules'])).toBe(false);
  });

  it('matches wildcard patterns', () => {
    expect(shouldIgnore('file.test.ts', ['*.test.*'])).toBe(true);
    expect(shouldIgnore('file.ts', ['*.test.*'])).toBe(false);
  });

  it('matches single character wildcard', () => {
    expect(shouldIgnore('file1.ts', ['file?.ts'])).toBe(true);
    expect(shouldIgnore('file10.ts', ['file?.ts'])).toBe(false);
  });

  it('handles negation patterns', () => {
    expect(shouldIgnore('important.log', ['*.log', '!important.log'])).toBe(false);
    expect(shouldIgnore('debug.log', ['*.log', '!important.log'])).toBe(true);
  });

  it('handles empty patterns list', () => {
    expect(shouldIgnore('anything.ts', [])).toBe(false);
  });

  it('matches dotfiles', () => {
    expect(shouldIgnore('.env', ['.env'])).toBe(true);
    expect(shouldIgnore('.gitignore', ['.git*'])).toBe(true);
  });
});

describe('mergePatterns', () => {
  it('merges multiple pattern sets', () => {
    const result = mergePatterns(['a', 'b'], ['c', 'd']);
    expect(result).toEqual(['a', 'b', 'c', 'd']);
  });

  it('deduplicates patterns', () => {
    const result = mergePatterns(['a', 'b'], ['b', 'c']);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('handles empty sets', () => {
    const result = mergePatterns([], ['a', 'b'], []);
    expect(result).toEqual(['a', 'b']);
  });

  it('preserves order', () => {
    const result = mergePatterns(['x', 'y'], ['a', 'b']);
    expect(result).toEqual(['x', 'y', 'a', 'b']);
  });
});

describe('formatFileSize', () => {
  it('formats zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats KiB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KiB');
    expect(formatFileSize(1536)).toBe('1.5 KiB');
  });

  it('formats MiB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MiB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MiB');
  });

  it('formats GiB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GiB');
  });
});

describe('formatPermissions', () => {
  it('formats full permissions', () => {
    expect(formatPermissions(0o777)).toBe('rwxrwxrwx');
  });

  it('formats read-only permissions', () => {
    expect(formatPermissions(0o444)).toBe('r--r--r--');
  });

  it('formats typical file permissions', () => {
    expect(formatPermissions(0o644)).toBe('rw-r--r--');
  });

  it('formats executable permissions', () => {
    expect(formatPermissions(0o755)).toBe('rwxr-xr-x');
  });

  it('formats no permissions', () => {
    expect(formatPermissions(0o000)).toBe('---------');
  });
});
