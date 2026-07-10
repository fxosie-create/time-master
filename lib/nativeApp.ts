"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export type NativeDebugInfo = {
  debug: boolean;
  buildType: string;
  appVersion: string;
  adMobMode: "test" | "production" | "disabled";
  appIdConfigured: boolean;
  bannerIdConfigured: boolean;
  adMobAppId: string;
  manifestAdMobAppId: string;
  bannerAdUnitId: string;
  mobileAdsInitialized: boolean;
  consentStatus: string;
  canRequestAds: boolean;
  privacyOptionsRequired: "true" | "false" | "unknown";
  lastAdLoadRequestScreen: string;
  lastAdEvent: string;
  lastAdErrorCode: number;
  lastAdErrorDomain: string;
  lastAdErrorMessage: string;
  lastUmpEvent: string;
  lastUmpErrorCode: number;
  lastUmpErrorMessage: string;
  nativeBridgeStatus: string;
  currentScreen: string;
  shouldShowAd: boolean;
  adContainerWidth: number;
  adContainerHeight: number;
  adContainerVisibility: string;
  adViewAttached: boolean;
  adViewUnitId: string;
  testDeviceHash: string;
};

export type NativeActionResult = {
  opened: boolean;
  message: string;
};

type TimeMasterNativePlugin = {
  showBanner(options: { screen: string }): Promise<void>;
  hideBanner(options: { screen: string }): Promise<void>;
  showPrivacyOptions(): Promise<NativeActionResult>;
  getDebugInfo(): Promise<NativeDebugInfo>;
  reloadTestBanner(): Promise<NativeActionResult>;
  showAdForDiagnostics(): Promise<NativeActionResult>;
  hideAdForDiagnostics(): Promise<NativeActionResult>;
  runAdSdkDiagnostics(): Promise<NativeActionResult>;
  refreshUmpState(): Promise<NativeActionResult>;
  resetConsentForTesting(): Promise<NativeActionResult>;
};

const TimeMasterNative = registerPlugin<TimeMasterNativePlugin>("TimeMasterNative");

export const NATIVE_BANNER_VISIBILITY_EVENT = "time-master-native-banner-visibility";

type NativeBannerVisibilityDetail = {
  height: number;
  visible: boolean;
};

export function isAndroidNativeApp(): boolean {
  return Capacitor.getPlatform() === "android";
}

export async function setNativeBannerVisible(visible: boolean, screen = "unknown"): Promise<void> {
  if (!isAndroidNativeApp()) return;

  try {
    if (visible) {
      await TimeMasterNative.showBanner({ screen });
    } else {
      await TimeMasterNative.hideBanner({ screen });
    }
  } catch {
    // ネイティブ広告の失敗でゲーム本体を停止させない。
  }
}

export async function showNativePrivacyOptions(): Promise<NativeActionResult> {
  if (!isAndroidNativeApp()) {
    return {
      opened: false,
      message: "プライバシー設定はAndroidアプリ版で利用できます。",
    };
  }

  try {
    return await TimeMasterNative.showPrivacyOptions();
  } catch {
    return {
      opened: false,
      message: "Androidネイティブブリッジへ接続できませんでした。Time Master 1.0.1 debug APKを再インストールしてください。",
    };
  }
}

export async function getNativeDebugInfo(): Promise<NativeDebugInfo | null> {
  if (!isAndroidNativeApp()) return null;

  try {
    return await TimeMasterNative.getDebugInfo();
  } catch {
    return null;
  }
}

type NativeDiagnosticMethod =
  | "reloadTestBanner"
  | "showAdForDiagnostics"
  | "hideAdForDiagnostics"
  | "runAdSdkDiagnostics"
  | "refreshUmpState";

export async function runNativeDiagnostic(method: NativeDiagnosticMethod): Promise<NativeActionResult> {
  if (!isAndroidNativeApp()) {
    return { opened: false, message: "広告診断はAndroid debug版限定です。" };
  }

  try {
    return await TimeMasterNative[method]();
  } catch {
    return {
      opened: false,
      message: "Androidネイティブブリッジへ接続できませんでした。最新debug APKを再インストールしてください。",
    };
  }
}

export async function resetNativeConsentForTesting(): Promise<NativeActionResult> {
  if (!isAndroidNativeApp()) {
    return { opened: false, message: "同意状態のリセットはAndroid debug版限定です。" };
  }

  try {
    return await TimeMasterNative.resetConsentForTesting();
  } catch {
    return { opened: false, message: "同意状態をリセットできませんでした。Logcatを確認してください。" };
  }
}

export function subscribeToNativeBannerVisibility(
  listener: (detail: NativeBannerVisibilityDetail) => void,
): () => void {
  if (!isAndroidNativeApp()) return () => undefined;

  const handleEvent = (event: Event) => {
    const detail = (event as CustomEvent<NativeBannerVisibilityDetail>).detail;
    if (!detail || typeof detail.visible !== "boolean" || typeof detail.height !== "number") return;
    listener(detail);
  };

  window.addEventListener(NATIVE_BANNER_VISIBILITY_EVENT, handleEvent);
  return () => window.removeEventListener(NATIVE_BANNER_VISIBILITY_EVENT, handleEvent);
}
