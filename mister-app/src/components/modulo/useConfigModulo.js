import { useEffect, useState } from 'react'
import { db } from '../../db/db'
import { DEFAULT_BY_FORMATO, statoDaRecord, formatoDaAssetto, tatticaDaAssetto } from './stato'

// Configurazione della pagina Modulo e il suo salvataggio nel record meta
// 'modulo': per formato (modulo, undici, override dei ruoli, cambi,
// incarichi) più impostazione, costruzione, linea e partita. Ogni modifica
// si salva subito, come sempre.
export default function useConfigModulo(formato) {
  const [byFormato, setByFormato] = useState(DEFAULT_BY_FORMATO)
  const [impostazione, setImpostazione] = useState('possesso')
  const [costruzione, setCostruzione] = useState('equilibrata')
  const [linea, setLinea] = useState('normale')
  // partita selezionata: filtra disponibili/panchina sui presenti; null = tutti gli attivi
  const [matchId, setMatchId] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    db.meta.get('modulo').then((m) => {
      const v = m?.value
      if (v) {
        const s = statoDaRecord(v)
        setByFormato(s.byFormato)
        if (s.impostazione) setImpostazione(s.impostazione)
        if (s.costruzione) setCostruzione(s.costruzione)
        if (s.linea) setLinea(s.linea)
        if (s.matchId !== undefined) setMatchId(s.matchId)
      }
      setLoaded(true)
    })
  }, [])

  const persist = (patch = {}) => {
    const value = { impostazione, costruzione, linea, byFormato, matchId, ...patch }
    db.meta.put({ key: 'modulo', value })
  }

  // Un solo setByFormato per aggiornamento: chiamarne due di seguito nello
  // stesso handler farebbe perdere il primo, perché entrambi partirebbero
  // dallo stesso byFormato "stale" prima del re-render.
  const updateFormato = (patch) => {
    const next = { ...byFormato, [formato]: { ...byFormato[formato], ...patch } }
    setByFormato(next)
    persist({ byFormato: next })
  }

  const SETTER = { impostazione: setImpostazione, costruzione: setCostruzione, linea: setLinea }
  const cambiaTattica = (campo) => (value) => {
    SETTER[campo](value)
    persist({ [campo]: value })
  }

  const cambiaPartita = (id) => {
    setMatchId(id)
    persist({ matchId: id })
  }

  const caricaAssetto = (s) => {
    const next = { ...byFormato, [formato]: formatoDaAssetto(s) }
    const t = tatticaDaAssetto(s, impostazione)
    setByFormato(next)
    setImpostazione(t.impostazione)
    setCostruzione(t.costruzione)
    setLinea(t.linea)
    persist({ byFormato: next, ...t })
  }

  const config = byFormato[formato]

  // Incarico per fase: per giocatore, non per slot, così segue il giocatore
  // negli scambi e vale anche per chi entra dalla panchina.
  const setIncarico = (playerId, valore) => {
    const next = { ...(config.incarichi ?? {}) }
    if (valore) next[playerId] = valore
    else delete next[playerId]
    updateFormato({ incarichi: next })
  }

  // Ruolo manuale di una posizione in una fase; null torna all'automatico
  const setOverride = (fase, slot, codice) => {
    const override = {
      possesso: { ...(config.slotRuoliOverride?.possesso ?? {}) },
      nonPossesso: { ...(config.slotRuoliOverride?.nonPossesso ?? {}) },
    }
    if (codice) override[fase][slot] = codice
    else delete override[fase][slot]
    updateFormato({ slotRuoliOverride: override })
  }

  // Nuovo assetto salvato con l'undici, la tattica e i cambi previsti
  const salvaAssetto = async (nome, righe, tutti) => {
    const nuovo = {
      id: Date.now(),
      nome,
      formato,
      modulo: config.modulo,
      slots: [...config.slots],
      impostazione,
      costruzione,
      linea,
      slotRuoliOverride: {
        possesso: { ...(config.slotRuoliOverride?.possesso ?? {}) },
        nonPossesso: { ...(config.slotRuoliOverride?.nonPossesso ?? {}) },
      },
      incarichi: { ...(config.incarichi ?? {}) },
      // una riga senza chi entra non è un cambio previsto, solo rumore
      cambiPrevisti: righe.filter((r) => r.entraPlayerId != null),
    }
    await db.meta.put({ key: 'moduliSalvati', value: [...tutti, nuovo] })
  }

  return {
    loaded, config, impostazione, costruzione, linea, matchId,
    updateFormato, cambiaTattica, cambiaPartita, caricaAssetto, setIncarico, setOverride, salvaAssetto,
  }
}
