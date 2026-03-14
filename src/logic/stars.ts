export function getStarRating(moves: number, colorCount: number): number {
  // A heuristic for the "optimal" number of moves. 
  // Each color has 4 segments. Roughly 4-5 moves per color minimum.
  const optimal = colorCount * 4.5;
  
  if (moves <= optimal) return 3;
  if (moves <= optimal * 1.5) return 2;
  return 1;
}
