import { canPour } from './engine';

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

import { generateLevel } from './engine';

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
