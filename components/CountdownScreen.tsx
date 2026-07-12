import type { CountdownNumber } from "@/lib/countdown";
import styles from "./timeMaster.module.css";

type CountdownScreenProps = {
  value: CountdownNumber;
};

export function CountdownScreen({ value }: CountdownScreenProps) {
  return (
    <section
      aria-atomic="true"
      aria-live="assertive"
      className={`${styles.screen} ${styles.countdownScreen}`}
      aria-labelledby="countdown-title"
    >
      <h1 className={styles.visuallyHidden} id="countdown-title">計測開始までのカウントダウン</h1>
      <div aria-hidden="true" className={styles.countdownDial}>
        <span className={styles.countdownTick} />
        <span className={styles.countdownTick} />
        <span className={styles.countdownTick} />
        <span className={styles.countdownTick} />
        <span className={styles.countdownNumber} key={value}>{value}</span>
      </div>
      <p className={styles.countdownAnnouncement}>{value}</p>
      <p className={styles.countdownHint}>まもなく計測開始</p>
    </section>
  );
}
