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
  build: {
    // チャンクサイズの警告を無効化（大きな依存関係がある場合）
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // チャンクの読み込み順序を保証
        chunkFileNames: (chunkInfo) => {
          // react-vendorを最初に読み込むようにする
          if (chunkInfo.name === "react-vendor") {
            return "assets/react-vendor-[hash].js";
          }
          return "assets/[name]-[hash].js";
        },
        // チャンクの分割戦略を最適化
        manualChunks: (id) => {
          // node_modules内のパッケージをベンダーチャンクに分割
          if (id.includes("node_modules")) {
            // Reactとreact-domは必ず同じチャンクに含める（React 19の互換性のため）
            if (id.includes("react/") || id.includes("react-dom/")) {
              return "react-vendor";
            }
            // react-routerはReactに依存するため、react-vendorに含める
            if (id.includes("react-router")) {
              return "react-vendor";
            }
            // React 19と互換性の問題がある可能性のあるライブラリはvendorに分離
            if (
              id.includes("react-big-calendar") ||
              id.includes("react-toastify")
            ) {
              return "vendor";
            }
            // UI関連
            if (
              id.includes("@dicebear") ||
              id.includes("react-icons")
            ) {
              return "ui-vendor";
            }
            // チャート関連
            if (id.includes("recharts")) {
              return "chart-vendor";
            }
            // 日付関連
            if (id.includes("date-fns") || id.includes("moment")) {
              return "date-vendor";
            }
            // その他の大きなライブラリ
            if (
              id.includes("firebase") ||
              id.includes("html2canvas") ||
              id.includes("jspdf")
            ) {
              return "utils-vendor";
            }
            // その他のベンダー
            return "vendor";
          }
        },
      },
    },
    // ソースマップを無効化してビルド時間とサイズを削減
    sourcemap: false,
    // ミニファイの最適化
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // 本番環境でconsole.logを削除
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
    },
  },
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
    dedupe: ["react", "react-dom"],
  },
});
