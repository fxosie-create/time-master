import type {
  EvaluationRank,
  MeasurementResult,
  TargetMilliseconds,
} from "../types/timeMaster";

export function formatDuration(seconds: number): string {
  const absoluteSeconds = Math.abs(seconds) < 0.00005 ? 0 : Math.abs(seconds);

  if (absoluteSeconds < 60) {
    return `${absoluteSeconds.toFixed(4)}秒`;
  }

  const minutes = Math.floor(absoluteSeconds / 60);
  const remainingSeconds = absoluteSeconds - minutes * 60;
  return `${minutes}分${remainingSeconds.toFixed(4)}秒`;
}

export function formatSignedDuration(seconds: number): string {
  if (Math.abs(seconds) < 0.00005) return "0.0000秒";
  if (seconds < 0) return `−${formatDuration(seconds)}`;
  return `＋${formatDuration(seconds)}`;
}

export function formatSecondsFromMs(milliseconds: number): string {
  return formatDuration(milliseconds / 1000);
}

export function formatAccuracy(accuracy: number): string {
  return Math.min(100, Math.max(0, accuracy)).toFixed(2);
}

export function getEvaluation(absoluteDifferenceMs: number): EvaluationRank {
  if (absoluteDifferenceMs <= 50) return "神の時間感覚";
  if (absoluteDifferenceMs <= 200) return "時間マスター";
  if (absoluteDifferenceMs <= 500) return "すばらしい";
  if (absoluteDifferenceMs <= 1000) return "おしい";
  return "もう一度挑戦";
}

export function calculateMeasurementResult(
  elapsedMs: number,
  targetMs: TargetMilliseconds,
): MeasurementResult {
  const safeElapsedMs = Math.max(0, elapsedMs);
  const differenceMs = safeElapsedMs - targetMs;
  const absoluteDifferenceMs = Math.abs(differenceMs);
  const targetSeconds = targetMs / 1000;
  const absoluteDifferenceSeconds = absoluteDifferenceMs / 1000;
  const accuracy = Math.min(
    100,
    Math.max(0, 100 - (absoluteDifferenceSeconds / targetSeconds) * 100),
  );
  const isPerfectDisplay = formatDuration(absoluteDifferenceSeconds) === "0.0000秒";

  return {
    targetMs,
    elapsedMs: safeElapsedMs,
    differenceMs,
    absoluteDifferenceMs,
    accuracy,
    evaluation: getEvaluation(absoluteDifferenceMs),
    isPerfectDisplay,
  };
}

export function getTargetLabel(targetMs: TargetMilliseconds): string {
  if (targetMs === 10_000) return "10秒";
  if (targetMs === 30_000) return "30秒";
  if (targetMs === 60_000) return "1分";
  return "5分";
}
