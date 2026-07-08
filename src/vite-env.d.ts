/// <reference types="vite/client" />

// Le decimos a TypeScript qué variables de entorno existen.
// Vite solo expone las que empiezan con VITE_.
interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
