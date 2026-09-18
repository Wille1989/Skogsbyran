# Kontroll av skapa, redigera och radera – 2026-09-18

Produktionsbygget kompilerades separat och kördes i en dold webbläsarflik på localhost:4173 mot en separat lokal Laravel-process på port 8021. Inga nya testfiler har skrivits. Kartfixen nedan har lagts in lokalt men inte driftsatts.

## Faktiska kontroller

- Create via formuläret skapade den opublicerade fastigheten 17, CRUD verifiering 2026-09-18. UI visade 100 procent efter sluthämtningen.
- Edit via formulärets Spara ändrade pris från 100000 till 125000. UI visade 100 procent och redigeringsformuläret fanns kvar med det nya priset.
- En bild från projektets befintliga ikonfil lades till och sparades. Efter sluthämtningen visades den som omslagsbild och formuläret fanns kvar.
- Spara ändringar utan ytterligare ändringar genomförde endast sluthämtningen och återgick till redigeringsformuläret.
- Raderingsdialogen öppnades och visade permanent radering. Användaren valde uttryckligen att behålla fastighet 17, så dialogen avbröts. Fastigheten och bilden är kvar.
- Det lokala produktionsbygget kunde inte reproducera den rapporterade tomma sidan efter Spara.

Google Maps tillåter inte verifieringsporten 4173 och rapporterade RefererNotAllowedMapError. Det befintliga felet för tom polygon (addListener på undefined) visades också lokalt. Dessa fel tömde inte redigeringssidan vid kontrollerna. Google-nyckelns restriktioner har inte ändrats.

## Befintliga backendtester

Kommando: php artisan test tests/Feature/PropertyDeletionTest.php tests/Feature/PropertyListingFieldsTest.php tests/Feature/PropertyMapTest.php tests/Feature/ImageModuleTest.php tests/Feature/DocumentModuleTest.php

9 passerade, 4 misslyckades, 104 assertions. Testdatabasen var SQLite i minnet.

Alla tre PropertyDeletionTest passerade: borttagning av ägd data/filer men bevarande av delade dokument; databasrollback när lagring misslyckas; endast admin får radera. Även listing- och karttesterna passerade.

ImageModuleTest och tre DocumentModuleTest misslyckades i befintlig autentiseringssetup: App\Models\User::withAccessToken() saknas. Det är inte ett reproducerat fel i sparflödet. Testfilerna har inte ändrats.

## Fortsatt felsökning av produktion

Produktionsadressen tillhandahölls senare. Se reproduktion och rättning nedan.

## Fortsatt verifiering

- Full omladdning av redigeringen visade sparat pris 125000 och den första sparade bilden.
- Aktivering av schemaläggning utan datum/tid och klick på Spara visade ett tydligt valideringsmeddelande; sidan förblev användbar. Schemaläggningen avaktiverades igen innan nästa sparning.
- Tre befintliga projektbilder (sammanlagt 6 472 212 bytes) valdes och sparades i två bildbatchar. UI visade Bildserie 1 av 2 och återgick till 100 procent med samtliga fyra bilder (en tidigare plus tre nya) i redigeringsformuläret.
- Fastighet 17 behålls opublicerad enligt användarens instruktion och har nu fyra bilder.
- Ingen reproducerad krasch i dessa fall. Därefter reproducerades felet i produktion enligt nedan.

## Reproducerad produktionskrasch och lokal rättning

- På skogsbyran.vercel.app/admin/properties/7/edit klickades Spara utan fältändringar. Hela sidan blev tom. Inga fastigheter eller bilder raderades.
- Konsolen visade RefererNotAllowedMapError följt av TypeError: Cannot read properties of undefined (reading getArray), i PropertyAreaMap-BF2e-EWl.js:3:4232. Den publika koden bekräftade att polygonens getPath() användes utan kontroll i synkroniseringseffekten.
- Produktionens frontend skiljer sig från aktuell lokal kod och saknar den nya sparprogressen.
- usePropertyMap skapar nu en explicit MVCArray-ring även för tom polygon och behåller den under kartans livstid. Synkroniseringen hanterar även att Google ogiltigförklarar kartobjekt efter ett asynkront auktoriseringsfel. Då visas kartfel, kartan avaktiveras och formuläret kan användas. Synkroniseringsflaggan återställs med finally.
- En första lokal kontroll visade att en explicit ring ensam inte räcker vid auktoriseringsfel: getArray() kan också returnera undefined. Den slutliga rättningen kontrollerar därför även returvärdet.
- Efter slutlig rättning sparades pris 125000 på lokal fastighet 17. UI nådde 100 procent, formuläret och alla fyra bilder fanns kvar och ett begripligt kartfel visades. Inget nytt TypeError registrerades.
- TypeScript/Vite-bygget och ESLint passerade. Befintlig varning om woodland-placeholder.webp kvarstår.
- Rättningen är inte driftsatt. Google Maps-nyckelns tillåtna webbplatser måste också tillåta produktionsdomänen; inga nyckelrestriktioner har ändrats. Full kartinteraktion kan inte verifieras medan Google nekar domänen.
