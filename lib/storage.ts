import { TARGET_OPTIONS, type BestRecord, type BestRecords, type TargetMilliseconds } from "../types/timeMaster";

export const BEST_RECORDS_STORAGE_KEY = "time-master-best-records";

function isTargetMilliseconds(value: unknown): value is TargetMilliseconds {
  return TARGET_OPTIONS.some((option) => option.milliseconds === value);
}

function isBestRecord(value: unknown): value is BestRecord {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;
  return (
    isTargetMilliseconds(record.targetMs) &&
    typeof record.actualMs === "number" &&
    Number.isFinite(record.actualMs) &&
    typeof record.absoluteDifferenceMs === "number" &&
    Number.isFinite(record.absoluteDifferenceMs) &&
    record.absoluteDifferenceMs >= 0 &&
    typeof record.accuracy === "number" &&
    Number.isFinite(record.accuracy) &&
    typeof record.recordedAt === "string"
  );
}

export function readBestRecords(): BestRecords {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(BEST_RECORDS_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const records: BestRecords = {};
    for (const option of TARGET_OPTIONS) {
      const candidate = (parsed as Record<string, unknown>)[String(option.milliseconds)];
      if (isBestRecord(candidate) && candidate.targetMs === option.milliseconds) {
        records[option.milliseconds] = candidate;
      }
    }
    return records;
  } catch {
    return {};
  }
}

export function writeBestRecords(records: BestRecords): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(BEST_RECORDS_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function shouldReplaceBestRecord(
  current: BestRecord | undefined,
  candidate: BestRecord,
): boolean {
  return !current || candidate.absoluteDifferenceMs < current.absoluteDifferenceMs;
}
