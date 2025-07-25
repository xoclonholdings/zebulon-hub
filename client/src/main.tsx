import { createRoot } from "react-dom/client";
import "./index.css";

// Import React for JSX
import React from "react";

// Lazy load the main App to catch import errors
const App = React.lazy(() => import("./App"));

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ 
        color: 'white', 
        backgroundColor: 'black', 
        padding: '20px', 
        fontFamily: 'monospace',
        minHeight: '100vh'
      }}>
        <h1>🚀 Zebulon AI System</h1>
        <p>Loading issue detected. Troubleshooting...</p>
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #333' }}>
          <p>Node.js: v24.4.0</p>
          <p>Vite: v6.3.5</p>
          <p>Error: {error?.message || 'Unknown error'}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '20px', 
            padding: '10px 20px', 
            backgroundColor: '#333', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          Reload Application
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Loading component
function Loading() {
  return (
    <div style={{ 
      color: 'white', 
      backgroundColor: 'black', 
      padding: '20px', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div>
        <h1>🚀 Zebulon AI System</h1>
        <p>Initializing...</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <React.Suspense fallback={<Loading />}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  );
  // Zebulon UI mounted successfully
} catch (error) {
  console.error("❌ Failed to mount Zebulon UI:", error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="color: white; background: red; padding: 20px; font-family: monospace;">
        <h1>❌ Critical Error</h1>
        <p>React failed to initialize: ${error}</p>
        <p>Check browser console for details</p>
      </div>
    `;
  }
}
