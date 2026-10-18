import { famigliaRuolo, incaricoInfo } from '../db/constants'
import { coloreFamiglia, coloreIntesa, Simbolo } from './simboli'
import { compatibilitaGiocatore } from '../tactics/engine'
import { nomeBreve } from '../lib/nomi'
import { pt, poly, areaPoly } from '../lib/pitchGeometry'
import { fuoriRuolo } from '../lib/formazioni'
import { vistaCompleta } from '../lib/vistaCampo'
import { IconAlert, IconPencil, IconSwap } from './icons'

// Il campo resta verde e scuro con qualsiasi tema: linee e scritte usano
// --campo-linee, e i colori di stato si schiariscono verso le linee per
// restare leggibili sul verde anche quando il tema chiaro li scurisce.
const tratto = (pc) => `color-mix(in srgb, var(--campo-linee) ${pc}%, transparent)`
const sulCampo = (token) => `color-mix(in srgb, var(--${token}) 70%, var(--campo-linee))`

// Matita accanto al ruolo scelto a mano dal mister
const Manuale = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} style={{ color: sulCampo('accent') }}>
    <IconPencil size={8} aria-label="Ruolo manuale" />
  </g>
)

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
        <circle cx={x} cy={y} r="6.5" fill={sulCampo('ok')} stroke="var(--campo-pedina)" strokeWidth="1.5" />
        <text x={x} y={y + 3.8} textAnchor="middle" fill="var(--campo-pedina)" fontSize="11" fontWeight="900">+</text>
      </g>
    )
  }
  if (livello === 'adattabile') {
    return (
      <g>
        <circle cx={x} cy={y} r="6.5" fill={sulCampo('warn')} stroke="var(--campo-pedina)" strokeWidth="1.5" />
        <text x={x} y={y + 3.8} textAnchor="middle" fill="var(--campo-pedina)" fontSize="11" fontWeight="900">~</text>
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
  coordinate, fase = 'possesso', cambi = {}, incarichi = {}, mostra,
}) {
  // indicatori accesi/spenti dal mister (lib/vistaCampo): di default tutto
  const vedi = vistaCompleta(mostra)
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
  if (fase === 'possesso' && vedi.intese) {
    for (const intesa of intese) {
      const punti = (intesa.playerIds ?? [])
        .map((pid) => assignments.indexOf(pid))
        .filter((i) => i !== -1)
        .map((i) => posizioni[i])
      if (punti.length < 2) continue
      const colore = coloreIntesa(intesa.tipo)
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
          fill={i % 2 === 0 ? 'color-mix(in srgb, var(--campo) 85%, var(--ombra))' : 'var(--campo)'}
        />
      ))}

      {/* griglia 5×5 */}
      {lineeU.map((u) => {
        const [x1, y1] = pt(u, 0)
        const [x2, y2] = pt(u, 1)
        return <line key={`u${u}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tratto(9)} />
      })}
      {lineeT.map((t) => {
        const [x1, y1] = pt(0, t)
        const [x2, y2] = pt(1, t)
        return <line key={`t${t}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tratto(9)} />
      })}

      {/* linee campo */}
      <polygon points={poly([pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)])} fill="none" stroke={tratto(65)} strokeWidth="2" />
      <line x1={pt(0, 0.5)[0]} y1={pt(0, 0.5)[1]} x2={pt(1, 0.5)[0]} y2={pt(1, 0.5)[1]} stroke={tratto(55)} strokeWidth="1.5" />
      <ellipse cx={ccx} cy={ccy} rx={crx} ry={cry} fill="none" stroke={tratto(45)} strokeWidth="1.5" />
      {/* aree di rigore */}
      <polygon points={areaPoly(0, 0.16)} fill="none" stroke={tratto(55)} strokeWidth="1.5" />
      <polygon points={areaPoly(0.84, 1)} fill="none" stroke={tratto(55)} strokeWidth="1.5" />
      {/* porte */}
      <polygon points={poly([pt(0.4, 0), [pt(0.4, 0)[0], pt(0.4, 0)[1] + 14], [pt(0.6, 0)[0], pt(0.6, 0)[1] + 14], pt(0.6, 0)])} fill="none" stroke={tratto(50)} strokeWidth="1.5" />
      <polygon points={poly([pt(0.42, 1), [pt(0.42, 1)[0], pt(0.42, 1)[1] - 9], [pt(0.58, 1)[0], pt(0.58, 1)[1] - 9], pt(0.58, 1)])} fill="none" stroke={tratto(50)} strokeWidth="1.5" />

      {/* badge di fase: impostazione in possesso, linea+fase in non possesso —
          non deve mai essere possibile guardare lo schermo senza sapere
          quale mappa si sta vedendo */}
      {badgeInfo && (
        <g>
          <rect x="8" y="8" width={badgeW} height="30" rx="15" fill="color-mix(in srgb, var(--campo-pedina) 92%, transparent)" stroke={sulCampo('accent')} strokeWidth="1" />
          <g transform="translate(17 15)" style={{ color: 'var(--campo-linee)' }}>{badgeInfo.icona}</g>
          <text x="40" y="27" fill="var(--campo-linee)" fontSize="11" fontWeight="700">{badgeInfo.label}</text>
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
        const colore = coloreFamiglia(famigliaRuolo(slot.sigla))
        const ruolo = ruoli[i]
        const isSel = selected === i
        const warning = vedi.compatibilita && fuoriRuolo({ player: p, slot, ruoloNome: ruolo?.nome })
        const compat = vedi.compatibilita && fase === 'possesso' && p && !warning
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
            {isSel && <circle cx="0" cy="-4" r="21" fill="none" stroke={sulCampo('accent')} strokeWidth="3" />}
            {p ? (
              <>
                <circle cx="0" cy="-4" r="16" fill="var(--campo-pedina)" stroke={colore} strokeWidth="2.5" />
                {p.foto && vedi.foto ? (
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
                  <text x="0" y="1" textAnchor="middle" fill="var(--campo-linee)" fontSize="12" fontWeight="800">
                    {p.numero !== '' && p.numero != null ? p.numero : slot.sigla}
                  </text>
                )}
                {warning && (
                  <g transform="translate(7 -27)" style={{ color: sulCampo('warn') }}>
                    <IconAlert size={14} aria-label="Fuori ruolo" />
                  </g>
                )}
                {compat && <BadgeCompatibilita x={13} y={-14} livello={compat.livello} />}
                {vedi.incarichi && incaricoInfo(incarichi[p.id]) && (
                  <g transform="translate(-30 -24)" style={{ color: 'var(--campo-linee)' }}>
                    <Simbolo gruppo="incarico" valore={incarichi[p.id]} size={13} />
                  </g>
                )}
                <text x="0" y="25" textAnchor="middle" fill="var(--campo-linee)" fontSize="10.5" fontWeight="700">
                  {nomeCorto(p)}
                </text>
                <text x="0" y="36" textAnchor="middle" fill={colore} fontSize="9.5" fontWeight="800">
                  {slot.sigla}
                </text>
                {ruolo.manuale && <Manuale x={slot.sigla.length * 3.4 + 2} y={29} />}
                {vedi.ruoli && (
                  <text x="0" y="45" textAnchor="middle" fill={tratto(78)} fontSize="7.5">
                    {ruolo.nome}
                  </text>
                )}
                {vedi.cambi && cambi[i] != null && (() => {
                  const entrante = players.find((pl) => pl.id === cambi[i])
                  if (!entrante) return null
                  return (
                    <g style={{ color: sulCampo('danger') }}>
                      <g transform={`translate(${-nomeCorto(entrante).length * 2.45 - 12} ${vedi.ruoli ? 50 : 40})`}>
                        <IconSwap size={9} />
                      </g>
                      <text x="2" y={vedi.ruoli ? 57 : 47} textAnchor="middle" fill="currentColor" fontSize="8.5" fontWeight="800">
                        {nomeCorto(entrante)}
                      </text>
                    </g>
                  )
                })()}
              </>
            ) : (
              <>
                <circle
                  cx="0" cy="-4" r="16"
                  fill="color-mix(in srgb, var(--ombra) 25%, transparent)" stroke={colore} strokeWidth="1.5" strokeDasharray="4 3"
                />
                <text x="0" y="0" textAnchor="middle" fill={colore} fontSize="9.5" fontWeight="800">
                  {slot.sigla}
                </text>
                <text x="0" y="25" textAnchor="middle" fill={tratto(45)} fontSize="9">
                  tocca
                </text>
                <text x="0" y="36" textAnchor="middle" fontSize="7.5" fill={tratto(55)}>
                  {vedi.ruoli ? ruolo.nome : ''}
                </text>
                {ruolo.manuale && (
                  <Manuale x={vedi.ruoli ? ruolo.nome.length * 1.9 + 2 : -4} y={30} />
                )}
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
