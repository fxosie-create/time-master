import { TARGET_OPTIONS, type TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type TimeSelectorProps = {
  selectedTargetMs: TargetMilliseconds;
  onSelect: (targetMs: TargetMilliseconds) => void;
};

export function TimeSelector({ selectedTargetMs, onSelect }: TimeSelectorProps) {
  return (
    <div className={styles.timeGrid} aria-label="目標時間を選択">
      {TARGET_OPTIONS.map((option) => {
        const isSelected = option.milliseconds === selectedTargetMs;
        return (
          <button
            aria-pressed={isSelected}
            className={styles.timeButton}
            key={option.milliseconds}
            onClick={() => onSelect(option.milliseconds)}
            type="button"
          >
            {option.label}
            {isSelected && <span className={styles.selectedMark}>選択中</span>}
          </button>
        );
      })}
    </div>
  );
}
