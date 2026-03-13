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
