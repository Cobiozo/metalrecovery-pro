import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Activity, LogIn, Eye, EyeOff, UserPlus, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getAuthApiBase } from "@/lib/api";
import { useTranslation } from "react-i18next";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>("login");
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const verified = params.get("verified") === "1";
  const verifiedError = params.get("verified_error") === "1";

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (verified || verifiedError) {
      const clean = new URL(window.location.href);
      clean.searchParams.delete("verified");
      clean.searchParams.delete("verified_error");
      window.history.replaceState({}, "", clean.toString());
    }
  }, [verified, verifiedError]);

  useEffect(() => {
    fetch(`${getAuthApiBase()}/auth/register-status`)
      .then((r) => r.json())
      .then((data) => setRegistrationEnabled(!!data.enabled))
      .catch(() => setRegistrationEnabled(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      const isVerificationError = msg.includes("potwierdzony") || msg.includes("weryfikacyjny");
      toast({ title: t("common.error"), description: msg, variant: "destructive" });
      if (isVerificationError) setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${getAuthApiBase()}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("common.error"));
      toast({ title: "OK", description: data.message });
      setShowResend(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast({ title: t("common.error"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: t("common.error"), description: t("login.passwordMinLength"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getAuthApiBase()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("common.error"));
      toast({
        title: data.emailSent === false ? "Konto utworzone — problem z emailem" : "Konto utworzone",
        description: data.message,
        variant: data.emailSent === false ? "destructive" : "default",
      });
      if (data.emailSent !== false) {
        setMode("login");
        setPassword("");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast({ title: t("common.error"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("login.backToApp")}
        </button>

        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">MetalRecovery</h1>
            <p className="text-xs text-primary font-mono font-medium mt-0.5">PRO EDITION</p>
          </div>
        </div>

        {verified && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-300">{t("login.emailVerified")}</p>
              <p className="text-xs text-green-400/80 mt-0.5">{t("login.emailVerifiedDesc")}</p>
            </div>
          </div>
        )}

        {verifiedError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">{t("login.linkExpired")}</p>
              <p className="text-xs text-red-400/80 mt-0.5">{t("login.linkExpiredDesc")}</p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-5">
            {mode === "login" ? t("login.loginTitle") : t("login.registerTitle")}
          </h2>

          {mode === "login" ? (
            <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  {t("login.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder={t("login.emailPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  {t("login.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-10 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    placeholder={t("login.passwordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? t("login.loggingIn") : t("login.loginButton")}
              </button>
            </form>

            {showResend && (
              <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-400 mb-2">{t("login.resendHint")}</p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResend}
                  className="w-full py-2 rounded-md bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                  {t("login.resendVerification")}
                </button>
              </div>
            )}
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  {t("login.name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder={t("login.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  {t("login.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  placeholder={t("login.emailPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  {t("login.password")} <span className="text-xs text-muted-foreground/70">{t("login.passwordMin")}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    placeholder={t("login.passwordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loading ? t("login.registering") : t("login.registerButton")}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 text-center">
          {registrationEnabled === null ? (
            <p className="text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              {t("login.checkingRegistration")}
            </p>
          ) : registrationEnabled ? (
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setPassword(""); setShowPass(false); }}
              className="text-xs text-primary hover:underline transition-colors"
            >
              {mode === "login" ? t("login.noAccount") : t("login.hasAccount")}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("login.registrationDisabled")}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
