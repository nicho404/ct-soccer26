import { describe, it, expect } from 'vitest'
import { convertiSlotRuoliOverride, migrazioneV8SlotRuoliOverride } from './db'

// Piccolo scope Dexie-like: solo quanto basta per esercitare
// `.table(nome).toCollection().modify(fn)` senza IndexedDB — le migration
// vengono richiamate anche fuori da un upgrade Dexie reale (importBackup),
// quindi vanno testabili senza un browser.
function scopeFinto(tabelle) {
  return {
    table: (nome) => ({
      toCollection: () => ({
        modify: async (fn) => {
          for (const row of tabelle[nome] ?? []) fn(row)
        },
      }),
    }),
  }
}

describe('convertiSlotRuoliOverride', () => {
  it('forma vecchia ({ [slotIndex]: codice }) diventa { possesso: <vecchio>, nonPossesso: {} }, senza perdere chiavi', () => {
    const vecchio = { 1: 'DC-A', 5: 'CC-M' }
    const nuovo = convertiSlotRuoliOverride(vecchio)
    expect(nuovo).toEqual({ possesso: { 1: 'DC-A', 5: 'CC-M' }, nonPossesso: {} })
  })

  it('forma già nuova resta invariata (a parte la sanificazione dei codici)', () => {
    const gia = { possesso: { 2: 'DC-C' }, nonPossesso: { 2: 'N-DC-L' } }
    expect(convertiSlotRuoliOverride(gia)).toEqual(gia)
  })

  it('un override vuoto/assente diventa { possesso: {}, nonPossesso: {} }', () => {
    expect(convertiSlotRuoliOverride(undefined)).toEqual({ possesso: {}, nonPossesso: {} })
    expect(convertiSlotRuoliOverride(null)).toEqual({ possesso: {}, nonPossesso: {} })
  })

  it('un codice di possesso infilato nel set di non possesso (o viceversa) viene scartato, non crasha', () => {
    const misto = { possesso: { 1: 'N-DC-L' }, nonPossesso: { 2: 'DC-C' } }
    expect(convertiSlotRuoliOverride(misto)).toEqual({ possesso: {}, nonPossesso: {} })
  })

  it('un codice inesistente in generale viene scartato senza crash', () => {
    expect(convertiSlotRuoliOverride({ 1: 'NON-ESISTE' })).toEqual({ possesso: {}, nonPossesso: {} })
  })
})

describe('migrazioneV8SlotRuoliOverride — richiamabile fuori da un upgrade Dexie (importBackup)', () => {
  it('migra meta.modulo (byFormato) dalla forma vecchia alla nuova, per ogni formato', () => {
    const metaModulo = {
      key: 'modulo',
      value: {
        impostazione: 'possesso',
        byFormato: {
          7: { modulo: '2-3-1', slots: Array(7).fill(null), slotRuoliOverride: { 0: 'POR-C' } },
          8: { modulo: '3-3-1', slots: Array(8).fill(null), slotRuoliOverride: { 3: 'DC-A' } },
        },
      },
    }
    const scope = scopeFinto({ meta: [metaModulo] })
    return migrazioneV8SlotRuoliOverride(scope).then(() => {
      expect(metaModulo.value.byFormato[7].slotRuoliOverride).toEqual({ possesso: { 0: 'POR-C' }, nonPossesso: {} })
      expect(metaModulo.value.byFormato[8].slotRuoliOverride).toEqual({ possesso: { 3: 'DC-A' }, nonPossesso: {} })
    })
  })

  it('migra ogni assetto di meta.moduliSalvati mantenendo il resto dei campi intatto', () => {
    const salvati = {
      key: 'moduliSalvati',
      value: [
        { id: 1, nome: 'Titolari', formato: 8, modulo: '3-3-1', slots: Array(8).fill(null), impostazione: 'possesso', slotRuoliOverride: { 2: 'CC-M' } },
      ],
    }
    const scope = scopeFinto({ meta: [salvati] })
    return migrazioneV8SlotRuoliOverride(scope).then(() => {
      const s = salvati.value[0]
      expect(s.nome).toBe('Titolari')
      expect(s.slotRuoliOverride).toEqual({ possesso: { 2: 'CC-M' }, nonPossesso: {} })
    })
  })

  it('un override di possesso salvato e ricaricato resta applicato solo alla fase possesso', () => {
    const metaModulo = {
      key: 'modulo',
      value: { byFormato: { 8: { modulo: '3-3-1', slots: Array(8).fill(null), slotRuoliOverride: { 2: 'CC-M' } } } },
    }
    const scope = scopeFinto({ meta: [metaModulo] })
    return migrazioneV8SlotRuoliOverride(scope).then(() => {
      const { possesso, nonPossesso } = metaModulo.value.byFormato[8].slotRuoliOverride
      expect(possesso[2]).toBe('CC-M')
      expect(nonPossesso[2]).toBeUndefined()
    })
  })
})
