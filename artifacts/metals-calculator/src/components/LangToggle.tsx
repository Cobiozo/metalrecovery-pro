import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();

  if (compact) {
    return (
      <button
        onClick={() => setLang(lang === "pl" ? "en" : "pl")}
        className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-xs font-bold font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="Switch language / Zmień język"
        aria-label="Switch language"
      >
        <span className={cn(lang === "pl" ? "text-foreground" : "text-muted-foreground/50")}>PL</span>
        <span className="text-muted-foreground/40">|</span>
        <span className={cn(lang === "en" ? "text-foreground" : "text-muted-foreground/50")}>EN</span>
      </button>
    );
  }

  return (
    <div className="flex items-center rounded-md border border-border overflow-hidden bg-muted/30">
      <button
        onClick={() => setLang("pl")}
        className={cn(
          "flex-1 px-3 py-1.5 text-xs font-bold font-mono transition-colors",
          lang === "pl"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-pressed={lang === "pl"}
      >
        PL
      </button>
      <button
        onClick={() => setLang("en")}
        className={cn(
          "flex-1 px-3 py-1.5 text-xs font-bold font-mono transition-colors",
          lang === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
