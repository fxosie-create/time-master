"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWAの登録失敗は、通常のWeb利用を妨げない。
    });
  }, []);

  return null;
}
