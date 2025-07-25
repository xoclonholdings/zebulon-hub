import { createRoot } from "react-dom/client";
import "./index.css";

// Simple test component first
function TestApp() {
  return (
    <div style={{ color: 'white', backgroundColor: 'black', padding: '20px', minHeight: '100vh' }}>
      <h1>🚀 Zebulon AI System</h1>
      <p>Frontend is loading correctly!</p>
      <p>Node.js: v20.19.3</p>
      <p>Vite: 5.4.19</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #333' }}>
        <p>✅ React is working</p>
        <p>✅ CSS is loading</p>
        <p>✅ TypeScript compilation successful</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(<TestApp />);
  console.log("✅ Zebulon UI successfully mounted - Test Mode");
} catch (error) {
  console.error("❌ Failed to mount Zebulon UI:", error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="color: white; background: red; padding: 20px; font-family: monospace;">
        <h1>❌ Zebulon UI Error</h1>
        <p>Failed to load: ${error}</p>
        <p>Check console for details</p>
      </div>
    `;
  }
}
