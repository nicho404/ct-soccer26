# Roadmap Mister App

Stato delle milestone. Le sigle `M3`…`M7` sono quelle già citate nei placeholder
(`src/App.jsx`, `src/pages/AltroPage.jsx`): questo file è la fonte di verità sullo scope.

## Fatte

| MS | Cosa | Dove |
|----|------|------|
| M1 | Scaffold, tema, Dexie, modulo Rosa completo (+ M1.1–M1.4: sigle FC26, ruoli tattici multipli, rinomina terzini) | `pages/RosaPage`, `PlayerFormPage`, `PlayerDetailPage` |
| M2 | Osservazione da campo con modalità comparativa, CRUD Intese | `pages/ObservationPage`, `IntesePage`, `IntesaFormPage` |
| M4 | Builder tattico stile FC26 (anticipata, saltando M3) | `pages/ModuloPage`, `tactics/engine.js`, `components/PitchView` |
| M3 | Partite e calendario | `pages/PartitePage`, `PartitaFormPage`, `lib/partite.js` |
| M6 | Storico: referto partita, minutaggio, marcatori | `pages/StoricoPage`, `PartitaRefertoPage`, `lib/storico.js` |
| M5 | Presenze e sedute: appello, piani seduta, confronto campo/allenamento | `pages/PresenzePage`, `SedutaFormPage`, `PianiPage`, `lib/presenze.js` |

Fuori milestone, dopo M4: motore tattico a 27 ruoli, fase di non possesso, stili di gioco,
export immagine del modulo, PWA, backup/ripristino, onboarding.

## Mancanti

### M7 — Avversari, Manuale, Capitano
Tre moduli indipendenti tra loro, raggruppati nella stessa milestone.

- **Avversari** (`opponents`): oggi la squadra avversaria si crea al volo dalla scheda
  partita, con il solo nome. Manca lo scouting: modulo abituale, giocatori pericolosi,
  note partita per partita, storico degli scontri diretti.
- **Manuale** (`manualEntries`): knowledge base tattica per categoria
  (`CATEGORIE_MANUALE` già definita: tattica, protocolli, psicologia, regole, principi).
- **Capitano**: confronto tra candidati sui criteri di osservazione già raccolti
  (leadership, lettura, presenze) — dipende da M2 (fatta) e migliora con M5.

## Ordine consigliato

Resta solo **M7**, i cui tre moduli sono indipendenti tra loro: si possono fare
nell'ordine che serve di più (Avversari prima di un girone nuovo, Capitano a
inizio stagione, Manuale quando c'è tempo).

## Debito noto

- Il bundle ha superato i 500 kB (warning di Vite in build). Prima o poi va
  spezzato per rotta con `lazy()` — non urgente per una PWA che si installa,
  ma cresce a ogni milestone.

## Vincoli trasversali

- Nessun backend: tutto in IndexedDB via Dexie. Ogni nuova tabella o campo va gestito
  con una `db.version(n)` e, se serve una migrazione dati, con una funzione esportata
  richiamabile anche da `importBackup()` (vedi `migrazioneV7RuoliTattici`).
- I dati demo (`db/demo.js`) vanno estesi insieme a ogni nuovo modulo, con `demo: true`
  su ogni riga.
- Mobile first: schermata singola, niente scroll orizzontale.
