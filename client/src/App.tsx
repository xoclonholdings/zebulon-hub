import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import PrivyAuthRoot from "@/components/PrivyAuthRoot";
import NotFound from "@/pages/not-found";
import LoginScreen from "@/components/LoginScreen";
import ZebulonConstellationPage from "@/system/ZebulonConstellationPage";
import ZcosCommandDesk from "@/system/ZcosCommandDesk";
import ZillionGateway, { GalaxyGateway } from "@/galaxies/GalaxyGateway";
import ZarGateway from "@/galaxies/zar/ZarGateway";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading ZCOS...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="mobile-viewport mobile-container bg-black overflow-hidden">
      <Switch>
        <Route path="/" component={ZebulonConstellationPage} />
        <Route path="/zar" component={ZarGateway} />
        <Route path="/nexys" component={ZarGateway} />
        <Route path="/zillion" component={ZillionGateway} />
        <Route path="/zillion/:domain/:surface" component={GalaxyGateway} />
        <Route path="/zillion/:domain" component={GalaxyGateway} />
        <Route path="/zeta" component={GalaxyGateway} />
        <Route path="/zeta/:domain/:surface" component={GalaxyGateway} />
        <Route path="/zeta/:domain" component={GalaxyGateway} />
        <Route path="/zync" component={GalaxyGateway} />
        <Route path="/zync/:domain/:surface" component={GalaxyGateway} />
        <Route path="/zync/:domain" component={GalaxyGateway} />
        <Route path="/zylo" component={GalaxyGateway} />
        <Route path="/zylo/:domain/:surface" component={GalaxyGateway} />
        <Route path="/zylo/:domain" component={GalaxyGateway} />
        <Route path="/zeno" component={GalaxyGateway} />
        <Route path="/zeno/:domain/:surface" component={GalaxyGateway} />
        <Route path="/zeno/:domain" component={GalaxyGateway} />
        <Route path="/zwap" component={GalaxyGateway} />
        <Route path="/zwap/:domain/:surface" component={GalaxyGateway} />
        <Route path="/zwap/:domain" component={GalaxyGateway} />
        <Route path="/zenith" component={GalaxyGateway} />
        <Route path="/zenith/:domain/:surface" component={GalaxyGateway} />
        <Route path="/zenith/:domain" component={GalaxyGateway} />
        <Route path="/galaxy/:galaxy/:domain/:surface" component={GalaxyGateway} />
        <Route path="/galaxy/zillion" component={ZillionGateway} />
        <Route path="/galaxy/:galaxy/:domain" component={GalaxyGateway} />
        <Route path="/galaxy/:galaxy" component={GalaxyGateway} />
        <Route path="/command/:surface" component={ZcosCommandDesk} />
        <Route path="/command" component={ZcosCommandDesk} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyAuthRoot>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </PrivyAuthRoot>
    </QueryClientProvider>
  );
}

export default App;
