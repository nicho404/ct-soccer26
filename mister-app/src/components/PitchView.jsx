import { COLORI_FAMIGLIA, famigliaRuolo, TIPI_INTESA } from '../db/constants'
import { compatibilitaGiocatore } from '../tactics/engine'
import { nomeBreve } from '../lib/nomi'
import { pt, poly, areaPoly } from '../lib/pitchGeometry'

function nomeCorto(p) {
  const n = nomeBreve(p)
  return n.length > 13 ? n.slice(0, 12) + '…' : n
}

// Badge di compatibilità giocatore↔ruolo tattico, 3 livelli. "forzato" non
// mostra badge: l'assenza è già un segnale, senza affollare lo slot. Vale
// solo in fase di possesso (vedi PitchView: compatibilitaGiocatore confronta
// contro ruoliTattici osservati, che sono nel vocabolario di possesso).
function BadgeCompatibilita({ x, y, livello }) {
  if (livello === 'naturale') {
    return (
      <g>
        <circle cx={x} cy={y} r="6.5" fill="#34d399" stroke="#0a0a0e" strokeWidth="1.5" />
        <text x={x} y={y + 3.8} textAnchor="middle" fill="#053022" fontSize="11" fontWeight="900">+</text>
      </g>
    )
  }
  if (livello === 'adattabile') {
    return (
      <g>
        <circle cx={x} cy={y} r="6.5" fill="#fbbf24" stroke="#0a0a0e" strokeWidth="1.5" />
        <text x={x} y={y + 3.8} textAnchor="middle" fill="#3a2a00" fontSize="11" fontWeight="900">~</text>
      </g>
    )
  }
  return null
}

// `coordinate` sono le {u, t} già risolte dal chiamante (geometria normale o
// compressa di non possesso): PitchView resta un componente di rendering,
// non decide da sé quale fase è in corso. `fase` serve solo per sapere cosa
// nascondere (intese, badge di compatibilità), mai per ricalcolare qualcosa.
export default function PitchView({
  modulo, ruoli, assignments, players, intese, selected, onSlotTap, badgeInfo,
  coordinate, fase = 'possesso',
}) {
  const slots = modulo.slots
  const coords = coordinate ?? slots.map((s) => ({ u: s.u, t: s.t }))
  const posizioni = coords.map(({ u, t }) => pt(u, t))

  const playerAt = (i) => {
    const id = assignments[i]
    return id ? players.find((p) => p.id === id) : null
  }

  // Linee intese tra giocatori schierati — solo in possesso: sono
  // combinazioni offensive, rumore su una mappa difensiva.
  const linee = []
  if (fase === 'possesso') {
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
  }

  // Griglia 5×5 in prospettiva
  const bande = [0, 1, 2, 3, 4]
  const lineeU = [0.2, 0.4, 0.6, 0.8]
  const lineeT = [0.2, 0.4, 0.6, 0.8]

  const [ccx, ccy] = pt(0.5, 0.5)
  const crx = (pt(0.58, 0.5)[0] - pt(0.42, 0.5)[0]) / 2
  const cry = (pt(0.5, 0.44)[1] - pt(0.5, 0.56)[1]) / 2

  const badgeW = badgeInfo ? 46 + badgeInfo.label.length * 6.3 : 0

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

      {/* badge di fase: impostazione in possesso, linea+fase in non possesso —
          non deve mai essere possibile guardare lo schermo senza sapere
          quale mappa si sta vedendo */}
      {badgeInfo && (
        <g>
          <rect x="8" y="8" width={badgeW} height="30" rx="15" fill="rgba(20,20,28,0.92)" stroke="rgba(167,139,250,0.55)" strokeWidth="1" />
          <text x="18" y="28" fontSize="15">{badgeInfo.icona}</text>
          <text x="40" y="27" fill="#ececf1" fontSize="11" fontWeight="700">{badgeInfo.label}</text>
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

      {/* figure giocatori — ogni gruppo è posizionato con un transform
          animabile (CSS transition), così il cambio di fase mostra quanto
          la squadra si accorcia invece di scattare da una forma all'altra */}
      {slots.map((slot, i) => {
        const [x, y] = posizioni[i]
        const p = playerAt(i)
        const colore = COLORI_FAMIGLIA[famigliaRuolo(slot.sigla)] ?? '#9a9aad'
        const ruolo = ruoli[i]
        const isSel = selected === i
        const warning =
          p && p.ruoloNaturale !== slot.sigla && !(p.ruoliAdattati ?? []).includes(slot.sigla)
        const compat = fase === 'possesso' && p && !warning
          ? compatibilitaGiocatore({ slotRuolo: ruolo.ruoloSuggerito, player: p })
          : null
        return (
          <g
            key={i}
            onClick={() => onSlotTap(i)}
            style={{ cursor: 'pointer', transform: `translate(${x}px, ${y}px)`, transition: 'transform 350ms ease' }}
          >
            {/* area tap generosa */}
            <rect x="-44" y="-25" width="88" height="60" fill="transparent" />
            {isSel && <circle cx="0" cy="-4" r="21" fill="none" stroke="#a78bfa" strokeWidth="3" />}
            {p ? (
              <>
                <circle cx="0" cy="-4" r="16" fill="#14141c" stroke={colore} strokeWidth="2.5" />
                {p.foto ? (
                  <>
                    <clipPath id={`avatar-slot-${i}`}>
                      <circle cx="0" cy="-4" r="14.8" />
                    </clipPath>
                    <image
                      href={p.foto}
                      x="-15" y="-19" width="30" height="30"
                      clipPath={`url(#avatar-slot-${i})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <text x="0" y="1" textAnchor="middle" fill="#ececf1" fontSize="12" fontWeight="800">
                    {p.numero !== '' && p.numero != null ? p.numero : slot.sigla}
                  </text>
                )}
                {warning && (
                  <text x="14" y="-14" fontSize="12">⚠️</text>
                )}
                {compat && <BadgeCompatibilita x={13} y={-14} livello={compat.livello} />}
                <text x="0" y="25" textAnchor="middle" fill="#ececf1" fontSize="10.5" fontWeight="700">
                  {nomeCorto(p)}
                </text>
                <text x="0" y="36" textAnchor="middle" fill={colore} fontSize="9.5" fontWeight="800">
                  {slot.sigla}
                  {ruolo.manuale && <tspan fill="#a78bfa" fontSize="8"> ✎</tspan>}
                </text>
                <text x="0" y="45" textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize="7.5">
                  {ruolo.nome}
                </text>
              </>
            ) : (
              <>
                <circle
                  cx="0" cy="-4" r="16"
                  fill="rgba(0,0,0,0.25)" stroke={colore} strokeWidth="1.5" strokeDasharray="4 3"
                />
                <text x="0" y="0" textAnchor="middle" fill={colore} fontSize="9.5" fontWeight="800">
                  {slot.sigla}
                </text>
                <text x="0" y="25" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9">
                  tocca
                </text>
                <text x="0" y="36" textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.55)">
                  {ruolo.nome}
                  {ruolo.manuale && <tspan fill="#a78bfa"> ✎</tspan>}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
