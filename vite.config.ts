import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    cacheDir: "C:/vite-cache/mulungushi-moves",
  },
});