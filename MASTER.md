# Ombralunga: sistema di design

Fonte unica per colori, caratteri, spazi e movimento. Le variabili in cima a `css/style.css` corrispondono a questo file.

## Idea

Ombralunga è un agriturismo inventato sui Colli Euganei. Il sito parla dell'ombra: quella lunga delle lettere del nome nell'apertura, quella del portico dove stanno le camere, quella a macchie del pergolato a pranzo, quella del noce nella controra e, alla fine, quella che si beve (in Veneto un bicchiere di vino si chiama "un'ombra").

Una sola regola visiva tiene insieme tutto: **ogni ombra viene da una luce**. Le ombre sono calcolate (direzione e lunghezza dal sole della scena), sono viola e mai nere, e gli oggetti hanno un'altezza: quando si sollevano la loro ombra si allarga e si sfoca, quando si posano si stringe.

Riferimenti di stile: i manifesti turistici italiani degli anni '30-'50 (campiture piatte, colline a strati, luce netta) e la luce di Edward Hopper (macchie di sole sui muri, ombre lunghe).

## Colori (inchiostri da manifesto)

| Nome | Hex | Ruolo |
|---|---|---|
| Inchiostro | `#2B2233` | testo sui fondi chiari (è il viola dell'ombra, scurito) |
| Ombra | `#5B5496` | ombre portate, con opacità e `multiply` |
| Sole | `#F2C14E` | luce, sole, pulsanti, evidenze |
| Coppo | `#B84A2E` | lettere del nome, tetti, accenti caldi |
| Persiana | `#2E5B47` | verde delle persiane: prenotazione, bottoni |
| Calce | `#F4ECDD` | testo sui fondi scuri, carte |
| Vino | `#5A1627` | sezione del vino |

Fondi di sezione (non c'è un fondo unico): cielo d'estate `#F3D9A1`, campo `#D9B566`, intonaco `#EFD6AE`, abbaglio `#FBF4DE`, colline `#7C8C54` / `#5E7043` / `#465A3C`, colline lontane `#98A2C2`, notte `#1F2140`.

Contrasti calcolati (WCAG): Inchiostro su Abbaglio 13,85:1; su Cielo 11,06:1; su Campo 7,79:1; su Sole 9,07:1. Calce su Persiana 6,62:1; su Vino 11,33:1; su Notte 13,25:1; su Ombra 5,67:1. Calce su Coppo 4,41:1: solo per testi grandi (sopra i 24 px), mai per il testo corrente.

## Caratteri

- **Archivo** (variabile: larghezza 62-125, peso 100-900), per il nome, i titoli e le etichette. La larghezza si anima: i titoli entrano stretti e si allungano come le ombre.
- **Newsreader** (variabile, con corsivo), per i testi lunghi e le didascalie.

Scala a 1440 px: nome 15vw (Archivo 900, largh. 72); titolo 7,5vw (Archivo 850, largh. 80); sottotitolo 3,2vw; testo 19 px / 1,55 (Newsreader 400); piccolo 14 px (Archivo 500, largh. 100). Tutto in minuscolo con la maiuscola iniziale, niente etichette tutte maiuscole: solo il nome è in maiuscolo.

## Spazi e impaginazione

- Griglia a 12 colonne; margini `clamp(16px, 4vw, 64px)`; spazi fra colonne `clamp(16px, 2.2vw, 36px)`.
- Scala di spazio: 8 · 16 · 24 · 40 · 64 · 104 · 168 px.
- Testo allineato a sinistra, righe sotto i 70 caratteri.
- Composizioni da manifesto: un'idea per schermo, forme grandi.
- Forme con un significato invece del raggio unico: archi (il portico), festoni (la tenda da sole), cerchi (piatti e sole). Gli angoli dritti sono la norma.

## Movimento

- **Carattere:** calmo e caldo, con dettagli giocosi. Niente rimbalzi sui testi; i rimbalzi solo per gli oggetti che si posano.
- **Curve:** `sole` = `0.22, 1, 0.36, 1` (entrate), `ombra` = `0.65, 0, 0.35, 1` (spostamenti in scena), `posa` = `elastic.out(1, 0.55)` (oggetti che atterrano).
- **Durate:** 0,18 s micro (hover); 0,6 s normale; 1,1 s rivelazioni; 1,8 s momenti grandi.
- **Scaglionamenti:** lettere 0,045 s; parole 0,02 s; oggetti 0,08 s.
- **Scroll:** Lenis (`lerp` 0,09); scrub 0,6-1; scene fissate solo dove raccontano qualcosa.
- **Movimento ridotto:** stati finali statici, ombre ferme a un angolo di pomeriggio, nessuno scrub.

## Regole fisse di Lucas

Niente numerazioni ordinali (si usano i nomi), niente sottolineature animate, niente pallini luminosi o decorativi, niente emoji né frecce Unicode (solo SVG), niente coordinate geografiche, niente trattini davanti alle etichette, niente cursore punto più anello, niente barra di avanzamento in alto, niente musica. Tutte le animazioni anche sul telefono.
