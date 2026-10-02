// Immagine del modulo da mostrare ai giocatori: solo il campo, le posizioni
// (POR, CC, ED…) e chi le occupa (numero + nome). Niente ruoli tattici, niente
// linee di intesa, niente badge di fase o di compatibilità: quella è roba da
// mister, non da spogliatoio. Se il modulo è legato a una partita, sotto il
// campo c'è anche la panchina: chi è convocato e non parte titolare.
import { pt, poly, areaPoly, PITCH_W, PITCH_H } from './pitchGeometry'
import { nomeBreve } from './nomi'
import { COLORI_FAMIGLIA, famigliaRuolo } from '../db/constants'

const HEADER_H = 64
const FOOTER_H = 22
const OUT_W = PITCH_W
const OUT_H = HEADER_H + PITCH_H + FOOTER_H

// Panchina: tre giocatori per riga, sotto il campo
const PANCHINA_COLONNE = 3
const PANCHINA_TITOLO_H = 30
const PANCHINA_RIGA_H = 30
const altezzaPanchina = (panchina = []) =>
  panchina.length === 0
    ? 0
    : PANCHINA_TITOLO_H + Math.ceil(panchina.length / PANCHINA_COLONNE) * PANCHINA_RIGA_H + 12

export const altezzaImmagine = ({ panchina } = {}) => OUT_H + altezzaPanchina(panchina)
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const nomeCorto = (p) => {
  const n = nomeBreve(p)
  return n.length > 14 ? `${n.slice(0, 13)}…` : n
}

