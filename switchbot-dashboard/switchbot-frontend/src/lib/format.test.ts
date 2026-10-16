import { describe, expect, it } from 'vitest';
import { formatClock, formatTimestamp, pad2 } from './format';

// Build timestamps from local time so the tests pass in any timezone.
const local = (y: number, m: number, d: number, h: number, min: number) =>
  new Date(y, m, d, h, min).toISOString();

describe('pad2', () => {
  it('zero-pads single digits', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
  });
});

describe('formatTimestamp', () => {
  // 2024-01-15 (Monday) 09:05
  const ts = local(2024, 0, 15, 9, 5);

  it('formats hour and day as HH:mm', () => {
    expect(formatTimestamp(ts, 'hour')).toBe('09:05');
    expect(formatTimestamp(ts, 'day')).toBe('09:05');
  });

  it('formats week as weekday + hour', () => {
    expect(formatTimestamp(ts, 'week')).toBe('Mon 09');
  });

  it('formats month and year as month + day', () => {
    expect(formatTimestamp(ts, 'month')).toBe('Jan 15');
    expect(formatTimestamp(local(2024, 11, 3, 23, 59), 'year')).toBe('Dec 3');
  });

  it('falls back to toLocaleString for unknown scales', () => {
    const unknown = 'decade' as unknown as Parameters<typeof formatTimestamp>[1];
    expect(formatTimestamp(ts, unknown)).toBe(new Date(ts).toLocaleString());
  });
});

describe('formatClock', () => {
  it('formats HH:mm:ss', () => {
    expect(formatClock(new Date(2024, 0, 1, 8, 3, 9))).toBe('08:03:09');
  });
});
