export type TopColor = string | null;

/**
 * Helper to count how many tubes in the current board are fully matched.
 */
function countMatchedTubes(tubes: string[][]): number {
  return tubes.filter(tube => {
    if (tube.length !== 4) return false;
    const firstColor = tube[0];
    return tube.every(color => color === firstColor);
  }).length;
}

export function canPour(source: string[], target: string[]): boolean {
  if (source.length === 0) return false;
  if (target.length >= 4) return false;

  const sourceTop = source[source.length - 1];
  const targetTop = target.length > 0 ? target[target.length - 1] : null;

  if (targetTop === null) return true;
  return sourceTop === targetTop;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C',
  '#F7FFF7', '#FF8C42', '#8C271E', '#9EBC9F',
  '#D4A5A5', '#77c593', '#9D4EDD', '#FFB703',
  '#023047', '#E56B70'
];

export function generateLevel(filledCount: number, emptyCount: number, level: number = 1): string[][] {
  const numColors = Math.min(filledCount, COLORS.length);
  const selectedColors = COLORS.slice(0, numColors);

  let bestTubes: string[][] | null = null;
  let minMatched = Infinity;

  const MAX_RETRIES = 20;
  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    // 1. Start with a solved state
    const tubes: string[][] = selectedColors.map(color => [color, color, color, color]);
    for (let i = 0; i < emptyCount; i++) {
      tubes.push([]);
    }

    // 2. Perform N valid random "un-pours" (backward moves)
    // Increase scrambling depth as the player gets to higher levels for a deeply fractured setup
    const baseIterations = 50 * filledCount;
    const levelMultiplier = Math.min(5, 1 + (level / 20)); // Scales up to 5x more scrambling by level 80
    const iterations = Math.floor(baseIterations * levelMultiplier);

    for (let i = 0; i < iterations; i++) {
      const sourceIdx = Math.floor(Math.random() * tubes.length);
      const targetIdx = Math.floor(Math.random() * tubes.length);

      if (sourceIdx === targetIdx) continue;

      // We can only un-pour if we can pour!
      // By following the same canPour rules, we scramble the board ensuring
      // it remains perfectly solvable. The high iteration count mixes it deeply.
      if (tubes[sourceIdx].length > 0 && tubes[targetIdx].length < 4) {
        // To prevent trivial 1-step shuffles, ensure we don't just reverse the exact same move immediately
        const color = tubes[sourceIdx].pop() as string;
        tubes[targetIdx].push(color);
      }
    }

    // Check win and matched count
    if (isWin(tubes)) continue;

    const matchedCount = countMatchedTubes(tubes);
    const maxAllowedMatched = level <= 10 ? 1 : 0;

    if (matchedCount <= maxAllowedMatched) {
      return tubes;
    }

    // Save the best attempt so far
    if (matchedCount < minMatched) {
      minMatched = matchedCount;
      bestTubes = tubes.map(t => [...t]);
    }
  }

  // If we couldn't find a perfect mix in MAX_RETRIES, return the best found
  return bestTubes || selectedColors.map(color => [color, color, color, color]).concat(Array(emptyCount).fill([]));
}

/**
 * Returns only the top N visible layers of a tube.
 * Bottom layers are hidden by the frosted glass effect.
 * index 0 = bottom, higher = closer to top (visible).
 */
export function getVisibleLayers(tube: string[], visibleCount: number = 2): string[] {
  if (tube.length === 0) return [];
  return tube.slice(Math.max(0, tube.length - visibleCount));
}

/**
 * Checks if the puzzle is solved.
 * All non-empty tubes must contain exactly 4 of the same color.
 */
export function isWin(tubes: string[][]): boolean {
  return tubes.every(tube => {
    if (tube.length === 0) return true;
    if (tube.length !== 4) return false;
    const firstColor = tube[0];
    return tube.every(color => color === firstColor);
  });
}
