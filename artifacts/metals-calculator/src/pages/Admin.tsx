import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getAuthApiBase as getApiBase } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Users, BarChart2, Settings, Plus, Trash2, Edit2, Check, X,
  Shield, Star, User as UserIcon, RefreshCw, Send, Eye, EyeOff,
  Activity, Brain, Globe, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  Mail, Server, List
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

type AiLogRow = {
  id: number;
  createdAt: string;
  ip: string;
  userId: number | null;
  userEmail: string | null;
  materialsDetected: string | null;
  itemCount: number;
};

type VisitLogRow = {
  id: number;
  createdAt: string;
  ip: string;
};

const ROLE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Administrator", icon: Shield, color: "text-red-400" },
  vip: { label: "VIP", icon: Star, color: "text-yellow-400" },
  user: { label: "User", icon: UserIcon, color: "text-blue-400" },
};

type Tab = "users" | "stats" | "settings" | "vision";

export function AdminPage() {
  const { user, authHeaders, isAdmin, loading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-red-500/10 p-2 rounded-md">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("admin.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
      </div>

      <div className="flex border-b border-border pb-0 overflow-x-auto">
        {(["users", "stats", "settings", "vision"] as Tab[]).map((tabKey) => {
          const icons = { users: Users, stats: BarChart2, settings: Settings, vision: Brain };
          const labels: Record<Tab, string> = { users: t("admin.tabs.users"), stats: t("admin.tabs.stats"), settings: t("admin.tabs.settings"), vision: t("admin.tabs.vision") };
          const Icon = icons[tabKey];
          return (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === tabKey
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{labels[tabKey]}</span>
            </button>
          );
        })}
      </div>

      {tab === "users" && <UsersTab authHeaders={authHeaders} toast={toast} currentUserId={user.id} />}
      {tab === "stats" && <StatsTab authHeaders={authHeaders} />}
      {tab === "settings" && <SettingsTab authHeaders={authHeaders} toast={toast} />}
      {tab === "vision" && <VisionTab authHeaders={authHeaders} toast={toast} />}
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
  const { t } = useTranslation();
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
      toast({ title: t("common.error"), description: t("admin.users.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast, t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deleteUser = async (id: number) => {
    if (!confirm(t("admin.users.deleteConfirm"))) return;
    const res = await fetch(`${getApiBase()}/admin/users/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      toast({ title: t("admin.users.deleted") });
      fetchUsers();
    } else {
      const d = await res.json();
      toast({ title: t("common.error"), description: d.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("admin.users.count", { count: users.length })}</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("admin.users.newUser")}
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
  const { t } = useTranslation();
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
            {isCurrent && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t("admin.users.you")}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-medium ${role.color}`}>{role.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${user.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {user.isActive ? t("admin.users.active") : t("admin.users.inactive")}
            </span>
            {!user.emailVerified && (
              <span className="text-xs bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">{t("admin.users.emailUnverified")}</span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3" />{user.aiUsageCount} {t("admin.users.aiAnalysesCount")}
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
  const { t } = useTranslation();
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
      toast({ title: t("admin.users.created") });
      onCreated();
    } catch (err: unknown) {
      toast({ title: t("common.error"), description: err instanceof Error ? err.message : t("common.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-primary/30 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">{t("admin.users.newUser")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required type="email" placeholder="Email *" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <input placeholder={t("admin.users.name")} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <div className="relative">
          <input required type={showPass ? "text" : "password"} placeholder={`${t("login.password")} *`} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 pr-9 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="user">{ROLE_LABELS.user.label}</option>
          <option value="vip">VIP</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          {t("admin.users.accountActive")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })} />
          {t("admin.users.emailVerifiedLabel")}
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {t("admin.users.create")}
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
  const { t } = useTranslation();
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
      toast({ title: t("admin.users.saveChanges") });
      onSaved();
    } catch (err: unknown) {
      toast({ title: t("common.error"), description: err instanceof Error ? err.message : t("common.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-yellow-500/30 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">{t("admin.users.editing")} {user.email}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input placeholder={t("admin.users.name")} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="user">{ROLE_LABELS.user.label}</option>
          <option value="vip">VIP</option>
          <option value="admin">Administrator</option>
        </select>
        <div className="relative col-span-2">
          <input type={showPass ? "text" : "password"} placeholder={t("admin.users.newPasswordOpt")} value={form.password}
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
          {t("admin.users.accountActive")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })} />
          {t("admin.users.emailVerifiedLabel")}
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4 inline mr-1" />{t("common.cancel")}
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-yellow-500 text-yellow-950 text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50 transition-colors">
          {loading ? <div className="w-3.5 h-3.5 border-2 border-yellow-900/30 border-t-yellow-900 rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {t("common.save")}
        </button>
      </div>
    </form>
  );
}

const LOGS_PAGE_SIZE = 15;

function PageControls({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const { t } = useTranslation();
  const pages = Math.ceil(total / LOGS_PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="px-3 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {t("admin.stats.prevPage")}
      </button>
      <span className="text-xs text-muted-foreground">
        {t("admin.stats.page", { current: page + 1, total: pages })}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages - 1}
        className="px-3 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {t("admin.stats.nextPage")}
      </button>
    </div>
  );
}

function StatsTab({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLogs, setAiLogs] = useState<AiLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [visitLogs, setVisitLogs] = useState<VisitLogRow[]>([]);
  const [visitLogsLoading, setVisitLogsLoading] = useState(true);
  const [aiLogsPage, setAiLogsPage] = useState(0);
  const [visitLogsPage, setVisitLogsPage] = useState(0);
  const [clearingAiLogs, setClearingAiLogs] = useState(false);
  const [clearingVisitLogs, setClearingVisitLogs] = useState(false);

  const handleClearAiLogs = useCallback(async () => {
    if (!window.confirm(t("admin.stats.clearAiConfirm", { count: aiLogs.length }))) return;
    setClearingAiLogs(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/ai-logs`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (res.ok) { setAiLogs([]); setAiLogsPage(0); toast({ title: t("admin.stats.clearedAi", { count: data.deleted }) }); }
      else toast({ title: t("common.error"), description: data.error, variant: "destructive" });
    } finally { setClearingAiLogs(false); }
  }, [aiLogs.length, authHeaders, toast, t]);

  const handleClearVisitLogs = useCallback(async () => {
    if (!window.confirm(t("admin.stats.clearVisitConfirm", { count: visitLogs.length }))) return;
    setClearingVisitLogs(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/visit-logs`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (res.ok) { setVisitLogs([]); setVisitLogsPage(0); toast({ title: t("admin.stats.clearedVisits", { count: data.deleted }) }); }
      else toast({ title: t("common.error"), description: data.error, variant: "destructive" });
    } finally { setClearingVisitLogs(false); }
  }, [visitLogs.length, authHeaders, toast, t]);

  useEffect(() => {
    fetch(`${getApiBase()}/admin/stats`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
    fetch(`${getApiBase()}/admin/ai-logs`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setAiLogs(data) : setAiLogs([]))
      .finally(() => setLogsLoading(false));
    fetch(`${getApiBase()}/admin/visit-logs`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setVisitLogs(data) : setVisitLogs([]))
      .finally(() => setVisitLogsLoading(false));
  }, [authHeaders]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!stats) return <p className="text-muted-foreground text-sm">{t("common.error")}</p>;

  const last30Visits = Object.values(stats.daily).reduce((s, d) => s + (d.page_visits ?? 0), 0);
  const last30AI = Object.values(stats.daily).reduce((s, d) => s + (d.ai_analyses ?? 0), 0);
  const dates = Object.keys(stats.daily).sort().slice(-14);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label={t("admin.stats.allUsers")} value={stats.users.total} color="text-blue-400" />
        <StatCard icon={Shield} label={t("admin.stats.admins")} value={stats.users.admin} color="text-red-400" />
        <StatCard icon={Star} label={t("admin.stats.vip")} value={stats.users.vip} color="text-yellow-400" />
        <StatCard icon={UserIcon} label={t("admin.stats.regularUsers")} value={stats.users.user} color="text-green-400" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={Globe} label={t("admin.stats.visits30d")} value={last30Visits} color="text-cyan-400" />
        <StatCard icon={Brain} label={t("admin.stats.ai30d")} value={last30AI} color="text-purple-400" />
        <StatCard icon={Brain} label={t("admin.stats.aiTotal")} value={stats.totalAiAnalyses} color="text-indigo-400" />
      </div>

      {dates.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">{t("admin.stats.last14days")}</h3>
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

      {/* AI Analysis Logs */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <List className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold">{t("admin.stats.aiLogs")}</h3>
          <span className="text-xs text-muted-foreground">
            {aiLogs.length > 0 ? t("admin.stats.entries", { count: aiLogs.length }) : t("admin.stats.last100")}
          </span>
          {aiLogs.length > 0 && (
            <button
              onClick={handleClearAiLogs}
              disabled={clearingAiLogs}
              className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors px-2 py-1 rounded border border-red-400/30 hover:border-red-400/60"
            >
              {clearingAiLogs
                ? <><div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />{t("admin.stats.clearing")}</>
                : <><Trash2 className="w-3 h-3" />{t("admin.stats.clearLogs")}</>
              }
            </button>
          )}
        </div>
        {logsLoading ? (
          <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : aiLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">{t("admin.stats.noLogs")}</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="text-xs" style={{ minWidth: "520px", width: "100%" }}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 pr-3 font-medium whitespace-nowrap">{t("admin.stats.date")}</th>
                    <th className="text-left pb-2 pr-3 font-medium whitespace-nowrap">{t("admin.stats.ip")}</th>
                    <th className="text-left pb-2 pr-3 font-medium whitespace-nowrap">{t("admin.stats.account")}</th>
                    <th className="text-left pb-2 pr-3 font-medium">{t("admin.stats.detectedMaterials")}</th>
                    <th className="text-right pb-2 font-medium whitespace-nowrap">{t("admin.stats.count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {aiLogs
                    .slice(aiLogsPage * LOGS_PAGE_SIZE, (aiLogsPage + 1) * LOGS_PAGE_SIZE)
                    .map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-1.5 pr-3 text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("pl-PL", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="py-1.5 pr-3 font-mono text-muted-foreground whitespace-nowrap">{log.ip}</td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">
                          {log.userEmail ? (
                            <span className="text-purple-400">{log.userEmail}</span>
                          ) : (
                            <span className="text-muted-foreground/50">{t("admin.stats.anon")}</span>
                          )}
                        </td>
                        <td
                          className="py-1.5 pr-3 text-foreground/80 max-w-[180px] overflow-hidden"
                          style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={log.materialsDetected ?? undefined}
                        >
                          {log.materialsDetected || <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="py-1.5 text-right text-muted-foreground">{log.itemCount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <PageControls page={aiLogsPage} total={aiLogs.length} onChange={setAiLogsPage} />
          </>
        )}
      </div>

      {/* Visit Logs */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold">{t("admin.stats.visitLogs")}</h3>
          <span className="text-xs text-muted-foreground">
            {visitLogs.length > 0 ? t("admin.stats.entries", { count: visitLogs.length }) : t("admin.stats.last200")}
          </span>
          {visitLogs.length > 0 && (
            <button
              onClick={handleClearVisitLogs}
              disabled={clearingVisitLogs}
              className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors px-2 py-1 rounded border border-red-400/30 hover:border-red-400/60"
            >
              {clearingVisitLogs
                ? <><div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />{t("admin.stats.clearing")}</>
                : <><Trash2 className="w-3 h-3" />{t("admin.stats.clearLogs")}</>
              }
            </button>
          )}
        </div>
        {visitLogsLoading ? (
          <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : visitLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">{t("admin.stats.noVisits")}</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="text-xs" style={{ minWidth: "300px", width: "100%" }}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 pr-3 font-medium whitespace-nowrap">{t("admin.stats.date")}</th>
                    <th className="text-left pb-2 font-medium whitespace-nowrap">{t("admin.stats.ip")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visitLogs
                    .slice(visitLogsPage * LOGS_PAGE_SIZE, (visitLogsPage + 1) * LOGS_PAGE_SIZE)
                    .map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-1.5 pr-3 text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("pl-PL", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="py-1.5 font-mono text-cyan-400/80">{log.ip}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <PageControls page={visitLogsPage} total={visitLogs.length} onChange={setVisitLogsPage} />
          </>
        )}
      </div>
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
  const { t } = useTranslation();
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
      toast({ title: t("admin.settings.saved") });
    } catch {
      toast({ title: t("common.error"), description: t("admin.settings.saveError"), variant: "destructive" });
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
      toast({ title: t("admin.settings.smtpOk"), description: d.message });
    } catch (err: unknown) {
      toast({ title: t("admin.settings.smtpError"), description: err instanceof Error ? err.message : t("common.error"), variant: "destructive" });
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
          {t("admin.settings.registration")}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("admin.settings.registrationStatus")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {regEnabled ? t("admin.settings.regEnabled") : t("admin.settings.regDisabled")}
            </p>
          </div>
          <button
            onClick={() => set("registration_enabled", regEnabled ? "false" : "true")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 self-start sm:self-auto ${
              regEnabled ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {regEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {regEnabled ? t("admin.settings.enabled") : t("admin.settings.disabled")}
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            {t("admin.settings.siteUrl")}
          </label>
          <input
            value={settings.site_url ?? ""}
            onChange={(e) => set("site_url", e.target.value)}
            placeholder="https://metalrecovery.online"
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            {t("admin.settings.apiUrl")}
          </label>
          <input
            value={settings.api_url ?? ""}
            onChange={(e) => set("api_url", e.target.value)}
            placeholder="https://recovery-calculator-bawolekw9.replit.app"
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">{t("admin.settings.apiUrlHint")}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            {t("admin.settings.smtp")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">{t("admin.settings.smtpNote")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("admin.settings.smtpHost")}</label>
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
            <label className="block text-xs text-muted-foreground mb-1">{t("admin.settings.smtpUser")}</label>
            <input
              value={settings.smtp_user ?? ""}
              onChange={(e) => set("smtp_user", e.target.value)}
              placeholder="noreply@metalrecovery.online"
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("admin.settings.smtpPass")}</label>
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
            <label className="block text-xs text-muted-foreground mb-1">{t("admin.settings.smtpFrom")}</label>
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
              {t("admin.settings.smtpSecure")}
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
            {t("admin.settings.testSmtp")}
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
          {t("admin.settings.saveAll")}
        </button>
      </div>
    </div>
  );
}

// ── Vision Learning Tab ───────────────────────────────────────────────────────

type VisionCorrection = {
  id: number;
  createdAt: string;
  aiMaterialType: string;
  correctMaterialType: string;
  correctionNote: string | null;
  imageDescription: string | null;
  userEmail: string | null;
  status: string;
  promotedRuleId: number | null;
};

type VisionRule = {
  id: number;
  createdAt: string;
  title: string;
  ruleText: string;
  isActive: boolean;
  sortOrder: number;
};

function VisionTab({
  authHeaders,
  toast,
}: {
  authHeaders: () => Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const { t } = useTranslation();
  const [corrections, setCorrections] = useState<VisionCorrection[]>([]);
  const [rules, setRules] = useState<VisionRule[]>([]);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingR, setLoadingR] = useState(true);
  const [section, setSection] = useState<"corrections" | "rules">("corrections");

  // Promote dialog state
  const [promoteItem, setPromoteItem] = useState<VisionCorrection | null>(null);
  const [promoteTitle, setPromoteTitle] = useState("");
  const [promoteText, setPromoteText] = useState("");
  const [promoting, setPromoting] = useState(false);

  // New rule form
  const [showNewRule, setShowNewRule] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit rule
  const [editRuleId, setEditRuleId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchCorrections = useCallback(async () => {
    setLoadingC(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/vision-corrections`, { headers: authHeaders() });
      if (res.ok) setCorrections(await res.json());
    } finally { setLoadingC(false); }
  }, [authHeaders]);

  const fetchRules = useCallback(async () => {
    setLoadingR(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/vision-rules`, { headers: authHeaders() });
      if (res.ok) setRules(await res.json());
    } finally { setLoadingR(false); }
  }, [authHeaders]);

  useEffect(() => {
    fetchCorrections();
    fetchRules();
  }, [fetchCorrections, fetchRules]);

  async function dismissCorrection(id: number) {
    await fetch(`${getApiBase()}/admin/vision-corrections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status: "dismissed" }),
    });
    setCorrections((prev) => prev.map((c) => c.id === id ? { ...c, status: "dismissed" } : c));
  }

  async function restoreCorrection(id: number) {
    await fetch(`${getApiBase()}/admin/vision-corrections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status: "pending" }),
    });
    setCorrections((prev) => prev.map((c) => c.id === id ? { ...c, status: "pending" } : c));
  }

  function openPromote(c: VisionCorrection) {
    setPromoteItem(c);
    setPromoteTitle(`Nie klasyfikuj "${c.aiMaterialType}" jako błędu — poprawna nazwa to "${c.correctMaterialType}"`);
    setPromoteText(
      `Jeśli widzisz materiał sklasyfikowany jako "${c.aiMaterialType}", sprawdź ponownie — poprawna odpowiedź to "${c.correctMaterialType}".` +
      (c.correctionNote ? ` Wskazówka: ${c.correctionNote}` : "")
    );
  }

  async function submitPromote() {
    if (!promoteItem || !promoteTitle.trim() || !promoteText.trim()) return;
    setPromoting(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/vision-corrections/${promoteItem.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: promoteTitle, ruleText: promoteText }),
      });
      if (!res.ok) throw new Error();
      toast({ title: t("admin.vision.promoteSuccess"), description: t("admin.vision.promoteSuccessDesc") });
      setPromoteItem(null);
      await Promise.all([fetchCorrections(), fetchRules()]);
    } catch {
      toast({ title: t("common.error"), description: t("admin.vision.promoteError"), variant: "destructive" });
    } finally { setPromoting(false); }
  }

  async function toggleRule(id: number, current: boolean) {
    await fetch(`${getApiBase()}/admin/vision-rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ isActive: !current }),
    });
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !current } : r));
  }

  async function deleteRule(id: number) {
    if (!confirm(t("admin.vision.deleteRuleConfirm"))) return;
    await fetch(`${getApiBase()}/admin/vision-rules/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: t("admin.vision.ruleDeleted") });
  }

  async function createRule() {
    if (!newTitle.trim() || !newText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/vision-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: newTitle, ruleText: newText }),
      });
      if (!res.ok) throw new Error();
      toast({ title: t("admin.vision.ruleAdded") });
      setNewTitle(""); setNewText(""); setShowNewRule(false);
      await fetchRules();
    } catch {
      toast({ title: t("common.error"), description: t("admin.vision.ruleAddError"), variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function saveEditRule() {
    if (!editRuleId || !editTitle.trim() || !editText.trim()) return;
    setEditSaving(true);
    try {
      await fetch(`${getApiBase()}/admin/vision-rules/${editRuleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: editTitle, ruleText: editText }),
      });
      setRules((prev) => prev.map((r) => r.id === editRuleId ? { ...r, title: editTitle, ruleText: editText } : r));
      setEditRuleId(null);
      toast({ title: t("admin.vision.ruleUpdated") });
    } catch {
      toast({ title: t("common.error"), description: t("admin.vision.ruleUpdateError"), variant: "destructive" });
    } finally { setEditSaving(false); }
  }

  const pending = corrections.filter((c) => c.status === "pending");
  const other = corrections.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold">{t("admin.vision.title")}</h2>
        </div>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setSection("corrections")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              section === "corrections" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("admin.vision.corrections")}
            {pending.length > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSection("rules")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              section === "rules" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("admin.vision.rules")}
            {rules.filter((r) => r.isActive).length > 0 && (
              <span className="ml-1.5 bg-green-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {rules.filter((r) => r.isActive).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Corrections Section ── */}
      {section === "corrections" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: t("admin.vision.correctionsDesc") }}
          />

          {loadingC ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : corrections.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {t("admin.vision.noCorrections")}
            </div>
          ) : (
            <div className="space-y-2">
              {pending.length > 0 && (
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  {t("admin.vision.pendingLabel", { count: pending.length })}
                </p>
              )}
              {[...pending, ...other].map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg border p-3 space-y-2 ${
                    c.status === "pending"
                      ? "border-orange-500/30 bg-orange-500/5"
                      : c.status === "promoted"
                      ? "border-green-500/20 bg-green-500/5 opacity-60"
                      : "border-border bg-muted/20 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                          c.status === "pending" ? "bg-orange-500/20 text-orange-400" :
                          c.status === "promoted" ? "bg-green-500/20 text-green-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {c.status === "pending" ? t("admin.vision.statusPending") : c.status === "promoted" ? t("admin.vision.statusPromoted") : t("admin.vision.statusDismissed")}
                        </span>
                        {c.userEmail && (
                          <span className="text-[11px] text-muted-foreground">{c.userEmail}</span>
                        )}
                        <span className="text-[11px] text-muted-foreground ml-auto">
                          {new Date(c.createdAt).toLocaleDateString("pl-PL")}
                        </span>
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p className="text-muted-foreground">
                          {t("admin.vision.aiSaid")} <span className="font-medium text-foreground line-through decoration-red-400">{c.aiMaterialType}</span>
                        </p>
                        <p className="text-muted-foreground">
                          {t("admin.vision.correctAnswer")} <span className="font-semibold text-green-400">{c.correctMaterialType}</span>
                        </p>
                        {c.correctionNote && (
                          <p className="text-muted-foreground italic">„{c.correctionNote}"</p>
                        )}
                        {c.imageDescription && (
                          <p className="text-muted-foreground/70 text-[11px]">{t("admin.vision.aiDesc")} {c.imageDescription.slice(0, 120)}{c.imageDescription.length > 120 ? "…" : ""}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {c.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => openPromote(c)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                        {t("admin.vision.promote")}
                      </button>
                      <button
                        onClick={() => dismissCorrection(c.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        {t("admin.vision.dismiss")}
                      </button>
                    </div>
                  )}
                  {c.status === "dismissed" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => restoreCorrection(c.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {t("admin.vision.restore")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Rules Section ── */}
      {section === "rules" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex-1">
              {t("admin.vision.rulesDesc")}
            </p>
            <button
              onClick={() => setShowNewRule((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0 ml-2"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("admin.vision.newRule")}
            </button>
          </div>

          {showNewRule && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">{t("admin.vision.newRuleTitle")}</p>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium block">{t("admin.vision.ruleTitleLabel")}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t("admin.vision.ruleTitlePlaceholder")}
                  className="w-full h-8 px-2.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium block">{t("admin.vision.ruleTextLabel")}</label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  rows={3}
                  placeholder={t("admin.vision.ruleTextPlaceholder")}
                  className="w-full px-2.5 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNewRule(false)} className="px-3 py-1.5 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80">{t("common.cancel")}</button>
                <button
                  onClick={createRule}
                  disabled={saving || !newTitle.trim() || !newText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {t("admin.vision.addRule")}
                </button>
              </div>
            </div>
          )}

          {loadingR ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {t("admin.vision.noRules")}
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className={`rounded-lg border p-3 space-y-2 ${r.isActive ? "border-border" : "border-border/40 opacity-50"}`}>
                  {editRuleId === r.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full h-8 px-2.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full px-2.5 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditRuleId(null)} className="px-3 py-1.5 text-xs rounded bg-muted text-muted-foreground">{t("common.cancel")}</button>
                        <button
                          onClick={saveEditRule}
                          disabled={editSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {editSaving ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          {t("common.save")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleRule(r.id, r.isActive)}
                          className="shrink-0 mt-0.5"
                          title={r.isActive ? t("admin.vision.deactivateTitle") : t("admin.vision.activateTitle")}
                        >
                          {r.isActive
                            ? <ToggleRight className="w-5 h-5 text-green-400" />
                            : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{r.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed whitespace-pre-line">{r.ruleText}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setEditRuleId(r.id); setEditTitle(r.title); setEditText(r.ruleText); }}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={t("common.edit")}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRule(r.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Promote Dialog ── */}
      {promoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ChevronUp className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-sm">{t("admin.vision.promoteDialogTitle")}</h3>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium block">{t("admin.vision.ruleTitle")}</label>
              <input
                type="text"
                value={promoteTitle}
                onChange={(e) => setPromoteTitle(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium block">{t("admin.vision.ruleTextLabel")}</label>
              <textarea
                value={promoteText}
                onChange={(e) => setPromoteText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPromoteItem(null)} disabled={promoting} className="px-4 py-2 text-sm rounded bg-muted text-muted-foreground hover:bg-muted/80">{t("common.cancel")}</button>
              <button
                onClick={submitPromote}
                disabled={promoting || !promoteTitle.trim() || !promoteText.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-600/90 disabled:opacity-50"
              >
                {promoting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {t("admin.vision.addAsRule")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
