"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { AppInfoDialog } from "@/components/AppInfoDialog";
import { CountdownScreen } from "@/components/CountdownScreen";
import { InterruptedScreen } from "@/components/InterruptedScreen";
import { MeasuringScreen } from "@/components/MeasuringScreen";
import { ReadyScreen } from "@/components/ReadyScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import {
  COUNTDOWN_DURATION_MS,
  getCountdownNumber,
  getNextCountdownDelay,
  type CountdownNumber,
} from "@/lib/countdown";
import { calculateMeasurementResult } from "@/lib/timeMaster";
import { selectMeasuringMessage } from "@/lib/measuringMessages";
import { isAndroidNativeApp, setNativeBannerVisible, subscribeToNativeBannerVisibility } from "@/lib/nativeApp";
import { readBestRecords, shouldReplaceBestRecord, writeBestRecords } from "@/lib/storage";
import type { BestRecord, BestRecords, MeasurementResult, TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type Screen = "ready" | "countdown" | "measuring" | "result" | "interrupted";

export function TimeMasterApp() {
  const [screen, setScreen] = useState<Screen>("ready");
  const [targetMs, setTargetMs] = useState<TargetMilliseconds>(10_000);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [bestRecords, setBestRecords] = useState<BestRecords>({});
  const [isNewBest, setIsNewBest] = useState(false);
  const [countdownValue, setCountdownValue] = useState<CountdownNumber>(3);
  const [measuringMessage, setMeasuringMessage] = useState("体感で時間を測ってください");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [nativeBannerHeight, setNativeBannerHeight] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const countdownEndTimeRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const challengeHistoryEntryRef = useRef(false);
  const finishingRef = useRef(false);
  const bestRecordsRef = useRef<BestRecords>({});

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedRecords = readBestRecords();
      bestRecordsRef.current = savedRecords;
      setBestRecords(savedRecords);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const nativeBannerVisible = isAndroidNativeApp() && !isInfoOpen && (screen === "ready" || screen === "result");
  const nativeScreen = isInfoOpen ? "app_info" : screen;

  useEffect(() => subscribeToNativeBannerVisibility(({ height, visible }) => {
    setNativeBannerHeight(visible ? Math.max(0, height) : 0);
  }), []);

  useEffect(() => {
    void setNativeBannerVisible(nativeBannerVisible, nativeScreen);
    return () => {
      void setNativeBannerVisible(false, nativeScreen);
    };
  }, [nativeBannerVisible, nativeScreen]);

  const appStyle = nativeBannerHeight > 0
    ? ({ "--native-banner-height": `${nativeBannerHeight}px` } as CSSProperties)
    : undefined;

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current === null) return;
    window.clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = null;
  }, []);

  const releaseChallengeHistoryEntry = useCallback(() => {
    if (isAndroidNativeApp() || !challengeHistoryEntryRef.current) return;
    challengeHistoryEntryRef.current = false;
    if (window.history.state?.timeMasterChallenge === true) {
      window.history.back();
    }
  }, []);

  const returnToReady = useCallback(() => {
    clearCountdownTimer();
    releaseChallengeHistoryEntry();
    countdownEndTimeRef.current = null;
    startTimeRef.current = null;
    finishingRef.current = false;
    setResult(null);
    setIsNewBest(false);
    setScreen("ready");
  }, [clearCountdownTimer, releaseChallengeHistoryEntry]);

  const interruptChallenge = useCallback(() => {
    const challengeIsActive = countdownEndTimeRef.current !== null || startTimeRef.current !== null;
    if (!challengeIsActive || finishingRef.current) return;
    finishingRef.current = true;
    clearCountdownTimer();
    countdownEndTimeRef.current = null;
    startTimeRef.current = null;
    setScreen("interrupted");
  }, [clearCountdownTimer]);

  const beginMeasurementAfterCountdown = useCallback(() => {
    if (countdownEndTimeRef.current === null || finishingRef.current) return;

    countdownEndTimeRef.current = null;
    countdownTimerRef.current = null;
    setMeasuringMessage(selectMeasuringMessage());
    startTimeRef.current = performance.now();
    setScreen("measuring");
  }, []);

  useEffect(() => {
    if (screen !== "countdown") return;

    const updateCountdown = () => {
      const countdownEndTime = countdownEndTimeRef.current;
      if (countdownEndTime === null) return;

      const currentTime = performance.now();
      const nextValue = getCountdownNumber(countdownEndTime, currentTime);
      if (nextValue === null) {
        countdownTimerRef.current = null;
        beginMeasurementAfterCountdown();
        return;
      }

      setCountdownValue((currentValue) => currentValue === nextValue ? currentValue : nextValue);
      countdownTimerRef.current = window.setTimeout(
        updateCountdown,
        getNextCountdownDelay(countdownEndTime, currentTime),
      );
    };

    updateCountdown();
    return clearCountdownTimer;
  }, [beginMeasurementAfterCountdown, clearCountdownTimer, screen]);

  useEffect(() => {
    if (screen !== "countdown" && screen !== "measuring") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        interruptChallenge();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [screen, interruptChallenge]);

  useEffect(() => {
    if (!isAndroidNativeApp()) return;

    let disposed = false;
    const handles: PluginListenerHandle[] = [];
    const registerListeners = async () => {
      const registered = await Promise.all([
        App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) interruptChallenge();
        }),
        App.addListener("backButton", () => {
          if (isInfoOpen) {
            setIsInfoOpen(false);
          } else if (screen === "countdown") {
            returnToReady();
          } else if (screen === "measuring") {
            interruptChallenge();
          } else if (screen !== "ready") {
            returnToReady();
          } else {
            void App.minimizeApp();
          }
        }),
      ]);

      if (disposed) {
        await Promise.all(registered.map((handle) => handle.remove()));
        return;
      }
      handles.push(...registered);
    };

    void registerListeners();
    return () => {
      disposed = true;
      for (const handle of handles) void handle.remove();
    };
  }, [interruptChallenge, isInfoOpen, returnToReady, screen]);

  useEffect(() => {
    if (isAndroidNativeApp()) return;

    const handlePopState = () => {
      if (!challengeHistoryEntryRef.current) return;
      challengeHistoryEntryRef.current = false;
      if (screen === "measuring") {
        interruptChallenge();
      } else if (screen !== "ready") {
        returnToReady();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [interruptChallenge, returnToReady, screen]);

  const startCountdown = useCallback(() => {
    if (
      screen !== "ready"
      || countdownEndTimeRef.current !== null
      || startTimeRef.current !== null
    ) return;

    finishingRef.current = false;
    setNativeBannerHeight(0);
    void setNativeBannerVisible(false, "countdown");
    if (!isAndroidNativeApp() && !challengeHistoryEntryRef.current) {
      window.history.pushState({ ...window.history.state, timeMasterChallenge: true }, "");
      challengeHistoryEntryRef.current = true;
    }
    const currentTime = performance.now();
    countdownEndTimeRef.current = currentTime + COUNTDOWN_DURATION_MS;
    setCountdownValue(3);
    setScreen("countdown");
  }, [screen]);

  const finishMeasurement = useCallback(() => {
    if (screen !== "measuring" || startTimeRef.current === null || finishingRef.current) return;

    finishingRef.current = true;
    const endTime = performance.now();
    const elapsedMs = endTime - startTimeRef.current;
    startTimeRef.current = null;
    const nextResult = calculateMeasurementResult(elapsedMs, targetMs);
    const candidate: BestRecord = {
      targetMs,
      actualMs: nextResult.elapsedMs,
      absoluteDifferenceMs: nextResult.absoluteDifferenceMs,
      accuracy: nextResult.accuracy,
      recordedAt: new Date().toISOString(),
    };
    const currentBest = bestRecordsRef.current[targetMs];
    const hasNewBest = shouldReplaceBestRecord(currentBest, candidate);

    if (hasNewBest) {
      const nextRecords = { ...bestRecordsRef.current, [targetMs]: candidate };
      bestRecordsRef.current = nextRecords;
      setBestRecords(nextRecords);
      writeBestRecords(nextRecords);
    }

    setResult(nextResult);
    setIsNewBest(hasNewBest);
    setScreen("result");
  }, [screen, targetMs]);

  return (
    <main
      className={`${styles.appShell} ${nativeBannerHeight > 0 ? styles.nativeBannerVisible : ""} ${screen === "measuring" ? styles.measurementMode : ""}`}
      data-screen={screen}
      style={appStyle}
    >
      <ServiceWorkerRegistration />
      <div className={`${styles.gameCard} ${screen === "result" ? styles.resultCard : ""} ${screen === "countdown" ? styles.countdownCard : ""}`}>
        {screen === "ready" && (
          <ReadyScreen
            bestRecords={bestRecords}
            onStart={startCountdown}
            onOpenInfo={() => setIsInfoOpen(true)}
            onTargetChange={setTargetMs}
            targetMs={targetMs}
          />
        )}
        {screen === "countdown" && <CountdownScreen value={countdownValue} />}
        {screen === "measuring" && <MeasuringScreen message={measuringMessage} onFinish={finishMeasurement} targetMs={targetMs} />}
        {screen === "result" && result && (
          <ResultScreen
            isNewBest={isNewBest}
            onRetry={returnToReady}
            result={result}
          />
        )}
        {screen === "interrupted" && <InterruptedScreen onRetry={returnToReady} />}
      </div>
      {isInfoOpen && <AppInfoDialog onClose={() => setIsInfoOpen(false)} />}
    </main>
  );
}
