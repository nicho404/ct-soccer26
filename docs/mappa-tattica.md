# MAPPA TATTICA
### Sistema: impostazione × costruzione × linea × modulo → ruoli tattici

Documento di dominio per il motore tattico. Formati supportati: calcio a 7 e calcio a 8.

---

## 0. IL PRINCIPIO: LA CATENA A QUATTRO ANELLI

```
MODULO          →  dove stanno (slot disponibili per zona)
COSTRUZIONE     →  come esci (primo terzo)
IMPOSTAZIONE    →  come attacchi (ultimo terzo)
LINEA           →  dove aspetti (fase di non possesso)
```

**Requisito centrale:** ogni anello deve **riscrivere il ruolo tattico** degli slot che governa. Se cambiando `costruzione` i ruoli restano identici, l'anello è scollegato e la scelta è cosmetica.

**Divisione di competenza degli assi:**

| Asse | Zona di campo | Slot che governa |
|---|---|---|
| **Costruzione** | Primo terzo (uscita palla) | Portiere, difensori, mediano |
| **Impostazione** | Ultimo terzo (rifinitura e finalizzazione) | Esterni, centrocampisti offensivi, punta |
| **Linea** | Fase di non possesso | Tutti (altezza del blocco) |
| **Modulo** | Struttura | Determina *quali* ruoli sono disponibili |

**Zona critica: il centrocampo centrale**, dove i due assi si sovrappongono. È lì che nascono le incoerenze: un mediano non può essere contemporaneamente *regista arretrato* (costruzione corta) e *schermo di filtro* (impostazione di contropiede). Se i due assi chiedono cose opposte allo stesso slot, la catena è rotta.

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

→ risolve in:

slotRuoli[i] = f(modulo, zona(i), impostazione, costruzione)
coerenza     = matriceCoerenza[impostazione][costruzione]   // ok | warn | rotto
warning      = incoerenzeLinea(impostazione, linea)
```

**Regola di precedenza sugli slot contesi (centrocampo):**
> Il **mediano** segue sempre la `costruzione`. I **centrocampisti avanzati** seguono sempre l'`impostazione`.

Questa singola regola risolve la quasi totalità dei conflitti di assegnazione.

**Override manuale:** ogni slot deve poter essere sbloccato a mano. Il ruolo calcolato è un default, non una gabbia. Se l'override rompe la coerenza, il sistema lo segnala senza impedirlo.

**Separazione dei concetti — vincolo architetturale:**

| Concetto | Natura | Chi lo scrive |
|---|---|---|
| Ruoli tattici del **giocatore** | Attributo osservato, persistente | Solo l'utente |
| Ruolo assegnato allo **slot** | Calcolato, volatile | Il motore tattico |

Il motore tattico non deve **mai** scrivere sugli attributi del giocatore. Il confronto tra i due produce la compatibilità.

---

## 7. ESTENSIONI FUTURE

- **Compatibilità giocatore/ruolo**: livelli naturale / adattabile / forzato, calcolati confrontando i ruoli tattici del giocatore con il ruolo dello slot.
- **Ruoli di transizione**: cosa fa ogni slot nei secondi immediatamente successivi alla perdita del possesso.
- **Piani per situazione di partita**: varianti in vantaggio / in svantaggio / in parità numerica, con vincolo di modificare un solo anello della catena per volta.
