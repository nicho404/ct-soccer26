# Roadmap Mister App

Stato delle milestone. Le sigle `M1`…`M7` vengono dal piano iniziale, quando i moduli
non ancora fatti erano segnaposto in `src/App.jsx`. **Sono tutte chiuse**: da qui in poi
il lavoro non ha più una scaletta prefissata, e questo file resta come storia dello scope
e come elenco del debito.

## Fatte

| MS | Cosa | Dove |
|----|------|------|
| M1 | Scaffold, tema, Dexie, modulo Rosa completo (+ M1.1–M1.4: sigle FC26, ruoli tattici multipli, rinomina terzini) | `pages/RosaPage`, `PlayerFormPage`, `PlayerDetailPage` |
| M2 | Osservazione da campo con modalità comparativa, CRUD Intese | `pages/ObservationPage`, `IntesePage`, `IntesaFormPage` |
| M4 | Builder tattico stile FC26 (anticipata, saltando M3) | `pages/ModuloPage`, `tactics/engine.js`, `components/PitchView` |
| M3 | Partite e calendario | `pages/PartitePage`, `PartitaFormPage`, `lib/partite.js` |
| M6 | Storico: referto partita, minutaggio, marcatori | `pages/StoricoPage`, `PartitaRefertoPage`, `lib/storico.js` |
| M5 | Presenze e sedute: appello, piani seduta, confronto campo/allenamento | `pages/PresenzePage`, `SedutaFormPage`, `PianiPage`, `lib/presenze.js` |
| M7 | Avversari (scouting), Manuale, Capitano | `pages/AvversariPage`, `AvversarioFormPage`, `ManualePage`, `ManualeFormPage`, `CapitanoPage`, `lib/capitano.js` |

Fuori milestone, dopo M4: motore tattico a 27 ruoli, fase di non possesso, stili di gioco,
export immagine del modulo, PWA, backup/ripristino, onboarding.

## Tutte chiuse

L'ultima milestone (M7) ha chiuso gli ultimi tre segnaposto:

- **Avversari** — scouting per squadra (modulo abituale, come giocano, giocatori
  pericolosi con nota su come fermarli) e scontri diretti dal calendario.
- **Manuale** — voci per categoria con ricerca: principi, protocolli, psicologia, regole.
- **Capitano** — confronto tra candidati sui dati già raccolti altrove, senza chiedere
  niente di nuovo al mister. Vedi `lib/capitano.js` per pesi e regole.

Idee emerse strada facendo e non ancora affrontate:

- Sostituzioni per slot nel referto: oggi un cambio è "esce X, entra Y", senza dire in
  quale posizione. Basta per i minuti, non per ricostruire la forma della squadra.
- Scontri diretti dentro la scheda partita (oggi si vedono solo dalla scheda avversario).
- Esportazione della convocazione come immagine, come già si fa per il modulo.

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
