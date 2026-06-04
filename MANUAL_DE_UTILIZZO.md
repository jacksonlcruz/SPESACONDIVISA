# 📖 Manuale di Utilizzo — Spesa Condivisa

> Guida completa per l'utente finale. Lingua: Italiano.

---

## Indice

1. [Introduzione](#-introduzione)
2. [Creare un Account](#-creare-un-account)
3. [Creare la Prima Lista](#-creare-la-prima-lista)
4. [Aggiungere Articoli alla Lista](#-aggiungere-articoli-alla-lista)
5. [Condividere la Lista in Tempo Reale](#-condividere-la-lista-in-tempo-reale)
6. [Mettere Articoli nel Carrello (Modalità Manuale)](#-mettere-articoli-nel-carrello--modalità-manuale)
7. [Usare la Fotocamera con l'Intelligenza Artificiale](#-usare-la-fotocamera-con-lintelligenza-artificiale)
8. [Capire il Totale e il Progresso](#-capire-il-totale-e-il-progresso)
9. [Gestire Più Liste](#-gestire-più-liste)
10. [Installare l'App sul Cellulare (PWA)](#-installare-lapp-sul-cellulare-pwa)
11. [Domande Frequenti](#-domande-frequenti)

---

## 🛒 Introduzione

**Spesa Condivisa** è un'app per liste della spesa collaborativa che funziona in tempo reale. Puoi:

- Creare liste della spesa e condividerle con familiari o amici
- Vedere le modifiche degli altri **istantaneamente**, senza ricaricare la pagina
- Fotografare le **etichette dei prezzi** al supermercato e lasciare che l'**IA legga il prezzo** automaticamente
- Tenere traccia del **totale speso** mentre fai la spesa

> **Nota:** L'app è ottimizzata per smartphone. Usala direttamente dal browser del cellulare — non è necessario scaricarla da nessun app store.

---

## 👤 Creare un Account

### Registrazione con email

```
1. Apri l'app nel browser del tuo smartphone
2. Nella schermata iniziale, tocca "Registrati"
3. Inserisci il tuo indirizzo email
4. Scegli una password sicura (minimo 6 caratteri)
5. Tocca il pulsante "Registrati"
6. Controlla la tua email e clicca sul link di conferma
7. Torna all'app: ora sei connesso!
```

### Accesso con Google

```
1. Nella schermata di login, tocca il pulsante "Continua con Google"
2. Scegli il tuo account Google
3. Autorizza l'app
4. Vieni reindirizzato automaticamente alla tua dashboard
```

### Accesso successivo

```
1. Apri l'app
2. Inserisci email e password
3. Tocca "Accedi"
```

> **Hai dimenticato la password?** Tocca il link "Password dimenticata?" nella schermata di login e riceverai un'email con le istruzioni.

---

## ➕ Creare la Prima Lista

Dopo aver effettuato l'accesso, ti trovi nella **Dashboard** — la schermata che mostra tutte le tue liste.

```
Schermata Dashboard
┌─────────────────────────────┐
│  Le mie liste 🛒            │
│                             │
│  (nessuna lista ancora)     │
│  Creane una!                │
│                             │
│                    [ + ]    │ ← Tocca qui
└─────────────────────────────┘
```

**Passi:**

```
1. Tocca il pulsante arancione [ + ] nell'angolo in basso a destra
2. Una nuova lista "Lista della spesa 🛒" viene creata automaticamente
3. Vieni portato direttamente alla schermata della lista
4. Per rinominarla: tocca il titolo in cima e modifica il nome
```

> Puoi avere quante liste vuoi: una per il supermercato, una per la farmacia, una per il mercato, ecc.

---

## ✏️ Aggiungere Articoli alla Lista

Una volta dentro una lista, usa la **barra in fondo allo schermo** per aggiungere articoli.

```
Schermata Lista
┌─────────────────────────────┐
│ 🛒 Lista della spesa        │
│ ─────────────────────────── │
│ Totale: €0,00               │
│ ▓░░░░░░░░░░░░░░ 0%          │
│ ─────────────────────────── │
│                             │
│  Da comprare (0)            │
│                             │
│  (lista vuota)              │
│  Aggiungi il primo          │
│  articolo!                  │
│                             │
│ ─────────────────────────── │
│ [ Aggiungi articolo…  ] [+] │ ← Barra di inserimento
└─────────────────────────────┘
```

**Come aggiungere un articolo:**

```
1. Tocca il campo di testo "Aggiungi articolo…"
2. Digita il nome dell'articolo (es. "Latte", "Pane", "Tomate")
3. Tocca il pulsante arancione [ + ] oppure premi "Invio" sulla tastiera
4. L'articolo appare immediatamente nella lista
5. Ripeti per tutti gli articoli necessari
```

**Suggerimento:** Aggiungi tutti gli articoli prima di andare al supermercato. Non è necessario inserire i prezzi in anticipo — li aggiungerai durante la spesa.

---

## 👥 Condividere la Lista in Tempo Reale

Puoi condividere una lista con chiunque tramite un **link speciale**. Tutte le modifiche fatte da qualsiasi collaboratore appaiono **istantaneamente** su tutti i dispositivi.

### Come condividere

```
1. Apri la lista che vuoi condividere
2. Tocca l'icona 🔗 (link) in alto a destra
3. Il link viene copiato automaticamente negli appunti
4. Incollalo in WhatsApp, SMS, email o qualsiasi altro sistema

   Esempio di link:
   https://spesacondivisa.app/join/a1b2c3d4-...
```

### Come funziona per chi riceve il link

```
1. Il destinatario tocca il link ricevuto
2. Se non ha un account, viene chiesto di registrarsi/accedere
3. Dopo l'accesso, viene aggiunto automaticamente come collaboratore
4. La lista appare subito nella sua dashboard
```

### Sincronizzazione in tempo reale

Quando sei nella stessa lista con un'altra persona:

```
┌──────────────────┐         ┌──────────────────┐
│   TUO TELEFONO   │         │  TELEFONO AMICO  │
│                  │         │                  │
│  📝 Aggiungo     │──────►  │  ✨ "Pasta"      │
│  "Pasta"         │         │  appare subito!  │
│                  │◄──────  │                  │
│  ✨ "Salsa"      │         │  📝 Aggiunge     │
│  appare subito!  │         │  "Salsa"         │
└──────────────────┘         └──────────────────┘
         Aggiornamenti istantanei via WebSocket
```

Non è necessario ricaricare la pagina. Le modifiche arrivano **automaticamente** non appena l'altra persona salva.

---

## ✅ Mettere Articoli nel Carrello — Modalità Manuale

Quando sei al supermercato e metti un articolo nel carrello fisico, segnalalo nell'app toccando il **cerchio** accanto all'articolo.

### Schermata di inserimento prezzo

```
┌──────────────────────────────┐
│ Aggiunta al carrello         │  ← Nome dell'articolo
│ Latte                        │
│ ──────────────────────────── │
│ [ Manuale ]  [ Fotocamera ]  │  ← Scegli modalità
│ ──────────────────────────── │
│ Quantità (pz)                │
│ [ 1                        ] │
│                              │
│ Prezzo unitario (€)          │
│ [ € 1,45                   ] │
│                              │
│ Subtotale: €1,45             │
│                              │
│      [ ✓ Conferma ]          │
└──────────────────────────────┘
```

**Passi:**

```
1. Tocca il cerchio ○ accanto a un articolo
2. Si apre un pannello dal basso (bottom sheet)
3. Assicurati che sia selezionata la scheda "Manuale"
4. Inserisci la QUANTITÀ (es. 2 per due confezioni)
5. Inserisci il PREZZO UNITARIO che vedi sull'etichetta (es. 1,45)
6. Vedi il subtotale calcolato automaticamente (Qtd × Prezzo)
7. Tocca "✓ Conferma"
8. L'articolo viene spostato nella sezione "Nel carrello"
   e il totale in cima si aggiorna
```

**Hai sbagliato?** Tocca di nuovo l'articolo già marcato per toglierlo dal carrello e reinserire i dati.

---

## 📷 Usare la Fotocamera con l'Intelligenza Artificiale

Questa è la funzionalità più potente dell'app. Invece di digitare il prezzo manualmente, **fotografi l'etichetta** e l'IA:

1. **Legge il prezzo** automaticamente (OCR)
2. **Riconosce il prodotto** nella foto
3. **Associa** il prodotto fotografato all'articolo corrispondente nella tua lista — anche se i nomi sono diversi

### Come usare la fotocamera

```
1. Tocca il cerchio ○ accanto a un articolo (es. "Tomate")
2. Nel pannello, tocca la scheda "Fotocamera"
3. Tocca il pulsante arancione "📷 Scatta foto"
4. Il cellulare apre la fotocamera posteriore
5. Inquadra l'etichetta del prezzo o il cartellino del prodotto
6. Scatta la foto
7. Attendi qualche secondo (appare "Analisi in corso…")
8. L'IA mostra il risultato
```

### Esempio di corrispondenza semantica

Supponiamo che nella tua lista ci sia l'articolo **"Tomate"** e al supermercato trovi i **"Pomodorini Pachino"**.

```
LISTA                    ETICHETTA FOTOGRAFATA
─────────────────        ──────────────────────────────
○ Tomate          ◄───   Pomodorini Pachino
                         € 2,49 / kg
                         Prodotto d'Italia
```

**Cosa fa l'IA:**

```
Analisi immagine:
  ✓ OCR rileva: "€ 2,49"
  ✓ Prodotto identificato: "Pomodorini Pachino"
  ✓ Corrispondenza semantica trovata:
    "Pomodorini Pachino" ≈ "Tomate" nella lista
    Confidenza: 94%

Risultato mostrato nell'app:
┌──────────────────────────────────────┐
│ 🤖 IA: Pomodorini Pachino            │
│ Corrisponde semanticamente a         │
│ "Tomate" nella tua lista.            │
│ Prezzo rilevato: €2,49/kg            │
│ ─────────────────────────────────── │
│ Quantità (kg):                       │
│ [ 0,5                              ] │
│ Prezzo: €2,49 (compilato dall'IA)    │
│                                      │
│         [ ✓ Conferma ]               │
└──────────────────────────────────────┘
```

**L'unica cosa che devi fare è confermare la quantità** — il prezzo è già stato inserito dall'IA!

### Altri esempi di associazioni riconosciute dall'IA

| Foto scattata | Articolo nella lista | Associazione |
|---|---|---|
| "Mele Golden Delicious" | "Mele" | ✅ Riconosciuto |
| "Latte intero Parmalat 1L" | "Latte" | ✅ Riconosciuto |
| "Pane integrale Mulino Bianco" | "Pane" | ✅ Riconosciuto |
| "Pasta Barilla Spaghetti n.5" | "Pasta" | ✅ Riconosciuto |
| "Olio EVO Monini 750ml" | "Olio" | ✅ Riconosciuto |
| "Acqua minerale San Pellegrino" | "Acqua" | ✅ Riconosciuto |

### Cosa fare se l'IA sbaglia o non riconosce il prodotto

```
Caso 1 — IA non riesce a leggere l'etichetta:
  • Assicurati che la foto sia a fuoco e ben illuminata
  • Avvicina il telefono all'etichetta
  • Tocca "Riprova" per scattare una nuova foto
  • Se il problema persiste, usa la modalità Manuale

Caso 2 — IA non trova una corrispondenza nella lista:
  • L'app lo segnala con confidenza bassa
  • Puoi comunque usare il prezzo rilevato e inserirlo manualmente
  • Considera di aggiungere il nome specifico del prodotto alla lista

Caso 3 — Prezzo rilevato è errato:
  • Il campo prezzo è modificabile — correggilo prima di confermare
```

### Requisiti per la foto

- Usa la **fotocamera posteriore** (non il selfie)
- Cerca di inquadrare **solo l'etichetta**, riducendo il rumore di sfondo
- **Buona illuminazione**: evita riflessi diretti sulla plastica del cartellino
- Dimensione massima della foto: **5 MB**

---

## 💰 Capire il Totale e il Progresso

In cima alla lista c'è sempre il **pannello dei totali**, che si aggiorna in tempo reale mentre fai la spesa.

```
┌──────────────────────────────────────┐
│ 🛒 Nel carrello    Totale speso      │
│    3/8 articoli        €7,43         │
│                                      │
│  ▓▓▓▓▓▓░░░░░░░░░░░░░░  37%           │
│                                      │
│  Stima totale: €18,20                │
│                          ⚠️ 2 senza  │
│                             prezzo   │
└──────────────────────────────────────┘
```

| Campo | Significato |
|---|---|
| **Nel carrello** | Quanti articoli hai già preso (es. 3 su 8 totali) |
| **Totale speso** | Somma reale: solo gli articoli marcati CON prezzo inserito |
| **Barra di progresso** | Percentuale di completamento della spesa |
| **Stima totale** | Totale speso + stima degli articoli ancora da prendere (con prezzo pre-impostato) |
| **⚠️ N senza prezzo** | Articoli marcati ma senza prezzo — il totale reale potrebbe essere più alto |

> **Suggerimento:** Il "Totale speso" è affidabile solo quando tutti gli articoli nel carrello hanno un prezzo. Gli articoli marcati senza prezzo vengono evidenziati con un avviso arancione.

---

## 📋 Gestire Più Liste

### Archiviare una lista

Quando hai finito la spesa, puoi tenere la lista o archiviarla per non ingombrare la dashboard. (Funzione disponibile nelle impostazioni della lista.)

### Riutilizzare una lista

Le liste rimangono salvate. La settimana successiva puoi:

```
1. Aprire la lista precedente
2. Togliere il segno di spunta da tutti gli articoli
   (tocca ogni articolo marcato per "desmarcarlo")
3. La lista è pronta per una nuova spesa
```

### Visualizzatori vs. Editori

Quando condividi una lista, puoi assegnare ruoli diversi:

| Ruolo | Può vedere | Può aggiungere/modificare | Può eliminare |
|---|---|---|---|
| **Editor** (default) | ✅ | ✅ | ✅ |
| **Visualizzatore** | ✅ | ❌ | ❌ |

---

## 📲 Installare l'App sul Cellulare (PWA)

L'app funziona direttamente dal browser, ma puoi installarla come un'app nativa sul tuo schermo home per accedervi più facilmente.

### Su iPhone (Safari)

```
1. Apri l'app in Safari
2. Tocca il pulsante di condivisione [ ⬆ ] nella barra in basso
3. Scorri verso il basso e tocca "Aggiungi a schermata Home"
4. Scegli un nome (es. "Spesa") e tocca "Aggiungi"
5. L'icona dell'app appare nella schermata home
```

### Su Android (Chrome)

```
1. Apri l'app in Chrome
2. Tocca il menu [ ⋮ ] in alto a destra
3. Tocca "Aggiungi a schermata Home" o "Installa app"
4. Conferma toccando "Aggiungi"
5. L'icona appare nella schermata home o nel cassetto app
```

> **Vantaggio dell'installazione:** L'app si apre a schermo intero, senza la barra del browser, esattamente come un'app nativa.

---

## ❓ Domande Frequenti

**D: Devo installare l'app da un App Store?**
R: No. Funziona direttamente nel browser. Puoi però aggiungerla alla schermata home come descritto sopra.

**D: Le mie liste sono private?**
R: Sì. Solo tu e le persone a cui hai inviato il link di condivisione possono vedere le tue liste. Il sistema usa la sicurezza Row Level Security del database.

**D: Cosa succede se perdo la connessione internet?**
R: Puoi continuare a vedere la lista, ma le modifiche non verranno sincronizzate finché non torni online. Ricarica la pagina dopo aver recuperato la connessione.

**D: La fotocamera funziona sempre?**
R: La funzione fotocamera richiede una connessione internet (per inviare l'immagine all'IA) e che il sito sia aperto in HTTPS. Se usi l'app dall'URL ufficiale, funziona sempre.

**D: Quanto costa usare la funzione IA/fotocamera?**
R: Il costo dipende dalla configurazione del servizio. Il riconoscimento immagine usa l'API OpenAI (GPT-4o Vision), che ha un costo per utilizzo molto basso — generalmente meno di €0,01 per scansione.

**D: Posso usare l'app senza usare la fotocamera?**
R: Assolutamente sì. La modalità manuale funziona perfettamente: inserisci la quantità e il prezzo a mano. La fotocamera è un'opzione, non un requisito.

**D: Quante persone possono usare la stessa lista contemporaneamente?**
R: Non c'è un limite tecnico fisso. La sincronizzazione in tempo reale funziona con qualsiasi numero di collaboratori connessi.

**D: Posso eliminare un articolo?**
R: Sì. Tieni premuto sull'articolo oppure scorri verso sinistra per visualizzare il pulsante di eliminazione. Verrà chiesta una breve conferma.

**D: Come esco dall'account?**
R: Nella dashboard, tocca l'icona di uscita (→) in alto a destra.

---

*Per problemi tecnici, consultare il [README.md](./README.md) o contattare il supporto.*
