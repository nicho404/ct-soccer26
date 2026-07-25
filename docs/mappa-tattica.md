# MAPPA TATTICA
### Sistema: impostazione × costruzione × linea × modulo → ruoli tattici

Documento di dominio per il motore tattico. Formati supportati: calcio a 7 e calcio a 8.

---

## 0. IL PRINCIPIO: LA CATENA A QUATTRO ANELLI (PIÙ UNO SDOPPIAMENTO DI FASE)

```
MODULO          →  dove stanno (slot disponibili per zona)
COSTRUZIONE     →  come esci, con palla (primo terzo)
IMPOSTAZIONE    →  come attacchi, con palla (ultimo terzo) — e cosa fai nei secondi dopo averla persa
LINEA           →  dove aspetti, senza palla (fase di non possesso)
```

**Requisito centrale:** ogni anello deve **riscrivere il ruolo tattico** degli slot che governa. Se cambiando `costruzione` i ruoli restano identici, l'anello è scollegato e la scelta è cosmetica. Vale anche per la linea: non è più un anello che produce solo avvisi di coerenza, è l'asse che scrive il ruolo di ogni slot **quando la squadra non ha palla**, con la stessa forza di costruzione e impostazione quando ce l'ha (§3-bis).

Ogni slot ha quindi **due ruoli**, uno per fase — non uno con due sfumature. Il vocabolario di non possesso (§1-bis) è un namespace separato dal vocabolario di possesso (§1): un "Falso 9" senza palla non esiste, esiste una "Punta di riferimento" o un "Prima pressione", a seconda di cosa la squadra deve fare in quel momento.

**Divisione di competenza degli assi:**

| Asse | Zona di campo | Slot che governa |
|---|---|---|
| **Costruzione** | Primo terzo, con palla (uscita) | Portiere, difensori, mediano |
| **Impostazione** | Ultimo terzo, con palla (rifinitura e finalizzazione) — e la transizione immediata alla perdita | Esterni, centrocampisti offensivi, punta (in entrambe le fasi) |
| **Linea** | Fase di non possesso | Tutti: riscrive il ruolo di ogni slot via Matrice C (§3-bis), non solo un warning |
| **Modulo** | Struttura | Determina *quali* ruoli sono disponibili — e quali impostazioni sono eseguibili, in entrambe le fasi |

**Zona critica: il centrocampo centrale**, dove i due assi si sovrappongono. È lì che nascono le incoerenze: un mediano non può essere contemporaneamente *regista arretrato* (costruzione corta) e *schermo di filtro* (impostazione di contropiede). Se i due assi chiedono cose opposte allo stesso slot, la catena è rotta. La stessa regola di precedenza vale identica in fase di non possesso (§3-bis).

**Controllo trasversale: modulo × impostazione.** Il modulo non riscrive mai un ruolo — resta la struttura, determina quali slot esistono — ma vincola quali impostazioni possono scrivere qualcosa su quella struttura. Se il modulo non ha gli slot di zona che l'impostazione userebbe nell'ultimo terzo (esterni offensivi per il gioco sulle ali, un reparto arretrato numeroso per la difesa a oltranza), l'impostazione gira a vuoto: è un'incoerenza dello stesso tipo di quelle su costruzione e linea, verificata allo stesso modo — un avviso, mai un blocco (vedi §5 e §6). Lo stesso principio vale per **modulo × linea** (§6): un reparto arretrato troppo corto con la linea alta, o troppe punte con la linea bassa, sono avvisi dello stesso tipo.

---

## 1. VOCABOLARIO RUOLI (set chiuso — 27 ruoli)

Da usare come enum. Ogni ruolo = un compito comunicabile a voce a un giocatore.

### Portiere
| Codice | Ruolo | Compito |
|---|---|---|
| `POR-C` | Portiere costruttore | Gioca coi piedi, si alza a bordo area, prima linea di passaggio |
| `POR-E` | Portiere di reparto | Sceglie: corto se libero, lungo se pressato |
| `POR-L` | Portiere di rilancio | Rinvio diretto, zero rischio |

