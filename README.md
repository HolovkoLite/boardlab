# BoardLab

Lavagna digitale per tablet Android con penna attiva. Funziona anche senza rete.

Le lavagne restano solo sul tablet: questo repository contiene unicamente il codice dell'app.

## Contenuto

| File | A cosa serve |
|---|---|
| `index.html` | l'app |
| `manifest.webmanifest` | nome, icona e apertura a schermo intero |
| `sw.js` | salva l'app sul tablet per l'uso offline e propone gli aggiornamenti |
| `lib/` | librerie per creare e aprire i PDF (jsPDF 2.5.1, pdf.js 3.11.174) |
| `icons/` | icone dell'app |

## Aggiornare

Sostituire tutti i file con quelli della nuova versione (Add file → Upload files → Commit changes).
Alla successiva apertura con la rete, BoardLab mostra "È disponibile una nuova versione · AGGIORNA".
