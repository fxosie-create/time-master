import { getTargetLabel } from "@/lib/timeMaster";
import { getMeasuringMessageLines } from "@/lib/measuringMessages";
import type { TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type MeasuringScreenProps = {
  targetMs: TargetMilliseconds;
  message: string;
  onFinish: () => void;
};

export function MeasuringScreen({ targetMs, message, onFinish }: MeasuringScreenProps) {
  const messageLines = getMeasuringMessageLines(message);

  return (
    <section className={`${styles.screen} ${styles.measuringScreen}`} aria-labelledby="measuring-title">
      <h1 aria-label={message} className={styles.measuringCopy} id="measuring-title">
        {messageLines.map((line) => (
          <span aria-hidden="true" className={styles.measuringCopyLine} key={line}>{line}</span>
        ))}
      </h1>
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