### Difensori centrali
| Codice | Ruolo | Compito |
|---|---|---|
| `DC-C` | Difensore costruttore | Esce palla al piede, rompe la prima linea |
| `DC-A` | Braccetto in ampiezza | Si allarga in costruzione per creare superiorità |
| `DC-P` | Centrale di posizione | Tiene la linea, gioca semplice |
| `DC-M` | Marcatore / d'anticipo | Aggressivo sul diretto, non costruisce |
| `DC-B` | Centrale bloccato | Non supera mai la linea della palla |

### Terzini / esterni bassi
| Codice | Ruolo | Compito |
|---|---|---|
| `T-S` | Terzino di spinta | Sale sempre, dà ampiezza alta |
| `T-E` | Terzino equilibrato | Sale a turno, mai insieme al gemello |
| `T-B` | Terzino bloccato | Resta, difesa a tre permanente |

### Mediani
| Codice | Ruolo | Compito |
|---|---|---|
| `M-R` | Regista arretrato | Si abbassa tra i centrali, sempre linea di passaggio |
| `M-F` | Mediano di filtro | Schermo davanti alla difesa, prima verticalizzazione |
| `M-E` | Mediano equilibratore | Resta quando salgono gli esterni, scala quando la difesa cala |

### Centrocampisti centrali
| Codice | Ruolo | Compito |
|---|---|---|
| `CC-C` | Interno di collegamento | Riceve tra le linee, gira il gioco |
| `CC-M` | Mezzala d'inserimento | Attacca lo spazio in avanti |
| `CC-I` | Incursore in area | Entra in area sul cross / seconda palla |

### Esterni offensivi
| Codice | Ruolo | Compito |
|---|---|---|
| `E-A` | Esterno di ampiezza | Largo e alto, allunga la difesa avversaria |
| `E-X` | Ala di cross | Punta il fondo, mette dentro |
| `E-I` | Ala interna | Converge dentro, libera la fascia al terzino |
| `E-S` | Esterno di strappo | Riceve e va in campo aperto |
| `E-T` | Tornante | Basso in fase difensiva, alto in ripartenza |

### Punta
| Codice | Ruolo | Compito |
|---|---|---|
| `P-9` | Falso 9 | Si abbassa tra le linee, poi sprint in area |
| `P-A` | Punta d'area | Vive in area, finalizza |
| `P-T` | Punta di riferimento | Sponda sulla palla lunga, gioca di corpo |
| `P-P` | Punta di profondità | Attacca lo spazio alle spalle |
| `P-1` | Punta di prima pressione | Orienta il pressing, si sacrifica |

---

## 1-bis. VOCABOLARIO RUOLI DI NON POSSESSO (set chiuso — 21 ruoli, namespace `N-*`)

Vocabolario separato dal §1: nessun codice `N-*` compare tra i 27 di possesso, e viceversa. Non ha il campo `posizione`: la sigla mostrata sullo slot resta quella del modulo, cambia solo il compito.

### Portiere
| Codice | Ruolo | Compito |
|---|---|---|
| `N-POR-S` | Portiere libero | Esce alto fuori area, copre lo spazio dietro la linea |
| `N-POR-E` | Portiere di reparto | Legge la profondità, esce solo sulla palla che può prendere |
| `N-POR-A` | Portiere d'area | Resta in area, non esce mai in anticipo |

### Difensori centrali
| Codice | Ruolo | Compito |
|---|---|---|
| `N-DC-A` | Difensore d'anticipo | Esce sul diretto prima che riceva, difende in avanti |
| `N-DC-L` | Difensore di linea | Tiene la linea col reparto, sale e scala insieme agli altri |
| `N-DC-C` | Difensore di copertura | Ultimo uomo: non esce mai, copre chi esce |

### Terzini / esterni bassi
| Codice | Ruolo | Compito |
|---|---|---|
| `N-T-P` | Terzino in pressione | Sale sull'esterno avversario appena la palla va sul suo lato |
| `N-T-S` | Terzino che stringe | Si accorcia dentro sul lato debole, fa il terzo centrale |
| `N-T-B` | Terzino bloccato | Resta basso in linea, non segue mai fuori zona |

