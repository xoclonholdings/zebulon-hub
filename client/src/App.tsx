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
        <div className="mt-8">
          <div className="zebulon-card p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">System Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Frontend</span>
                <span className="text-green-400">✓ Running</span>
              </div>
              <div className="flex justify-between">
                <span>Backend</span>
                <span className="text-green-400">✓ Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Bank</span>
                <span className="text-blue-400">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen bg-black">
            <Switch>
              <Route path="/" component={TestPage} />
              <Route component={TestPage} />
            </Switch>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App error:', error);
    return <TestPage />;
  }
}

export default App;
