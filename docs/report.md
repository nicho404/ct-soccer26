# Report — to do dev

## Ruoli tattici del rombo: mancanti o da correggere

Confronto tra la lavagna del 13-14/10/2026 e il catalogo ruoli di slot (`src/tactics/constants.js`, `RUOLI` e `RUOLI_NP`). Oggi `slotRuoliOverride` è vuoto perché 6 ruoli su 10 non hanno un corrispettivo.

- **POR — Portiere regista (Bonnie)**: manca. Il più vicino è "Portiere di reparto" (corto se libero, lungo se pressato). Da aggiungere: ogni uscita parte da lui, a Zanna solo se libero e con le mani.
- **DC sx — Libero (Cato/Prio)**: manca in possesso. In non possesso "Difensore di copertura" corrisponde. Da aggiungere in possesso: ultimo uomo, non supera la metà campo, chiude i buchi lasciati dal braccetto.
- **DC dx — Braccetto (Gigi/Albi)**: manca. In possesso il più vicino è "Difensore largo"; in non possesso "Difensore d'anticipo" corrisponde (tiene sempre la loro prima punta). Da aggiungere: sale sulla fascia solo ogni tanto, chiamando "Zanna, punta!".
- **CDC — Mediano (Zanna)**: esiste, descrizione da correggere. Il catalogo dice "poi verticalizza"; Zanna veglia sulla difesa, ha la metà campo come limite ed è il primo riferimento centrale in uscita. In non possesso "Mediano schermo" corrisponde.
- **ES — Tornante (Sbronz/Gabry)**: "Tornante" esiste solo in zona terzino, quindi non è selezionabile sullo slot ES. In non possesso c'è "Tornante difensivo". Da rendere disponibile sugli esterni: copre tutta la fascia, senza catena.
- **ED — Ala (Den)**: "Ala" esiste ma la descrizione non corrisponde ("punta il fondo e crossa"). Den riceve largo sulla linea, rientra di piede invertito e ha la catena col braccetto. Il più vicino è "Esterno di ampiezza".
- **COC — Regista avanzato (Piccio)**: manca. Il più vicino è "Regista". Da aggiungere: riceve, smista, si muove senza palla, tira quando si avvicina alla porta.
- **COC, cambio — Trequartista (Giova)**: manca come ruolo di slot ("Classico 10" e "Attaccante ombra" esistono solo come ruoli osservati del giocatore). Quasi seconda punta che lega esterni e punta, con licenza di tiro.
- **ATT — Falso 9 (Patta)**: esiste, corrisponde.
- **ATT, cambio — Rapace (Ricky)**: manca. Il più vicino è "Opportunista", ma il rapace fa movimenti orizzontali in attesa della palla e non fa da boa.

## Da decidere a livello di app

- Il catalogo è chiuso. Due strade: aggiungere i ruoli sopra, oppure permettere nome e compito personalizzati per slot, con il catalogo come base.
- Un cambio con ruolo diverso dal titolare (Giova trequartista al posto di Piccio regista avanzato, Ricky rapace al posto di Patta falso 9) oggi non si può esprimere: l'override è per slot, non per giocatore.
