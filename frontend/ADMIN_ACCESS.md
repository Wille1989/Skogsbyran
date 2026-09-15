# Adminåtkomst

Sätt `VITE_ADMIN_LOGIN_SLUG` i frontendens `.env.local`. Använd 12–64 små bokstäver, siffror eller bindestreck; börja med en bokstav eller siffra. Generera exempelvis med:

```powershell
node -e "console.log(require('node:crypto').randomBytes(16).toString('hex'))"
```

Adressen blir `/admin/<värdet>`. Starta om Vite efter ändring. För driftsättning måste samma variabel sättas i frontendens byggmiljö och frontend byggas om. Tomt eller ogiltigt värde stänger login-ingången; publika sidor fortsätter fungera.

Denna Vite-variabel ingår i frontendpaketet och är ingen hemlighet eller behörighetskontroll. Ingen publik navigation länkar till login. Gamla `/login`- och `/dashboard`-adresser samt fel slug ger en generell sida utan login eller rätt adress. Utloggade besök på skyddade adminvyer skickas till startsidan.

Login använder befintlig Laravel-session och CSRF-hantering. En inloggad admin skickas till Översikt. Visa webbplatsen behåller sessionen och visar Tillbaka till admin enbart efter bekräftad adminstatus från backend.

Backendens POST /login begränsas till fem anrop per minut och IP via Laravel throttle:login, även för lyckade och ogiltiga försök. Nästa anrop får HTTP 429 med Retry-After. Limitern registreras i alla miljöer och använder Laravels cache. Produktionsmiljön behöver en beständig cache (exempelvis befintlig database-cache), delad vid flera appinstanser. Eventuell proxy måste vara korrekt konfigurerad för klient-IP.

Skrivande fastighets-API kräver fortsatt auth:web och admin. Den dolda frontendadressen förändrar inga API-rättigheter.
