# Kartfunktion för fastigheter

## Befintlig implementation och identifierade luckor

Undersökningen följde Create/Edit/Show/Index, deras komponenter och mutations, API-klienterna, routes, controllers, Form Requests, tjänster, presenters, modeller och migrations.

- `Property` har en `Location`, flera `Area` via Location och angiven `size_hectares`.
- `locations` innehåller huvudposition, adressfält och Google place ID. `location_pois` innehåller flera namngivna punkter. `location_areas` och ordnade `area_points` innehåller polygonerna. Dessa tabeller behövde inte ändras.
- Area-controller och AreaService har motsvarande CRUD-metoder. Kontrollen av områdestillhörighet kastade däremot ett allmänt undantag, som nu ersatts med HTTP 404.
- `Area.marker` i svar är ett beräknat polygoncentrum. Det är inte en sparad POI eller en separat huvudposition. Äldre create-anrop kunde initialisera Location med `Area.marker`; den kompatibiliteten finns kvar, men nya klienten skriver huvudpositionen via Location.
- Backend kunde skapa Areas i property-create-transaktionen. Frontend skickade ändå separata create-anrop. Location/POI saknades i samma create-kontrakt.
- Frontend hade Maps-loader, Google-typer, Terra Draw och en äldre Places Autocomplete. Kartor för plats respektive områden var separata implementationer. Show visade inte POI och prioriterade polygoncentrum framför huvudposition.
- `details.size` är angiven hektar: presentern hämtar `size_hectares`, med befintlig bakåtkompatibilitet för `size`. Migrationsfilen för listingfält kopierade äldre `size` till `size_hectares`.
- Skrivroutes skyddades redan av `auth:web` och `admin`. Publika detalj- och Area-läsningar saknade kontroll av `is_visible`.

## Datakontrakt och ansvar

| Data | API och källa |
| --- | --- |
| Huvudposition | `location.latitude`, `location.longitude`, båda tal eller båda null. Lagras i `locations`. Vid Maps-gränsen konverteras de till `{lat, lng}`. |
| Polygon | Area `{name, polygon: [{lat, lng}, ...]}`. Minst tre olika giltiga punkter. Lagras som ordnade `area_points.latitude/longitude`. En upprepad slutpunkt accepteras av backend och tas bort före lagring. |
| POI | `location.pois: [{id?, name, description, latitude, longitude}]`. Lagras i `location_pois`. `uiId` finns bara i frontendutkastet. |
| Hektar | `details.size` från fastighetens angivna `size_hectares`. Ingen automatisk överskrivning från polygonerna. |
| Kartarea | Befintlig ungefärlig beräkning från polygonen. AreaService äger backendberäkning och serialisering; PropertyPresenter återanvänder den. Frontendens rena `areaMath` ger förhandsvisning. |

Flera områden visas samtidigt i Show. Area-collection summerar områdenas kartarea; överlapp räknas i varje område, alltså ingen geometrisk union. Summan används inte som fastighetens angivna hektar.

`AreaData` och `LocationData` ger typade kontrakt mellan validerade requests och tjänster. Inga Google-objekt skickas till backend. Ingen migration eller dependency har lagts till.

## Vyer och sparning

- **Create:** adressökning, huvudposition och POI i platskartan; polygoner i områdesredigeraren. Områdeskartan visar huvudpositionen som referens. `location` och `areas` skickas i befintligt property-create-anrop och sparas i samma databastransaktion. Enbart adress/position/POI går att spara utan polygon.
- **Edit:** Location PUT ersätter huvudposition och POI. Befintliga Area POST/PUT/DELETE används för polygoner. Tomma befintliga polygoner och ofullständiga polygoner avvisas. Ett explicit borttaget område raderas. Utkastet finns kvar vid fel. Bekräftade Area-svar och nya områdes-ID:n bevaras om ett senare anrop misslyckas, så ett återförsök inte skapar samma bekräftade område igen.
- **Show:** alla polygoner, korrekt huvudposition och namngivna POI. Kartan anpassar utsnittet till sparad geometri. Ingen redigering, inga skrivcallbacks eller sökverktyg. POI finns också som textlista för överlappande flaggor. Fastigheter utan kartdata får en tomstatus.
- **Index:** svenska hektartal, exempelvis `42,6 ha`, från angiven fastighetsareal.

Ritningen använder `google.maps.Polygon`, klick för hörn och Googles redigerbara hörn/mittpunkter. Högerklick tar bort ett hörn; knapp tar bort sista hörnet. Huvudmarkör och POI använder `AdvancedMarkerElement`. POI kan även väljas i listan och flyttas genom ett kartklick, vilket fungerar vid överlapp.

Kartans komponent äger presentationen, `usePropertyMap` synkroniserar Maps-objekt och städar lyssnare/overlays, och `MapAddressSearch` hanterar Places-resultat. Domäntyper och payloadvalidering ligger utanför presentationen.

## Behörighet

