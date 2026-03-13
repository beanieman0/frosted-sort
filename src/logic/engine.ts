export type TopColor = string | null;

export function canPour(source: string[], target: string[]): boolean {
  if (source.length === 0) return false;
  if (target.length >= 4) return false;
  
  const sourceTop = source[source.length - 1];
  const targetTop = target.length > 0 ? target[target.length - 1] : null;
  
  if (targetTop === null) return true;
  return sourceTop === targetTop;
}
