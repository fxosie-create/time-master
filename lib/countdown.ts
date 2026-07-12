export const COUNTDOWN_DURATION_MS = 3_000;

export type CountdownNumber = 1 | 2 | 3;

export function getCountdownNumber(
  countdownEndTime: number,
  currentTime: number,
): CountdownNumber | null {
  const remainingMs = countdownEndTime - currentTime;
  if (remainingMs <= 0) return null;

  return Math.min(3, Math.max(1, Math.ceil(remainingMs / 1_000))) as CountdownNumber;
}

export function getNextCountdownDelay(
  countdownEndTime: number,
  currentTime: number,
): number {
  const remainingMs = Math.max(0, countdownEndTime - currentTime);
  const currentNumber = getCountdownNumber(countdownEndTime, currentTime);
  if (currentNumber === null) return 0;

  const untilNextNumber = remainingMs - (currentNumber - 1) * 1_000;
  return Math.max(16, Math.min(1_000, Math.ceil(untilNextNumber) + 4));
}
