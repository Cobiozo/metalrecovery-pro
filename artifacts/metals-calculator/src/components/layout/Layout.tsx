import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Beaker, Calculator, Coins, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Kalkulator", labelFull: "Kalkulator Wsadu", icon: Calculator },
    { href: "/kursy", label: "Kursy", labelFull: "Kursy Metali", icon: Coins },
    { href: "/procesy", label: "Procesy", labelFull: "Procesy Chemiczne", icon: Beaker },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="bg-primary/10 p-2 rounded-md">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">MetalRecovery</h1>
            <p className="text-xs text-primary font-mono font-medium">PRO EDITION</p>
          </div>
        </div>
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
        </nav>
        <div className="p-4 border-t border-border mt-auto">
          <div className="text-xs text-muted-foreground font-mono text-center">
            SYSTEM STATUS: ONLINE
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="bg-primary/10 p-1.5 rounded-md">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-base leading-tight tracking-tight">MetalRecovery</span>
          <span className="text-xs text-primary font-mono font-medium ml-2">PRO</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
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
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
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
