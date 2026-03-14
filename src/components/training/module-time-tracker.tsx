"use client";

import { useEffect, useRef } from "react";

type ModuleTimeTrackerProps = {
  moduleId: string;
  estimatedMinutes: number;
};

export function ModuleTimeTracker({ moduleId, estimatedMinutes }: ModuleTimeTrackerProps) {
  const elapsedSecondsRef = useRef(0);
  const sentMinutesRef = useRef(0);
  const flushInProgressRef = useRef(false);
  const sessionCapMinutes = Math.max(estimatedMinutes * 3, 15);

  useEffect(() => {
    async function flushWithFetch(minutes: number): Promise<boolean> {
      if (minutes <= 0) {
        return true;
      }

      try {
        const response = await fetch("/api/progress/time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId, minutes }),
          keepalive: true,
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    function flushWithBeacon(minutes: number): boolean {
      if (minutes <= 0 || typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
        return false;
      }

      const payload = JSON.stringify({ moduleId, minutes });
      const blob = new Blob([payload], { type: "application/json" });
      return navigator.sendBeacon("/api/progress/time", blob);
    }

    async function flushPending(forceRounding: boolean) {
      if (flushInProgressRef.current) {
        return;
      }

      const totalTrackedMinutes = forceRounding
        ? Math.floor((elapsedSecondsRef.current + 30) / 60)
        : Math.floor(elapsedSecondsRef.current / 60);
      const boundedTotalMinutes = Math.min(totalTrackedMinutes, sessionCapMinutes);
      const pendingMinutes = boundedTotalMinutes - sentMinutesRef.current;

      if (pendingMinutes <= 0) {
        return;
      }

      flushInProgressRef.current = true;
      const flushed = await flushWithFetch(pendingMinutes);
      if (flushed) {
        sentMinutesRef.current += pendingMinutes;
      }
      flushInProgressRef.current = false;
    }

    function flushPendingWithBeacon() {
      const totalTrackedMinutes = Math.min(
        Math.floor((elapsedSecondsRef.current + 30) / 60),
        sessionCapMinutes,
      );
      const pendingMinutes = totalTrackedMinutes - sentMinutesRef.current;

      if (pendingMinutes > 0 && flushWithBeacon(pendingMinutes)) {
        sentMinutesRef.current += pendingMinutes;
      }
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      elapsedSecondsRef.current += 15;
      void flushPending(false);
    }, 15000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingWithBeacon();
        return;
      }

      void flushPending(false);
    };

    const onBeforeUnload = () => {
      flushPendingWithBeacon();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flushPendingWithBeacon();
      void flushPending(true);
    };
  }, [moduleId, sessionCapMinutes]);

  return null;
}
