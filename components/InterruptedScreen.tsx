import styles from "./timeMaster.module.css";

type InterruptedScreenProps = {
  onRetry: () => void;
};

export function InterruptedScreen({ onRetry }: InterruptedScreenProps) {
  return (
    <section aria-live="assertive" className={`${styles.screen} ${styles.interruptedScreen}`} aria-labelledby="interrupted-title">
      <p aria-hidden="true" className={styles.interruptedIcon}>!</p>
      <h1 className={styles.resultHeading} id="interrupted-title">計測を中断しました</h1>
      <p className={styles.interruptedMessage}>画面が非表示になったため、今回の計測を中断しました。</p>
      <button className={styles.primaryButton} onClick={onRetry} type="button">もう一度挑戦</button>
    </section>
  );
}
