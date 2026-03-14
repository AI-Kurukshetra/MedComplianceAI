"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (completeTimer.current) clearTimeout(completeTimer.current);
    setActive(true);
    setWidth(12);
  };

  const complete = () => {
    setWidth(100);
    completeTimer.current = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 500);
  };

  // Intercept every link click and form submit — fires before navigation starts
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:")
      ) return;
      const targetPath = href.split("?")[0].split("#")[0];
      if (targetPath === window.location.pathname) return;
      start();
    };

    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      // Only show loader for POST forms (server actions navigate on completion)
      if (form.method?.toLowerCase() === "get") return;
      start();
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("submit", handleSubmit);
    };
  }, []);

  // Crawl the bar forward while active (stops at 90% — completion pushes to 100%)
  useEffect(() => {
    if (!active || width >= 90) return;
    const delay = width < 40 ? 280 : width < 65 ? 380 : width < 80 ? 500 : 700;
    const inc = width < 40 ? 18 : width < 65 ? 10 : width < 80 ? 5 : 2;
    const t = setTimeout(() => setWidth((w) => Math.min(w + inc, 90)), delay);
    return () => clearTimeout(t);
  }, [active, width]);

  // When pathname actually changes → navigation is complete → finish bar
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      if (active) complete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!active && width === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: `${width}%`,
        zIndex: 99999,
        pointerEvents: "none",
        borderRadius: "0 2px 2px 0",
        background: "linear-gradient(90deg, var(--primary) 0%, #3b82f6 100%)",
        boxShadow: "0 0 10px rgba(17,82,212,0.45), 0 0 4px rgba(59,130,246,0.35)",
        transition:
          width === 0
            ? "none"
            : width === 100
              ? "width 0.18s ease, opacity 0.45s ease 0.08s"
              : "width 0.32s ease",
        opacity: width === 100 ? 0 : 1,
      }}
    />
  );
}
