import { COLORI_FAMIGLIA, famigliaRuolo, TIPI_INTESA } from '../db/constants'
import { ruoloSlot, IMPOSTAZIONI } from '../lib/formazioni'

// Proiezione prospettica a un punto di fuga (vista da dietro la nostra porta).
// t = 0 nostra linea di porta (vicina, larga), t = 1 porta avversaria (lontana, stretta).
const ZF = 2.1
const YN = 467
const YF = 72
const C = (YN - YF) / (1 - 1 / ZF)
const YH = YN - C
const HW = 188
const CX = 200

function pt(u, t) {
  const z = 1 + t * (ZF - 1)
  return [CX + ((u - 0.5) * 2 * HW) / z, YH + C / z]
}

const poly = (punti) => punti.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

function areaPoly(t0, t1, u0 = 0.22, u1 = 0.78) {
  return poly([pt(u0, t0), pt(u1, t0), pt(u1, t1), pt(u0, t1)])
}

function nomeCorto(p) {
  const n = p.soprannome || p.nome.split(' ')[0]
  return n.length > 12 ? n.slice(0, 11) + '…' : n
}

export default function PitchView({
  modulo, impostazione, assignments, players, intese, selected, onSlotTap,
}) {
  const slots = modulo.slots
  const posizioni = slots.map((s) => pt(s.u, s.t))

  const playerAt = (i) => {
    const id = assignments[i]
    return id ? players.find((p) => p.id === id) : null
  }

  // Linee intese tra giocatori schierati
  const linee = []
  for (const intesa of intese) {
    const punti = (intesa.playerIds ?? [])
      .map((pid) => assignments.indexOf(pid))
      .filter((i) => i !== -1)
      .map((i) => posizioni[i])
    if (punti.length < 2) continue
    const colore = TIPI_INTESA.find((t) => t.value === intesa.tipo)?.colore ?? '#fff'
    for (let k = 0; k < punti.length - 1; k++) {
      linee.push({ a: punti[k], b: punti[k + 1], colore, key: `${intesa.id}-${k}` })
    }
  }

  // Griglia 5×5 in prospettiva
  const bande = [0, 1, 2, 3, 4]
  const lineeU = [0.2, 0.4, 0.6, 0.8]
  const lineeT = [0.2, 0.4, 0.6, 0.8]

  const [ccx, ccy] = pt(0.5, 0.5)
  const crx = (pt(0.58, 0.5)[0] - pt(0.42, 0.5)[0]) / 2
  const cry = (pt(0.5, 0.44)[1] - pt(0.5, 0.56)[1]) / 2

  const imp = IMPOSTAZIONI.find((i) => i.value === impostazione)
  const badgeW = imp ? 46 + imp.label.length * 6.3 : 0

  return (
    <svg viewBox="0 0 400 505" className="pitch-svg">
      {/* prato: 5 bande di profondità alternate */}
      {bande.map((i) => (
        <polygon
          key={i}
          points={areaPoly(i * 0.2, (i + 1) * 0.2, 0, 1)}
          fill={i % 2 === 0 ? '#0c3120' : '#0e3a26'}
        />
      ))}

      {/* griglia 5×5 */}
      {lineeU.map((u) => {
        const [x1, y1] = pt(u, 0)
        const [x2, y2] = pt(u, 1)
        return <line key={`u${u}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.09)" />
      })}
      {lineeT.map((t) => {
        const [x1, y1] = pt(0, t)
        const [x2, y2] = pt(1, t)
        return <line key={`t${t}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.09)" />
      })}

      {/* linee campo */}
      <polygon points={poly([pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)])} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />
      <line x1={pt(0, 0.5)[0]} y1={pt(0, 0.5)[1]} x2={pt(1, 0.5)[0]} y2={pt(1, 0.5)[1]} stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <ellipse cx={ccx} cy={ccy} rx={crx} ry={cry} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
      {/* aree di rigore */}
      <polygon points={areaPoly(0, 0.16)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <polygon points={areaPoly(0.84, 1)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      {/* porte */}
      <polygon points={poly([pt(0.4, 0), [pt(0.4, 0)[0], pt(0.4, 0)[1] + 14], [pt(0.6, 0)[0], pt(0.6, 0)[1] + 14], pt(0.6, 0)])} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <polygon points={poly([pt(0.42, 1), [pt(0.42, 1)[0], pt(0.42, 1)[1] - 9], [pt(0.58, 1)[0], pt(0.58, 1)[1] - 9], pt(0.58, 1)])} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

      {/* badge impostazione tattica selezionata */}
      {imp && (
        <g>
          <rect x="8" y="8" width={badgeW} height="30" rx="15" fill="rgba(20,20,28,0.92)" stroke="rgba(167,139,250,0.55)" strokeWidth="1" />
          <text x="18" y="28" fontSize="15">{imp.icona}</text>
          <text x="40" y="27" fill="#ececf1" fontSize="11" fontWeight="700">{imp.label}</text>
        </g>
      )}

      {/* linee intese sotto le figure */}
      {linee.map((l) => (
        <line
          key={l.key}
          x1={l.a[0]} y1={l.a[1]} x2={l.b[0]} y2={l.b[1]}
          stroke={l.colore} strokeWidth="2.5" strokeDasharray="6 4" opacity="0.85"
        />
      ))}

      {/* figure giocatori */}
      {slots.map((slot, i) => {
        const [x, y] = posizioni[i]
        const p = playerAt(i)
        const colore = COLORI_FAMIGLIA[famigliaRuolo(slot.sigla)] ?? '#9a9aad'
        const ruolo = ruoloSlot(slot.sigla, impostazione)
        const isSel = selected === i
        const warning =
          p && p.ruoloNaturale !== slot.sigla && !(p.ruoliAdattati ?? []).includes(slot.sigla)
        return (
          <g
            key={i}
            onClick={() => onSlotTap(i)}
            style={{ cursor: 'pointer' }}
          >
            {/* area tap generosa */}
            <rect x={x - 44} y={y - 25} width="88" height="60" fill="transparent" />
            {isSel && <circle cx={x} cy={y - 4} r="21" fill="none" stroke="#a78bfa" strokeWidth="3" />}
            {p ? (
              <>
                <circle cx={x} cy={y - 4} r="16" fill="#14141c" stroke={colore} strokeWidth="2.5" />
                {p.foto ? (
                  <>
                    <clipPath id={`avatar-slot-${i}`}>
                      <circle cx={x} cy={y - 4} r="14.8" />
                    </clipPath>
                    <image
                      href={p.foto}
                      x={x - 15} y={y - 19} width="30" height="30"
                      clipPath={`url(#avatar-slot-${i})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <text x={x} y={y + 1} textAnchor="middle" fill="#ececf1" fontSize="12" fontWeight="800">
                    {p.numero !== '' && p.numero != null ? p.numero : slot.sigla}
                  </text>
                )}
                {warning && (
                  <text x={x + 14} y={y - 14} fontSize="12">⚠️</text>
                )}
                <text x={x} y={y + 25} textAnchor="middle" fill="#ececf1" fontSize="10.5" fontWeight="700">
                  {nomeCorto(p)}
                </text>
                <text x={x} y={y + 35} textAnchor="middle" fontSize="7.5">
                  <tspan fill={colore} fontWeight="800">{slot.sigla}</tspan>
                  <tspan fill="rgba(255,255,255,0.75)"> · {ruolo}</tspan>
                </text>
              </>
            ) : (
              <>
                <circle
                  cx={x} cy={y - 4} r="16"
                  fill="rgba(0,0,0,0.25)" stroke={colore} strokeWidth="1.5" strokeDasharray="4 3"
                />
                <text x={x} y={y} textAnchor="middle" fill={colore} fontSize="9.5" fontWeight="800">
                  {slot.sigla}
                </text>
                <text x={x} y={y + 25} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9">
                  tocca
                </text>
                <text x={x} y={y + 35} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.55)">
                  {ruolo}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
