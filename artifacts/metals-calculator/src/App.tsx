import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
import { CalculatorPage } from "@/pages/Calculator";
import { PricesPage } from "@/pages/Prices";
import { ProcessesPage } from "@/pages/Processes";
import { PurchaseCalculatorPage } from "@/pages/PurchaseCalculator";
import { PhotoAnalysisPage } from "@/pages/PhotoAnalysis";
import { LoginPage } from "@/pages/Login";
import { AdminPage } from "@/pages/Admin";
import { AuthProvider } from "@/hooks/useAuth";
import { getAuthApiBase } from "@/lib/api";
import { setBaseUrl } from "@workspace/api-client-react";

// Configure the generated API client to use the remote API when VITE_VISION_API_URL
// is set (production on Cyberfolks).  The env var ends with /api, but the
// generated client already has /api/... in its paths, so we strip the /api suffix.
// In dev the URL is relative and the Vite proxy forwards /api/* to the local
// Express server, so we leave setBaseUrl uncalled.
const _remoteApi = import.meta.env.VITE_VISION_API_URL as string | undefined;
if (_remoteApi) {
  const origin = _remoteApi.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  setBaseUrl(origin);
}

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/logowanie" component={LoginPage} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={CalculatorPage} />
            <Route path="/kursy" component={PricesPage} />
            <Route path="/procesy" component={ProcessesPage} />
            <Route path="/skup" component={PurchaseCalculatorPage} />
            <Route path="/analiza" component={PhotoAnalysisPage} />
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');

    // Track unique visit once per browser session (server deduplicates by IP per day)
    if (!sessionStorage.getItem('visit_tracked')) {
      sessionStorage.setItem('visit_tracked', '1');
      fetch(`${getAuthApiBase()}/visit`, { method: 'POST' }).catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