### Mediano
| Codice | Ruolo | Compito |
|---|---|---|
| `N-M-A` | Mediano aggressore | Esce sul portatore in mezzo, va a raddoppiare |
| `N-M-S` | Mediano schermo | Sta davanti alla difesa e chiude il centro, non insegue |
| `N-M-C` | Mediano di copertura | Scala tra i centrali quando uno esce, tappa il buco |

### Centrocampisti centrali
| Codice | Ruolo | Compito |
|---|---|---|
| `N-CC-P` | Primo pressore centrale | Aggredisce chi riceve in mezzo, non gli dà il tempo di girarsi |
| `N-CC-R` | Riferimento sul regista | Il regista avversario è suo: lo segue ovunque vada |
| `N-CC-B` | Rientro basso | Torna dentro la linea di centrocampo, fa densità |

### Esterni
| Codice | Ruolo | Compito |
|---|---|---|
| `N-E-P` | Esterno in pressione | Va sul portatore sulla sua fascia, lo indirizza verso il fondo |
| `N-E-T` | Tornante difensivo | Rientra a fare il quarto/quinto di linea, sempre |
| `N-E-I` | Esterno che stringe | Si chiude dentro sul centro, concede il cross esterno |

### Punta
| Codice | Ruolo | Compito |
|---|---|---|
| `N-P-1` | Prima pressione | Attacca il portatore e lo indirizza su un solo lato, sempre lo stesso |
| `N-P-S` | Punta schermo | Non insegue: resta sul regista avversario e chiude la linea centrale |
| `N-P-R` | Punta di riferimento | Resta alta, non rientra: è lei la palla d'uscita |

---

## 2. MATRICE A — COSTRUZIONE → primo terzo

| Costruzione | Portiere | DC centrale | DC laterali | Mediano | Principio |
|---|---|---|---|---|---|
| **Passaggi corti** | `POR-C` | `DC-C` | `DC-A` | `M-R` | Superiorità numerica dietro, attirare la pressione per saltarla |
| **Equilibrata** | `POR-E` | `DC-P` | `DC-P` / `T-E` | `M-E` | Corto se c'è, lungo se pressati — decide chi ha palla |
| **Contropiede (diretta)** | `POR-L` | `DC-M` | `DC-B` | `M-F` | Prima palla verticale o in fascia, zero rischio in uscita |

---

## 3. MATRICE B — IMPOSTAZIONE → ultimo terzo

| Impostazione | Esterni | Centrocampo off. | Punta | Ampiezza | Uomini in area |
|---|---|---|---|---|---|
| **Possesso palla** | `E-A` | `CC-C` | `P-9` | Alta | 2-3 |
| **Gioco sulle ali** | `E-X` | `CC-I` | `P-A` | Massima | 3-4 |
| **Palla lunga** | `E-T` | `CC-I` | `P-T` | Media | 2-3 sulla seconda palla |
| **Contropiede** | `E-S` | `CC-M` | `P-P` | Bassa → esplode | 2 |
| **Difesa a oltranza** | `E-T` | `CC-C` (bassi) | `P-1` | Minima | 1 |

---

## 3-bis. MATRICE C — LINEA → fase di non possesso, e TRANSIZIONE

Stessa forma delle matrici A e B: chiavi per zona. `dcCentrale`/`dcLaterale` restano distinti per coerenza architetturale con la costruzione, anche se oggi coincidono.

| Linea | Portiere | DC | Terzino | Mediano | CC | Esterno | Punta |
|---|---|---|---|---|---|---|---|
| **Alta** | `N-POR-S` | `N-DC-A` | `N-T-P` | `N-M-A` | `N-CC-P` | `N-E-P` | `N-P-1` |
| **Normale** | `N-POR-E` | `N-DC-L` | `N-T-S` | `N-M-S` | `N-CC-R` | `N-E-T` | `N-P-S` |
| **Bassa** | `N-POR-A` | `N-DC-C` | `N-T-B` | `N-M-C` | `N-CC-B` | `N-E-I` | `N-P-R` |

