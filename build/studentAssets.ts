import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * Exposes the image files found in `public/assets/` as the virtual module
 * `virtual:student-assets` (a map of slot name -> relative URL).
 *
 * Dropping `hero.png` into public/assets makes the "hero" slot use it with no
 * code change, and slots without a file fall back to inline SVG art without
 * ever requesting a missing URL.
 */
const VIRTUAL_ID = 'virtual:student-assets'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i
// When several files share a slot name, the first extension in this list wins.
const PRIORITY = ['.svg', '.webp', '.avif', '.png', '.jpg', '.jpeg', '.gif']

export function studentAssets(): Plugin {
  let assetsDir = ''

  const scan = (): Record<string, string> => {
    if (!fs.existsSync(assetsDir)) return {}
    const files = fs
      .readdirSync(assetsDir)
      .filter((f) => IMAGE_EXT.test(f))
      .sort((a, b) => {
        const pa = PRIORITY.indexOf(path.extname(a).toLowerCase())
        const pb = PRIORITY.indexOf(path.extname(b).toLowerCase())
        return pa - pb || a.localeCompare(b)
      })
    const map: Record<string, string> = {}
    for (const file of files) {
      const slot = path.basename(file, path.extname(file)).toLowerCase()
      if (!(slot in map)) map[slot] = `assets/${file}`
    }
    return map
  }

  return {
    name: 'bracketsense-student-assets',
    configResolved(config) {
      assetsDir = path.resolve(config.publicDir, 'assets')
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined
      return `export default ${JSON.stringify(scan())};`
    },
    configureServer(server) {
      server.watcher.add(assetsDir)
      const refresh = (file: string) => {
        if (!path.resolve(file).startsWith(assetsDir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}
