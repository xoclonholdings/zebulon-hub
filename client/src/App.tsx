import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Simple test component to verify app loads
function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient">Zebulon</h1>
        <p className="text-gray-400 mt-4">System initializing...</p>
      </div>
    </div>
  );
}

// Lazy load dashboard to isolate issues
function Router() {
  try {
    const Dashboard = React.lazy(() => import("@/pages/dashboard"));
    const NotFound = React.lazy(() => import("@/pages/not-found"));
    
    return (
      <div className="min-h-screen bg-black">
        <React.Suspense fallback={<TestPage />}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </React.Suspense>
      </div>
    );
  } catch (error) {
    console.error('Router error:', error);
    return <TestPage />;
  }
}

function App() {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App error:', error);
    return <TestPage />;
  }
}

export default App;
