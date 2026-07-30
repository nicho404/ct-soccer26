// Proiezione prospettica a un punto di fuga (vista da dietro la nostra porta).
// t = 0 nostra linea di porta (vicina, larga), t = 1 porta avversaria (lontana, stretta).
// Vive qui e non dentro PitchView perché anche l'immagine esportata del modulo
// deve usare esattamente la stessa geometria del campo a schermo.
export const ZF = 2.1
export const YN = 467
export const YF = 72
export const C = (YN - YF) / (1 - 1 / ZF)
export const YH = YN - C
export const HW = 188
export const CX = 200

// Dimensioni della viewBox del campo (le figure più basse arrivano a ~505)
export const PITCH_W = 400
export const PITCH_H = 505

export function pt(u, t) {
  const z = 1 + t * (ZF - 1)
  return [CX + ((u - 0.5) * 2 * HW) / z, YH + C / z]
}

export const poly = (punti) => punti.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

export function areaPoly(t0, t1, u0 = 0.22, u1 = 0.78) {
  return poly([pt(u0, t0), pt(u1, t0), pt(u1, t1), pt(u0, t1)])
}
