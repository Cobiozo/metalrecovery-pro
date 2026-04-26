import { useState, useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function usePWA() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const swUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt.current) return;
    const prompt = deferredPrompt.current;
    deferredPrompt.current = null;
    setCanInstall(false);
    prompt.prompt();
    await prompt.userChoice;
  };

  useRegisterSW({
    onRegistered(r) {
      if (r) {
        swUpdateInterval.current = setInterval(
          () => r.update(),
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error: unknown) {
      console.warn("[PWA] SW registration error:", error);
    },
  });

  useEffect(() => {
    return () => {
      if (swUpdateInterval.current !== null) {
        clearInterval(swUpdateInterval.current);
      }
    };
  }, []);

  return { isOffline, canInstall, installApp };
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
