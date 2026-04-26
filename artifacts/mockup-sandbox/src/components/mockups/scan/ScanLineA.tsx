import { useEffect, useRef, useState } from "react";

const PHOTO = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=420&q=80";

const DETECTIONS = [
  { x: 12, y: 8,  w: 28, h: 16, label: "Płyta główna", metal: "Au 0.34g", conf: 92 },
  { x: 60, y: 18, w: 18, h: 12, label: "Kondensator", metal: "Pd 0.12g", conf: 78 },
  { x: 44, y: 38, w: 22, h: 14, label: "CPU socket",  metal: "Au 0.89g", conf: 95 },
  { x: 8,  y: 55, w: 30, h: 18, label: "RAM slot",    metal: "Au 0.21g", conf: 85 },
  { x: 65, y: 52, w: 24, h: 20, label: "Złącze PCI",  metal: "Au 0.18g", conf: 72 },
  { x: 30, y: 70, w: 36, h: 16, label: "Radiator",    metal: "Ag 1.2g",  conf: 68 },
  { x: 5,  y: 78, w: 20, h: 14, label: "Chip BIOS",   metal: "Au 0.07g", conf: 88 },
];

export default function ScanLineA() {
  const [scanY, setScanY] = useState(-4);
  const [visible, setVisible] = useState<boolean[]>(DETECTIONS.map(() => false));
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const DURATION = 3800;

  useEffect(() => {
    startRef.current = null;
    setScanY(-4);
    setVisible(DETECTIONS.map(() => false));
    setDone(false);

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const y = progress * 108 - 4;
      setScanY(y);

      const newVis = DETECTIONS.map((d) => d.y + d.h / 2 < y);
      setVisible(newVis);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const restart = () => {
    cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setScanY(-4);
    setVisible(DETECTIONS.map(() => false));
    setDone(false);
    rafRef.current = requestAnimationFrame((ts) => {
      startRef.current = ts;
      const animate = (t: number) => {
        const elapsed = t - (startRef.current ?? t);
        const progress = Math.min(elapsed / DURATION, 1);
        const y = progress * 108 - 4;
        setScanY(y);
        setVisible(DETECTIONS.map((d) => d.y + d.h / 2 < y));
        if (progress < 1) rafRef.current = requestAnimationFrame(animate);
        else setDone(true);
      };
      animate(ts);
    });
  };

  const detected = visible.filter(Boolean).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <p className="text-xs text-zinc-500 mb-2 text-center uppercase tracking-widest font-mono">
          Wariant A — linia skanowania
        </p>

        <div
          className="relative rounded-xl overflow-hidden border border-zinc-700 shadow-2xl"
          style={{ aspectRatio: "4/3" }}
        >
          <img
            src={PHOTO}
            alt="e-waste"
            className="w-full h-full object-cover"
            draggable={false}
          />

          <div className="absolute inset-0 bg-black/30" />

          {!done && (
            <>
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${scanY}%`,
                  height: "3px",
                  background:
                    "linear-gradient(90deg, transparent 0%, #00ffaa 20%, #00ffee 50%, #00ffaa 80%, transparent 100%)",
                  boxShadow: "0 0 12px 4px #00ffaa88",
                  transition: "none",
                }}
              />
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: 0,
                  height: `${scanY}%`,
                  background:
                    "linear-gradient(to bottom, transparent, rgba(0,255,170,0.04))",
                }}
              />
            </>
          )}

          {DETECTIONS.map((d, i) =>
            visible[i] ? (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.w}%`,
                  height: `${d.h}%`,
                  animation: "fadeInBox 0.25s ease-out",
                }}
              >
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 border-2 border-emerald-400 rounded-sm opacity-90" />
                  <div className="absolute inset-0 border border-emerald-300 rounded-sm opacity-30 scale-105" />
                  <div
                    className="absolute -top-5 left-0 whitespace-nowrap text-[9px] font-mono font-bold px-1 py-0.5 rounded-sm"
                    style={{ background: "#00ffaa22", color: "#00ffaa", border: "1px solid #00ffaa55" }}
                  >
                    {d.label}
                  </div>
                  <div
                    className="absolute -bottom-4 right-0 whitespace-nowrap text-[8px] font-mono px-1 rounded-sm"
                    style={{ color: "#aaffdd", background: "#00000066" }}
                  >
                    {d.metal} · {d.conf}%
                  </div>
                </div>
              </div>
            ) : null
          )}

          <div
            className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded-md"
            style={{ background: "#00000088", backdropFilter: "blur(4px)" }}
          >
            <span className="text-[10px] font-mono text-emerald-400">
              {done ? "✓ Analiza zakończona" : "Skanowanie..."}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {detected} / {DETECTIONS.length}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {DETECTIONS.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-all duration-300"
              style={{
                background: visible[i] ? "#00ffaa11" : "#ffffff08",
                border: `1px solid ${visible[i] ? "#00ffaa44" : "#ffffff10"}`,
                opacity: visible[i] ? 1 : 0.35,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: visible[i] ? "#00ffaa" : "#444" }}
              />
              <div className="min-w-0">
                <p className="text-[9px] font-mono text-zinc-300 truncate">{d.label}</p>
                <p className="text-[8px] font-mono text-emerald-400">{d.metal}</p>
              </div>
            </div>
          ))}
        </div>

        {done && (
          <button
            onClick={restart}
            className="mt-3 w-full text-xs font-mono py-1.5 rounded-md border transition-colors"
            style={{ border: "1px solid #00ffaa44", color: "#00ffaa", background: "#00ffaa11" }}
          >
            ↺ Skanuj ponownie
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeInBox {
          from { opacity: 0; transform: scale(1.08); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
