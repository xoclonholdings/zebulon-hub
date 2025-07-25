import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// import "./lib/pwa"; // Temporarily disabled for debugging

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(<App />);
  console.log("✅ Zebulon UI successfully mounted");
} catch (error) {
  console.error("❌ Failed to mount Zebulon UI:", error);
  rootElement.innerHTML = `
    <div style="color: white; background: black; padding: 20px; font-family: monospace;">
      <h1>Zebulon UI Error</h1>
      <p>Failed to load the application: ${error}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}
