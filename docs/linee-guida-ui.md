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
- **Partite**: riquadri compatti (V-N-P, gol, referti da fare), una riga per partita con il
  risultato a sinistra; il nome della competizione solo se ce n'è più d'una; "da fare" solo se
  manca qualcosa.
- **Scheda partita**: riepilogo in cima (risultato, avversario, data, competizione) con ✎ per i
  dati in finestra; risultato modificabile subito sotto; Presenze, Referto e Marcatori avversari
  come righe con stato, il dettaglio in finestra o nel referto. In creazione i dati restano in
  pagina, perché vanno compilati.
- **Referto**: riepilogo con il risultato ufficiale (non il conto degli eventi) e la durata in
  finestra; modulo in `Scelta`, assetti pronti in finestra; eventi come cronologia compatta
  (minuto, icona, descrizione); incarichi una riga per giocatore (assegnato → svolto) con i
  dettagli in finestra; "Salva" fisso in basso. Le azioni che cambiano dati importanti (es.
  "Usa il conto degli eventi") compaiono solo quando hanno senso.
- **Altro**: griglia di pulsanti per categoria (Squadra, Campionato, Mister), righe da tre.
- **Quaderno**: analisi e manuale nella stessa sezione, due schede (`/analisi`, `/manuale`).
- **Liste di testo (Manuale, Intese)**: classe `voce-lista` — etichetta piccola sopra, titolo
  su tutta la larghezza, anteprima tagliata a due righe dal CSS. Mai un badge accanto al
  titolo: gli ruba metà riga e lo manda a capo.
- **Storico**: marcatori come righe in una sola card, referti come le righe di Partite.
- **Osservazione**: pensata per bordo campo. Contesto in tre schede uguali, poi una riga (data o
  partita). Giocatori in griglia da quattro (in partita solo chi ha giocato), ✓ su chi è già
  osservato. Il tocco apre una finestra con la **nota in cima** (è ciò che si usa davvero) e,
  facoltativi, gli aspetti **rispetto al suo solito** (▼ ● ▲, salvati come 2/3/4) al posto dei
  voti 1-5, più i compiti del ruolo Sì/No in partita.
- **Modulo**: partita in `Scelta`; assetto in una riga (modulo in `Scelta`, tattica riassunta su
  due righe con il pallino di coerenza, ✎ apre la finestra con modulo, impostazione,
  costruzione e linea come pulsanti con descrizione); avviso di coerenza solo se qualcosa non
  torna; fasi in schede; assetti salvati come righe (nome, modulo, 🔁 cambi), dettaglio in
  finestra con "Carica in campo" ed "Elimina".
- **Riquadri in cima**: classe `stat-grid compatto`, etichette di una parola.

## Componenti

| Componente | Uso |
|---|---|
| `Modal` | Finestra a schermo con titolo e ✕; si chiude anche toccando fuori o con Esc |
| `Scelta` | Al posto di `<select>`: stesso uso (figli `<option>`), la scelta avviene in un `Modal` |
| `FacciaUmore` | Faccina dell'umore disegnata, colore dal verde scuro al rosso scuro |
| `BadgePresenze` | Badge presenze: solo icona nel riquadro colorato, dettagli nel tooltip |
| `Fascia` | Tag capitano (C) / vice (VC) |
