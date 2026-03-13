/**
 * Phase 5: Playtest stress-test — verifies 10 auto-generated levels are solvable
 * using a BFS solver to confirm the game engine actually works end-to-end.
 */

import { generateLevel, canPour, isWin } from './engine';

function solveLevel(tubes: string[][]): boolean {
  const stringify = (t: string[][]) => JSON.stringify(t);
  const queue: string[][][] = [tubes.map(t => [...t])];
  const visited = new Set<string>([stringify(tubes)]);
  let iters = 0;

  while (queue.length > 0 && iters < 10000) {
    iters++;
    const current = queue.shift()!;
    if (isWin(current)) return true;

    for (let src = 0; src < current.length; src++) {
      for (let tgt = 0; tgt < current.length; tgt++) {
        if (src === tgt) continue;
        if (canPour(current[src], current[tgt])) {
          const next = current.map(t => [...t]);
          const color = next[src].pop()!;
          next[tgt].push(color);
          const key = stringify(next);
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(next);
          }
        }
      }
    }
  }
  return false;
}

describe('Phase 5 Playtest: Level solvability (10 levels)', () => {
  test.each(
    Array.from({ length: 10 }, (_, i) => [i + 1])
  )('Level %i is solvable and well-formed', (levelNum) => {
    const tubes = generateLevel(4, 2);

    // Structural invariants
    expect(tubes.length).toBe(6);                        // 4 filled + 2 empty
    expect(tubes.flat().length).toBe(16);                // 4 colors × 4 layers
    tubes.forEach(t => expect(t.length).toBeLessThanOrEqual(4));

    // Gameplay invariant: BFS solver must find a solution
    const solvable = solveLevel(tubes);
    expect(solvable).toBe(true);
  });
});
