import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getAuthApiBase as getApiBase } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Users, BarChart2, Settings, Plus, Trash2, Edit2, Check, X,
  Shield, Star, User as UserIcon, RefreshCw, Send, Eye, EyeOff,
  Activity, Brain, Globe, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  Mail, Server
} from "lucide-react";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  aiUsageCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

type StatsData = {
  daily: Record<string, Record<string, number>>;
  users: { admin: number; user: number; vip: number; total: number };
  totalAiAnalyses: number;
};

type Settings = Record<string, string | null>;

const ROLE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Administrator", icon: Shield, color: "text-red-400" },
  vip: { label: "VIP", icon: Star, color: "text-yellow-400" },
  user: { label: "Użytkownik", icon: UserIcon, color: "text-blue-400" },
};

type Tab = "users" | "stats" | "settings";

export function AdminPage() {
  const { user, authHeaders, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-red-500/10 p-2 rounded-md">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Panel Administratora</h1>
          <p className="text-xs text-muted-foreground">Zarządzanie systemem MetalRecovery Pro</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-0">
        {(["users", "stats", "settings"] as Tab[]).map((t) => {
          const icons = { users: Users, stats: BarChart2, settings: Settings };
          const labels = { users: "Użytkownicy", stats: "Statystyki", settings: "Ustawienia" };
          const Icon = icons[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {labels[t]}
            </button>
          );
        })}
      </div>

      {tab === "users" && <UsersTab authHeaders={authHeaders} toast={toast} currentUserId={user.id} />}
      {tab === "stats" && <StatsTab authHeaders={authHeaders} />}
      {tab === "settings" && <SettingsTab authHeaders={authHeaders} toast={toast} />}
    </div>
  );
}

