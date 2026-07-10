export const TARGET_OPTIONS = [
  { milliseconds: 10_000, label: "10秒" },
  { milliseconds: 30_000, label: "30秒" },
  { milliseconds: 60_000, label: "1分" },
  { milliseconds: 300_000, label: "5分" },
] as const;

export type TargetMilliseconds = (typeof TARGET_OPTIONS)[number]["milliseconds"];

export type EvaluationRank =
  | "神の時間感覚"
  | "時間マスター"
  | "すばらしい"
  | "おしい"
  | "もう一度挑戦";

export type MeasurementResult = {
  targetMs: TargetMilliseconds;
  elapsedMs: number;
  differenceMs: number;
  absoluteDifferenceMs: number;
  accuracy: number;
  evaluation: EvaluationRank;
  isPerfectDisplay: boolean;
};

export type BestRecord = {
  targetMs: TargetMilliseconds;
  actualMs: number;
  absoluteDifferenceMs: number;
  accuracy: number;
  recordedAt: string;
};

export type BestRecords = Partial<Record<TargetMilliseconds, BestRecord>>;