**TRANSIZIONE — l'impostazione (con palla) sovrascrive la Matrice C su al massimo tre zone**, perché cosa fai appena perdi palla dipende da cosa volevi fare mentre l'avevi: chi cerca il possesso riaggredisce subito, chi cerca il contropiede si ricompatta e lascia l'uomo alto. Se una zona non è nella riga, vince la linea.

| Impostazione | Punta | CC offensivo | Esterno | Principio di squadra |
|---|---|---|---|---|
| **Possesso** | `N-P-1` | `N-CC-P` | — (vince la linea) | Contropressing: riaggredisci subito dov'è persa, i primi cinque secondi sono nostri |
| **Ali** | — | — | — (vince la linea) | Riaggredisci sulla fascia dove hai perso, dentro copre chi è rientrato |
| **Palla lunga** | `N-P-R` | — | — | Non riaggredire: ricompattati e aspetta la seconda palla |
| **Contropiede** | `N-P-R` | `N-CC-B` | `N-E-T` | Ripiega subito dietro la palla: l'uomo alto resta, gli altri tornano tutti |
| **Difesa a oltranza** | `N-P-S` | `N-CC-B` | `N-E-I` | Tutti sotto la linea della palla, nessuno esce dal blocco |

La regola di precedenza sul centrocampo conteso (§0, §6) vale identica qui: se il modulo non ha un mediano dedicato, il CC che lo assorbe segue `MATRICE_LINEA`/`TRANSIZIONE` come mediano, non come centrocampista offensivo.

**Geometria compressa (derivata, non un secondo set di coordinate):** senza palla la squadra si accorcia verso la propria porta e si stringe verso il centro. Il portiere non si muove. Per ogni altro slot, con `tMin` il `t` più basso fra gli slot non portiere del modulo:

```
t' = ancora + (t - tMin) * fattoreT
u' = 0.5 + (u - 0.5) * fattoreU
```

| Linea | ancora | fattoreT | fattoreU |
|---|---|---|---|
| Alta | 0.26 | 0.78 | 0.86 |
| Normale | 0.18 | 0.64 | 0.80 |
| Bassa | 0.11 | 0.48 | 0.72 |

---

## 4. MATRICE DI COERENZA

Non tutte le combinazioni stanno in piedi. Il sistema deve **avvisare**, mai bloccare.

| Impostazione ↓ / Costruzione → | Passaggi corti | Equilibrata | Contropiede |
|---|---|---|---|
| **Possesso palla** | ✅ coerente | ⚠️ tiepido | ❌ si annulla |
| **Gioco sulle ali** | ✅ coerente | ✅ coerente | ⚠️ solo su strappo |
| **Palla lunga** | ❌ contraddittorio | ⚠️ ibrido | ✅ coerente |
| **Contropiede** | ❌ contraddittorio | ⚠️ ibrido | ✅ coerente |
| **Difesa a oltranza** | ❌ suicida | ⚠️ rischioso | ✅ coerente |

**Linea difensiva coerente per impostazione:**

| Impostazione | Linea | Perché |
|---|---|---|
| Possesso palla | Alta | Squadra corta, contropressing immediato |
| Gioco sulle ali | Normale/Alta | Serve campo per i cross, ma non scoprirsi |
| Palla lunga | Normale | Il campo lo attacchi col lancio, non col blocco |
| Contropiede | Normale/Bassa | Serve spazio davanti da attaccare |
| Difesa a oltranza | Bassa | Nessuno spazio alle spalle |

**Le tre incoerenze critiche da rilevare:**

1. **Possesso + costruzione diretta** — si chiede di far girare palla a una squadra che la butta via appena esce. Il possesso non nasce mai.
2. **Contropiede + linea alta** — non c'è spazio davanti da attaccare, perché lo si occupa già. Il contropiede diventa un passaggio all'indietro.
3. **Difesa a oltranza + passaggi corti** — costruire corto sotto pressione dentro la propria area. Il modo più veloce di regalare gol.

---

## 5. LAYER MODULO — come cambiano gli slot

