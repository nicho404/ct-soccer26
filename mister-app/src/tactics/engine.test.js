import { describe, it, expect } from 'vitest'
import {
  risolviRuoli, verificaCoerenza, compatibilitaGiocatore, zoneEffettive,
  risolviRuoliNonPossesso, geometriaNonPossesso, applicaOverrideRuoli,
} from './engine'
import { MODULI_FORMATO, FORMATI } from '../lib/formazioni'
import { IMPOSTAZIONI, COSTRUZIONI, LINEE, ruoloInfo, RUOLI, RUOLI_NP, ruoloNpInfo } from './constants'

const TUTTI_I_MODULI = FORMATI.flatMap((f) => Object.values(MODULI_FORMATO[f]))
const TUTTI_I_MODULI_CON_CHIAVE = FORMATI.flatMap((f) =>
  Object.entries(MODULI_FORMATO[f]).map(([moduloKey, modulo]) => ({ moduloKey, modulo }))
)

describe('risolviRuoli — copertura completa', () => {
  it('per ogni modulo e ogni combinazione impostazione×costruzione restituisce un ruolo per ogni slot, senza vuoti', () => {
    for (const modulo of TUTTI_I_MODULI) {
      for (const { value: impostazione } of IMPOSTAZIONI) {
        for (const { value: costruzione } of COSTRUZIONI) {
          const ruoli = risolviRuoli({ modulo, impostazione, costruzione })
          expect(ruoli).toHaveLength(modulo.slots.length)
          for (const r of ruoli) {
            expect(r.ruoloSuggerito).toBeTruthy()
            expect(r.nome).toBeTruthy()
            expect(r.compito).toBeTruthy()
            expect(ruoloInfo(r.ruoloSuggerito)).toBeTruthy()
          }
        }
      }
    }
  })
})

describe('verificaCoerenza — le tre incoerenze critiche del documento', () => {
  it('possesso + costruzione diretta è rotto', () => {
    const { livello } = verificaCoerenza({ impostazione: 'possesso', costruzione: 'diretta', linea: 'normale' })
    expect(livello).toBe('rotto')
  })

  it('contropiede + linea alta è rotto', () => {
    const { livello, problemi } = verificaCoerenza({ impostazione: 'contropiede', costruzione: 'diretta', linea: 'alta' })
    expect(livello).toBe('rotto')
    expect(problemi.some((p) => p.tipo === 'linea')).toBe(true)
  })

  it('difesa a oltranza + passaggi corti è rotto', () => {
    const { livello } = verificaCoerenza({ impostazione: 'oltranza', costruzione: 'corti', linea: 'bassa' })
    expect(livello).toBe('rotto')
  })

  it('una combinazione coerente è ok e senza problemi', () => {
    const { livello, problemi } = verificaCoerenza({ impostazione: 'possesso', costruzione: 'corti', linea: 'alta' })
    expect(livello).toBe('ok')
    expect(problemi).toHaveLength(0)
  })
})

