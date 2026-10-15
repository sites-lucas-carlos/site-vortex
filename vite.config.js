import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// Inlines the Vortex symbol and Phosphor icons into index.html at dev/build time,
// so the markup is static (no icon flash) and each part of the logo can be animated.
// Usage in HTML:  <!-- symbol:extra-class -->   <!-- icon:target -->
const root = process.cwd()
const symbol = fs
  .readFileSync(path.join(root, 'src/assets/vortex-symbol.svg'), 'utf8')
  .replace(/<defs>[\s\S]*?<\/defs>/, '')

const iconCache = new Map()
function icon(name) {
  if (!iconCache.has(name)) {
    const file = path.join(root, 'node_modules/@phosphor-icons/core/assets/light', `${name}-light.svg`)
    iconCache.set(
      name,
      fs.readFileSync(file, 'utf8').replace('<svg ', '<svg aria-hidden="true" focusable="false" class="ico" ')
    )
  }
  return iconCache.get(name)
}

export default defineConfig({
  plugins: [
    {
      name: 'inline-svg',
      transformIndexHtml(html) {
        return html
          .replace(/<!--\s*symbol(?::([\w-]+))?\s*-->/g, (_, cls) =>
            symbol.replace('<svg ', `<svg aria-hidden="true" focusable="false" class="vx-symbol ${cls || ''}" `)
          )
          .replace(/<!--\s*icon:([\w-]+)\s*-->/g, (_, n) => icon(n))
      },
    },
  ],
})
