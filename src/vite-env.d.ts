/// <reference types="vite/client" />

declare module 'virtual:student-assets' {
  /** Slot name (file name without extension, lower-case) -> URL relative to the app base. */
  const assets: Record<string, string>
  export default assets
}
