"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { getPendingSubmissions } from "@/lib/offline/indexed-db";

export function OfflineIndicator() {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState(true);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    /* Initial state */
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setShowRestoredBanner(true);

      /* Check for pending submissions and try to flush them */
      try {
        const pending = await getPendingSubmissions();
        if (pending.length > 0) {
          setPendingCount(pending.length);
          /* Background sync is handled by the service worker;
             here we just show the count for UX feedback */
        }
      } catch {
        /* IndexedDB may not be available in all contexts */
      }

      setTimeout(() => {
        setShowRestoredBanner(false);
        setPendingCount(0);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredBanner(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showRestoredBanner) return null;

  if (showRestoredBanner) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 lg:bottom-6"
      >
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 shadow-md">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-emerald-800">
            {pendingCount > 0
              ? t("offline.syncPending")
              : t("offline.backOnline")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-20 left-0 right-0 z-50 px-4 lg:bottom-6"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
        <span className="material-symbols-outlined text-amber-600">wifi_off</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">{t("offline.banner")}</p>
          <p className="text-xs text-amber-700">{t("offline.savedProgress")}</p>
        </div>
      </div>
    </div>
  );
}
