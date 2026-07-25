import { describe, it, expect } from 'vitest'
import { risolviRuoli, verificaCoerenza, compatibilitaGiocatore } from './engine'
import { MODULI_FORMATO, FORMATI } from '../lib/formazioni'
import { IMPOSTAZIONI, COSTRUZIONI, ruoloInfo } from './constants'

const TUTTI_I_MODULI = FORMATI.flatMap((f) => Object.values(MODULI_FORMATO[f]))

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