### 3-3-1 (formato 8)
`POR — DC sx / DC c / DC dx — E sx / M c / E dx — PUNTA`
- Un solo centrocampista centrale → deve essere `M-R` o `M-E`, mai `CC-M`. Se si inserisce, la squadra resta senza filtro.
- Gli slot esterni sono **ibridi**: alti in possesso, tornanti in non possesso.
- Più adatto a: **gioco sulle ali**, **possesso**.

### 3-1-2-1 (formato 8)
`POR — 3 DC — 1 MEDIANO — 2 CC — PUNTA`
- Il mediano è puro `M-F` o `M-R`, i due CC possono inserirsi liberamente.
- Perde ampiezza naturale: deve venire dai DC laterali (`DC-A` → `T-S`).
- Più adatto a: **contropiede**, **possesso centrale**, **difesa a oltranza**.

### 2-4-1 (formato 8)
`POR — 2 DC — 4 CC (2 esterni + 2 centrali) — PUNTA`
- Due centrali davanti alla difesa: uno `M-E` che resta, uno `CC-M` che si inserisce. Mai entrambi in avanti.
- Difesa a 2 → richiede `DC-P` disciplinati e un `M-E` che scala sistematicamente.
- Più adatto a: **possesso**, **gioco sulle ali**. Sconsigliato con **difesa a oltranza**.
- ⚠️ Punto di rottura noto: senza automatismi consolidati, la difesa a 2 è il primo reparto a saltare.

### 3-2-1 (formato 7)
`POR — 3 DC — 2 CC — PUNTA`
- Nessun esterno puro: l'ampiezza è a carico dei DC laterali e dei CC che allargano.
- I due CC si dividono per forza: uno `M-E`, uno `CC-M`.

### Tabella modulo × impostazione

