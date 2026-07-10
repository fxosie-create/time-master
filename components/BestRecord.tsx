import { formatAccuracy, formatSecondsFromMs, getTargetLabel } from "@/lib/timeMaster";
import type { BestRecord as BestRecordType, TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type BestRecordProps = {
  targetMs: TargetMilliseconds;
  record: BestRecordType | undefined;
};

export function BestRecord({ targetMs, record }: BestRecordProps) {
  return (
    <section className={styles.bestRecord} aria-label={`${getTargetLabel(targetMs)}の自己ベスト`}>
      <h2 className={styles.bestRecordTitle}>{getTargetLabel(targetMs)}の自己ベスト</h2>
      {record ? (
        <p className={styles.bestRecordDetail}>
          誤差：<strong>{formatSecondsFromMs(record.absoluteDifferenceMs)}秒</strong>
          <br />
          結果：{formatSecondsFromMs(record.actualMs)}秒（正確率 {formatAccuracy(record.accuracy)}％）
        </p>
      ) : (
        <p className={styles.bestRecordEmpty}>まだ記録がありません</p>
      )}
    </section>
  );
}
