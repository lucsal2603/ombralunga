# Ombralunga

Demo di sito per un agriturismo inventato sui Colli Euganei. Il tema è l'ombra: in Veneto "un'ombra" è anche un bicchiere di vino. Ogni ombra del sito è calcolata da una luce: le lettere del nome stanno in piedi sul campo e proiettano ombre lunghe in prospettiva, il casale sul colle ha la sua, le camere hanno macchie di sole che si spostano, i piatti sulla tavola hanno ombre che si stringono quando si posano.

Tutti i dati sono inventati: vedi [DA-VERIFICARE.md](DA-VERIFICARE.md). Il sistema di design è in [MASTER.md](MASTER.md).

## Sezioni

1. **La meridiana (apertura):** l'abbaglio si ritira, i colli salgono, le lettere di OMBRALUNGA si alzano dal campo con le loro ombre. Il sole scende da mezzogiorno al pomeriggio e le ombre girano. Col mouse il sole si sposta un poco. Scorrendo il sole va verso sera, le lettere si allungano (asse di larghezza del carattere) e il quadro si stacca e si aggancia a destra.
2. **All'ombra (manifesto):** il testo è abbagliato e trema nella calura; un'ombra passa e le parole diventano nitide.
3. **Le camere:** la sezione sale con il bordo a festoni di una tenda a righe. Portico orizzontale: gli archi si svelano dal basso, dentro c'è una stanza illustrata con la macchia di sole che si sposta. Cliccando un arco, l'arco vola in una scheda (Flip) e torna al suo posto alla chiusura.
4. **A tavola:** la tovaglia si srotola e i piatti cadono dall'alto; l'ombra si stringe quando si posano. Sopra, le ombre a macchie del pergolato in WebGL. Il menù si segna mentre arrivano i piatti; col mouse un piatto si solleva e mostra il nome.
5. **La controra:** il titolo trema nella calura e si allarga pigro; l'amaca sotto il noce è una catena di punti con la gravità, dondola al vento e si spinge col mouse o col dito.
6. **La tenuta:** numeri che contano e si allungano.
7. **Mentre state all'ombra:** scena fissata in cui le parole si sciolgono una nell'altra (uva, vino; olive, olio; grano, pane; latte, formaggio) con un filtro SVG.
8. **Da un'ombra all'altra:** panorama orizzontale dei Colli con parallasse, ombre di nuvole e cartelli che si alzano dal prato.
9. **Un'ombra:** le terrazze si ritirano all'ingresso; l'ombra del campanile di San Marco gira e il banco del vino la segue; il calice si riempie scorrendo e cambia colore col vino scelto.
10. **Nastro, Prenota, Piede:** nastro che pende con la velocità di scorrimento; modulo dimostrativo; il nome sotto la luna, con l'ombra verso chi guarda.

## Struttura

- `index.html`: la pagina con tutti i testi e le illustrazioni SVG.
- `css/style.css`: stile; le variabili in cima corrispondono a MASTER.md.
- `js/main.js`: la regia (GSAP 3.15 con ScrollTrigger, SplitText, Flip, CustomEase, più Lenis). Le funzioni sono nell'ordine delle sezioni. `inPiedi()` è il componente delle lettere in piedi con l'ombra sul piano 3D, usato nell'apertura e nel piede.
- `js/pergolato.js`: lo shader delle ombre del pergolato (gira solo quando la tavola è sullo schermo).
- `js/amaca.js`: l'amaca con l'integrazione di Verlet.

## Modalità

- `?qa`: salta l'apertura e lo scorrimento morbido, per le prove.
- `?statico`: movimento ridotto (vale anche con `prefers-reduced-motion`): niente scene fissate, contenuti completi e fermi.

## In locale

```bash
python3 -m http.server 8096 --directory /Users/lucas/ombralunga
```

Poi `http://localhost:8096`. Nel `launch.json` la voce si chiama `ombralunga`.

## Pubblicazione

GitHub Pages dal ramo `main`. Prima di pubblicare si aggiorna il `?v=` di CSS e JS in `index.html` e negli `import` di `js/main.js` (Safari e GitHub Pages tengono i file in cache).