function UsersTab({
  authHeaders,
  toast,
  currentUserId,
}: {
  authHeaders: () => Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
  currentUserId: number;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      toast({ title: "Błąd", description: "Nie udało się załadować użytkowników.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deleteUser = async (id: number) => {
    if (!confirm("Usunąć tego użytkownika?")) return;
    const res = await fetch(`${getApiBase()}/admin/users/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      toast({ title: "Usunięto użytkownika" });
      fetchUsers();
    } else {
      const d = await res.json();
      toast({ title: "Błąd", description: d.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} użytkownik(ów)</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nowy użytkownik
        </button>
      </div>

      {showCreate && (
        <CreateUserForm
          authHeaders={authHeaders}
          toast={toast}
          onCreated={() => { setShowCreate(false); fetchUsers(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            editId === u.id ? (
              <EditUserForm
                key={u.id}
                user={u}
                authHeaders={authHeaders}
                toast={toast}
                onSaved={() => { setEditId(null); fetchUsers(); }}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <UserCard
                key={u.id}
                user={u}
                isCurrent={u.id === currentUserId}
                onEdit={() => setEditId(u.id)}
                onDelete={() => deleteUser(u.id)}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({
  user, isCurrent, onEdit, onDelete
}: {
  user: UserRow; isCurrent: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const role = ROLE_LABELS[user.role] ?? ROLE_LABELS.user;
  const Icon = role.icon;
  return (
    <div className={`bg-card border rounded-lg p-4 flex items-center justify-between gap-4 ${
      isCurrent ? "border-primary/30" : "border-border"
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-full bg-card border border-border ${role.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{user.name ?? user.email}</span>
            {user.name && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
            {isCurrent && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Ty</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-medium ${role.color}`}>{role.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${user.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {user.isActive ? "Aktywny" : "Nieaktywny"}
            </span>
            {!user.emailVerified && (
              <span className="text-xs bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">Email niezweryfikowany</span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3" />{user.aiUsageCount} analiz AI
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        {!isCurrent && (
          <button onClick={onDelete} className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function CreateUserForm({
  authHeaders, toast, onCreated, onCancel
}: {
  authHeaders: () => Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "user", isActive: true, emailVerified: true });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/users`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: "Użytkownik utworzony" });
      onCreated();
    } catch (err: unknown) {
      toast({ title: "Błąd", description: err instanceof Error ? err.message : "Błąd", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-primary/30 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Nowy użytkownik</h3>
      <div className="grid grid-cols-2 gap-3">
        <input required type="email" placeholder="Email *" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <input placeholder="Imię / nazwa" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <div className="relative">
          <input required type={showPass ? "text" : "password"} placeholder="Hasło *" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 pr-9 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="user">Użytkownik</option>
          <option value="vip">VIP</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Konto aktywne
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })} />
          Email zweryfikowany
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Anuluj
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Utwórz
        </button>
      </div>
    </form>
  );
}

function EditUserForm({
  user, authHeaders, toast, onSaved, onCancel
}: {
  user: UserRow;
  authHeaders: () => Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: user.name ?? "", role: user.role, isActive: user.isActive,
    emailVerified: user.emailVerified, password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name || null, role: form.role,
        isActive: form.isActive, emailVerified: form.emailVerified,
      };
      if (form.password) body.password = form.password;
      const res = await fetch(`${getApiBase()}/admin/users/${user.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: "Zapisano zmiany" });
      onSaved();
    } catch (err: unknown) {
      toast({ title: "Błąd", description: err instanceof Error ? err.message : "Błąd", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-yellow-500/30 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Edycja: {user.email}</h3>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Imię / nazwa" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="user">Użytkownik</option>
          <option value="vip">VIP</option>
          <option value="admin">Administrator</option>
        </select>
        <div className="relative col-span-2">
          <input type={showPass ? "text" : "password"} placeholder="Nowe hasło (opcjonalne)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 pr-9 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Konto aktywne
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })} />
          Email zweryfikowany
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4 inline mr-1" />Anuluj
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-yellow-500 text-yellow-950 text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50 transition-colors">
          {loading ? <div className="w-3.5 h-3.5 border-2 border-yellow-900/30 border-t-yellow-900 rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Zapisz
        </button>
      </div>
    </form>
  );
}

function StatsTab({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/admin/stats`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [authHeaders]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!stats) return <p className="text-muted-foreground text-sm">Brak danych.</p>;

  const last30Visits = Object.values(stats.daily).reduce((s, d) => s + (d.page_visits ?? 0), 0);
  const last30AI = Object.values(stats.daily).reduce((s, d) => s + (d.ai_analyses ?? 0), 0);
  const dates = Object.keys(stats.daily).sort().slice(-14);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Wszyscy użytkownicy" value={stats.users.total} color="text-blue-400" />
        <StatCard icon={Shield} label="Administratorzy" value={stats.users.admin} color="text-red-400" />
        <StatCard icon={Star} label="VIP" value={stats.users.vip} color="text-yellow-400" />
        <StatCard icon={UserIcon} label="Użytkownicy" value={stats.users.user} color="text-green-400" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={Globe} label="Wizyty (30 dni)" value={last30Visits} color="text-cyan-400" />
        <StatCard icon={Brain} label="Analizy AI (30 dni)" value={last30AI} color="text-purple-400" />
        <StatCard icon={Brain} label="Analizy AI (łącznie)" value={stats.totalAiAnalyses} color="text-indigo-400" />
      </div>

      {dates.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Ostatnie 14 dni</h3>
          <div className="space-y-2">
            {dates.map((date) => {
              const d = stats.daily[date] ?? {};
              const visits = d.page_visits ?? 0;
              const ai = d.ai_analyses ?? 0;
              const maxVisits = Math.max(1, ...dates.map((dt) => stats.daily[dt]?.page_visits ?? 0));
              return (
                <div key={date} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted-foreground shrink-0">{date.slice(5)}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${(visits / maxVisits) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{visits}</span>
                    </div>
                    {ai > 0 && (
                      <div className="flex items-center gap-2">
                        <Brain className="w-3 h-3 text-purple-400 shrink-0" />
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${(ai / maxVisits) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-muted-foreground">{ai}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
      <div className={`${color} bg-current/10 p-2 rounded-md`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SettingsTab({
  authHeaders, toast
}: {
  authHeaders: () => Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  useEffect(() => {
    fetch(`${getApiBase()}/admin/settings`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setSettings)
      .finally(() => setLoading(false));
  }, [authHeaders]);

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/settings`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Ustawienia zapisane" });
    } catch {
      toast({ title: "Błąd", description: "Nie udało się zapisać ustawień.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const testSmtp = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/settings/smtp-test`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          host: settings.smtp_host,
          port: settings.smtp_port ?? "587",
          secure: settings.smtp_secure === "true",
          user: settings.smtp_user,
          pass: settings.smtp_pass,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: "SMTP działa", description: d.message });
    } catch (err: unknown) {
      toast({ title: "Błąd SMTP", description: err instanceof Error ? err.message : "Błąd", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const regEnabled = settings.registration_enabled === "true";

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Rejestracja użytkowników
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status rejestracji</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {regEnabled
                ? "Rejestracja jest włączona — nowi użytkownicy mogą się rejestrować"
                : "Rejestracja jest wyłączona — tylko administrator może tworzyć konta"}
            </p>
          </div>
          <button
            onClick={() => set("registration_enabled", regEnabled ? "false" : "true")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              regEnabled ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {regEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {regEnabled ? "Włączona" : "Wyłączona"}
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            URL strony (do linków w emailach)
          </label>
          <input
            value={settings.site_url ?? ""}
            onChange={(e) => set("site_url", e.target.value)}
            placeholder="https://metalrecovery.online"
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          Konfiguracja SMTP
          <span className="text-xs text-muted-foreground font-normal ml-1">(wymagane do emailowej rejestracji)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Serwer SMTP</label>
            <input
              value={settings.smtp_host ?? ""}
              onChange={(e) => set("smtp_host", e.target.value)}
              placeholder="mail.cyberfolks.pl"
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Port</label>
            <input
              value={settings.smtp_port ?? "587"}
              onChange={(e) => set("smtp_port", e.target.value)}
              placeholder="587"
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Użytkownik SMTP</label>
            <input
              value={settings.smtp_user ?? ""}
              onChange={(e) => set("smtp_user", e.target.value)}
              placeholder="noreply@metalrecovery.online"
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Hasło SMTP</label>
            <div className="relative">
              <input
                type={showSmtpPass ? "text" : "password"}
                value={settings.smtp_pass ?? ""}
                onChange={(e) => set("smtp_pass", e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-9 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Adres nadawcy (From)</label>
            <input
              value={settings.smtp_from ?? ""}
              onChange={(e) => set("smtp_from", e.target.value)}
              placeholder="noreply@metalrecovery.online"
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smtp_secure === "true"}
                onChange={(e) => set("smtp_secure", e.target.checked ? "true" : "false")}
              />
              Połączenie szyfrowane (SSL/TLS, port 465)
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={testSmtp}
            disabled={testing || !settings.smtp_host}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors"
          >
            {testing ? (
              <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Testuj połączenie
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Zapisz wszystkie ustawienia
        </button>
      </div>
    </div>
  );
}
