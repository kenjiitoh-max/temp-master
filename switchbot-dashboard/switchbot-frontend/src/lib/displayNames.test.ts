import { describe, expect, it } from 'vitest';
import { DISPLAY_NAMES, getDisplayName } from './displayNames';

describe('getDisplayName', () => {
  it('maps known device names to plant equipment names', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)');
    expect(getDisplayName('外')).toBe('屋外モニター (EM-1101)');
    expect(getDisplayName('ブロッチ Hot Spot')).toBe('フレアスタック (FS-1401)');
  });

  it('returns unknown names unchanged', () => {
    expect(getDisplayName('New Meter')).toBe('New Meter');
  });

  it('does not resolve Object.prototype keys', () => {
    expect(getDisplayName('toString')).toBe('toString');
    expect(getDisplayName('constructor')).toBe('constructor');
  });

  it('keeps all 18 legacy mappings', () => {
    expect(Object.keys(DISPLAY_NAMES)).toHaveLength(18);
  });
});
