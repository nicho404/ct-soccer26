// Girone (M11): il ponte tra i form e Dexie per squadre e giocatori
// avversari, che si creano scrivendone il nome invece che da un CRUD a parte.
import { db } from './db'
import { pulisciNome, trovaGiocatore } from '../lib/girone'

// Cerca la squadra per nome (senza distinzione di maiuscole) e la crea se non c'è.
export async function risolviAvversario(nome) {
  const pulito = pulisciNome(nome)
  if (!pulito) return null
  const tutte = await db.opponents.toArray()
  const esistente = tutte.find((o) => pulisciNome(o.nome).toLowerCase() === pulito.toLowerCase())
  if (esistente) return esistente.id
  return db.opponents.add({ nome: pulito })
}

export async function risolviGiocatore(opponentId, nome) {
  const rosa = await db.giocatoriAvversari.where('opponentId').equals(opponentId).toArray()
  const esistente = trovaGiocatore(rosa, opponentId, nome)
  if (esistente) return esistente.id
  return db.giocatoriAvversari.add({ opponentId, nome: pulisciNome(nome), sportxId: null })
}

let seq = 0
export const chiaveEvento = () => `ev-${Date.now()}-${(seq += 1)}`

// Nei form un evento è { key, tipo, lato, nome }: il lato ('casa', 'ospite',
// 'avversario') e il nome, non gli id, perché la squadra può essere ancora
// da creare e il giocatore pure. Gli id si risolvono solo al salvataggio.
export function eventiPerForm(eventi, latoDi, giocatori) {
  return (eventi ?? []).flatMap((e) => {
    const lato = latoDi(e)
    if (!lato) return []
    const nome = giocatori.find((g) => g.id === e.giocatoreId)?.nome ?? ''
    return [{ key: chiaveEvento(), tipo: e.tipo, lato, nome }]
  })
}

// form → db: [{ tipo, squadraId, giocatoreId }], creando i giocatori nuovi.
// In sequenza, così lo stesso nome nuovo scritto due volte crea un solo giocatore.
export async function eventiPerDb(eventi, idPerLato) {
  const out = []
  for (const e of eventi) {
    const squadraId = idPerLato[e.lato]
    if (squadraId == null || !pulisciNome(e.nome)) continue
    out.push({ tipo: e.tipo, squadraId, giocatoreId: await risolviGiocatore(squadraId, e.nome) })
  }
  return out
}
