# Mister App — codice sorgente

Vedi il [README principale](../README.md) per la descrizione completa del progetto.

```bash
npm install
npm run dev      # sviluppo locale su http://localhost:5173
npm run build    # build di produzione in dist/
npm run preview  # anteprima della build
npm run lint     # oxlint
```

Note:

- La `base` di Vite è `/ct-soccer26/` ([vite.config.js](vite.config.js)) perché GitHub Pages serve il sito su `https://<utente>.github.io/ct-soccer26/`. Se rinomini la repo, aggiorna quel valore.
- Il routing usa `HashRouter`, quindi funziona su Pages senza redirect particolari.
- I dati vivono solo nel browser (IndexedDB via Dexie): niente backend, niente variabili d'ambiente.
