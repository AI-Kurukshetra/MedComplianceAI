"use client";

import { useEffect } from "react";
import {
  getPendingSubmissions,
  removePendingSubmission,
} from "@/lib/offline/indexed-db";

/**
 * Registers the service worker and handles background sync of
 * queued quiz submissions when the user comes back online.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    /* Register SW */
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.debug("[PWA] Service worker registered", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err);
      });

    /* Flush pending quiz submissions on reconnect */
    async function flushPending() {
      if (!navigator.onLine) return;

      try {
        const pending = await getPendingSubmissions();
        if (pending.length === 0) return;

        console.debug(`[PWA] Flushing ${pending.length} pending quiz submission(s)`);

        for (const item of pending) {
          try {
            const res = await fetch(`/api/quiz/${item.moduleId}/submit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payload: item.payload }),
            });

            if (res.ok) {
              await removePendingSubmission(item.id);
              console.debug(`[PWA] Flushed submission for module ${item.moduleId}`);
            }
          } catch {
            /* Leave in queue — will retry next time */
          }
        }
      } catch {
        /* IndexedDB unavailable */
      }
    }

    window.addEventListener("online", flushPending);

    /* Also try on mount (page loaded while online) */
    flushPending();

    return () => {
      window.removeEventListener("online", flushPending);
    };
  }, []);

  return null; /* Renders nothing */
}
