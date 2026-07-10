"use client";

import { showNativePrivacyOptions } from "@/lib/nativeApp";
import styles from "./timeMaster.module.css";

const PRIVACY_POLICY_URL = "https://www.ymrlab.com/ja/privacy/time-master";
const CONTACT_EMAIL = "contact@ymrlab.com";

type AppInfoDialogProps = {
  onClose: () => void;
};

export function AppInfoDialog({ onClose }: AppInfoDialogProps) {
  return (
    <div aria-labelledby="app-info-title" aria-modal="true" className={styles.dialogBackdrop} role="dialog">
      <section className={styles.infoDialog}>
        <div className={styles.infoDialogHeader}>
          <div>
            <p className={styles.eyebrow}>TIME MASTER</p>
            <h2 id="app-info-title">アプリ情報</h2>
          </div>
          <button aria-label="アプリ情報を閉じる" className={styles.dialogCloseButton} onClick={onClose} type="button">×</button>
        </div>

        <dl className={styles.infoList}>
          <div><dt>アプリ名</dt><dd>時間マスター</dd></div>
          <div><dt>バージョン</dt><dd>1.0.0</dd></div>
          <div><dt>遊び方</dt><dd>時計を見ずに目標時間を体感で測り、「終了」を押します。</dd></div>
          <div><dt>ライセンス</dt><dd>MIT（アプリ本体）</dd></div>
        </dl>

        <div className={styles.infoActions}>
          <a className={styles.secondaryButton} href={PRIVACY_POLICY_URL} rel="noreferrer" target="_blank">プライバシーポリシー</a>
          <button className={styles.secondaryButton} onClick={() => void showNativePrivacyOptions()} type="button">プライバシー設定</button>
          <a className={styles.secondaryButton} href={`mailto:${CONTACT_EMAIL}`}>お問い合わせ</a>
        </div>
      </section>
    </div>
  );
}
