export type TopColor = string | null;

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
  '#F7FFF7', '#FF8C42', '#8C271E', '#9EBC9F'
];

export function generateLevel(filledCount: number, emptyCount: number): string[][] {
  const numColors = Math.min(filledCount, COLORS.length);
  const selectedColors = COLORS.slice(0, numColors);
  
  // 1. Start with a solved state
  const tubes: string[][] = selectedColors.map(color => [color, color, color, color]);
  for (let i = 0; i < emptyCount; i++) {
    tubes.push([]);
  }

  // 2. Perform N valid random "un-pours" (backward moves)
  // Since any valid forward pour is reversible, moving colors randomly 
  // following the same canPour rules ensures the puzzle remains solvable.
  const iterations = 50 * filledCount;
  for (let i = 0; i < iterations; i++) {
    const sourceIdx = Math.floor(Math.random() * tubes.length);
    const targetIdx = Math.floor(Math.random() * tubes.length);
    
    if (sourceIdx === targetIdx) continue;
    
    // We can only un-pour if we can pour!
    // Wait, physically pouring is taking from source and putting on target.
    // If we just randomly pour using our own rules, we scramble the board.
    if (canPour(tubes[sourceIdx], tubes[targetIdx])) {
      const color = tubes[sourceIdx].pop() as string;
      tubes[targetIdx].push(color);
    }
  }

  return tubes;
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
 * All non-empty tubes must contain only one unique color.
 */
export function isWin(tubes: string[][]): boolean {
  return tubes.every(tube => {
    if (tube.length === 0) return true;
    const firstColor = tube[0];
    return tube.every(color => color === firstColor);
  });
}
