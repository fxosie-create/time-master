import { getTargetLabel } from "@/lib/timeMaster";
import type { TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type MeasuringScreenProps = {
  targetMs: TargetMilliseconds;
  onFinish: () => void;
};

export function MeasuringScreen({ targetMs, onFinish }: MeasuringScreenProps) {
  return (
    <section className={`${styles.screen} ${styles.measuringScreen}`} aria-labelledby="measuring-title">
      <h1 className={styles.measuringCopy} id="measuring-title">体感で時間を測ってください</h1>
      <p className={styles.targetPill}>目標：{getTargetLabel(targetMs)}</p>
      <button
        aria-label="計測を終了して結果を確認する"
        className={styles.finishButton}
        onClick={onFinish}
        type="button"
      >
        終了
      </button>
    </section>
  );
}
