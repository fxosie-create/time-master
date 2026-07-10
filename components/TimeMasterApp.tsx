"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InterruptedScreen } from "@/components/InterruptedScreen";
import { MeasuringScreen } from "@/components/MeasuringScreen";
import { ReadyScreen } from "@/components/ReadyScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { calculateMeasurementResult } from "@/lib/timeMaster";
import { readBestRecords, shouldReplaceBestRecord, writeBestRecords } from "@/lib/storage";
import type { BestRecord, BestRecords, MeasurementResult, TargetMilliseconds } from "@/types/timeMaster";
import styles from "./timeMaster.module.css";

type Screen = "ready" | "measuring" | "result" | "interrupted";

export function TimeMasterApp() {
  const [screen, setScreen] = useState<Screen>("ready");
  const [targetMs, setTargetMs] = useState<TargetMilliseconds>(10_000);
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [bestRecords, setBestRecords] = useState<BestRecords>({});
  const [isNewBest, setIsNewBest] = useState(false);
  const startTimeRef = useRef<number | null>(null);
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

  const returnToReady = useCallback(() => {
    startTimeRef.current = null;
    finishingRef.current = false;
    setResult(null);
    setIsNewBest(false);
    setScreen("ready");
  }, []);

  const interruptMeasurement = useCallback(() => {
    if (startTimeRef.current === null || finishingRef.current) return;
    finishingRef.current = true;
    startTimeRef.current = null;
    setScreen("interrupted");
  }, []);

  useEffect(() => {
    if (screen !== "measuring") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        interruptMeasurement();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [screen, interruptMeasurement]);

  const startMeasurement = useCallback(() => {
    if (screen !== "ready" || startTimeRef.current !== null) return;
    finishingRef.current = false;
    startTimeRef.current = performance.now();
    setScreen("measuring");
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
    <main className={styles.appShell}>
      <ServiceWorkerRegistration />
      <div className={`${styles.gameCard} ${screen === "result" ? styles.resultCard : ""}`}>
        {screen === "ready" && (
          <ReadyScreen
            bestRecords={bestRecords}
            onStart={startMeasurement}
            onTargetChange={setTargetMs}
            targetMs={targetMs}
          />
        )}
        {screen === "measuring" && <MeasuringScreen onFinish={finishMeasurement} targetMs={targetMs} />}
        {screen === "result" && result && (
          <ResultScreen
            isNewBest={isNewBest}
            onRetry={returnToReady}
            result={result}
          />
        )}
        {screen === "interrupted" && <InterruptedScreen onRetry={returnToReady} />}
      </div>
    </main>
  );
}
