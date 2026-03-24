"use client";

export function HeroGlow() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Dot-grid overlay – Cursor / Linear signature */}
      <div className="grid-bg absolute inset-0" />

      {/* Aurora band */}
      <div className="aurora-band" />

      {/* Secondary softer glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 400,
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Bottom edge fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