Alla Property-, Area- och Location-skrivningar går fortsatt genom `auth:web` och `admin`, där adminflaggan kontrolleras på servern. Form Requests validerar koordinater, namn och övrig indata. AreaService kontrollerar att området tillhör fastigheten.

Ny `EnsurePropertyVisible` skyddar detalj- och Area-läsning: publika läsare ser endast synliga fastigheter; admin kan läsa dolda fastigheter. Property-klienten skickar sessionen även vid detaljhämtning. De äldre Location-testerna har anpassats från borttagen tokeninloggning till projektets sessionsinloggning.

## Google-konfiguration

- `VITE_GOOGLE_MAPS_API_KEY`: Maps JavaScript API samt Places API (New) måste vara aktiverade för projektet.
- `VITE_GOOGLE_MAPS_MAP_ID`: eget map ID krävs för produktion. Utvecklingsläget använder Googles `DEMO_MAP_ID` om variabeln saknas.
- Inga miljöfiler eller nycklar har ändrats. Kontrollen av den lokala miljön visade en nyckel men inget map ID.
- Sökningen använder `PlaceAutocompleteElement`, `gmp-select` och `fetchFields`. Fel och resultat utan koordinater visas för administratören.

Referenser: [Places-widget](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new), [redigerbara former](https://developers.google.com/maps/documentation/javascript/shapes), [flyttbara Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/draggable-markers).

## Verifiering

| Kommando | Resultat |
| --- | --- |
| `php artisan test tests/Feature/PropertyMapTest.php tests/Feature/LocationModuleTest.php tests/Feature/AdminAuthorizationTest.php tests/Feature/PropertyListingFieldsTest.php` i backend | 12 tester passerar, 97 assertions. SQLite i minnet. |
| `node --test tests/propertyMap.test.mjs` i frontend | 5 tester passerar: koordinater, polygoner, POI, hektar och återförsök efter delvis misslyckad sparning. |
| `npm run lint` i frontend | Passerar. |
| `npm run build` i frontend | TypeScript strict och produktionsbygge passerar. Befintlig varning om `/images/woodland-placeholder.webp`. |
| `git diff --check` | Passerar. |

PHPStan saknas både som installerat verktyg och projektkonfiguration i detta backendprojekt. Ingen godkänd PHPStan-körning kan därför redovisas. Inga nya dependencies installerades för att ändra projektets kontrollverktyg.

## Kvarvarande verifiering och begränsningar

- Livekontroll i Google Maps kunde inte genomföras: webbläsarverktyget misslyckades med att skapa en testflik. Adressförslag, dragning, rendering och mobilinteraktion behöver därför verifieras manuellt med aktuell Google-konfiguration. Typkontroll är inte en ersättning för det.
- Testerna verifierar migrationsschemat i en separat testdatabas. Ingen migration eller ändring av befintlig driftsdata kördes.
- Kartarean är approximativ, inte lantmäterimätning. Självkorsande polygoner och överlapp mellan områden har ingen topologisk kontroll. Angiven hektar är fortfarande källa för fastighetsstorlek.
- Edit består fortsatt av flera endpointanrop och är inte en transaktion för hela formuläret. Ett avbrutet nätverkssvar efter att servern redan sparat en ny post kan fortfarande kräva omladdning och kontroll innan återförsök. Bekräftade Area-svar hanteras i klienten.
- Bilder/dokument använder det tidigare separata uppladdningsflödet. Fel där kan lämna en skapad, ännu opublicerad fastighet. Det flödet har inte byggts om.

## Ändrade filer

Backend:

- `app/Http/Controllers/Api/{AreaController,LocationController,PropertyController}.php`
- `app/Http/Requests/{StoreAreaRequest,UpdateAreaRequest,StorePropertyRequest,UpdateLocationRequest}.php`
- `app/Http/Middleware/EnsurePropertyVisible.php` (ny)
- `app/Modules/Location/Data/{AreaData,LocationData}.php` (nya)
- `app/Services/{AreaService,LocationService,PropertyService}.php`
- `app/Presenters/PropertyPresenter.php`
- `routes/api.php`
- `tests/Feature/LocationModuleTest.php`, `tests/Feature/PropertyMapTest.php` (ny)

Frontend:

- `src/modules/location/LocationEditor.tsx`, `types.ts`
- `src/modules/location/map/data/{areaDraft,googleMapsLoader,types}.ts`, `usePropertyMap.ts` (ny)
- `src/modules/location/map/presentation/{EditableAreas,PropertyAreaEditor,PropertyAreaMap}.tsx`, `MapAddressSearch.tsx` (ny), `googleMap.css`
- Tidigare, nu oanvända `PropertyAreaDrawingTools.tsx`, `PropertyAreaForm.tsx` och `PropertyAreaMapModal.tsx` har tagits bort.
- `src/modules/property/data/{api,mutations,editDrafts,editMutations}.ts`
- `src/modules/property/presentation/{CreatePage,EditPage,ShowPage,PropertyCard}.tsx`, `propertyListing.ts`
- `tests/propertyMap.test.mjs` och denna rapport (nya).
