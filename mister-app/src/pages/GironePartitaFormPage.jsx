import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { risolviAvversario, eventiPerForm, eventiPerDb } from '../db/girone'
import { disallineamentoGirone, pulisciNome } from '../lib/girone'
import EventiAvversari from '../components/EventiAvversari'

const EMPTY = {
  competitionId: null,
  giornata: '',
  data: '',
  golCasa: null,
  golOspite: null,
}

// '' → null, come nel form delle nostre partite: lo 0 è un risultato
const toGol = (raw) => {
  if (raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 ? n : null
}

const toGiornata = (raw) => {
  const n = Number(raw)
  return raw !== '' && Number.isInteger(n) && n > 0 ? n : null
}

// Partita tra due altre squadre della competizione. Le nostre restano in
// matches e si modificano da PartitaFormPage.
export default function GironePartitaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const editing = Boolean(id)
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    competitionId: Number(params.get('c')) || null,
    giornata: params.get('g') ?? '',
  }))
  const [nomeCasa, setNomeCasa] = useState('')
  const [nomeOspite, setNomeOspite] = useState('')
  const [eventi, setEventi] = useState([])
  const [loaded, setLoaded] = useState(!editing)

  const competitions = useLiveQuery(() => db.competitions.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const giocatori = useLiveQuery(() => db.giocatoriAvversari.toArray(), [])

  useEffect(() => {
    if (!editing) return
    Promise.all([
      db.partiteGirone.get(Number(id)), db.opponents.toArray(), db.giocatoriAvversari.toArray(),
    ]).then(([p, opps, gioc]) => {
      if (p) {
        setForm({
          competitionId: p.competitionId ?? null,
          giornata: p.giornata ?? '',
          data: p.data ?? '',
          golCasa: p.golCasa ?? null,
          golOspite: p.golOspite ?? null,
        })
        const nome = (oid) => opps.find((o) => o.id === oid)?.nome ?? ''
        setNomeCasa(nome(p.casaId))
        setNomeOspite(nome(p.ospiteId))
        setEventi(eventiPerForm(
          p.eventi,
          (e) => (e.squadraId === p.casaId ? 'casa' : e.squadraId === p.ospiteId ? 'ospite' : null),
          gioc,
        ))
      }
      setLoaded(true)
    })
  }, [id, editing])

  if (!competitions || !opponents || !giocatori || !loaded) return null

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const idDaNome = (nome) =>
    opponents.find((o) => pulisciNome(o.nome).toLowerCase() === pulisciNome(nome).toLowerCase())?.id ?? null

  const lati = [
    { key: 'casa', nome: nomeCasa, opponentId: idDaNome(nomeCasa) },
    { key: 'ospite', nome: nomeOspite, opponentId: idDaNome(nomeOspite) },
  ]

  const storti = disallineamentoGirone({
    casaId: 'casa',
    ospiteId: 'ospite',
    golCasa: form.golCasa,
    golOspite: form.golOspite,
    eventi: eventi.map((e) => ({ tipo: e.tipo, squadraId: e.lato })),
  })

  const salva = async () => {
    if (!form.competitionId) {
      alert('Scegli la competizione')
      return
    }
    if (!pulisciNome(nomeCasa) || !pulisciNome(nomeOspite)) {
      alert('Servono entrambe le squadre')
      return
    }
    if (pulisciNome(nomeCasa).toLowerCase() === pulisciNome(nomeOspite).toLowerCase()) {
      alert('Casa e ospite devono essere squadre diverse')
      return
    }
    const casaId = await risolviAvversario(nomeCasa)
    const ospiteId = await risolviAvversario(nomeOspite)
    const dati = {
      competitionId: form.competitionId,
      giornata: toGiornata(form.giornata),
      data: form.data || null,
      casaId,
      ospiteId,
      golCasa: form.golCasa,
      golOspite: form.golOspite,
      eventi: await eventiPerDb(eventi, { casa: casaId, ospite: ospiteId }),
    }
    // update solo dei campi del form: ora, luogo e sportxId di un import restano
    if (editing) await db.partiteGirone.update(Number(id), dati)
    else await db.partiteGirone.add({ ...dati, ora: '', luogo: '', sportxId: null })
    navigate(`/girone?c=${form.competitionId}&t=risultati`, { replace: true })
  }

  const elimina = async () => {
    if (!window.confirm('Eliminare questa partita del girone?')) return
    await db.partiteGirone.delete(Number(id))
    navigate(-1)
  }

  const campoSquadra = (label, valore, setValore) => (
    <div className="field">
      <label>{label}</label>
      <input
        className="input"
        list="girone-squadre"
        value={valore}
        onChange={(e) => setValore(e.target.value)}
        placeholder="Es. Bisonti"
      />
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Partita del girone' : 'Nuovo risultato'}</h1>
      </div>

      <div className="field">
        <label>Competizione</label>
        <select
          className="select"
          value={form.competitionId ?? ''}
          onChange={(e) => set('competitionId', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— Scegli —</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className="field" style={{ width: 110 }}>
          <label>Giornata</label>
          <input
            className="input"
            type="number"
            min="1"
            inputMode="numeric"
            value={form.giornata}
            onChange={(e) => set('giornata', e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Data (facoltativa)</label>
          <input
            className="input"
            type="date"
            value={form.data}
            onChange={(e) => set('data', e.target.value)}
          />
        </div>
      </div>

      {campoSquadra('Casa', nomeCasa, setNomeCasa)}
      {campoSquadra('Ospite', nomeOspite, setNomeOspite)}
      <datalist id="girone-squadre">
        {opponents.map((o) => <option key={o.id} value={o.nome} />)}
      </datalist>
      <p className="muted small" style={{ margin: '-6px 0 12px' }}>
        Se il nome è nuovo la squadra viene creata.
      </p>

      <div className="section-title">Risultato</div>
      <div className="card">
        <div className="row" style={{ gap: 10 }}>
          {[['golCasa', pulisciNome(nomeCasa) || 'Casa'], ['golOspite', pulisciNome(nomeOspite) || 'Ospite']].map(([k, label]) => (
            <div className="field" style={{ flex: 1, marginBottom: 0 }} key={k}>
              <label>{label}</label>
              <input
                className="input"
                type="number"
                min="0"
                inputMode="numeric"
                value={form[k] ?? ''}
                onChange={(e) => set(k, toGol(e.target.value))}
              />
            </div>
          ))}
        </div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>Lascia vuoto finché non si gioca.</p>
      </div>

      <div className="section-title">Marcatori e cartellini</div>
      <EventiAvversari eventi={eventi} onChange={setEventi} lati={lati} giocatori={giocatori} />

      {storti && (
        <div className="alert-card" style={{ marginTop: 10 }}>
          <div>
            I marcatori non tornano col risultato:{' '}
            {storti.map((s) => {
              const lato = lati.find((l) => l.key === s.squadraId)
              return `${pulisciNome(lato?.nome) || s.squadraId} ${s.eventi} marcatori su ${s.risultato ?? 'nessun'} gol`
            }).join(', ')}.
            Puoi salvare lo stesso.
          </div>
        </div>
      )}

      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={salva}>
        {editing ? 'Salva modifiche' : 'Salva risultato'}
      </button>

      {editing && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={elimina}>
          Elimina partita
        </button>
      )}
    </div>
  )
}
