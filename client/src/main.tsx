import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(<App />);
  console.log("✅ Zebulon UI successfully mounted with Node.js v18.20.8");
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
