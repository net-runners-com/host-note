import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png"],
      manifest: {
        name: "HostNote",
        short_name: "HostNote",
        description: "ホストクラブ向け姫・キャスト管理アプリ",
        theme_color: "#D4AF37",
        background_color: "#0D0D0D",
        display: "standalone",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      manifestFilename: "manifest.webmanifest",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      },
      // 開発環境ではService Workerを無効化
      disable: process.env.NODE_ENV === "development",
    }),
  ],
  server: {
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@database": path.resolve(__dirname, "./src/database"),
      "@stores": path.resolve(__dirname, "./src/stores"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@services": path.resolve(__dirname, "./src/services"),
    },
  },
});
