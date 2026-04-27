import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon, Star, Shield, Brain, CalendarDays,
  LogIn, LogOut, Mail, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_META = {
  admin: { label: "Administrator", icon: Shield, color: "text-red-400", bg: "bg-red-500/10", badgeClass: "bg-red-500/15 text-red-400 border-red-500/30" },
  vip:   { label: "VIP",           icon: Star,   color: "text-yellow-400", bg: "bg-yellow-500/10", badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  user:  { label: "Użytkownik",    icon: UserIcon, color: "text-blue-400", bg: "bg-blue-500/10", badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

function formatDate(val: unknown): string {
  if (!val) return "—";
  try {
    return new Date(val as string).toLocaleString("pl-PL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function UserPanelPage() {
  const [, navigate] = useLocation();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/logowanie");
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const role = user.role as keyof typeof ROLE_META;
  const meta = ROLE_META[role] ?? ROLE_META.user;
  const RoleIcon = meta.icon;
  const u = user as typeof user & {
    aiUsageCount?: number;
    createdAt?: unknown;
    lastLoginAt?: unknown;
    emailVerified?: boolean;
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-primary" />
          Mój panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Informacje o Twoim koncie i aktywności
        </p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Konto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full shrink-0", meta.bg)}>
              <RoleIcon className={cn("w-5 h-5", meta.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{u.name ?? u.email}</p>
              <Badge variant="outline" className={cn("text-xs mt-0.5", meta.badgeClass)}>
                {meta.label}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-border rounded-md border border-border overflow-hidden text-sm">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/20">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground min-w-[90px]">E-mail</span>
              <span className="truncate font-mono text-xs ml-auto">{u.email}</span>
            </div>
            {u.createdAt && (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground min-w-[90px]">Rejestracja</span>
                <span className="ml-auto text-xs">{formatDate(u.createdAt)}</span>
              </div>
            )}
            {u.lastLoginAt && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/20">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground min-w-[90px]">Ostatnie logowanie</span>
                <span className="ml-auto text-xs">{formatDate(u.lastLoginAt)}</span>
              </div>
            )}
            {u.emailVerified !== undefined && (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <LogIn className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground min-w-[90px]">E-mail zweryfikowany</span>
                <span className={cn("ml-auto text-xs font-medium", u.emailVerified ? "text-green-400" : "text-yellow-400")}>
                  {u.emailVerified ? "Tak" : "Nie"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Aktywność AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono">{u.aiUsageCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">analiz AI wykonanych na Twoim koncie</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full gap-2 text-muted-foreground"
        onClick={() => { logout(); navigate("/"); }}
      >
        <LogOut className="w-4 h-4" />
        Wyloguj się
      </Button>
    </div>
  );
}
