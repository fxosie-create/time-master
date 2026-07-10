import { formatAccuracy, formatSecondsFromMs } from "@/lib/timeMaster";
import type { MeasurementResult } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type ResultScreenProps = {
  result: MeasurementResult;
  isNewBest: boolean;
  onRetry: () => void;
  onChooseAgain: () => void;
};

function getResultSentence(result: MeasurementResult): string {
  if (result.isPerfectDisplay) return "完璧です！";
  const amount = formatSecondsFromMs(result.absoluteDifferenceMs);
  return result.differenceMs < 0 ? `${amount}早かったです` : `${amount}遅かったです`;
}

function getDifferenceLabel(result: MeasurementResult): string {
  if (result.isPerfectDisplay) return "±0.0000秒";
  const prefix = result.differenceMs < 0 ? "－" : "＋";
  return `${prefix}${formatSecondsFromMs(result.absoluteDifferenceMs)}`;
}

export function ResultScreen({ result, isNewBest, onRetry, onChooseAgain }: ResultScreenProps) {
  return (
    <section aria-live="polite" className={`${styles.screen} ${styles.resultScreen}`} aria-labelledby="result-title">
      <h1 className={styles.resultHeading} id="result-title">結果発表</h1>
      {isNewBest && <p className={styles.newBest}>自己ベスト更新！</p>}

      <div className={styles.resultHero}>
        <p className={styles.resultHeroLabel}>実際の時間</p>
        <p className={result.isPerfectDisplay ? `${styles.resultElapsed} ${styles.resultPerfect}` : styles.resultElapsed}>
          {formatSecondsFromMs(result.elapsedMs)}
        </p>
        <p className={styles.resultSummary}>{getResultSentence(result)}</p>
      </div>

      <dl className={styles.resultRows}>
        <div className={styles.resultRow}>
          <dt>目標時間</dt>
          <dd>{formatSecondsFromMs(result.targetMs)}</dd>
        </div>
        <div className={styles.resultRow}>
          <dt>実際の時間</dt>
          <dd>{formatSecondsFromMs(result.elapsedMs)}</dd>
        </div>
        <div className={styles.resultRow}>
          <dt>誤差</dt>
          <dd>{getDifferenceLabel(result)}</dd>
        </div>
        <div className={styles.resultRow}>
          <dt>正確率</dt>
          <dd>{formatAccuracy(result.accuracy)}％</dd>
        </div>
        <div className={styles.resultRow}>
          <dt>評価</dt>
          <dd><strong>{result.evaluation}</strong></dd>
        </div>
      </dl>

      <div className={styles.resultActions}>
        <button className={styles.primaryButton} onClick={onRetry} type="button">もう一度</button>
        <button className={styles.secondaryButton} onClick={onChooseAgain} type="button">時間を選び直す</button>
      </div>
    </section>
  );
}
