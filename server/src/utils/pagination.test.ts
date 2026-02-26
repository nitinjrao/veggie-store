import { parsePagination } from './pagination';

describe('parsePagination', () => {
  it('returns default values when no params are provided', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('parses valid page and limit', () => {
    const result = parsePagination({ page: '3', limit: '10' });
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps page to 1 when page < 1', () => {
    const result = parsePagination({ page: '0', limit: '10' });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('clamps page to 1 when page is negative', () => {
    const result = parsePagination({ page: '-5', limit: '10' });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('clamps limit to 50 when limit > 50', () => {
    const result = parsePagination({ page: '1', limit: '100' });
    expect(result.limit).toBe(50);
  });

  it('clamps limit to 1 when limit < 1', () => {
    const result = parsePagination({ page: '1', limit: '0' });
    // parseInt('0') is 0, which is falsy, so || defaultLimit kicks in -> 20
    expect(result.limit).toBe(20);
  });

  it('clamps negative limit to 1', () => {
    const result = parsePagination({ page: '1', limit: '-5' });
    expect(result.limit).toBe(1);
  });

  it('uses custom defaultLimit when provided', () => {
    const result = parsePagination({}, 10);
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('uses custom defaultLimit of 50 (max)', () => {
    const result = parsePagination({}, 50);
    expect(result.limit).toBe(50);
  });

  it('clamps custom defaultLimit to 50 when it exceeds max', () => {
    const result = parsePagination({}, 100);
    expect(result.limit).toBe(50);
  });

  it('falls back to defaults for non-numeric page string', () => {
    const result = parsePagination({ page: 'abc', limit: '10' });
    expect(result.page).toBe(1);
  });

  it('falls back to defaults for non-numeric limit string', () => {
    const result = parsePagination({ page: '2', limit: 'xyz' });
    expect(result.limit).toBe(20);
  });

  it('handles undefined page and limit values', () => {
    const result = parsePagination({ page: undefined, limit: undefined });
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('calculates skip correctly for page 2 with limit 15', () => {
    const result = parsePagination({ page: '2', limit: '15' });
    expect(result).toEqual({ page: 2, limit: 15, skip: 15 });
  });

  it('calculates skip correctly for page 5 with limit 10', () => {
    const result = parsePagination({ page: '5', limit: '10' });
    expect(result).toEqual({ page: 5, limit: 10, skip: 40 });
  });
});
