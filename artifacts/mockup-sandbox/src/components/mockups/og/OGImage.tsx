export default function OGImage() {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: "linear-gradient(135deg, #0d1117 0%, #1a2233 100%)",
        fontFamily: "'Inter', 'Arial', sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
      }}
    >
      {/* Subtle grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}>
        {[105,210,315,420,525].map(y => <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="#fff" strokeWidth="1"/>)}
        {[200,400,600,800,1000].map(x => <line key={x} x1={x} y1="0" x2={x} y2="630" stroke="#fff" strokeWidth="1"/>)}
      </svg>

      {/* Gold left accent bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 6, height: "100%", background: "linear-gradient(180deg, #f59e0b, #d97706)" }} />
      <div style={{ position: "absolute", left: 6, top: 0, right: 0, height: 3, background: "linear-gradient(90deg, #f59e0b, transparent)", opacity: 0.35 }} />

      {/* ===== LEFT PANEL ===== */}
      <div style={{ width: 540, padding: "36px 32px 36px 32px", display: "flex", flexDirection: "column", zIndex: 10 }}>

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#1e2a3a",
            border: "2.5px solid rgba(245,158,11,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 18px rgba(245,158,11,0.35)",
            flexShrink: 0,
          }}>
            <svg width="30" height="20" viewBox="0 0 30 20">
              <polyline points="0,10 6,1 9,14 14,4 18,9 22,6 30,6"
                fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>MetalRecovery</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#f59e0b", letterSpacing: 3, marginTop: 2 }}>PRO EDITION</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1.5, background: "linear-gradient(90deg, #f59e0b, transparent)", opacity: 0.35, marginBottom: 22 }} />

        {/* Tagline */}
        <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1.25, marginBottom: 4 }}>
          Kalkulator Odzysku
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#f59e0b", lineHeight: 1.25, marginBottom: 6 }}>
          Metali Szlachetnych
        </div>
        <div style={{ fontSize: 14, color: "#6b7fa0", marginBottom: 28 }}>
          z e-odpadów elektronicznych
        </div>

        {/* Features */}
        {[
          { icon: "📷", title: "Analiza zdjęć AI (Claude Vision)", sub: "Wykrywa i klasyfikuje materiały automatycznie" },
          { icon: "📈", title: "Kursy Au/Ag/Pt/Pd na żywo (NBP)", sub: "Dane stooq.pl aktualizowane codziennie" },
          { icon: "⚗", title: "Kalkulator hydrometalurgiczny", sub: "AR, mokra, cementacja — z kosztami chemii" },
          { icon: "📱", title: "PWA — działa offline", sub: "Instalowalna na Android i iOS bez sklepu" },
        ].map((f) => (
          <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "rgba(245,158,11,0.12)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#6b7fa0", marginTop: 2 }}>{f.sub}</div>
            </div>
          </div>
        ))}

        {/* Bottom badges */}
        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          <div style={{
            background: "#f59e0b", borderRadius: 8, padding: "9px 16px",
            fontSize: 13, fontWeight: 700, color: "#000",
          }}>metalrecovery.online</div>
          <div style={{
            background: "transparent", borderRadius: 8, padding: "9px 16px",
            fontSize: 12, fontWeight: 600, color: "#f59e0b",
            border: "1.5px solid rgba(245,158,11,0.5)",
          }}>BEZPŁATNY DOSTĘP</div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — App mockup ===== */}
      <div style={{
        flex: 1, margin: "28px 28px 28px 0",
        background: "linear-gradient(180deg, #1e2a3a, #162030)",
        borderRadius: 16, border: "1.5px solid #2a3a50",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        overflow: "hidden", display: "flex",
      }}>
        {/* Sidebar */}
        <div style={{ width: 140, background: "#0d1621", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "#1e2a3a",
              border: "1.5px solid rgba(245,158,11,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="16" height="11" viewBox="0 0 16 11">
                <polyline points="0,5.5 3,0.5 5,7.5 7.5,2.5 9.5,4.5 11.5,3.5 16,3.5"
                  fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>MetalRecovery</div>
              <div style={{ fontSize: 6.5, fontWeight: 600, color: "#f59e0b", letterSpacing: 1.5 }}>PRO</div>
            </div>
          </div>

          {[
            { label: "Kalkulator Metali", active: true },
            { label: "Kalkulator skupu", active: false },
            { label: "Analiza zdjęcia", active: false },
            { label: "Kursy Metali", active: false },
            { label: "Procesy chem.", active: false },
          ].map((nav) => (
            <div key={nav.label} style={{
              padding: "7px 10px", borderRadius: 7, fontSize: 10, fontWeight: nav.active ? 600 : 400,
              background: nav.active ? "#f59e0b" : "transparent",
              color: nav.active ? "#000" : "#6b7f9a",
              cursor: "pointer",
            }}>{nav.label}</div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Kalkulator Odzysku Metali</div>
            <div style={{ fontSize: 10, color: "#6b7f9a" }}>Precyzyjne szacowanie opłacalności procesów</div>
          </div>

          {/* Step tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ background: "#f59e0b", borderRadius: 12, padding: "5px 12px", fontSize: 10, fontWeight: 600, color: "#000" }}>1. Materiał wsadu</div>
            <div style={{ border: "1px solid #2a3a50", borderRadius: 12, padding: "5px 12px", fontSize: 10, color: "#6b7f9a" }}>2. Parametry procesu</div>
            <div style={{ border: "1px solid #2a3a50", borderRadius: 12, padding: "5px 12px", fontSize: 10, color: "#6b7f9a" }}>3. Wyniki</div>
          </div>

          {/* Material row */}
          <div style={{ background: "#162030", border: "1px solid #2a3a50", borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ display: "flex", gap: 4, fontSize: 9, fontWeight: 600, color: "#6b7f9a", marginBottom: 6 }}>
              <div style={{ flex: 1 }}>MATERIAŁ</div>
              <div style={{ width: 48 }}>ILOŚĆ</div>
              <div style={{ width: 38 }}>JED.</div>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <div style={{ flex: 1, background: "#1e2a3a", border: "1px solid #2a3a50", borderRadius: 6, padding: "6px 8px", fontSize: 10, color: "#fff" }}>
                Procesory ceramiczne 486
              </div>
              <div style={{ width: 48, background: "#1e2a3a", border: "1px solid #2a3a50", borderRadius: 6, padding: "6px 4px", fontSize: 10, color: "#fff", textAlign: "center" }}>2.5</div>
              <div style={{ width: 38, background: "#1e2a3a", border: "1px solid #2a3a50", borderRadius: 6, padding: "6px 4px", fontSize: 10, color: "#fff", textAlign: "center" }}>kg</div>
              <div style={{ width: 28, background: "rgba(220,38,38,0.8)", borderRadius: 6, padding: "6px 4px", fontSize: 11, color: "#fff", textAlign: "center" }}>×</div>
            </div>
          </div>

          {/* Metal values */}
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { metal: "Au", value: "11.0 g", color: "#f59e0b", border: "#f59e0b" },
              { metal: "Ag", value: "5.0 g", color: "#9ca3af", border: "#9ca3af" },
              { metal: "Pd", value: "0.33 g", color: "#a78bfa", border: "#7c3aed" },
            ].map((m) => (
              <div key={m.metal} style={{
                flex: 1, background: "#162030", border: `1.5px solid ${m.border}`,
                borderRadius: 10, padding: "10px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.metal}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 4 }}>{m.value}</div>
              </div>
            ))}
            <div style={{
              flex: 1, background: "#f59e0b", borderRadius: 10, padding: "10px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#7a4800" }}>WARTOŚĆ</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#000", marginTop: 4 }}>3 421</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4a2800" }}>PLN</div>
            </div>
          </div>

          {/* Profitability bars */}
          <div style={{ background: "#162030", border: "1px solid #2a3a50", borderRadius: 10, padding: "10px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Opłacalność: AR (woda królewska)</div>
            {[
              { label: "Przychód z metali", pct: "78%", color: "#22c55e", val: "3 421 zł" },
              { label: "Koszty chemii", pct: "25%", color: "#ef4444", val: "-312 zł" },
              { label: "Zysk netto", pct: "69%", color: "#f59e0b", val: "2 876 zł" },
            ].map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 72, fontSize: 9, color: "#8899aa", flexShrink: 0 }}>{b.label}</div>
                <div style={{ flex: 1, background: "#1e2a3a", borderRadius: 3, height: 7, overflow: "hidden" }}>
                  <div style={{ width: b.pct, height: "100%", background: b.color, borderRadius: 3 }} />
                </div>
                <div style={{ width: 52, fontSize: 9, color: b.color, textAlign: "right", flexShrink: 0 }}>{b.val}</div>
              </div>
            ))}
            <div style={{
              background: "rgba(245,158,11,0.12)", borderRadius: 5, padding: "4px 8px",
              fontSize: 9, color: "#f59e0b", display: "inline-block", marginTop: 2,
            }}>ROI +841% · Opłacalny ✓</div>
          </div>

          {/* Price ticker */}
          <div style={{ background: "#0d1621", border: "1px solid #2a3a50", borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ fontSize: 8, color: "#6b7f9a", marginBottom: 6 }}>KURSY METALI SZLACHETNYCH (NBP)</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { m: "Au", v: "389 350", c: "#f59e0b", ch: "+0.8%", chc: "#22c55e" },
                { m: "Ag", v: "3 856", c: "#9ca3af", ch: "+1.2%", chc: "#22c55e" },
                { m: "Pd", v: "29 108", c: "#a78bfa", ch: "-0.3%", chc: "#ef4444" },
                { m: "Pt", v: "34 220", c: "#60a5fa", ch: "+0.1%", chc: "#22c55e" },
              ].map((p) => (
                <div key={p.m} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.c }}>{p.m}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{p.v}</span>
                  <span style={{ fontSize: 9, color: p.chc }}>{p.ch}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badges */}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1, background: "#1e2a3a", border: "1.5px solid #f59e0b", borderRadius: 8, padding: "6px 8px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b" }}>🤖 AI VISION SCAN</div>
              <div style={{ fontSize: 8, color: "#8899aa", marginTop: 2 }}>Claude 3.5 — auto wykrywanie</div>
            </div>
            <div style={{ flex: 1, background: "#1e2a3a", border: "1.5px solid #22c55e", borderRadius: 8, padding: "6px 8px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e" }}>📱 DZIAŁA OFFLINE</div>
              <div style={{ fontSize: 8, color: "#8899aa", marginTop: 2 }}>PWA bez sklepu aplikacji</div>
            </div>
            <div style={{ flex: 1, background: "#1e2a3a", border: "1.5px solid #60a5fa", borderRadius: 8, padding: "6px 8px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#60a5fa" }}>📊 600+ typów</div>
              <div style={{ fontSize: 8, color: "#8899aa", marginTop: 2 }}>materiałów w bazie danych</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
