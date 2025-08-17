/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vuex' {
  export * from 'vuex/types/index.js'
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}