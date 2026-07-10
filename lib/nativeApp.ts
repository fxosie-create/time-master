"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

type TimeMasterNativePlugin = {
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  showPrivacyOptions(): Promise<void>;
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

export async function showNativePrivacyOptions(): Promise<void> {
  if (!isAndroidNativeApp()) return;

  try {
    await TimeMasterNative.showPrivacyOptions();
  } catch {
    // 同意フォームを開けない場合も、情報画面は利用可能にする。
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
