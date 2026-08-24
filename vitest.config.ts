import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/nexys": resolve(__dirname, "./client/src/galaxies/zar/nexys"),
      "@": resolve(__dirname, "./client/src"),
      "@shared": resolve(__dirname, "./shared"),
      "@assets": resolve(__dirname, "./attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["client/src/**/*.test.ts", "server/**/*.test.ts"],
  },
});
