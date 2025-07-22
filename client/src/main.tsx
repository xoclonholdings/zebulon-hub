import { createRoot } from "react-dom/client";
import Test from "./test";
import "./index.css";

console.log("Main.tsx loading...");

try {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  
  console.log("Creating React root...");
  createRoot(root).render(<Test />);
  console.log("React app rendered successfully");
} catch (error) {
  console.error("Failed to render React app:", error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  document.body.innerHTML = `
    <div style="background: black; color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: monospace;">
      <div style="text-align: center;">
        <h1>Zebulon System Error</h1>
        <p style="color: #ff4444; margin-top: 20px;">Failed to initialize React: ${errorMessage}</p>
      </div>
    </div>
  `;
}
