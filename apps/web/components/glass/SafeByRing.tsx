"use client";

import { useEffect, useState } from "react";

interface SafeByRingProps {
  safeByIso: string;
  size?: number;
  children: React.ReactNode;
}

export function SafeByRing({ safeByIso, size = 76, children }: SafeByRingProps) {
  const [remainingMin, setRemainingMin] = useState<number>(() => {
    const diff = new Date(safeByIso).getTime() - Date.now();
    return Math.max(0, Math.round(diff / 60000));
  });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(safeByIso).getTime() - Date.now();
      setRemainingMin(Math.max(0, Math.round(diff / 60000)));
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [safeByIso]);

  const urgent = remainingMin <= 30;
  const maxWindow = 240; // visual ring scale: 4h
  const ratio = Math.min(1, Math.max(0.06, remainingMin / maxWindow));
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div
        className={`relative flex items-center justify-center rounded-full ${
          urgent ? "animate-pulse" : ""
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(11, 42, 46, 0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={urgent ? "#FF5C1F" : "#00B8A9"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-1.5 overflow-hidden rounded-full">
          {children}
        </div>
      </div>
      <span
        className={`tabular-nums rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          urgent
            ? "bg-tangerine text-white"
            : "bg-teal-50 text-teal-700 border border-teal/30"
        }`}
      >
        {remainingMin}m safe
      </span>
    </div>
  );
}

