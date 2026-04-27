import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Beaker, Calculator, Coins, Activity, Info, WifiOff,
  Download, ShoppingCart, ScanLine, Coffee, Shield, LogIn, LogOut,
  User as UserIcon, Star, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";

const ROLE_META = {
  admin: { label: "Administrator", icon: Shield, color: "text-red-400", bg: "bg-red-500/10" },
  vip:   { label: "VIP",           icon: Star,   color: "text-yellow-400", bg: "bg-yellow-500/10" },
  user:  { label: "Użytkownik",    icon: UserIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
};

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isOffline, canInstall, installApp } = usePWA();
  const { user, logout, loading: authLoading } = useAuth();

  const navItems = [
    { href: "/", label: "Kalkulator", labelFull: "Kalkulator Metali", icon: Calculator },
    { href: "/skup", label: "Skup", labelFull: "Kalkulator skupu", icon: ShoppingCart },
    { href: "/analiza", label: "Analiza", labelFull: "Analiza zdjęcia", icon: ScanLine },
    { href: "/kursy", label: "Kursy", labelFull: "Kursy Metali", icon: Coins },
    { href: "/procesy", label: "Procesy", labelFull: "Procesy Chemiczne", icon: Beaker },
  ];

  const roleMeta = user ? (ROLE_META[user.role as keyof typeof ROLE_META] ?? ROLE_META.user) : null;
  const RoleIcon = roleMeta?.icon ?? UserIcon;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/95 text-yellow-950 text-sm font-medium backdrop-blur-sm">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Brak połączenia — dane z pamięci podręcznej</span>
        </div>
      )}
      {/* Spacer for offline banner on mobile */}
      {isOffline && <div className="md:hidden h-9 shrink-0" />}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Link href="/" className="p-6 flex items-center gap-3 border-b border-border hover:bg-muted/30 transition-colors">
          <div className="bg-primary/10 p-2 rounded-md">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">MetalRecovery</h1>
            <p className="text-xs text-primary font-mono font-medium">PRO EDITION</p>
          </div>
        </Link>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.labelFull}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium",
                location === "/admin"
                  ? "bg-red-500/20 text-red-400"
                  : "text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
              )}
            >
              <Shield className="w-4 h-4" />
              Panel Admina
            </Link>
          )}
          {user && (
            <Link
              href="/panel"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium",
                location === "/panel"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Mój panel
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-border mt-auto space-y-3">
          {!authLoading && (
            user ? (
              <div className="bg-muted/50 border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1 rounded-full", roleMeta?.bg)}>
                    <RoleIcon className={cn("w-3.5 h-3.5", roleMeta?.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{user.name ?? user.email}</p>
                    <p className={cn("text-[10px] font-medium", roleMeta?.color)}>{roleMeta?.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Wyloguj się
                </button>
              </div>
            ) : (
              <Link
                href="/logowanie"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Zaloguj się
              </Link>
            )
          )}

          <a
            href="https://buycoffee.to/mobilneit"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-amber-950 text-sm font-semibold transition-colors shadow-sm"
          >
            <Coffee className="w-4 h-4" />
            Wesprzyj projekt ☕
          </a>
          {canInstall && (
            <button
              onClick={installApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Zainstaluj aplikację
            </button>
          )}
          <div className={cn(
            "text-xs font-mono text-center",
            isOffline ? "text-yellow-500" : "text-muted-foreground"
          )}>
            SYSTEM STATUS: {isOffline ? "OFFLINE" : "ONLINE"}
          </div>
          <div className="flex gap-2 items-start bg-muted/50 border border-border rounded-md p-3">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Wszystkie informacje mają charakter <strong>wyłącznie informacyjny i edukacyjny</strong>. Nie stanowią porady technicznej ani zachęty do przeprowadzania procesów chemicznych.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
          <div className="bg-primary/10 p-1.5 rounded-md shrink-0">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-base leading-tight tracking-tight truncate">MetalRecovery</span>
            <span className="text-xs text-primary font-mono font-medium shrink-0">PRO</span>
          </div>
        </Link>
        {!authLoading && user?.role === "admin" && (
          <Link href="/admin" className="p-1.5 rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Shield className="w-4 h-4" />
          </Link>
        )}
        {!authLoading && user && (
          <Link href="/panel" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <LayoutDashboard className="w-4 h-4" />
          </Link>
        )}
        {!authLoading && (
          user ? (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {user.name?.split(" ")[0] ?? user.email.split("@")[0]}
              <LogOut className="w-3.5 h-3.5 ml-1" />
            </button>
          ) : (
            <Link
              href="/logowanie"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zaloguj</span>
            </Link>
          )
        )}
        <a
          href="https://buycoffee.to/mobilneit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-semibold transition-colors shrink-0"
          title="Wesprzyj projekt"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Wesprzyj</span>
        </a>
        {canInstall && (
          <button
            onClick={installApp}
            title="Zainstaluj aplikację"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zainstaluj</span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className={cn(
          "mx-auto p-4 md:p-8",
          location === "/analiza" ? "w-full" : "max-w-6xl"
        )}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
