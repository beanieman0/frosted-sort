// All imports at the top — required for TypeScript/Jest to work correctly
import { canPour, generateLevel, getVisibleLayers, isWin } from './engine';

describe('Game Engine: canPour', () => {
  it('allows pouring into an empty tube', () => {
    expect(canPour(['red', 'blue'], [])).toBe(true);
  });
  
  it('prevents pouring into a full tube', () => {
    expect(canPour(['red'], ['red', 'red', 'red', 'red'])).toBe(false);
  });
  
  it('prevents pouring different colors', () => {
    expect(canPour(['blue', 'red'], ['green'])).toBe(false);
  });

  it('allows pouring same colors on top', () => {
    expect(canPour(['blue', 'green'], ['red', 'green'])).toBe(true);
  });

  it('prevents pouring from an empty tube', () => {
    expect(canPour([], ['blue'])).toBe(false);
  });
});

describe('Game Engine: generateLevel', () => {
  it('generates a valid level with correct tube count', () => {
    const level = generateLevel(3, 2);
    expect(level.length).toBe(5);
    
    // Total colors should be 3 * 4 = 12
    const allColors = level.flat();
    expect(allColors.length).toBe(12);
    
    // No tube should exceed capacity 4
    level.forEach((tube: string[]) => {
      expect(tube.length).toBeLessThanOrEqual(4);
    });
  });
});

describe('Game Engine: getVisibleLayers', () => {
  // The "hidden" mechanic: only the top 2 layers are visible, bottom 2 are hidden (frosted).
  it('returns all layers when tube has 2 or fewer', () => {
    expect(getVisibleLayers(['red', 'blue'], 2)).toEqual(['red', 'blue']);
  });

  it('returns only the top 2 when tube has 4 layers', () => {
    // Tube: [bottom, ?, visible, visible] — index 2 and 3 are visible (top)
    expect(getVisibleLayers(['blue', 'green', 'red', 'orange'], 2)).toEqual(['red', 'orange']);
  });

  it('returns empty array for empty tube', () => {
    expect(getVisibleLayers([], 2)).toEqual([]);
  });
});

describe('Game Engine: isWin', () => {
  it('detects win when all tubes are sorted (one color per tube)', () => {
    const sortedTubes = [
      ['red', 'red', 'red', 'red'],
      ['blue', 'blue', 'blue', 'blue'],
      [],
    ];
    expect(isWin(sortedTubes)).toBe(true);
  });

  it('detects no win when tubes still mixed', () => {
    const mixedTubes = [
      ['red', 'blue', 'red', 'blue'],
      ['blue', 'red', 'blue', 'red'],
      [],
    ];
    expect(isWin(mixedTubes)).toBe(false);
  });

  it('detects no win when tube is partially filled and mixed', () => {
    const partialTubes = [
      ['red', 'red'],
      ['blue', 'red'],
      [],
    ];
    expect(isWin(partialTubes)).toBe(false);
  });

  it('detects no win when all filled tubes have only one color but are partially filled', () => {
    const partialWin = [
      ['red', 'red'],
      ['blue', 'blue', 'blue', 'blue'],
      [],
    ];
    expect(isWin(partialWin)).toBe(false);
  });
});
