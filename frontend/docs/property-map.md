# Kartfunktion för fastigheter

## Slutstatus 2026-09-17

Google Maps används i ett gemensamt redigeringsflöde och ett separat låst visningsläge. Static Maps är inte implementerat. Inga dependencies, miljönycklar eller databasscheman ändrades i denna slutföring. Inga nya tester ingår i den senaste ändringen, enligt användarens instruktion.

## Arkitektur och gränssnitt

- PropertyForm visar PropertyMapEditor med en kompakt, låst förhandsvisning. Ett klick öppnar en stor dialog med adressökning, polygonritning, POI, huvudposition, avsluta verktyg och stäng. Adress- och POI-metadata finns i dialogen.
- CreatePage/EditPage äger location- och areas-utkasten. Dialogen äger bara valt verktyg och UI-tillstånd. Stängning bevarar utkastet; formulärets sparknapp persisterar det.
- PropertyAreaMap och usePropertyMap synkroniserar domändata till Google Map, Polygon och AdvancedMarkerElement och städar overlays/lyssnare. Kartobjekten är inte primär datakälla.
- MapAddressSearch använder riktig PlaceAutocompleteElement med Sverige som region, gmp-select och fetchFields. Inga mockade adressresultat används.
- ShowPage öppnar PropertyMapView utan redigeringsverktyg. Den rena funktionen filterMapData väljer Område, POI eller Allt före rendering. Denna separation kan återanvändas av en framtida Static Maps-renderare. POI-läget inkluderar eventuell huvudposition.
- Visningskartor anpassar utsnittet när geometri, filter eller kartans storlek ändras. Redigeringskartor behåller utsnittet medan man ritar. Mobilens dialogrubrik och stängknapp ryms efter rättningen.

## Datakontrakt och sparning

| Data | Källa och kontrakt |
| --- | --- |
| Huvudposition | location.latitude/longitude, båda tal eller båda null; sparas i locations. |
| Polygon | Area med namn och ordnad polygon av lat/lng. Minst tre olika giltiga punkter. Sparas i area_points. Backend accepterar och tar bort en upprepad slutpunkt. |
| POI | location.pois med name, description, latitude/longitude och valfritt id; sparas i location_pois. uiId skickas inte. |
| Area.marker | Beräknat polygoncentrum, inte en sparad POI. |
| Hektar | Angiven details.size är separat från beräknad kartarea. |

Create skickar location och areas som JSON i befintlig POST /property och sparar dem i samma backendtransaktion. Edit använder PUT /property/:id/location samt befintliga Area POST/PUT/DELETE. POI-listan ersätts och kan få nya databas-ID:n. Bekräftade nya Area-ID:n behålls vid delvis misslyckad sparning. Hela Edit-formuläret är fortfarande inte en gemensam transaktion.

validatePropertyMap kontrollerar hämtad geometri innan formulärhydrering eller rendering: ogiltiga koordinater, ofullständiga polygoner och felaktiga POI ger ett synligt fel i stället för tyst korrigering. Google-autentiseringsfel visas tydligt och kartytan döljs vid fel. Befintlig servervalidering och adminbehörighet gäller fortsatt.

## Genomförd kontroll i riktig lokal app

Frontend kördes på localhost:5173 och API på localhost:8020. Både Google-nyckel och map ID finns lokalt; deras värden har inte ändrats.

- Tom förhandsvisning öppnades; karta och verktyg laddades från Google. Ett initialiseringsfel med tom polygon rättades tidigare genom setPath efter konstruktion.
- En fyrhörnig polygon och två namngivna POI skapades genom kartinteraktion. En POI flyttades via listans flyttverktyg. Dialogen stängdes/öppnades utan förlorat utkast.
- Dold lokal fastighet 15, ”Kartverifiering 2026-09-17”, skapades: POST 201 och efterföljande GET 200. Polygonens ordning och POI-koordinater överlevde lagring med backendens avrundning till sju decimaler.
- Efter omladdning visades samma data. Låst visning med Område, POI och Allt visade respektive geometri/textlista utan redigeringsverktyg eller skrivningar.
- AdvancedMarker använder nu gmp-dragend. En POI flyttades med Googles tangentbordsdragning; longituden ändrades från 18.0681051 till 18.068148. Polygonens sista hörn ersattes och kartarean blev 10,0459 ha.
- PUT location och PUT area/5/update gav 200. GET 200 och full omladdning visade fyra punkter och två POI med uppdaterade värden. Polygonens sista punkt blev lat 59.3331244, lng 18.0692795.
- Mobilbredd 390 × 844 kontrollerades i redigeringsdialogen: stängknapp, verktyg, polygon och båda POI synliga.
- Riktiga svenska Places-förslag för Drottninggatan i Stockholm observerades. Användaren rapporterade att alla verktyg fungerade vid egen körning och att Drottninggatan 14 valts. Verktyget kan inte själv välja i Googles stängda shadow DOM; full adressval–koordinat-kontroll samt småortsadress är därför inte självständigt verifierade. Ingen sådan kontroll påstås vara genomförd.

Den dolda lokala fastigheten 15 finns kvar för granskning; den har inte publicerats. Tidigare befintliga fastigheter 12 och 13 saknade kartdata. Befintliga fastigheters data ändrades inte.

## Kontroller och begränsningar

- Slutlig npm run lint: passerar.
- Slutlig npm run build: TypeScript och Vite-produktionsbygge passerar.
- Tidigare i uppgiften, före instruktionen att inte skriva tester: fem befintliga frontendtester passerade och backendens fyra berörda featurefiler gav 13 passerande tester, 124 assertions. Backend har inte ändrats i denna slutföring. Inga nya testfall kvarstår i aktuell diff.
- Tillfällig MAP_HTTP/MAP_DRAFT/Google-resursdiagnostik är borttagen från källkoden.
- Polygonhörnens dragning har inte självständigt verifierats i sista webbläsarkörningen; ritning, ångra och nytt hörn har verifierats. Google-konfigurationsfel har fått felhantering men inget avsiktligt fel har injicerats i den fungerande nyckeln.
- Kartarea är approximativ. Självkorsning och överlapp har ingen topologisk kontroll. Edit kan fortfarande delvis sparas vid nätverksfel eftersom flera endpoints används.

## Filer i slutföringen

Tidigare sparad implementation: PropertyMapEditor.tsx, PropertyMapView.tsx, mapPresentation.ts, PropertyForm.tsx, LocationEditor.tsx, ShowPage.tsx, usePropertyMap.ts och googleMap.css.

Senaste ändringarna:

- src/modules/location/map/data/validatePropertyMap.ts (ny), googleMapsLoader.ts och usePropertyMap.ts
- src/modules/location/map/presentation/PropertyAreaMap.tsx, PropertyMapEditor.tsx och googleMap.css
- src/modules/location/LocationEditor.tsx
- src/modules/property/data/api.ts
- src/modules/property/presentation/EditPage.tsx, ShowPage.tsx och PropertyDetail.css
- docs/property-map.md