describe('regola di precedenza sul centrocampo conteso', () => {
  const medianoCodici = ['M-R', 'M-F', 'M-E']

  it('3-3-1: un solo CC senza mediano dedicato → segue la costruzione, mai un ruolo da CC-M', () => {
    const modulo = MODULI_FORMATO[8]['3-3-1']
    for (const { value: costruzione } of COSTRUZIONI) {
      const ruoli = risolviRuoli({ modulo, impostazione: 'possesso', costruzione })
      const iCC = modulo.slots.findIndex((s) => s.sigla === 'CC')
      expect(ruoli[iCC].zona).toBe('mediano')
      expect(medianoCodici).toContain(ruoli[iCC].ruoloSuggerito)
    }
  })

  it('3-1-2-1: il mediano dedicato (CDC) segue la costruzione, i due CC seguono sempre l\'impostazione', () => {
    const modulo = MODULI_FORMATO[8]['3-1-2-1']
    const iCDC = modulo.slots.findIndex((s) => s.sigla === 'CDC')
    const iCC = modulo.slots.map((s, i) => (s.sigla === 'CC' ? i : null)).filter((i) => i !== null)
    expect(iCC).toHaveLength(2)

    for (const { value: costruzione } of COSTRUZIONI) {
      for (const { value: impostazione } of IMPOSTAZIONI) {
        const ruoli = risolviRuoli({ modulo, impostazione, costruzione })
        expect(ruoli[iCDC].zona).toBe('mediano')
        expect(medianoCodici).toContain(ruoli[iCDC].ruoloSuggerito)
        for (const i of iCC) {
          expect(ruoli[i].zona).toBe('centrocampista-centrale')
          expect(ruoli[i].ruoloSuggerito.startsWith('CC-')).toBe(true)
        }
      }
    }
  })

  it('2-4-1: due CC senza mediano dedicato → uno assorbe il ruolo di mediano (M-E), l\'altro resta CC-M libero', () => {
    const modulo = MODULI_FORMATO[8]['2-4-1']
    const iCC = modulo.slots.map((s, i) => (s.sigla === 'CC' ? i : null)).filter((i) => i !== null)
    expect(iCC).toHaveLength(2)
    expect(modulo.slots.some((s) => s.sigla === 'CDC')).toBe(false)

    const ruoli = risolviRuoli({ modulo, impostazione: 'possesso', costruzione: 'equilibrata' })
    const zoneCC = iCC.map((i) => ruoli[i].zona)
    expect(zoneCC).toContain('mediano')
    expect(zoneCC).toContain('centrocampista-centrale')
    // mai entrambi in avanti: uno solo dei due può essere nella zona d'impostazione
    expect(zoneCC.filter((z) => z === 'centrocampista-centrale')).toHaveLength(1)
  })
})

describe('compatibilitaGiocatore', () => {
  it('naturale quando il ruolo dello slot è tra i ruoli tattici del giocatore', () => {
    const r = compatibilitaGiocatore({ slotRuolo: 'P-9', player: { ruoliTattici: ['Falso 9'] } })
    expect(r.livello).toBe('naturale')
  })

  it('adattabile quando il giocatore gioca ruoli della stessa zona ma non quello richiesto', () => {
    const r = compatibilitaGiocatore({ slotRuolo: 'P-9', player: { ruoliTattici: ['Opportunista'] } })
    expect(r.livello).toBe('adattabile')
  })

  it('forzato quando nessun ruolo tattico del giocatore appartiene alla zona richiesta', () => {
    const r = compatibilitaGiocatore({ slotRuolo: 'P-9', player: { ruoliTattici: ['Difensore'] } })
    expect(r.livello).toBe('forzato')
  })

  it('non scrive né modifica mai il giocatore passato in input', () => {
    const player = { ruoliTattici: ['Falso 9'] }
    const clone = JSON.parse(JSON.stringify(player))
    compatibilitaGiocatore({ slotRuolo: 'P-9', player })
    expect(player).toEqual(clone)
  })
})

describe('override manuale — sopravvive a un ciclo salva/ricarica', () => {
  it('un override serializzato e ricaricato (come da meta.moduliSalvati) resta applicato', () => {
    const modulo = MODULI_FORMATO[8]['3-3-1']
    const iCC = modulo.slots.findIndex((s) => s.sigla === 'CC')

    // stato "prima del salvataggio": override manuale su un centrocampista
    const overrideOriginale = { [iCC]: 'CC-I' }
    const salvato = JSON.parse(JSON.stringify({
      modulo: '3-3-1',
      impostazione: 'possesso',
      costruzione: 'equilibrata',
      linea: 'normale',
      slotRuoliOverride: overrideOriginale,
    }))

    // "ricarica": il motore calcola come sempre, poi l'override sovrascrive
    const ruoliBase = risolviRuoli({ modulo, impostazione: salvato.impostazione, costruzione: salvato.costruzione })
    const ruoli = ruoliBase.map((r, i) => {
      const codice = salvato.slotRuoliOverride[i]
      return codice ? { ...r, ruoloSuggerito: codice, ...ruoloInfo(codice), manuale: true } : r
    })

    expect(ruoli[iCC].ruoloSuggerito).toBe('CC-I')
    expect(ruoli[iCC].manuale).toBe(true)
    // senza override quello slot sarebbe stato mediano (per la regola di precedenza)
    expect(ruoliBase[iCC].ruoloSuggerito).not.toBe('CC-I')
  })
})

