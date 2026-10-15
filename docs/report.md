# Report — to do dev

## Ruoli tattici del rombo: mancanti o da correggere

Confronto tra la lavagna del 13-14/10/2026 e il catalogo ruoli di slot (`src/tactics/constants.js`, `RUOLI` e `RUOLI_NP`). Oggi `slotRuoliOverride` è vuoto perché 7 slot su 8 non hanno un ruolo che corrisponda.

- **POR — Portiere regista (Bonnie)**: manca. Il più vicino è "Portiere di reparto" (corto se libero, lungo se pressato). Da aggiungere: ogni uscita parte da lui, a Zanna solo se libero e con le mani.
- **DC sx — Libero (Cato/Prio)**: manca in possesso. In non possesso "Difensore di copertura" corrisponde. Da aggiungere in possesso: ultimo uomo, non supera la metà campo, chiude i buchi lasciati dal braccetto.
- **DC dx — Braccetto (Gigi/Albi)**: manca. In possesso il più vicino è "Difensore largo"; in non possesso "Difensore d'anticipo" corrisponde (tiene sempre la loro prima punta). Da aggiungere: sale sulla fascia solo ogni tanto, chiamando "Zanna, punta!".
- **CDC — Mediano (Zanna)**: esiste, descrizione da correggere. Il catalogo dice "poi verticalizza"; Zanna veglia sulla difesa ed è il primo riferimento centrale in uscita. Contro 2 punte resta dietro, contro 1 punta sale da uomo più arretrato nella loro metà campo. In non possesso "Mediano schermo" corrisponde.
- **ES — Tornante (Sbronz/Gabry)**: "Tornante" esiste solo in zona terzino, quindi non è selezionabile sullo slot ES. In non possesso c'è "Tornante difensivo". Da rendere disponibile sugli esterni: copre tutta la fascia e in attacco rientra nel tridente.
- **ED — Ala (Den)**: "Ala" esiste ma la descrizione non corrisponde ("punta il fondo e crossa"). Den fa parte del tridente: in costruzione stringe al centro, si allarga quando la palla arriva a Piccio, lascia la fascia al braccetto. Il più vicino è "Attaccante interno".
- **COC — Regista avanzato (Piccio)**: manca. Il più vicino è "Regista". Da aggiungere: riceve, smista, si muove senza palla, tira quando si avvicina alla porta.
- **ATT — Falso 9 (Patta)**: esiste, corrisponde.

## Da decidere a livello di app

- Il catalogo è chiuso. Due strade: aggiungere i ruoli sopra, oppure permettere nome e compito personalizzati per slot, con il catalogo come base.
