# Sparprogress – implementering och verifiering

## Ändring

Create och Edit använder SavePropertyProgress och den sekventiella stegkörningen i property/data/saveProgress.ts. Endast operationer som behövs ingår. Bilddelen väger 75 enheter, övriga steg 5 vardera. Inga timers flyttar procenten. Procenten är monoton och begränsad till 99 tills avslutande hämtning verifierat fastighetens ID.

Bildklienten behåller befintliga batchar med högst 6 MiB sammanlagda filbytes (en enskild större fil skickas ensam). Varje batch skickas sekventiellt. apiUpload i den befintliga HTTP-modulen använder XMLHttpRequest med samma sessionscookies, XSRF-header och ApiError-kontrakt som apiFetch. Uppladdningsevent begränsas till cirka 250 ms; slut-event levereras direkt. Multipart-byteandelen räknas om till respektive batchs filstorlek så stora och små filer viktas efter bytes. Fem procent av varje batchs vikt reserveras för serverns bekräftelse. Vid saknad totalstorlek visas skickade bytes utan uppdiktad procent.

UI visar bildserie, datamängd och bekräftat antal bilder. Efter att filerna skickats visas Bearbetar bilder tills svaret kommer. Backend skapar bildvarianter och skriver till objektlagring synkront; ingen serverprocent kan utläsas. Ingen regelbundet lång bearbetningstid har uppmätts, och ingen realtime-infrastruktur har införts.

Create sparar grunddata, plats och områden i den befintliga skapa-operationen; därefter bilder, dokument, eventuell publicering och slutlig hämtning. Edit behåller ordningen bildborttagning, bildändringar, nya bilder, plats, områden, dokument, grunduppgifter och slutlig hämtning. Bildtyper och backendkontrakt är oförändrade.

## Fel och dubbla sparningar

Fel återges med operation, eventuell bildserie, kända valideringsfält och redan bekräftade steg. Interna servermeddelanden och stack traces visas inte. Ett osäkert nätverks-/serversvar beskrivs som potentiellt sparat. Tidigare operationer och bildbatchar kan finnas kvar; hela flödet är inte transaktionellt och bilduppladdning saknar idempotensnyckel.

Ingen automatisk retry har lagts till. Vid delvis sparat eller osäkert resultat pausas nya saves i samma formulär och användaren kan öppna sparat resultat i en ny flik. Utkastet bevaras på ursprungssidan. Ett avvisat första steg utan bekräftade skrivningar kan rättas och skickas igen. Synkrona ref-lås och avaktiverade knappar skyddar mot dubbelklick. Formulärdelarna är inert under sparning. Efter lyckad Create visas 100 procent och en länk till den skapade fastigheten, så ett andra klick inte skapar en dubblett.

## Verifierat i den lokala appen

- Backendvalidering vid Create: saknad beskrivning och areal gav namngivna fält, synligt fel och möjlighet att rätta.
- Create utan bilder efter rättning: fastighet 16 skapades opublicerad; UI visade 100 procent efter slutlig hämtning. Inga bild-/dokumentsteg ingick.
- Edit av endast pris: bara grunduppgifter och slutlig hämtning ingick. Priset 110000 fanns kvar efter ny navigation/inloggning.
- Kontroller låstes medan sparningen pågick.
- Lint passerade. TypeScript passerade efter att ignoreDeprecations anpassats från 6.0 till projektets installerade TypeScript 5.9.3-kompatibla 5.0. Strict-inställningarna är oförändrade.
- git diff --check passerade.

Inga testfiler har lagts till eller ändrats. Aktuell checkout saknar frontendtester/testscript; den äldre tsconfig.tests.json pekar på filer som inte längre finns. Backend har inte ändrats, och backendtester/PHPStan kördes därför inte för denna ändring.

## Kvarvarande verifiering

Webbläsarkontrollen av filval för flera bildbatchar avbröts innan resultat kunde fastställas. Verklig långsam byteprogress, lyckad bilduppladdning, fel mitt i en senare bildbatch, nätverksavbrott, bildborttagning, dokumentändringar, rena områdesändringar och kombinerade saves är därför inte slutverifierade i UI. Dubbelklicksskyddet har dessutom verifierats genom upprepade synkrona submit-anrop i minnet, utan webbläsare.

Den nuvarande checkouten visar också ett befintligt fel vid tom Google-polygon (addListener på undefined). Kartkoden har inte ändrats inom denna uppgift. Verifieringsfastighet 16 finns kvar opublicerad.

Berörda filer: property/data/{types,editDrafts,mutations,editMutations,saveProgress}.ts; property/presentation/{CreatePage,EditPage}.tsx; property/details/Form.tsx; image/data/{api,types}.ts; shared/data/apiFetch.ts; admin/presentation/{PropertyForm.tsx,AdminLayout.css}; tsconfig.app.json.

## Slutförande utan webbläsarfönster

21 tillfälliga kontroller kördes direkt i terminalens minne mot de faktiska TypeScript-modulerna. Inga testfiler sparades och inga nätverksanrop gjordes i dessa kontroller. HTTP-transport och React-hookmiljö simulerades; detta är inte en fullständig browser-/backendintegration.

19 scenarier för sparlogiken passerade: Create utan bilder, med en bild, med tre byteviktade batchar, fel i andra batchen, nätverksavbrott, valideringsfel före skrivning, okänd bekräftelse vid skapande; Edit av endast titel/pris, endast område, en ny bild, flera bildbatchar, borttagning, borttagning plus uppladdning, dokumentborttagning/namnbyte/uppladdning, blandade ändringar, fel i senare steg och nätverksavbrott i senare batch. Dessutom kontrollerades uppladdning utan känd totalstorlek och fel fastighets-ID vid sluthämtning.

Kontrollerna verifierade monoton procent, inga 100 procent innan sluthämtningen lyckas, inga automatiska retries, bevarad information om bekräftade bildbatchar, stopp efter misslyckad batch, skydd mot visning av interna feltexter samt credentials och XSRF-header i uppladdningstransporten. Byteevent matades med flera delvärden och status växlade till serverbearbetning efter skickade bytes.

Ytterligare två kontroller av CreatePage och EditPage passerade: tre omedelbara submit-anrop gav exakt en mutation och låset frigjordes efter avslut.

Ordinarie npm run build (TypeScript och Vite) och npm run lint passerade. Bygget rapporterade projektets befintliga varning om saknad /images/woodland-placeholder.webp. Inga nya beroenden eller backendändringar infördes. Verklig långsam nätverksöverföring och fullständiga UI-scenarier för filuppladdning kvarstår som integrationsbegränsning enligt ovan.
