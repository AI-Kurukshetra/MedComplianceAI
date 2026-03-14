"use client";

import { useEffect, useState } from "react";

type Props = {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
};

export function ProgressRing({
  pct,
  size = 130,
  strokeWidth = 10,
  color = "var(--brand)",
  trackColor = "#dce7f4",
  label,
  sublabel,
}: Props) {
  const [animPct, setAnimPct] = useState(0);
  const r = size / 2 - strokeWidth - 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(animPct, 0), 100) / 100);

  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* Centre text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        {label && (
          <span
            style={{
              fontSize: size * 0.2,
              fontWeight: 800,
              lineHeight: 1,
              color: "var(--foreground)",
            }}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span
            style={{
              fontSize: size * 0.11,
              color: "var(--muted)",
              fontWeight: 600,
              letterSpacing: "0.03em",
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
