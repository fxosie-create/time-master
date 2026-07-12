import { BestRecord } from "@/components/BestRecord";
import { TimeSelector } from "@/components/TimeSelector";
import type { BestRecords, TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type ReadyScreenProps = {
  targetMs: TargetMilliseconds;
  bestRecords: BestRecords;
  onTargetChange: (targetMs: TargetMilliseconds) => void;
  onStart: () => void;
  onOpenInfo: () => void;
};

export function ReadyScreen({
  targetMs,
  bestRecords,
  onTargetChange,
  onStart,
  onOpenInfo,
}: ReadyScreenProps) {
  return (
    <section className={styles.screen} aria-labelledby="app-title">
      <div className={styles.readyHeader}>
        <header className={styles.headingGroup}>
          <p className={styles.eyebrow}>TIME MASTER</p>
          <h1 className={styles.title} id="app-title">時間マスター</h1>
          <p className={styles.subtitle}>
            時計を見ずに、あなたの体感だけで
            <br />
            ぴったりの時間を目指しましょう。
          </p>
        </header>
        <button aria-label="アプリ情報を開く" className={styles.infoButton} onClick={onOpenInfo} type="button">i</button>
      </div>

      <p className={styles.sectionLabel}>目標時間を選ぶ</p>
      <TimeSelector onSelect={onTargetChange} selectedTargetMs={targetMs} />
      <BestRecord record={bestRecords[targetMs]} targetMs={targetMs} />

      <button className={styles.primaryButton} onClick={onStart} type="button">
        開始
      </button>
      <p className={styles.hint}>3秒のカウントダウン後は時間を表示しません。体感で「終了」を押してください。</p>
    </section>
  );
}
