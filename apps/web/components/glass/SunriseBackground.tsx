"use client";

export function SunriseBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mist"
    >
      {/* Large Tangerine Flame & Ocean Teal blurred sunrise-wave blobs */}
      <div
        className="animate-drift-a absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full opacity-30"
        style={{
          background: "#FF5C1F",
          filter: "blur(90px)",
        }}
      />
      <div
        className="animate-drift-b absolute -right-24 top-1/4 h-[520px] w-[520px] rounded-full opacity-30"
        style={{
          background: "#00B8A9",
          filter: "blur(90px)",
        }}
      />
      <div
        className="animate-drift-a absolute bottom-[-140px] left-1/3 h-[440px] w-[440px] rounded-full opacity-25"
        style={{
          background: "#00B8A9",
          filter: "blur(90px)",
        }}
      />
      {/* Rare Berry Pop accent blob (15% opacity) near hero */}
      <div
        className="animate-drift-b absolute left-1/2 top-24 h-[260px] w-[260px] rounded-full opacity-15"
        style={{
          background: "#FF3D8B",
          filter: "blur(90px)",
        }}
      />
      {/* Faint wavy line pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.045]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="sunrise-waves"
            width="120"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 20 Q 30 0, 60 20 T 120 20"
              fill="none"
              stroke="#0B2A2E"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sunrise-waves)" />
      </svg>
    </div>
  );
}

