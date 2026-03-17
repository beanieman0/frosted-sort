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

  const MAX_RETRIES = 50;
  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    // 1. Start with a solved state
    const tubes: string[][] = selectedColors.map(color => [color, color, color, color]);
    for (let i = 0; i < emptyCount; i++) {
      tubes.push([]);
    }

    // 2. Scramble using only VALID pours (enforcing canPour) so every resulting
    //    state is reachable from the solved state — guaranteeing solvability.
    const baseIterations = 80 * filledCount;
    const levelMultiplier = Math.min(5, 1 + (level / 20));
    const iterations = Math.floor(baseIterations * levelMultiplier);

    for (let i = 0; i < iterations; i++) {
      // Collect all moves that are legal under canPour
      const validMoves: [number, number][] = [];
      for (let s = 0; s < tubes.length; s++) {
        for (let t = 0; t < tubes.length; t++) {
          if (s !== t && canPour(tubes[s], tubes[t])) {
            validMoves.push([s, t]);
          }
        }
      }
      if (validMoves.length === 0) break;
      // Pick a random valid move and apply it
      const [s, t] = validMoves[Math.floor(Math.random() * validMoves.length)];
      tubes[t].push(tubes[s].pop() as string);
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

  // Fall back to best found attempt
  return bestTubes ?? selectedColors.map(color => [color, color, color, color]).concat(Array(emptyCount).fill([]));
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
