import { formatDate, formatDateTime } from './formatting';

describe('formatDate', () => {
  it('formats an ISO date string into en-IN short date format', () => {
    const result = formatDate('2026-01-15T00:00:00.000Z');
    // en-IN format: "15 Jan 2026"
    expect(result).toContain('Jan');
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });

  it('formats a different date correctly', () => {
    const result = formatDate('2025-12-25T10:30:00.000Z');
    expect(result).toContain('Dec');
    expect(result).toContain('2025');
    expect(result).toContain('25');
  });

  it('does not include a time component', () => {
    const result = formatDate('2026-03-01T14:30:00.000Z');
    // Should not contain AM/PM or hour indicators
    expect(result).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it('handles date-only strings without time portion', () => {
    const result = formatDate('2026-06-10');
    expect(result).toContain('Jun');
    expect(result).toContain('2026');
  });
});

describe('formatDateTime', () => {
  it('formats an ISO date string into en-IN date-time format', () => {
    const result = formatDateTime('2026-01-15T14:30:00.000Z');
    // Should include date parts
    expect(result).toContain('Jan');
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });

  it('includes a time component with hours and minutes', () => {
    const result = formatDateTime('2026-01-15T14:30:00.000Z');
    // Should contain a colon-separated time like "8:00" or "20:00" depending on locale
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('handles midnight correctly', () => {
    const result = formatDateTime('2026-07-04T00:00:00.000Z');
    expect(result).toContain('Jul');
    expect(result).toContain('2026');
    // Should still have time component
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats a different date-time correctly', () => {
    const result = formatDateTime('2025-11-20T09:15:00.000Z');
    expect(result).toContain('Nov');
    expect(result).toContain('2025');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
