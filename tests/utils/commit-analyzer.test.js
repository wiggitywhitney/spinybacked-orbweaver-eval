import { describe, it, expect } from 'vitest';
import { isSafeGitRef } from '../../src/utils/commit-analyzer.js';

describe('isSafeGitRef', () => {
  it('accepts a valid SHA hash', () => {
    expect(isSafeGitRef('abc123def456')).toBe(true);
  });

  it('accepts HEAD', () => {
    expect(isSafeGitRef('HEAD')).toBe(true);
  });

  it('accepts HEAD with ancestor notation', () => {
    expect(isSafeGitRef('HEAD~1')).toBe(true);
    expect(isSafeGitRef('HEAD^2')).toBe(true);
  });

  it('accepts branch names with slashes', () => {
    expect(isSafeGitRef('origin/main')).toBe(true);
    expect(isSafeGitRef('feature/prd-33-testing')).toBe(true);
  });

  it('accepts tag names with dots', () => {
    expect(isSafeGitRef('v2.0.0-alpha.0')).toBe(true);
  });

  it('rejects null and undefined', () => {
    expect(isSafeGitRef(null)).toBe(false);
    expect(isSafeGitRef(undefined)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isSafeGitRef('')).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(isSafeGitRef(123)).toBe(false);
    expect(isSafeGitRef({})).toBe(false);
  });

  it('rejects shell metacharacters', () => {
    expect(isSafeGitRef('HEAD; rm -rf /')).toBe(false);
    expect(isSafeGitRef('$(whoami)')).toBe(false);
    expect(isSafeGitRef('ref`cmd`')).toBe(false);
    expect(isSafeGitRef('ref|pipe')).toBe(false);
  });

  it('rejects spaces', () => {
    expect(isSafeGitRef('my branch')).toBe(false);
  });
});
