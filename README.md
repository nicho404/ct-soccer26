# ⚽ Mister App

App web per allenatori di **calcio a 7 e calcio a 8** amatoriale: gestione rosa, moduli tattici in stile FC26, osservazioni da campo e intese tra giocatori.

**Tutti i dati restano sul tuo dispositivo**: l'app non ha un backend, salva tutto nel browser (IndexedDB via Dexie). Nessun dato di giocatori o squadre viene inviato a server esterni.

## Funzionalità

- **Rosa** — anagrafica giocatori con ruolo naturale, ruoli adattati, piede, stato di attività, tesseramento, calci piazzati e note.
- **Modulo** — builder tattico in semi-3D con switch Calcio a 7 ⇄ Calcio a 8, moduli specifici per formato, impostazioni tattiche (possesso, contropiede, pressing…) e ruoli tattici 1:1 con FC26.
- **Osservazione** — valutazioni da campo per criterio (lettura, pressione, intensità, leadership…) con modalità comparativa.
- **Intese** — coppie e catene di giocatori che funzionano bene insieme, visualizzate sul campo.
- **Dati demo** — un tasto per popolare l'app con una rosa finta e provare tutto subito.

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

[MIT](LICENSE)
