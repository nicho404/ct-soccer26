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

Fuori milestone, dopo M4: motore tattico a 27 ruoli, fase di non possesso, stili di gioco,
export immagine del modulo, PWA, backup/ripristino, onboarding.

## Mancanti

### M5 — Presenze e sedute
Appello per allenamento, storico presenze, indicatore di meritocrazia da incrociare con
le convocazioni. Tabelle già a schema: `trainings`, `sessionPlans`.

- Seduta di allenamento con data, tema, giocatori presenti/assenti/giustificati
  (`STATI_PRESENZA` esiste già in `db/constants.js`).
- Percentuale presenze per giocatore, visibile nella scheda giocatore e nella Rosa.
- Piani seduta riutilizzabili (`sessionPlans.isTemplate`).

Indipendente: si può fare in qualsiasi momento.

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

`M5` → `M7`

M3 e M6 sono fatte: il calendario e il referto esistono, quindi le due milestone
rimaste non hanno più dipendenze tra loro né su altro.

## Vincoli trasversali

- Nessun backend: tutto in IndexedDB via Dexie. Ogni nuova tabella o campo va gestito
  con una `db.version(n)` e, se serve una migrazione dati, con una funzione esportata
  richiamabile anche da `importBackup()` (vedi `migrazioneV7RuoliTattici`).
- I dati demo (`db/demo.js`) vanno estesi insieme a ogni nuovo modulo, con `demo: true`
  su ogni riga.
- Mobile first: schermata singola, niente scroll orizzontale.