function figura(slot, player, [x, y]) {
  const colore = COLORI_FAMIGLIA[famigliaRuolo(slot.sigla)] ?? '#9a9aad'
  const numero = player && player.numero !== '' && player.numero != null ? player.numero : null
  if (!player) {
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <circle cx="0" cy="-4" r="16" fill="rgba(0,0,0,0.28)" stroke="${colore}" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="0" y="0" text-anchor="middle" fill="${colore}" font-size="10" font-weight="800">${esc(slot.sigla)}</text>
    </g>`
  }
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
    <circle cx="0" cy="-4" r="16" fill="#14141c" stroke="${colore}" stroke-width="2.5"/>
    <text x="0" y="1" text-anchor="middle" fill="#ececf1" font-size="13" font-weight="800">${esc(numero ?? slot.sigla)}</text>
    <text x="0" y="26" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">${esc(nomeCorto(player))}</text>
    <text x="0" y="37" text-anchor="middle" fill="${colore}" font-size="10" font-weight="800">${esc(slot.sigla)}</text>
  </g>`
}

function svgPanchina(panchina, y0) {
  if (!panchina?.length) return ''
  const margine = 14
  const larghezza = (OUT_W - margine * 2) / PANCHINA_COLONNE
  const voci = panchina.map((p, i) => {
    const col = i % PANCHINA_COLONNE
    const riga = Math.floor(i / PANCHINA_COLONNE)
    const x = margine + col * larghezza
    const y = y0 + PANCHINA_TITOLO_H + riga * PANCHINA_RIGA_H
    const colore = COLORI_FAMIGLIA[famigliaRuolo(p.ruoloNaturale)] ?? '#9a9aad'
    const numero = p.numero !== '' && p.numero != null ? p.numero : ''
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <rect x="0" y="0" width="${(larghezza - 6).toFixed(1)}" height="24" rx="7" fill="#14141c" stroke="${colore}" stroke-opacity="0.6"/>
      <text x="16" y="16" text-anchor="middle" fill="${colore}" font-size="11" font-weight="800">${esc(numero)}</text>
      <text x="30" y="16" fill="#ececf1" font-size="11" font-weight="700">${esc(nomeCorto(p))}</text>
    </g>`
  })
  return `<text x="${margine}" y="${y0 + 19}" fill="#a1a1b5" font-size="12" font-weight="800" letter-spacing="1">PANCHINA (${panchina.length})</text>
  ${voci.join('\n')}`
}

// SVG completo dell'immagine da esportare. `coordinate` sono le {u,t} della
// fase mostrata a schermo: l'immagine rispecchia quello che il mister vede,
// meno le informazioni tattiche.
export function svgModulo({ modulo, moduloKey, slots, players, formato, team, panchina = [], partita = null }) {
  const altezza = altezzaImmagine({ panchina })
  const posizioni = (modulo.slots).map((s) => pt(s.u, s.t))
  const figure = modulo.slots
    .map((slot, i) => {
      const id = slots[i]
      const p = id ? players.find((pl) => pl.id === id) : null
      return figura(slot, p ?? null, posizioni[i])
    })
    .join('\n')

  const bande = [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<polygon points="${areaPoly(i * 0.2, (i + 1) * 0.2, 0, 1)}" fill="${i % 2 === 0 ? '#0c3120' : '#0e3a26'}"/>`
    )
    .join('')

  const [ccx, ccy] = pt(0.5, 0.5)
  const crx = (pt(0.58, 0.5)[0] - pt(0.42, 0.5)[0]) / 2
  const cry = (pt(0.5, 0.44)[1] - pt(0.5, 0.56)[1]) / 2

  const titolo = team?.nome?.trim() || 'Formazione'
  // con una partita, il sottotitolo dice contro chi e quando
  const sottotitolo = (partita
    ? [partita.avversario ? `vs ${partita.avversario}` : null, partita.data, moduloKey]
    : [moduloKey, `calcio a ${formato}`, team?.torneo?.trim()])
    .filter(Boolean)
    .join(' · ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${altezza}" viewBox="0 0 ${OUT_W} ${altezza}" font-family="${FONT}">
  <rect width="${OUT_W}" height="${altezza}" fill="#0a0a0e"/>
  <text x="${OUT_W / 2}" y="30" text-anchor="middle" fill="#ffffff" font-size="19" font-weight="800">${esc(titolo)}</text>
  <text x="${OUT_W / 2}" y="50" text-anchor="middle" fill="#a1a1b5" font-size="12" font-weight="600">${esc(sottotitolo)}</text>
  <g transform="translate(0,${HEADER_H})">
    ${bande}
    <polygon points="${poly([pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)])}" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="2"/>
    <line x1="${pt(0, 0.5)[0].toFixed(1)}" y1="${pt(0, 0.5)[1].toFixed(1)}" x2="${pt(1, 0.5)[0].toFixed(1)}" y2="${pt(1, 0.5)[1].toFixed(1)}" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/>
    <ellipse cx="${ccx.toFixed(1)}" cy="${ccy.toFixed(1)}" rx="${crx.toFixed(1)}" ry="${cry.toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
    <polygon points="${areaPoly(0, 0.16)}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/>
    <polygon points="${areaPoly(0.84, 1)}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/>
    <polygon points="${poly([pt(0.4, 0), [pt(0.4, 0)[0], pt(0.4, 0)[1] + 14], [pt(0.6, 0)[0], pt(0.6, 0)[1] + 14], pt(0.6, 0)])}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <polygon points="${poly([pt(0.42, 1), [pt(0.42, 1)[0], pt(0.42, 1)[1] - 9], [pt(0.58, 1)[0], pt(0.58, 1)[1] - 9], pt(0.58, 1)])}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    ${figure}
  </g>
  ${svgPanchina(panchina, HEADER_H + PITCH_H + 6)}
</svg>`
}

// Rasterizza l'SVG in PNG. Scala 2 = immagine nitida anche a schermo pieno su
// telefono, senza pesare come un 4x.
export function svgToPngBlob(svg, scala = 2, altezza = OUT_H) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = OUT_W * scala
      canvas.height = altezza * scala
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Impossibile generare il PNG'))
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Impossibile disegnare il campo'))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

const nomeFile = ({ team, moduloKey }) => {
  const base = [team?.nome?.trim() || 'formazione', moduloKey]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'formazione'}.png`
}

// Condivide l'immagine col foglio di sistema (utile per WhatsApp squadra);
// se il dispositivo non lo supporta, la scarica come file.
export async function esportaModulo(dati) {
  const blob = await svgToPngBlob(svgModulo(dati), 2, altezzaImmagine(dati))
  const file = new File([blob], nomeFile(dati), { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: dati.team?.nome?.trim() || 'Formazione' })
      return 'condivisa'
    } catch (e) {
      if (e?.name === 'AbortError') return 'annullata'
      // niente share: si continua col download
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'scaricata'
}
