# ⚽ Mister App

App web per allenatori di **calcio a 7 e calcio a 8** amatoriale: gestione rosa, moduli tattici in stile FC26, osservazioni da campo e intese tra giocatori.

**Tutti i dati restano sul tuo dispositivo**: l'app non ha un backend, salva tutto nel browser (IndexedDB via Dexie). Nessun dato di giocatori o squadre viene inviato a server esterni.

## Funzionalità

- **Rosa** — anagrafica giocatori con ruolo naturale, ruoli adattati, piede, stato di attività, tesseramento, calci piazzati e note.
- **Modulo** — builder tattico in semi-3D con switch Calcio a 7 ⇄ Calcio a 8, moduli specifici per formato, impostazioni tattiche (possesso, contropiede, pressing…) e ruoli tattici 1:1 con FC26.
- **Partite** — calendario con prossima partita in home, convocati, risultato e bilancio V-N-P; avversari e competizioni si creano al volo dalla scheda partita.
- **Storico** — referto partita (formazione schierata, gol, assist, cambi, cartellini) con minuti giocati calcolati dai cambi, classifica marcatori e minutaggio di squadra.
- **Presenze e sedute** — appello a tre stati per ogni allenamento, piano seduta a blocchi riutilizzabile come modello, rendimento all'appello e confronto tra quanto uno si allena e quanto gioca.
- **Osservazione** — valutazioni da campo per criterio (lettura, pressione, intensità, leadership…) con modalità comparativa.
- **Intese** — coppie e catene di giocatori che funzionano bene insieme, visualizzate sul campo.
- **Avversari** — scouting delle squadre del girone: modulo abituale, come giocano, giocatori pericolosi e scontri diretti.
- **Manuale** — la tua knowledge base: principi, protocolli, psicologia di gruppo, regole del torneo, con ricerca e categorie.
- **Capitano** — confronto tra candidati sui dati già raccolti (leadership osservata, presenze, minuti, carattere), con i pesi in chiaro.
- **Dati demo** — un tasto per popolare l'app con una rosa finta e provare tutto subito.

Lo stato delle milestone e cosa manca sono in [`docs/roadmap.md`](docs/roadmap.md).

## Sviluppo

Il progetto vive in [`mister-app/`](mister-app/):

```bash
cd mister-app
npm install
npm run dev      # sviluppo locale
npm run build    # build di produzione in dist/
npm run lint     # oxlint
```

Stack: React 19 + Vite, Dexie (IndexedDB), React Router (HashRouter).

## Deploy

Ogni push su `main` viene pubblicato automaticamente su GitHub Pages tramite il workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Licenza

Tutti i diritti riservati — codice visibile a solo scopo di consultazione, ogni utilizzo richiede permesso scritto. Vedi [LICENSE](LICENSE).
