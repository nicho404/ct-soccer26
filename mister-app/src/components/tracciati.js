// Tracciati (attributo d) delle icone che servono anche fuori da React:
// l'immagine esportata del modulo (lib/esportaModulo) è un SVG scritto come
// testo. components/icons.jsx li usa per le stesse icone, così il disegno è
// uno solo. Griglia 24x24, tratto 1.7, come tutte le icone.
export const TRACCIATI = {
  avviso: [
    'M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
    'M12 9.5v4.5M12 17.2h.01',
  ],
  scambio: ['M4 8h14M14.5 4.5 18 8l-3.5 3.5', 'M20 16H6M9.5 12.5 6 16l3.5 3.5'],
  scudo: ['M12 2.5 4.5 5.5v6c0 4.6 3.1 8.4 7.5 10 4.4-1.6 7.5-5.4 7.5-10v-6Z'],
  spada: ['M14.5 3.5H20.5V9.5L9 21 3 15Z', 'M6 12l6 6', 'M3.5 20.5l2-2'],
  ciclo: ['M20 11a8 8 0 0 0-14.3-4.9L4 8', 'M4 3.5V8h4.5', 'M4 13a8 8 0 0 0 14.3 4.9L20 16', 'M20 20.5V16h-4.5'],
}

// Stessa icona come stringa SVG, per chi scrive SVG come testo
export const svgIcona = (nome, { x = 0, y = 0, size = 12, colore = 'currentColor' } = {}) =>
  `<svg data-icona="${nome}" x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${colore}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${TRACCIATI[nome].map((d) => `<path d="${d}"/>`).join('')}</svg>`
