"use client";

import { useEffect, useState } from "react";

function parseHashError(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.slice(1)); // strip leading #
  const errorCode = params.get("error_code");
  const errorDescription = params.get("error_description");

  if (!errorCode && !errorDescription) return null;

  if (errorCode === "otp_expired") {
    return "This confirmation link has expired. Please request a new one or ask your admin to manually confirm your account.";
  }

  if (errorCode === "access_denied") {
    return errorDescription
      ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
      : "Access denied. The link may have already been used.";
  }

  return errorDescription
    ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
    : "An authentication error occurred. Please try again.";
}

/**
 * Reads Supabase error params from the URL hash fragment (e.g. #error=access_denied&error_description=...)
 * Hash fragments are never sent to the server, so they must be read client-side.
 */
export function HashErrorReader() {
  const [hashError] = useState<string | null>(() => parseHashError());

  useEffect(() => {
    if (!hashError) return;

    // Clean the hash from the URL without reloading the page
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [hashError]);

  if (!hashError) return null;

  return (
    <p className="mt-4 rounded-md border border-red-200 bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-fg)]">
      {hashError}
    </p>
  );
}
