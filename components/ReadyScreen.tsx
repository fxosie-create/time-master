import { BestRecord } from "@/components/BestRecord";
import { TimeSelector } from "@/components/TimeSelector";
import type { BestRecords, TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type ReadyScreenProps = {
  targetMs: TargetMilliseconds;
  bestRecords: BestRecords;
  onTargetChange: (targetMs: TargetMilliseconds) => void;
  onStart: () => void;
};

export function ReadyScreen({
  targetMs,
  bestRecords,
  onTargetChange,
  onStart,
}: ReadyScreenProps) {
  return (
    <section className={styles.screen} aria-labelledby="app-title">
      <header className={styles.headingGroup}>
        <p className={styles.eyebrow}>TIME MASTER</p>
        <h1 className={styles.title} id="app-title">時間マスター</h1>
        <p className={styles.subtitle}>
          時計を見ずに、あなたの体感だけで
          <br />
          ぴったりの時間を目指しましょう。
        </p>
      </header>

      <p className={styles.sectionLabel}>目標時間を選ぶ</p>
      <TimeSelector onSelect={onTargetChange} selectedTargetMs={targetMs} />
      <BestRecord record={bestRecords[targetMs]} targetMs={targetMs} />

      <button className={styles.primaryButton} onClick={onStart} type="button">
        開始
      </button>
      <p className={styles.hint}>開始後は時間を表示しません。体感で「終了」を押してください。</p>
    </section>
  );
}
