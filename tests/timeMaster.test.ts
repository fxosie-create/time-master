import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateMeasurementResult, formatAccuracy, formatSecondsFromMs, getEvaluation } from "../lib/timeMaster";
import { readBestRecords, writeBestRecords } from "../lib/storage";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("時間マスターの計測・判定ロジック", () => {
  it("表示用の秒数を0.01秒単位に丸める", () => {
    expect(formatSecondsFromMs(29_873)).toBe("29.87");
    expect(formatSecondsFromMs(30_126)).toBe("30.13");
  });

  it("早い・遅い誤差と正確率を算出する", () => {
    const early = calculateMeasurementResult(29_870, 30_000);
    expect(early.differenceMs).toBe(-130);
    expect(formatAccuracy(early.accuracy)).toBe("99.57");

    const late = calculateMeasurementResult(30_130, 30_000);
    expect(late.differenceMs).toBe(130);
    expect(formatAccuracy(late.accuracy)).toBe("99.57");
  });

  it("表示上0.00秒なら完全一致として扱う", () => {
    const result = calculateMeasurementResult(10_004.9, 10_000);
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
});
