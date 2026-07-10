"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNativeDebugInfo,
  resetNativeConsentForTesting,
  showNativePrivacyOptions,
  type NativeDebugInfo,
} from "@/lib/nativeApp";
import styles from "./timeMaster.module.css";

const PRIVACY_POLICY_URL = "https://www.ymrlab.com/ja/privacy/time-master";
const CONTACT_EMAIL = "contact@ymrlab.com";

type AppInfoDialogProps = {
  onClose: () => void;
};

function yesNo(value: boolean): string {
  return value ? "true" : "false";
}

export function AppInfoDialog({ onClose }: AppInfoDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [debugInfo, setDebugInfo] = useState<NativeDebugInfo | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const refreshDebugInfo = useCallback(async () => {
    setDebugInfo(await getNativeDebugInfo());
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refreshDebugInfo();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [refreshDebugInfo]);

  const handlePrivacyOptions = async () => {
    setIsBusy(true);
    const result = await showNativePrivacyOptions();
    setFeedback(result.message);
    await refreshDebugInfo();
    setIsBusy(false);
  };

  const handleConsentReset = async () => {
    setIsBusy(true);
    const result = await resetNativeConsentForTesting();
    setFeedback(result.message);
    await refreshDebugInfo();
    setIsBusy(false);
  };

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
          <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handlePrivacyOptions()} type="button">プライバシー設定</button>
          <a className={styles.secondaryButton} href={`mailto:${CONTACT_EMAIL}`}>お問い合わせ</a>
        </div>

        {feedback && <p aria-live="polite" className={styles.privacyFeedback}>{feedback}</p>}

        {debugInfo && (
          <section aria-labelledby="ad-debug-title" className={styles.debugPanel}>
            <div className={styles.debugHeader}>
              <h3 id="ad-debug-title">広告・同意デバッグ情報</h3>
              <button className={styles.compactButton} disabled={isBusy} onClick={() => void refreshDebugInfo()} type="button">更新</button>
            </div>
            <dl className={styles.debugList}>
              <div><dt>Build type</dt><dd>{debugInfo.buildType}</dd></div>
              <div><dt>AdMob mode</dt><dd>{debugInfo.adMobMode}</dd></div>
              <div><dt>AdMob App ID設定済み</dt><dd>{yesNo(debugInfo.appIdConfigured)}</dd></div>
              <div><dt>Banner ID設定済み</dt><dd>{yesNo(debugInfo.bannerIdConfigured)}</dd></div>
              <div><dt>MobileAds initialized</dt><dd>{yesNo(debugInfo.mobileAdsInitialized)}</dd></div>
              <div><dt>Consent status</dt><dd>{debugInfo.consentStatus}</dd></div>
              <div><dt>canRequestAds</dt><dd>{yesNo(debugInfo.canRequestAds)}</dd></div>
              <div><dt>Privacy options required</dt><dd>{debugInfo.privacyOptionsRequired}</dd></div>
              <div><dt>Last ad event</dt><dd>{debugInfo.lastAdEvent}</dd></div>
              <div><dt>Last ad error code</dt><dd>{debugInfo.lastAdErrorCode >= 0 ? debugInfo.lastAdErrorCode : "—"}</dd></div>
              <div><dt>Last ad error message</dt><dd>{debugInfo.lastAdErrorMessage || "—"}</dd></div>
              <div><dt>Last UMP error</dt><dd>{debugInfo.lastUmpError || "—"}</dd></div>
              <div><dt>現在画面が広告対象</dt><dd>{yesNo(debugInfo.currentScreenAdEligible)}</dd></div>
            </dl>
            <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handleConsentReset()} type="button">debug同意状態をリセット</button>
          </section>
        )}
      </section>
    </div>
  );
}
