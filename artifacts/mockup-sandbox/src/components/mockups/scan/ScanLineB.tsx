import { useEffect, useState } from "react";

const PHOTO = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=420&q=80";

const DETECTIONS = [
  { x: 12, y: 8,  w: 28, h: 16, label: "Płyta główna", metal: "Au 0.34g", conf: 92, color: "#facc15" },
  { x: 60, y: 18, w: 18, h: 12, label: "Kondensator",  metal: "Pd 0.12g", conf: 78, color: "#60a5fa" },
  { x: 44, y: 38, w: 22, h: 14, label: "CPU socket",   metal: "Au 0.89g", conf: 95, color: "#facc15" },
  { x: 8,  y: 55, w: 30, h: 18, label: "RAM slot",     metal: "Au 0.21g", conf: 85, color: "#facc15" },
  { x: 65, y: 52, w: 24, h: 20, label: "Złącze PCI",   metal: "Au 0.18g", conf: 72, color: "#facc15" },
  { x: 30, y: 70, w: 36, h: 16, label: "Radiator",     metal: "Ag 1.2g",  conf: 68, color: "#a3e635" },
  { x: 5,  y: 78, w: 20, h: 14, label: "Chip BIOS",    metal: "Au 0.07g", conf: 88, color: "#facc15" },
];

function CornerBox({ x, y, w, h, label, metal, conf, color, visible, active }: {
  x: number; y: number; w: number; h: number; label: string; metal: string;
  conf: number; color: string; visible: boolean; active: boolean;
}) {
  if (!visible) return null;
  const c = "10%";
  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
    >
      <div className="relative w-full h-full" style={{ animation: "popIn 0.3s cubic-bezier(.17,.67,.35,1.3)" }}>
        {[["top-0 left-0","border-t-2 border-l-2"],
          ["top-0 right-0","border-t-2 border-r-2"],
          ["bottom-0 left-0","border-b-2 border-l-2"],
          ["bottom-0 right-0","border-b-2 border-r-2"]
        ].map(([pos, border], i) => (
          <div
            key={i}
            className={`absolute ${pos} ${border} rounded-sm`}
            style={{ width: c, height: c, borderColor: color }}
          />
        ))}

        {active && (
          <div className="absolute inset-0 rounded-sm opacity-20"
            style={{ background: color, animation: "pulseBox 1.2s ease-in-out infinite" }}
          />
        )}

        <div
          className="absolute -top-5 left-0 whitespace-nowrap text-[9px] font-mono font-bold px-1 py-0.5 rounded-sm"
          style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
        >
          {label}
        </div>

        <div
          className="absolute -bottom-4 right-0 flex items-center gap-1"
        >
          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-[8px] font-mono" style={{ color, background: "#00000077", padding: "0 2px", borderRadius: 2 }}>
            {metal}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScanLineB() {
  const [phase, setPhase] = useState<"scanning" | "done">("scanning");
  const [visIdx, setVisIdx] = useState(-1);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setVisIdx(-1);
    setPhase("scanning");
    let i = 0;
    const schedule = () => {
      if (i >= DETECTIONS.length) {
        setPhase("done");
        return;
      }
      const delay = 200 + Math.random() * 400;
      setTimeout(() => {
        setVisIdx(i);
        i++;
        schedule();
      }, delay);
    };
    const t = setTimeout(schedule, 600);
    return () => clearTimeout(t);
  }, [key]);

  const detected = visIdx + 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <p className="text-xs text-zinc-500 mb-2 text-center uppercase tracking-widest font-mono">
          Wariant B — narożniki
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

          {phase === "scanning" && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 60%, rgba(96,165,250,0.06) 100%)",
                animation: "scanPulse 1.5s ease-in-out infinite",
              }}
            />
          )}

          {DETECTIONS.map((d, i) => (
            <CornerBox
              key={`${key}-${i}`}
              {...d}
              visible={i <= visIdx}
              active={phase === "scanning" && i === visIdx}
            />
          ))}

          <div
            className="absolute top-2 left-2 right-2 flex items-center gap-2 px-2 py-1 rounded-md"
            style={{ background: "#00000088", backdropFilter: "blur(4px)" }}
          >
            {phase === "scanning" ? (
              <>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: "#60a5fa", animation: "blinkDot 0.8s ease-in-out infinite" }}
                />
                <span className="text-[10px] font-mono text-blue-300 flex-1">Wykrywam elementy...</span>
                <span className="text-[10px] font-mono text-zinc-500">{detected}/{DETECTIONS.length}</span>
              </>
            ) : (
              <>
                <span className="text-emerald-400">✓</span>
                <span className="text-[10px] font-mono text-emerald-400 flex-1">Wykryto {detected} elementów</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {DETECTIONS.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-300"
              style={{
                background: i <= visIdx ? `${d.color}11` : "#ffffff06",
                border: `1px solid ${i <= visIdx ? d.color + "44" : "#ffffff10"}`,
                opacity: i <= visIdx ? 1 : 0.3,
                transform: i <= visIdx ? "translateX(0)" : "translateX(-6px)",
              }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i <= visIdx ? d.color : "#333" }} />
              <span className="text-[9px] font-mono text-zinc-300 flex-1">{d.label}</span>
              <span className="text-[9px] font-mono" style={{ color: d.color }}>{d.metal}</span>
              <span className="text-[8px] font-mono text-zinc-500">{d.conf}%</span>
            </div>
          ))}
        </div>

        {phase === "done" && (
          <button
            onClick={() => setKey(k => k + 1)}
            className="mt-3 w-full text-xs font-mono py-1.5 rounded-md border transition-colors"
            style={{ border: "1px solid #60a5fa44", color: "#60a5fa", background: "#60a5fa11" }}
          >
            ↺ Skanuj ponownie
          </button>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseBox {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.35; }
        }
        @keyframes scanPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes blinkDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