describe('coerenza modulo × impostazione', () => {
  it('copertura totale: nessun crash, livello valido, ogni problema ha tipo/livello/messaggio non vuoti', () => {
    const LIVELLI_VALIDI = ['ok', 'warn', 'rotto']
    for (const { moduloKey, modulo } of TUTTI_I_MODULI_CON_CHIAVE) {
      for (const { value: impostazione } of IMPOSTAZIONI) {
        for (const { value: costruzione } of COSTRUZIONI) {
          for (const { value: linea } of LINEE) {
            const { livello, problemi } = verificaCoerenza({ impostazione, costruzione, linea, modulo, moduloKey })
            expect(LIVELLI_VALIDI).toContain(livello)
            for (const p of problemi) {
              expect(p.tipo).toBeTruthy()
              expect(LIVELLI_VALIDI).toContain(p.livello)
              expect(p.messaggio).toBeTruthy()
            }
          }
        }
      }
    }
  })

  it('3-1-2-1 + gioco sulle ali: requisito strutturale violato (nessuno slot esterno) → rotto', () => {
    const modulo = MODULI_FORMATO[8]['3-1-2-1']
    const { livello, problemi } = verificaCoerenza({
      impostazione: 'ali', costruzione: 'equilibrata', linea: 'normale', modulo, moduloKey: '3-1-2-1',
    })
    expect(livello).toBe('rotto')
    expect(problemi.some((p) => p.tipo === 'modulo' && p.livello === 'rotto')).toBe(true)
  })

  it('2-3-2 + difesa a oltranza: requisito strutturale violato (solo 2 uomini di reparto arretrato) → rotto', () => {
    const modulo = MODULI_FORMATO[8]['2-3-2']
    const { livello, problemi } = verificaCoerenza({
      impostazione: 'oltranza', costruzione: 'diretta', linea: 'bassa', modulo, moduloKey: '2-3-2',
    })
    expect(livello).toBe('rotto')
    expect(problemi.some((p) => p.tipo === 'modulo' && p.livello === 'rotto')).toBe(true)
  })

  it('2-4-1 + contropiede: eccezione documentata (fragilità nota, non un\'impossibilità) → warn', () => {
    const modulo = MODULI_FORMATO[8]['2-4-1']
    const { problemi } = verificaCoerenza({
      impostazione: 'contropiede', costruzione: 'diretta', linea: 'bassa', modulo, moduloKey: '2-4-1',
    })
    expect(problemi.some((p) => p.tipo === 'modulo' && p.livello === 'warn')).toBe(true)
  })

  it('nessun falso positivo: 3-3-1 + possesso + corti + alta è ok senza problemi', () => {
    const modulo = MODULI_FORMATO[8]['3-3-1']
    const { livello, problemi } = verificaCoerenza({
      impostazione: 'possesso', costruzione: 'corti', linea: 'alta', modulo, moduloKey: '3-3-1',
    })
    expect(livello).toBe('ok')
    expect(problemi).toHaveLength(0)
  })

  it('retrocompatibilità: senza modulo/moduloKey non produce mai un problema di tipo "modulo"', () => {
    // stessa coppia che, CON modulo, produrrebbe un rotto strutturale
    const { problemi } = verificaCoerenza({ impostazione: 'ali', costruzione: 'equilibrata', linea: 'normale' })
    expect(problemi.some((p) => p.tipo === 'modulo')).toBe(false)
  })

  it('zoneEffettive: stessa lunghezza di modulo.slots e stesse zone di risolviRuoli', () => {
    for (const modulo of TUTTI_I_MODULI) {
      const zone = zoneEffettive(modulo)
      expect(zone).toHaveLength(modulo.slots.length)
      const ruoli = risolviRuoli({ modulo, impostazione: 'possesso', costruzione: 'equilibrata' })
      expect(ruoli.map((r) => r.zona)).toEqual(zone)
    }
  })
})

