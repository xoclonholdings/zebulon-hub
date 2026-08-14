import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";

const App = React.lazy(() => import("./App"));

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => setError(new Error(event.message));
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold">ZCOS could not start</h1>
          <p className="mt-2 text-sm text-white/55">{error.message || "Unknown application error"}</p>
          <button onClick={() => window.location.reload()} className="mt-5 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10">Reload</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm text-white/60">Loading ZCOS...</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <ErrorBoundary>
    <React.Suspense fallback={<Loading />}>
      <App />
    </React.Suspense>
  </ErrorBoundary>,
);
