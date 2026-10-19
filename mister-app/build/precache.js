import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Il service worker deve conoscere tutti i file della build, compresi i
// chunk delle pagine caricate a richiesta (React.lazy): altrimenti una pagina
// mai aperta online non si apre offline. A fine build si scrive l'elenco
// dentro dist/sw.js al posto del segnaposto, con una versione che cambia a
// ogni build (così le cache vecchie si buttano).
export const SEGNAPOSTO_FILE = '/*__PRECACHE_FILE__*/[]'
export const SEGNAPOSTO_VERSIONE = '__PRECACHE_VERSIONE__'

export function iniettaPrecache(sorgente, file) {
  const elenco = ['./', ...[...file].sort()]
  const versione = createHash('sha256').update(elenco.join('\n')).digest('hex').slice(0, 10)
  if (!sorgente.includes(SEGNAPOSTO_FILE) || !sorgente.includes(SEGNAPOSTO_VERSIONE)) {
    throw new Error('sw.js: segnaposto del precache mancanti')
  }
  return sorgente.replace(SEGNAPOSTO_FILE, JSON.stringify(elenco)).replace(SEGNAPOSTO_VERSIONE, versione)
}

// Plugin Vite: raccoglie i nomi dei file emessi (JS, CSS, immagini…) e,
// scritta la build, aggiorna dist/sw.js
export default function precache() {
  let dir = 'dist'
  const emessi = new Set()
  return {
    name: 'mister-precache',
    apply: 'build',
    configResolved(config) {
      dir = config.build.outDir
    },
    generateBundle(_, bundle) {
      for (const nome of Object.keys(bundle)) {
        if (!nome.endsWith('.map')) emessi.add(nome)
      }
    },
    closeBundle() {
      const sw = join(dir, 'sw.js')
      if (!existsSync(sw)) return
      // anche i file statici di public/ (icone, manifest), tranne il sw stesso
      const statici = ['manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']
        .filter((f) => existsSync(join(dir, f)))
      writeFileSync(sw, iniettaPrecache(readFileSync(sw, 'utf8'), [...emessi, ...statici]))
    },
  }
}