describe('coerenza modulo × linea', () => {
  it('meno di 3 difensori con linea alta → warn', () => {
    const modulo = MODULI_FORMATO[8]['2-3-2'] // DC=2, terzino=0 → difensivi=2
    const { problemi } = verificaCoerenza({
      impostazione: 'possesso', costruzione: 'equilibrata', linea: 'alta', modulo, moduloKey: '2-3-2',
    })
    expect(problemi.some((p) => p.tipo === 'modulo-linea' && p.livello === 'warn')).toBe(true)
  })

  it('due o più punte con linea bassa → warn', () => {
    const modulo = MODULI_FORMATO[8]['2-3-2'] // 2 ATT
    const { problemi } = verificaCoerenza({
      impostazione: 'oltranza', costruzione: 'diretta', linea: 'bassa', modulo, moduloKey: '2-3-2',
    })
    expect(problemi.some((p) => p.tipo === 'modulo-linea' && p.livello === 'warn')).toBe(true)
  })

  it('senza modulo non produce mai un problema di tipo "modulo-linea"', () => {
    const { problemi } = verificaCoerenza({ impostazione: 'possesso', costruzione: 'equilibrata', linea: 'alta' })
    expect(problemi.some((p) => p.tipo === 'modulo-linea')).toBe(false)
  })
})

describe('fase di non possesso', () => {
  it('copertura totale: un ruolo per ogni slot, nome/compito non vuoti, sempre risolvibile', () => {
    for (const modulo of TUTTI_I_MODULI) {
      for (const { value: linea } of LINEE) {
        for (const { value: impostazione } of IMPOSTAZIONI) {
          const ruoli = risolviRuoliNonPossesso({ modulo, linea, impostazione })
          expect(ruoli).toHaveLength(modulo.slots.length)
          for (const r of ruoli) {
            expect(r.nome).toBeTruthy()
            expect(r.compito).toBeTruthy()
            expect(ruoloNpInfo(r.ruoloSuggerito)).toBeTruthy()
          }
        }
      }
    }
  })

  it('la linea conta davvero: alta vs bassa cambiano almeno metà dei ruoli', () => {
    for (const modulo of TUTTI_I_MODULI) {
      const alta = risolviRuoliNonPossesso({ modulo, linea: 'alta', impostazione: 'possesso' })
      const bassa = risolviRuoliNonPossesso({ modulo, linea: 'bassa', impostazione: 'possesso' })
      const diversi = alta.filter((r, i) => r.ruoloSuggerito !== bassa[i].ruoloSuggerito).length
      expect(diversi).toBeGreaterThanOrEqual(Math.ceil(modulo.slots.length / 2))
    }
  })

  it('l\'impostazione conta anche senza palla: possesso vs contropiede, stesso modulo e stessa linea, danno ruoli diversi', () => {
    const modulo = MODULI_FORMATO[8]['3-3-1']
    const possesso = risolviRuoliNonPossesso({ modulo, linea: 'normale', impostazione: 'possesso' })
    const contropiede = risolviRuoliNonPossesso({ modulo, linea: 'normale', impostazione: 'contropiede' })
    const diversi = possesso.filter((r, i) => r.ruoloSuggerito !== contropiede[i].ruoloSuggerito).length
    expect(diversi).toBeGreaterThan(0)
  })

  it('namespace separato: nessun codice N-* in RUOLI, nessun codice di RUOLI in RUOLI_NP', () => {
    const codiciPossesso = new Set(RUOLI.map((r) => r.codice))
    const codiciNonPossesso = new Set(RUOLI_NP.map((r) => r.codice))
    for (const c of codiciNonPossesso) expect(codiciPossesso.has(c)).toBe(false)
    for (const c of codiciPossesso) expect(codiciNonPossesso.has(c)).toBe(false)
  })

  it('regola di precedenza condivisa: nel 3-3-1 lo slot CC è zona mediano anche senza palla', () => {
    const modulo = MODULI_FORMATO[8]['3-3-1']
    const iCC = modulo.slots.findIndex((s) => s.sigla === 'CC')
    const ruoli = risolviRuoliNonPossesso({ modulo, linea: 'normale', impostazione: 'possesso' })
    expect(ruoli[iCC].zona).toBe('mediano')
  })

  it('geometria compressa: invarianti su ogni modulo e ogni linea', () => {
    for (const modulo of TUTTI_I_MODULI) {
      const iPortiere = modulo.slots.findIndex((s) => s.sigla === 'POR')
      const tPortiere = modulo.slots[iPortiere].t
      const medie = {}

      for (const { value: linea } of LINEE) {
        const geo = geometriaNonPossesso({ modulo, linea })
        expect(geo).toHaveLength(modulo.slots.length)

        // il portiere non si muove
        expect(geo[iPortiere]).toEqual({ u: modulo.slots[iPortiere].u, t: modulo.slots[iPortiere].t })

        // tutti i valori in [0, 1]
        for (const { u, t } of geo) {
          expect(u).toBeGreaterThanOrEqual(0)
          expect(u).toBeLessThanOrEqual(1)
          expect(t).toBeGreaterThanOrEqual(0)
          expect(t).toBeLessThanOrEqual(1)
        }

        // ordine relativo dei t preservato fra gli slot di movimento
        const originali = modulo.slots.map((s, i) => ({ i, t: s.t })).filter(({ i }) => i !== iPortiere)
        const coppie = originali.flatMap((a, idx) => originali.slice(idx + 1).map((b) => [a, b]))
        for (const [a, b] of coppie) {
          if (a.t === b.t) continue
          const relazioneOriginale = a.t < b.t
          const relazioneCompressa = geo[a.i].t < geo[b.i].t
          expect(relazioneCompressa).toBe(relazioneOriginale)
        }

        // nessuno slot di movimento sotto il t del portiere
        for (let i = 0; i < geo.length; i++) {
          if (i === iPortiere) continue
          expect(geo[i].t).toBeGreaterThan(tPortiere)
        }

        medie[linea] = geo.filter((_, i) => i !== iPortiere).reduce((s, g) => s + g.t, 0) / (geo.length - 1)
      }

      // bassa più arretrata di normale, normale più arretrata di alta
      expect(medie.bassa).toBeLessThan(medie.normale)
      expect(medie.normale).toBeLessThan(medie.alta)
    }
  })

  it('non regressione: risolviRuoli e la regola di precedenza sul possesso restano invariati', () => {
    // stessa identica asserzione della FASE 2 (3-3-1, corti): se cambia,
    // la fase di non possesso ha toccato per errore il calcolo di possesso
    const modulo = MODULI_FORMATO[8]['3-3-1']
    const ruoli = risolviRuoli({ modulo, impostazione: 'possesso', costruzione: 'corti' })
    const iCC = modulo.slots.findIndex((s) => s.sigla === 'CC')
    expect(ruoli[iCC].ruoloSuggerito).toBe('M-R')
  })
})

