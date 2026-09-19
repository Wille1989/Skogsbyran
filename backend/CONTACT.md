# Kontaktformulär

Den befintliga kontaktmodalen skickar JSON till `POST /contact`. Laravel validerar fälten och skickar ett textmejl via Resends HTTP-API. Ingen konversationshistorik lagras och ingen köarbetare behövs.

Ange i backendens `.env` (aldrig i frontend):

```dotenv
RESEND_API_KEY=re_...
CONTACT_FORM_FROM_EMAIL=kontakt@din-verifierade-domän.se
CONTACT_FORM_TO_EMAIL=din-testadress@example.com
```

Avsändaren måste vara godkänd hos Resend. Använd din egen mottagaradress under test. Byt bara `CONTACT_FORM_TO_EMAIL` i produktionsmiljön när den riktiga mottagaren ska användas. Kör `php artisan config:cache` efter ändringar om miljön använder cachad konfiguration. `MAIL_MAILER` påverkar inte kontaktformuläret.

Besökarens e-post används som `Reply-To`, aldrig som avsändare eller mottagare. Det befintliga alternativet att bara ange telefon behålls; då saknas `Reply-To` och telefonnumret står i mejlet. Meddelandet är fortsatt valfritt.

Skydd: längdgränser, e-post-/telefonvalidering, dolt honeypotfält samt högst 3 försök/minut och 10/timme per IP, med ett totalt tak på 100/timme. Begränsningen använder Laravels cache; använd en beständig cache som delas mellan instanser i produktion. Om en reverse proxy används ska endast betrodda proxyservrar konfigureras så att klient-IP blir korrekt.

Svar: 200 när Resend accepterat utskicket, 422 vid felaktiga fält, 429 vid för många försök och 503 vid utskicksfel. API-acceptans garanterar inte inkorgsleverans; kontrollera leveransstatus hos Resend vid ett riktigt test. Vid timeout kan ett mejl redan ha skickats, så automatiska omförsök görs inte.

API-referens: https://resend.com/docs/api-reference/emails/send-email
