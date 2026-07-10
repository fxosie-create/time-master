import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateMeasurementResult, formatAccuracy, formatDuration, formatSecondsFromMs, formatSignedDuration, getEvaluation } from "../lib/timeMaster";
import { readBestRecords, shouldReplaceBestRecord, writeBestRecords } from "../lib/storage";
import { MEASURING_MESSAGES, selectMeasuringMessage } from "../lib/measuringMessages";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("measuring messages", () => {
  it("contains exactly ten static messages and selects one deterministically", () => {
    expect(MEASURING_MESSAGES).toHaveLength(10);
    expect(selectMeasuringMessage(() => 0)).toBe(MEASURING_MESSAGES[0]);
    expect(selectMeasuringMessage(() => 0.9999)).toBe(MEASURING_MESSAGES[9]);
    expect(selectMeasuringMessage(() => 1)).toBe(MEASURING_MESSAGES[9]);
  });
});

describe("時間マスターの計測・判定ロジック", () => {
  it("60秒未満は秒、60秒以上は分・秒形式で小数点以下4桁に統一する", () => {
    expect(formatDuration(59.9999)).toBe("59.9999秒");
    expect(formatDuration(60)).toBe("1分0.0000秒");
    expect(formatDuration(61.2345)).toBe("1分1.2345秒");
    expect(formatDuration(196.4392)).toBe("3分16.4392秒");
    expect(formatDuration(300)).toBe("5分0.0000秒");
    expect(formatDuration(625.1234)).toBe("10分25.1234秒");
    expect(formatSignedDuration(-103.5608)).toBe("−1分43.5608秒");
    expect(formatSignedDuration(63.1234)).toBe("＋1分3.1234秒");
    expect(formatSecondsFromMs(7912.44)).toBe("7.9124秒");
  });

  it("早い・遅い誤差と正確率を算出する", () => {
    const early = calculateMeasurementResult(29_870, 30_000);
    expect(early.differenceMs).toBe(-130);
    expect(formatAccuracy(early.accuracy)).toBe("99.57");

    const late = calculateMeasurementResult(30_130, 30_000);
    expect(late.differenceMs).toBe(130);
    expect(formatAccuracy(late.accuracy)).toBe("99.57");
  });

  it("表示上0.0000秒なら完全一致として扱う", () => {
    const result = calculateMeasurementResult(10_000.049, 10_000);
    expect(result.isPerfectDisplay).toBe(true);
  });

  it("評価ランクの境界をミリ秒単位で判定する", () => {
    expect(getEvaluation(0)).toBe("神の時間感覚");
    expect(getEvaluation(50)).toBe("神の時間感覚");
    expect(getEvaluation(51)).toBe("時間マスター");
    expect(getEvaluation(200)).toBe("時間マスター");
    expect(getEvaluation(201)).toBe("すばらしい");
    expect(getEvaluation(500)).toBe("すばらしい");
    expect(getEvaluation(501)).toBe("おしい");
    expect(getEvaluation(1000)).toBe("おしい");
    expect(getEvaluation(1001)).toBe("もう一度挑戦");
  });

  it("正確率を0から100の範囲に収める", () => {
    expect(calculateMeasurementResult(10_000, 10_000).accuracy).toBe(100);
    expect(calculateMeasurementResult(40_000, 10_000).accuracy).toBe(0);
  });
});

describe("自己ベストの端末内保存", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("目標時間ごとの複数記録を保存・読み込みできる", () => {
    const records = {
      10000: {
        targetMs: 10000 as const,
        actualMs: 10080,
        absoluteDifferenceMs: 80,
        accuracy: 99.2,
        recordedAt: "2026-07-10T00:00:00.000Z",
      },
      30000: {
        targetMs: 30000 as const,
        actualMs: 29870,
        absoluteDifferenceMs: 130,
        accuracy: 99.57,
        recordedAt: "2026-07-10T00:00:00.000Z",
      },
    };

    expect(writeBestRecords(records)).toBe(true);
    expect(readBestRecords()).toEqual(records);
  });

  it("壊れた保存データを空の記録として安全に扱う", () => {
    storage.setItem("time-master-best-records", "{壊れたJSON");
    expect(readBestRecords()).toEqual({});
  });

  it("表示上の誤差が同じでも、丸め前の誤差で自己ベストを比較する", () => {
    const current = {
      targetMs: 10000 as const,
      actualMs: 10000.049,
      absoluteDifferenceMs: 0.049,
      accuracy: 99.99951,
      recordedAt: "2026-07-10T00:00:00.000Z",
    };
    const candidate = {
      ...current,
      actualMs: 10000.04,
      absoluteDifferenceMs: 0.04,
    };

    expect(formatSecondsFromMs(current.absoluteDifferenceMs)).toBe("0.0000秒");
    expect(formatSecondsFromMs(candidate.absoluteDifferenceMs)).toBe("0.0000秒");
    expect(shouldReplaceBestRecord(current, candidate)).toBe(true);
  });
});
