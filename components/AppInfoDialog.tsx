"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNativeDebugInfo,
  isAndroidNativeApp,
  resetNativeConsentForTesting,
  runNativeDiagnostic,
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
    const info = await getNativeDebugInfo();
    setDebugInfo(info);
    if (isAndroidNativeApp() && !info) {
      setFeedback("Androidネイティブブリッジへ接続できません。最新の1.0.1 debug APKを再インストールしてください。");
    }
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

  const handleDiagnostic = async (
    method: Parameters<typeof runNativeDiagnostic>[0],
  ) => {
    setIsBusy(true);
    const result = await runNativeDiagnostic(method);
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
          <div><dt>バージョン</dt><dd>1.0.1</dd></div>
          <div><dt>遊び方</dt><dd>3秒のカウントダウン後、時計を見ずに目標時間を体感で測り、「終了」を押します。</dd></div>
          <div><dt>ライセンス</dt><dd>MIT（アプリ本体）</dd></div>
        </dl>

        <div className={styles.infoActions}>
          <a className={styles.secondaryButton} href={PRIVACY_POLICY_URL} rel="noreferrer" target="_blank">プライバシーポリシー</a>
          <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handlePrivacyOptions()} type="button">プライバシー設定</button>
          <a className={styles.secondaryButton} href={`mailto:${CONTACT_EMAIL}`}>お問い合わせ</a>
        </div>

        {feedback && <p aria-live="polite" className={styles.privacyFeedback}>{feedback}</p>}

        {debugInfo?.debug && (
          <section aria-labelledby="ad-debug-title" className={styles.debugPanel}>
            <div className={styles.debugHeader}>
              <h3 id="ad-debug-title">広告・同意デバッグ情報</h3>
              <button className={styles.compactButton} disabled={isBusy} onClick={() => void refreshDebugInfo()} type="button">更新</button>
            </div>
            <dl className={styles.debugList}>
              <div><dt>Build type</dt><dd>{debugInfo.buildType}</dd></div>
              <div><dt>Android build</dt><dd>{debugInfo.appVersion}</dd></div>
              <div><dt>AdMob mode</dt><dd>{debugInfo.adMobMode}</dd></div>
              <div><dt>AdMob App ID設定済み</dt><dd>{yesNo(debugInfo.appIdConfigured)}</dd></div>
              <div><dt>Banner ID設定済み</dt><dd>{yesNo(debugInfo.bannerIdConfigured)}</dd></div>
              <div><dt>BuildConfig App ID</dt><dd>{debugInfo.adMobAppId || "—"}</dd></div>
              <div><dt>Manifest App ID</dt><dd>{debugInfo.manifestAdMobAppId || "—"}</dd></div>
              <div><dt>Banner Unit ID</dt><dd>{debugInfo.bannerAdUnitId || "—"}</dd></div>
              <div><dt>MobileAds initialized</dt><dd>{yesNo(debugInfo.mobileAdsInitialized)}</dd></div>
              <div><dt>Consent status</dt><dd>{debugInfo.consentStatus}</dd></div>
              <div><dt>canRequestAds</dt><dd>{yesNo(debugInfo.canRequestAds)}</dd></div>
              <div><dt>Privacy options required</dt><dd>{debugInfo.privacyOptionsRequired}</dd></div>
              <div><dt>Last ad request screen</dt><dd>{debugInfo.lastAdLoadRequestScreen}</dd></div>
              <div><dt>Last ad event</dt><dd>{debugInfo.lastAdEvent}</dd></div>
              <div><dt>Last ad error code</dt><dd>{debugInfo.lastAdErrorCode >= 0 ? debugInfo.lastAdErrorCode : "—"}</dd></div>
              <div><dt>Last ad error domain</dt><dd>{debugInfo.lastAdErrorDomain || "—"}</dd></div>
              <div><dt>Last ad error message</dt><dd>{debugInfo.lastAdErrorMessage || "—"}</dd></div>
              <div><dt>Last UMP event</dt><dd>{debugInfo.lastUmpEvent}</dd></div>
              <div><dt>Last UMP error code</dt><dd>{debugInfo.lastUmpErrorCode >= 0 ? debugInfo.lastUmpErrorCode : "—"}</dd></div>
              <div><dt>Last UMP error message</dt><dd>{debugInfo.lastUmpErrorMessage || "—"}</dd></div>
              <div><dt>Native bridge status</dt><dd>{debugInfo.nativeBridgeStatus}</dd></div>
              <div><dt>Current screen</dt><dd>{debugInfo.currentScreen}</dd></div>
              <div><dt>Should show ad</dt><dd>{yesNo(debugInfo.shouldShowAd)}</dd></div>
              <div><dt>Ad container</dt><dd>{debugInfo.adContainerWidth}×{debugInfo.adContainerHeight}px / {debugInfo.adContainerVisibility}</dd></div>
              <div><dt>AdView attached</dt><dd>{yesNo(debugInfo.adViewAttached)}</dd></div>
              <div><dt>AdView Unit ID</dt><dd>{debugInfo.adViewUnitId || "—"}</dd></div>
              <div><dt>UMP test device hash</dt><dd>{debugInfo.testDeviceHash || "—"}</dd></div>
            </dl>
            <div className={styles.debugActions}>
              <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handleDiagnostic("reloadTestBanner")} type="button">テスト広告を再読み込み</button>
              <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handleDiagnostic("showAdForDiagnostics")} type="button">広告を表示</button>
              <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handleDiagnostic("hideAdForDiagnostics")} type="button">広告を非表示</button>
              <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handleDiagnostic("runAdSdkDiagnostics")} type="button">広告SDK診断を実行</button>
              <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handleDiagnostic("refreshUmpState")} type="button">UMP状態を再取得</button>
              <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handleConsentReset()} type="button">同意状態をリセット</button>
              <button className={styles.secondaryButton} disabled={isBusy} onClick={() => void handlePrivacyOptions()} type="button">プライバシー設定を開く</button>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
