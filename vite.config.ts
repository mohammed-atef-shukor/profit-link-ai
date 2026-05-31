// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually

// or the app will break with duplicate plugins:

//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),

//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,

//     error logger plugins, and sandbox detection (port/host/strictPort).

// You can pass additional config via defineConfig({ vite: { ... } }) if needed.

import netlify from "@netlify/vite-plugin-tanstack-start";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";



// Production deploys to Netlify SSR (cloudflare: false disables Cloudflare Workers build).

export default defineConfig({

  cloudflare: false,

  tanstackStart: {

    server: { entry: "server" },

  },

  plugins: [netlify()],

  vite: {

    build: {

      rollupOptions: {

        output: {

          manualChunks(id: string) {

            if (id.includes("node_modules/firebase/") || id.includes("node_modules/@firebase/")) {

              return "firebase-vendor";

            }

            if (

              id.includes("node_modules/react-dom/") ||

              id.includes("node_modules/react/") ||

              id.includes("node_modules/scheduler/")

            ) {

              return "react-vendor";

            }

            if (

              id.includes("node_modules/@tanstack/react-router/") ||

              id.includes("node_modules/@tanstack/router-core/") ||

              id.includes("node_modules/@tanstack/react-query/") ||

              id.includes("node_modules/@tanstack/query-core/") ||

              id.includes("node_modules/@tanstack/react-start/")

            ) {

              return "tanstack-vendor";

            }

          },

        },

      },

    },

  },

});