describe('applicaOverrideRuoli', () => {
  const modulo = MODULI_FORMATO[8]['3-3-1']
  const iCC = modulo.slots.findIndex((s) => s.sigla === 'CC')

  it('sovrappone un override valido e marca il ruolo come manuale', () => {
    const base = risolviRuoli({ modulo, impostazione: 'possesso', costruzione: 'equilibrata' })
    const ruoli = applicaOverrideRuoli(base, { [iCC]: 'CC-I' }, ruoloInfo)
    expect(ruoli[iCC].ruoloSuggerito).toBe('CC-I')
    expect(ruoli[iCC].manuale).toBe(true)
    expect(ruoli[iCC].nome).toBe(ruoloInfo('CC-I').nome)
  })

  it('funziona identico per il non possesso, passando ruoloNpInfo', () => {
    const base = risolviRuoliNonPossesso({ modulo, linea: 'normale', impostazione: 'possesso' })
    const ruoli = applicaOverrideRuoli(base, { [iCC]: 'N-M-A' }, ruoloNpInfo)
    expect(ruoli[iCC].ruoloSuggerito).toBe('N-M-A')
    expect(ruoli[iCC].manuale).toBe(true)
  })

  it('scarta in silenzio un codice del vocabolario sbagliato (nessun crash, resta il ruolo calcolato)', () => {
    const base = risolviRuoli({ modulo, impostazione: 'possesso', costruzione: 'equilibrata' })
    const originale = base[iCC].ruoloSuggerito
    // 'N-M-A' è di non possesso: passato al risolutore di possesso non esiste
    const ruoli = applicaOverrideRuoli(base, { [iCC]: 'N-M-A' }, ruoloInfo)
    expect(ruoli[iCC].ruoloSuggerito).toBe(originale)
    expect(ruoli[iCC].manuale).toBeUndefined()
  })

  it('nessun override, nessun crash: slot non toccati restano identici', () => {
    const base = risolviRuoli({ modulo, impostazione: 'possesso', costruzione: 'equilibrata' })
    const ruoli = applicaOverrideRuoli(base, {}, ruoloInfo)
    expect(ruoli).toEqual(base)
    const ruoliSenzaOverride = applicaOverrideRuoli(base, undefined, ruoloInfo)
    expect(ruoliSenzaOverride).toEqual(base)
  })
})
