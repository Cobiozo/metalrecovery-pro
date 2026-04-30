function ActivityIcon({ size = 24, color = "#f59e0b" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function AppLogo({ scale = 1 }: { scale?: number }) {
  const iconSize = Math.round(24 * scale);
  const padPx = Math.round(8 * scale);
  const r = Math.round(6 * scale);
  const textLg = Math.round(18 * scale);
  const textSm = Math.round(11 * scale);
  const gap = Math.round(12 * scale);
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <div style={{
        background: "rgba(245,158,11,0.15)",
        padding: padPx,
        borderRadius: r,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <ActivityIcon size={iconSize} color="#f59e0b" />
      </div>
      <div>
        <div style={{ fontSize: textLg, fontWeight: 700, color: "#fff", lineHeight: 1.15, letterSpacing: -0.3 }}>
          MetalRecovery
        </div>
        <div style={{ fontSize: textSm, fontWeight: 500, color: "#f59e0b", fontFamily: "monospace", letterSpacing: 1 }}>
          PRO EDITION
        </div>
      </div>
    </div>
  );
}

export default function OGImage() {
  return (
    <div style={{
      width: 1200, height: 630,
      background: "linear-gradient(135deg, #0d1117 0%, #1a2233 100%)",
      fontFamily: "'Inter', 'Arial', sans-serif",
      position: "relative", overflow: "hidden", display: "flex",
    }}>
      {/* Grid background */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.035 }}>
        {[105,210,315,420,525].map(y => <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="#fff" strokeWidth="1"/>)}
        {[200,400,600,800,1000].map(x => <line key={x} x1={x} y1="0" x2={x} y2="630" stroke="#fff" strokeWidth="1"/>)}
      </svg>

      {/* Gold left accent */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 5, height: "100%", background: "linear-gradient(180deg, #f59e0b, #d97706)" }} />
      <div style={{ position: "absolute", left: 5, top: 0, right: 0, height: 3, background: "linear-gradient(90deg, rgba(245,158,11,0.5), transparent)" }} />

      {/* ===== LEFT PANEL ===== */}
      <div style={{ width: 490, padding: "32px 28px 28px 30px", display: "flex", flexDirection: "column", zIndex: 10 }}>
        <AppLogo scale={1.45} />

        <div style={{ height: 1.5, background: "linear-gradient(90deg, rgba(245,158,11,0.4), transparent)", margin: "20px 0 18px" }} />

        <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Kalkulator Odzysku</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b", lineHeight: 1.2, marginBottom: 5 }}>Metali Szlachetnych</div>
        <div style={{ fontSize: 13.5, color: "#6b7fa0", marginBottom: 24 }}>z e-odpadów elektronicznych</div>

        {[
          { icon: "📷", title: "Analiza zdjęć AI (Claude Vision)", sub: "Wykrywa materiały i szacuje zawartość Au/Ag/Pd" },
          { icon: "📈", title: "Kursy Au/Ag/Pt/Pd na żywo", sub: "Dane NBP i stooq.pl — aktualizowane codziennie" },
          { icon: "⚗", title: "Kalkulator hydrometalurgiczny", sub: "AR, mokra, cementacja — z kosztami procesu" },
          { icon: "📱", title: "PWA — działa offline", sub: "Instalowalna na Android i iOS bez sklepu" },
        ].map((f) => (
          <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 12 }}>
            <div style={{
              width: 33, height: 33, borderRadius: 7, flexShrink: 0,
              background: "rgba(245,158,11,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{f.title}</div>
              <div style={{ fontSize: 11.5, color: "#6b7fa0", marginTop: 1.5 }}>{f.sub}</div>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          <div style={{ background: "#f59e0b", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "#000" }}>
            metalrecovery.online
          </div>
          <div style={{ border: "1.5px solid rgba(245,158,11,0.5)", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
            BEZPŁATNY DOSTĘP
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div style={{
        flex: 1, margin: "24px 22px 24px 0", display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* TOP: Calculator results mockup */}
        <div style={{
          flex: 1, background: "linear-gradient(180deg,#1e2a3a,#162030)",
          borderRadius: 14, border: "1.5px solid #2a3a50",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          overflow: "hidden", display: "flex",
        }}>
          {/* Sidebar strip */}
          <div style={{ width: 126, background: "#0d1621", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ marginBottom: 12 }}><AppLogo scale={0.7} /></div>
            {["Kalkulator Metali","Kalkulator skupu","Analiza zdjęcia","Kursy Metali","Procesy chem."].map((nav, i) => (
              <div key={nav} style={{
                padding: "6px 9px", borderRadius: 6, fontSize: 9.5, fontWeight: i === 0 ? 600 : 400,
                background: i === 0 ? "#f59e0b" : "transparent",
                color: i === 0 ? "#000" : "#5a6a80",
              }}>{nav}</div>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff" }}>Kalkulator Odzysku Metali</div>
              <div style={{ fontSize: 9, color: "#6b7f9a" }}>Precyzyjne szacowanie opłacalności procesów</div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <div style={{ background: "#f59e0b", borderRadius: 10, padding: "4px 11px", fontSize: 9.5, fontWeight: 600, color: "#000" }}>1. Materiał wsadu</div>
              <div style={{ border: "1px solid #2a3a50", borderRadius: 10, padding: "4px 11px", fontSize: 9.5, color: "#6b7f9a" }}>2. Parametry procesu</div>
              <div style={{ border: "1px solid #2a3a50", borderRadius: 10, padding: "4px 11px", fontSize: 9.5, color: "#6b7f9a" }}>3. Wyniki</div>
            </div>

            {/* Material input */}
            <div style={{ background: "#162030", border: "1px solid #2a3a50", borderRadius: 8, padding: "7px 9px" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ flex: 1, background: "#1e2a3a", border: "1px solid #2a3a50", borderRadius: 5, padding: "5px 8px", fontSize: 9.5, color: "#fff" }}>
                  Procesory ceramiczne 486
                </div>
                <div style={{ width: 42, background: "#1e2a3a", border: "1px solid #2a3a50", borderRadius: 5, padding: "5px 4px", fontSize: 9.5, color: "#fff", textAlign: "center" }}>2.5 kg</div>
                <div style={{ width: 22, background: "rgba(220,38,38,0.8)", borderRadius: 5, fontSize: 11, color: "#fff", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>×</div>
              </div>
            </div>

            {/* Metal values */}
            <div style={{ display: "flex", gap: 5 }}>
              {[
                { m: "Au", v: "11.0 g", c: "#f59e0b", b: "#f59e0b" },
                { m: "Ag", v: "5.0 g", c: "#9ca3af", b: "#9ca3af" },
                { m: "Pd", v: "0.33 g", c: "#a78bfa", b: "#7c3aed" },
              ].map(m => (
                <div key={m.m} style={{ flex: 1, background: "#162030", border: `1.5px solid ${m.b}`, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: m.c }}>{m.m}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 3 }}>{m.v}</div>
                </div>
              ))}
              <div style={{ flex: 1, background: "#f59e0b", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: "#7a4800" }}>WARTOŚĆ</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginTop: 2 }}>3 421</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#4a2800" }}>PLN</div>
              </div>
            </div>

            {/* Profitability */}
            <div style={{ background: "#162030", border: "1px solid #2a3a50", borderRadius: 8, padding: "8px 9px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#fff", marginBottom: 6 }}>Opłacalność: AR (woda królewska)</div>
              {[
                { label: "Przychód", pct: "80%", color: "#22c55e", val: "3 421 zł" },
                { label: "Koszty", pct: "23%", color: "#ef4444", val: "-312 zł" },
                { label: "Zysk netto", pct: "68%", color: "#f59e0b", val: "2 876 zł" },
              ].map(b => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <div style={{ width: 55, fontSize: 8.5, color: "#8899aa" }}>{b.label}</div>
                  <div style={{ flex: 1, background: "#1e2a3a", borderRadius: 3, height: 6 }}>
                    <div style={{ width: b.pct, height: "100%", background: b.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 44, fontSize: 8.5, color: b.color, textAlign: "right" }}>{b.val}</div>
                </div>
              ))}
              <div style={{ background: "rgba(245,158,11,0.12)", borderRadius: 4, padding: "3px 7px", display: "inline-block", marginTop: 2 }}>
                <span style={{ fontSize: 8, color: "#f59e0b" }}>ROI +841% · Opłacalny ✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: AI photo analysis mockup */}
        <div style={{
          height: 196,
          background: "linear-gradient(180deg,#1a2233,#131c2a)",
          borderRadius: 14, border: "1.5px solid #2a3a50",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          overflow: "hidden", display: "flex", gap: 0,
        }}>
          {/* Simulated photo scan area */}
          <div style={{
            width: 220, position: "relative", background: "#0d1117",
            borderRight: "1px solid #2a3a50",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Simulated photo background with chips */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a1a2e, #0f0f23)", opacity: 0.8 }} />
            {/* PCB chip visual */}
            {[
              { x: 20, y: 25, w: 55, h: 40, label: "CPU cer.", color: "#f59e0b" },
              { x: 90, y: 20, w: 80, h: 60, label: "Płyta główna", color: "#22c55e" },
              { x: 25, y: 80, w: 65, h: 30, label: "RAM złote", color: "#f59e0b" },
              { x: 145, y: 90, w: 50, h: 40, label: "GPU", color: "#a78bfa" },
            ].map((box, i) => (
              <div key={i} style={{
                position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h,
                border: `1.5px solid ${box.color}`,
                borderRadius: 3, zIndex: 2,
              }}>
                <div style={{
                  position: "absolute", top: -13, left: 0,
                  background: box.color, borderRadius: 3, padding: "1px 4px",
                  fontSize: 7, fontWeight: 700, color: box.color === "#f59e0b" ? "#000" : "#fff",
                  whiteSpace: "nowrap",
                }}>{box.label}</div>
              </div>
            ))}
            {/* Scan line animation visual */}
            <div style={{
              position: "absolute", left: 0, right: 0, top: "48%", height: 2,
              background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
              opacity: 0.8,
            }} />
            {/* Corner brackets */}
            {[
              { top: 6, left: 6, bt: "2px solid #f59e0b", bl: "2px solid #f59e0b", br: "none", bb: "none" },
              { top: 6, right: 6, bt: "2px solid #f59e0b", br: "2px solid #f59e0b", bl: "none", bb: "none" },
              { bottom: 6, left: 6, bb: "2px solid #f59e0b", bl: "2px solid #f59e0b", br: "none", bt: "none" },
              { bottom: 6, right: 6, bb: "2px solid #f59e0b", br: "2px solid #f59e0b", bl: "none", bt: "none" },
            ].map((c, i) => (
              <div key={i} style={{ position: "absolute", width: 12, height: 12, ...c }} />
            ))}
          </div>

          {/* Analysis results */}
          <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "rgba(245,158,11,0.15)", borderRadius: 6, padding: "4px 8px", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: "#f59e0b" }}>AI VISION SCAN</span>
              </div>
              <div style={{ fontSize: 9, color: "#22c55e", fontWeight: 600 }}>✓ Claude 3.5 — analiza gotowa</div>
            </div>

            {/* Detected items */}
            <div style={{ fontSize: 9, color: "#6b7f9a", marginBottom: 5, fontWeight: 600 }}>WYKRYTE MATERIAŁY (4 typy):</div>
            {[
              { name: "Procesory ceramiczne 486", qty: "×8", au: "Au 7.0", ag: "Ag 2.0", val: "~4 200 zł/kg" },
              { name: "Płyta główna (stara, ISA)", qty: "×3", au: "Au 0.35", ag: "Ag 0.45", val: "~180 zł/kg" },
              { name: "Pamięci RAM (złote)", qty: "×12", au: "Au 1.30", ag: "Ag 0.40", val: "~820 zł/kg" },
              { name: "Karta graficzna (GPU)", qty: "×2", au: "Au 0.22", ag: "Ag 1.20", val: "~310 zł/kg" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
                background: "rgba(30,42,58,0.6)", borderRadius: 5, padding: "3.5px 7px",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: ["#f59e0b","#22c55e","#f59e0b","#a78bfa"][i], flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 9, color: "#dde3ec" }}>{item.name}</div>
                <div style={{ fontSize: 8.5, color: "#f59e0b", flexShrink: 0 }}>{item.qty}</div>
                <div style={{ fontSize: 8, color: "#6b7f9a", flexShrink: 0 }}>{item.au} · {item.ag} g/kg</div>
                <div style={{ fontSize: 8.5, color: "#22c55e", fontWeight: 600, flexShrink: 0 }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