✅ coerente · ⚠️ fragile (il sistema avvisa, non impedisce) · ❌ rotto (il modulo non ha gli slot per eseguire l'impostazione).

Le ❌ sono **derivate dalla struttura** del modulo (quante zone possiede, non quale modulo è) — vivono in `REQUISITI_IMPOSTAZIONE`, e valgono automaticamente anche sui moduli aggiunti in futuro. Le ⚠️ sono **fragilità documentate**, specifiche del singolo modulo, non ricavabili dal solo conteggio degli slot — vivono in `ECCEZIONI_MODULO`.

| Modulo | Possesso | Ali | Palla lunga | Contropiede | Oltranza |
|---|---|---|---|---|---|
| 2-3-1 (c.7) | ✅ | ✅ | ✅ | ✅ | ❌ |
| 3-2-1 (c.7) | ✅ | ❌ | ✅ | ✅ | ✅ |
| 3-1-2 (c.7) | ✅ | ❌ | ✅ | ✅ | ✅ |
| 1-2-2-1 (c.7) | ✅ | ❌ | ✅ | ✅ | ✅ |
| 1-3-2 (c.7) | ✅ | ✅ | ✅ | ✅ | ❌ |
| 1-4-1 (c.7) | ✅ | ✅ | ✅ | ✅ | ❌ |
| 1-1-2-1-1 (c.7) | ✅ | ✅ | ✅ | ✅ | ❌ |
| 3-3-1 (c.8) | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| 2-3-2 (c.8) | ⚠️ | ⚠️ | ✅ | ✅ | ❌ |
| 3-2-2 (c.8) | ✅ | ❌ | ✅ | ✅ | ✅ |
| 3-1-2-1 (c.8) | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| 2-4-1 (c.8) | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| 3-2-1-1 (c.8) | ✅ | ❌ | ✅ | ✅ | ✅ |
| 3-1-3 (c.8) | ✅ | ✅ | ✅ | ✅ | ✅ |

Le ❌ su "Ali" sono tutti i moduli senza almeno 2 slot in zona esterno offensivo (nessuna sigla `ED`/`ES`/`AD`/`AS`); le ❌ su "Oltranza" sono i moduli con meno di 3 slot fra difensori centrali e terzini sommati. I moduli del calcio a 7 non compaiono in `ECCEZIONI_MODULO`: la copertura strutturale basta, nessuna fragilità documentata per ora.

---

## 6. STRUTTURA DATI

```
tattica = {
  modulo: string,                                                   // es. "3-3-1"
  formato: 7 | 8,
  impostazione: "possesso" | "ali" | "lunga" | "contropiede" | "oltranza",
  costruzione: "corti" | "equilibrata" | "diretta",
  linea: "alta" | "normale" | "bassa"
}

→ risolve in due mappe, una per fase — mai visibili insieme:

slotRuoli[i]            = f(modulo, zona(i), impostazione, costruzione)                 // con palla
slotRuoliNonPossesso[i]  = f(modulo, zona(i), linea, impostazione)                       // senza palla — zoneEffettive(modulo)

geometriaNonPossesso({ modulo, linea }) → [{ u, t }]                                     // derivata da {u,t}, non scritta a mano

verificaCoerenza({ impostazione, costruzione, linea, modulo, moduloKey })
  → { livello: "ok" | "warn" | "rotto", problemi: [{ tipo, livello, messaggio }] }
```

`verificaCoerenza` valuta quattro controlli indipendenti, ciascuno con `tipo` proprio (`costruzione`, `linea`, `modulo`, `modulo-linea`), e riporta come `livello` complessivo il peggiore fra tutti i problemi trovati:

1. **impostazione × costruzione** — `MATRICE_COERENZA`.
2. **impostazione × linea** — `LINEA_COERENTE`.
3. **modulo × impostazione** — `REQUISITI_IMPOSTAZIONE` (derivato dalla struttura: se manca la zona, sempre `rotto`) + `ECCEZIONI_MODULO` (fragilità documentate, `warn`). Se entrambi riguardano la stessa coppia, vince il livello peggiore. `modulo`/`moduloKey` sono opzionali: senza, questo terzo controllo viene saltato.
4. **modulo × linea** — derivato dalle zone effettive, non hardcodato per modulo: meno di 3 slot di reparto arretrato (DC + terzini) con linea alta → `warn`; due o più punte con linea bassa → `warn`. Anche questo salta senza `modulo`.

**Regola di precedenza sugli slot contesi (centrocampo):**
> Il **mediano** segue sempre la `costruzione` (con palla) o la `linea`/`impostazione` (senza palla). I **centrocampisti avanzati** seguono sempre l'`impostazione`, in entrambe le fasi.

Questa singola regola, applicata da `zoneEffettive(modulo)`, risolve la quasi totalità dei conflitti di assegnazione — identica per le due mappe.

**Override manuale, per fase:** ogni slot deve poter essere sbloccato a mano, indipendentemente in possesso e in non possesso — un override di possesso non esiste nel vocabolario di non possesso, e viceversa.

```
slotRuoliOverride = {
  possesso:     { [slotIndex]: codice },      // dal vocabolario dei 27 ruoli (§1)
  nonPossesso:  { [slotIndex]: codiceNp },    // dal vocabolario dei 21 ruoli N-* (§1-bis)
}
```

Un codice del vocabolario sbagliato per la fase (o inesistente) viene scartato in silenzio, mai un crash. Se l'override rompe la coerenza, il sistema lo segnala senza impedirlo.

**Separazione dei concetti — vincolo architetturale:**

| Concetto | Natura | Chi lo scrive |
|---|---|---|
| Ruoli tattici del **giocatore** | Attributo osservato, persistente | Solo l'utente |
| Ruolo assegnato allo **slot** | Calcolato, volatile | Il motore tattico |

Il motore tattico non deve **mai** scrivere sugli attributi del giocatore. Il confronto tra i due produce la compatibilità.

---

## 7. ESTENSIONI FUTURE

- **Compatibilità giocatore/ruolo**: livelli naturale / adattabile / forzato, calcolati confrontando i ruoli tattici del giocatore con il ruolo dello slot. Vale solo in possesso: i ruoli tattici osservati sono nel vocabolario di possesso, non in quello di non possesso.
- **Profilo avversario e contro-tattiche**: adattare modulo/impostazione/linea al piano partita dell'avversario, non solo alla propria identità.
- **Piani per situazione di partita**: varianti in vantaggio / in svantaggio / in parità numerica, con vincolo di modificare un solo anello della catena per volta.
