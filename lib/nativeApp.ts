"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export type NativeDebugInfo = {
  debug: boolean;
  buildType: string;
  adMobMode: "test" | "production" | "disabled";
  appIdConfigured: boolean;
  bannerIdConfigured: boolean;
  mobileAdsInitialized: boolean;
  consentStatus: string;
  canRequestAds: boolean;
  privacyOptionsRequired: "true" | "false" | "unknown";
  lastAdEvent: string;
  lastAdErrorCode: number;
  lastAdErrorMessage: string;
  lastUmpError: string;
  currentScreenAdEligible: boolean;
};

export type NativeActionResult = {
  opened: boolean;
  message: string;
};

type TimeMasterNativePlugin = {
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  showPrivacyOptions(): Promise<NativeActionResult>;
  getDebugInfo(): Promise<NativeDebugInfo>;
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

export async function setNativeBannerVisible(visible: boolean): Promise<void> {
  if (!isAndroidNativeApp()) return;

  try {
    if (visible) {
      await TimeMasterNative.showBanner();
    } else {
      await TimeMasterNative.hideBanner();
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
      message: "プライバシー設定を読み込めませんでした。通信状態を確認して、もう一度お試しください。",
    };
  }
}

export async function getNativeDebugInfo(): Promise<NativeDebugInfo | null> {
  if (!isAndroidNativeApp()) return null;

  try {
    const result = await TimeMasterNative.getDebugInfo();
    return result.debug ? result : null;
  } catch {
    return null;
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
