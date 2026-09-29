# SEO och publicering

## Implementerat

- Publika sidor renderas med sina befintliga React-komponenter i en Vercel Function. Fastighetens text, länkar och metadata finns i första HTML-svaret.
- Unika titlar, beskrivningar, canonical och Open Graph för startsidan, Om oss och fastigheter. Metadata uppdateras även vid navigering utan sidladdning.
- LocalBusiness med samma kontaktuppgifter som sajten visar.
- Favicons i 48×48 och 192×192 på stabila, publika adresser. Google avgör när ikonen visas efter nästa genomsökning.
- `/sitemap.xml` hämtar publicerade objekt från det publika API:et vid anrop. Sålda objekt behåller sina adresser så länge de är publicerade. Inga admin- eller opublicerade objekt inkluderas.
- `/robots.txt` levererar text. Admin får `X-Robots-Tag: noindex, nofollow`. Preview-sidor får noindex.
- Okända eller opublicerade objekt ger 404. Backendfel ger 503 och Retry-After, inte 404. HTML cachelagras inte så avpublicering slår igenom vid nästa begäran.

## Bygg och verifiera

Kör `npm run build`, `node tests/seo.test.mjs` och `npm run lint` i frontend.
Bygget skapar `dist` för webbläsaren och `dist-ssr` för funktionen. Båda krävs. Vercel-projektets rot ska fortsatt vara `frontend` och byggkommandot ska köra `npm run build` (inte bara `vite build`).

Efter deploy: kontrollera `/`, `/om-oss`, ett publicerat objekt, ett saknat objekt, `/robots.txt` och `/sitemap.xml`. Kontrollera sidkällan, statuskoderna och att admininloggning, bilder, kartor och kontaktformulär fortfarande fungerar. Vite dev/preview kör inte Vercel-funktionen; produktionens routing behöver även kontrolleras på Vercel.

## Domän och Google-konton

Nu används `https://skogsbyran.vercel.app`. När egen domän är ansluten: sätt `VITE_SITE_URL=https://din-domän.se` i Vercel, bygg om och konfigurera permanent omdirigering från tidigare domän till den valda huvuddomänen. Använd inte olika canonical-domäner för olika miljöer.

Ägaren behöver ange domän och ordna åtkomst till Google Search Console och befintlig Google-företagsprofil. Verifiera domänen i Search Console, skicka in `/sitemap.xml`, granska startsidan och en fastighet med URL-inspektion och följ indexering, sökfrågor och relevanta kontaktförfrågningar. Kontrollera företagets namn, adress, telefon, tjänster och verkliga verksamhetsområde i företagsprofilen. Skapa inte en dubblett.

I väntan på one.com kan Vercel-adressen verifieras gratis som en **URL-prefix-egendom**, `https://skogsbyran.vercel.app/`. Välj HTML-tagg, kopiera enbart värdet från `content` och lägg det i `VITE_GOOGLE_SITE_VERIFICATION` i Vercel. Bygg/deploya och tryck sedan Verifiera i Search Console. Värdet är en publik verifieringskod, inte ett lösenord eller en API-nyckel. Lägg till den egna domänen separat när åtkomst finns.

## Återstår separat

- Egna tjänstesidor och tillägg om bouppteckning, generationsskifte och bokföring avvaktar enligt önskemål.
- Ägarens namn, foto, meriter och referenser behöver bekräftat material.
- Bilderna använder fortfarande tidsbegränsade lagringslänkar från backend. Stabil offentlig bildleverans behöver en separat backendändring som behåller skyddet för opublicerade objekt; lagringsbehörigheter har inte ändrats här.
- Faktisk Core Web Vitals och Google-indexering måste mätas efter publicering; ett godkänt bygge är inte ett mätresultat eller en garanti för placering.

Teknisk referens: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics och https://vercel.com/docs/functions/runtimes/node-js.
