import { canPour, isWin } from './engine';

/**
 * Returns the index of the tube that should be highlighted for a tutorial hint.
 * If a tube is already selected, it finds a valid target.
 * If nothing is selected, it finds the first valid source tube that has a valid target.
 */
export function getTutorialHint(tubes: string[][], selectedIdx: number | null): number | null {
  if (isWin(tubes)) return null;

  if (selectedIdx !== null) {
    // Find target
    for (let i = 0; i < tubes.length; i++) {
      if (i !== selectedIdx && canPour(tubes[selectedIdx], tubes[i])) {
        return i; // Found a valid target
      }
    }
  } else {
    // Find source
    for (let i = 0; i < tubes.length; i++) {
      if (tubes[i].length === 0) continue;
      
      // Look for a valid target for this source
      for (let j = 0; j < tubes.length; j++) {
        if (i !== j && canPour(tubes[i], tubes[j])) {
          return i; // This source has a valid move
        }
      }
    }
  }

  return null;
}
