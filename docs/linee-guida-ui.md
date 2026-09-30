# Linee guida UI/UX

La pagina **Capitano** (`mister-app/src/pages/CapitanoPage.jsx`) è il modello di riferimento:
il mister la usa da telefono, a bordo campo, e deve vedere subito l'essenziale e agire con un
tocco. Prima di ridisegnare un'altra sezione, verificare questi punti.

## Principi

1. **Riepilogo in cima.** Quello che risponde alla domanda della sezione sta in tessere
   compatte in alto (in Capitano: chi ha le fasce), con uno stato vuoto esplicito
   ("Da nominare") invece di un buco.
2. **Elenco a una riga.** Identità, un solo numero sintetico e le azioni dirette. Nessun
   dettaglio sempre aperto nell'elenco.
3. **Dettaglio su richiesta.** Il tocco sulla riga apre una finestra a schermo (`Modal`) con
   la ✕ in alto a destra: analitiche, azioni estese, link alla scheda.
4. **Le azioni dirette non aprono il dettaglio.** Un pulsante nella riga fa solo la sua cosa
   (`stopPropagation`); la stessa azione torna, estesa, dentro la finestra.
5. **Il colore è lo stato.** Verde/giallo per dati completi/parziali, pulsanti che si
   accendono quando sono attivi. Icona in un riquadro colorato al posto della parola quando
   una legenda la spiega, e la legenda si apre toccando il simbolo stesso.
6. **Segnali solo quando servono.** Niente emoji o badge ripetuti su ogni riga se non
   rispondono alla domanda della sezione: è rumore. Un avviso compare solo quando c'è un
   problema.
7. **Ogni dato nella forma più leggibile.** Etichette corte; un badge al posto di una barra
   quando conta il livello più della lunghezza.
8. **Una riga di guida** al posto dei paragrafi esplicativi.
9. **Stesso dato, stesso calcolo.** Una percentuale mostrata in più pagine viene da una sola
   funzione (es. presenze: `impegno` in `lib/umore.js`), mai da due calcoli simili.
10. **Niente menu a tendina né pannelli che si aprono nella pagina.** Le scelte usano
    `components/Scelta`, i pannelli `components/Modal`, sempre con la ✕.

## Pagine già allineate

- **Capitano**: il modello.
- **Rosa**: riepilogo in cima (disponibili, porta, scontenti), giocatori per reparto, una riga
  ciascuno (faccina, foto con numero, soprannome + nome, fascia, ruolo, badge); gli avvisi
  (stato, acciaccato, tesseramento) compaiono sotto il nome solo se ci sono.
- **Home**: prossima partita (con la posizione dell'avversario), ultima partita, stagione in
  quattro numeri (posizione, punti, V-N-P, gol) e forma dalla più vecchia alla più recente.

## Componenti

| Componente | Uso |
|---|---|
| `Modal` | Finestra a schermo con titolo e ✕; si chiude anche toccando fuori o con Esc |
| `Scelta` | Al posto di `<select>`: stesso uso (figli `<option>`), la scelta avviene in un `Modal` |
| `FacciaUmore` | Faccina dell'umore disegnata, colore dal verde scuro al rosso scuro |
| `BadgePresenze` | Badge presenze: solo icona nel riquadro colorato, dettagli nel tooltip |
| `Fascia` | Tag capitano (C) / vice (VC) |
