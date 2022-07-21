import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import Components from "unplugin-vue-components/vite";
import { VuetifyResolver } from "unplugin-vue-components/resolvers";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "url";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        visualizer({
          gzipSize: true,
          open: true,
          template: "treemap"
        })
      ]
    }
  },
  css: {
    preprocessorOptions: {
      sass: {
        additionalData: [
          '@import "vuetify/src/styles/settings/_variables"',
          ""
        ].join("\n")
      }
    }
  },
  plugins: [
    vue(),
    VitePWA({
      includeAssets: [
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
        "android-chrome-maskable-192x192.png",
        "android-chrome-maskable-512x512.png",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "msapplication-icon-144x144.png",
        "robots.txt",
        "apple-touch-icon.png",
        "safari-pinned-tab.svg"
      ],
      manifest: {
        name: "Hotplate Console",
        theme_color: "#121212",
        icons: [
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "android-chrome-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "android-chrome-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    }),
    Components({
      dts: "./src/components.d.ts",
      resolvers: [VuetifyResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
