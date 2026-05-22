export function calculateHotScore(score: number, createdAt: number): number {
  const ageHours = (Date.now() / 1000 - createdAt) / 3600;
  return score / Math.pow(ageHours + 2, 1.8);
}
