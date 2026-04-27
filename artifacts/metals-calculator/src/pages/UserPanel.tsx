import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon, Star, Shield, Brain, CalendarDays,
  LogIn, LogOut, Mail, Clock, BookMarked, Trash2,
  FlaskConical, ChevronRight, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_META = {
  admin: { label: "Administrator", icon: Shield, color: "text-red-400", bg: "bg-red-500/10", badgeClass: "bg-red-500/15 text-red-400 border-red-500/30" },
  vip:   { label: "VIP",           icon: Star,   color: "text-yellow-400", bg: "bg-yellow-500/10", badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  user:  { label: "Użytkownik",    icon: UserIcon, color: "text-blue-400", bg: "bg-blue-500/10", badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

const SESSIONS_KEY = "metalrecovery_sessions";
const MATERIALS_KEY = "metalrecovery_custom_materials";

type SavedSession = {
  id: string;
  name: string;
  savedAt: string;
  result?: {
    netProfitPln?: number;
    totalMetalValuePln?: number;
  };
  batchItems?: Array<{ materialId: string; quantity: number }>;
};

type CustomMaterial = {
  id: string;
  name: string;
  au: number;
  ag: number;
  pt: number;
  pd: number;
  notes: string;
  createdAt: string;
};

function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as SavedSession[]) : [];
  } catch {
    return [];
  }
}

function loadMaterials(): CustomMaterial[] {
  try {
    const raw = localStorage.getItem(MATERIALS_KEY);
    return raw ? (JSON.parse(raw) as CustomMaterial[]) : [];
  } catch {
    return [];
  }
}

function deleteSession(id: string): SavedSession[] {
  const updated = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  return updated;
}

function deleteMaterial(id: string): CustomMaterial[] {
  const updated = loadMaterials().filter((m) => m.id !== id);
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
  return updated;
}

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

function formatPln(val: number | undefined | null): string {
  if (val == null) return "—";
  return val.toLocaleString("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });
}

function MetalBadge({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
      {label}: {value.toFixed(2)} g/kg
    </span>
  );
}

export function UserPanelPage() {
  const [, navigate] = useLocation();
  const { user, logout, loading } = useAuth();

  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [materials, setMaterials] = useState<CustomMaterial[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/logowanie");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      setSessions(loadSessions());
      setMaterials(loadMaterials());
    }
  }, [user]);

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

  const handleDeleteSession = (id: string) => setSessions(deleteSession(id));
  const handleDeleteMaterial = (id: string) => setMaterials(deleteMaterial(id));

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-sans tracking-tight flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-primary" />
          Mój panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Informacje o Twoim koncie, zapisane profile i własne materiały
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

      {/* Saved calculation profiles */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            Moje Profile
          </CardTitle>
          <Badge variant="outline" className="text-xs">{sessions.length}</Badge>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <FlaskConical className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Brak zapisanych profili</p>
              <p className="text-xs text-muted-foreground/60">Zapisz wynik obliczeń w Kalkulatorze, aby pojawił się tutaj.</p>
              <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => navigate("/")}>
                Przejdź do kalkulatora <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <FlaskConical className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(session.savedAt)}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {session.result?.netProfitPln != null && (
                        <span className={cn(
                          "text-xs font-mono font-semibold",
                          session.result.netProfitPln >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          Zysk: {formatPln(session.result.netProfitPln)}
                        </span>
                      )}
                      {session.result?.totalMetalValuePln != null && (
                        <span className="text-xs font-mono text-muted-foreground">
                          Metale: {formatPln(session.result.totalMetalValuePln)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => navigate("/")}
                      title="Otwórz kalkulator"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDeleteSession(session.id)}
                      title="Usuń profil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom materials */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Własne Materiały
          </CardTitle>
          <Badge variant="outline" className="text-xs">{materials.length}</Badge>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Cpu className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Brak własnych materiałów</p>
              <p className="text-xs text-muted-foreground/60">Dodaj własny materiał w Kalkulatorze (kategoria „Własne Profile"), aby pojawił się tutaj.</p>
              <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => navigate("/")}>
                Przejdź do kalkulatora <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((mat) => (
                <div key={mat.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <Cpu className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mat.name}</p>
                    <p className="text-xs text-muted-foreground mb-1">{formatDate(mat.createdAt)}</p>
                    <div className="flex flex-wrap gap-1">
                      <MetalBadge label="Au" value={mat.au} />
                      <MetalBadge label="Ag" value={mat.ag} />
                      <MetalBadge label="Pt" value={mat.pt} />
                      <MetalBadge label="Pd" value={mat.pd} />
                    </div>
                    {mat.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-1 truncate">{mat.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                    onClick={() => handleDeleteMaterial(mat.id)}
                    title="Usuń materiał"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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
