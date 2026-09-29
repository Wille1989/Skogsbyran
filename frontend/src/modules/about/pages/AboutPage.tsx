import "./AboutPage.css";
import { Link } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';

export function AboutPage() {
  return (
    <article className="about-page" aria-labelledby="about-page-title">
      <Link to="/" className="about-back"><IconArrowLeft size={19} aria-hidden="true" />Tillbaka</Link>
      <h1 id="about-page-title">Skogsbyrån i Jönköping</h1>
      <p>
        Skogsbyrån i Jönköping arbetar med rådgivning och fastighetsförmedling för dig som äger, köper eller säljer skog, mark och lantbruksfastigheter.
      </p>
      <p>
        Det är stor efterfrågan på skogsfastigheter, skogsmark och annan mark med jord- och skogsbruksvärden. Med mer än 30 års erfarenhet av rådgivning och förmedling hjälper vi företagare, jordbrukare och skogsbrukare genom hela fastighetsaffären.
      </p>
      <p>
        Oavsett om det gäller skogsmark, åkermark, jordbruksmark eller en större fastighet med både skog och mark är vår ambition att skapa goda förutsättningar för en trygg och väl genomförd försäljning.
      </p>
      <p>
        Skogsbyrån är oberoende av organisationer, banker och andra aktörer. Det innebär att vårt fokus ligger på kundens intressen och på den lösning som passar fastigheten och situationen bäst.
      </p>
      <p>Välkommen till Skogsbyrån i Jönköping.</p>
      <section aria-labelledby="about-contact-title">
        <h2 id="about-contact-title">Kontakta Skogsbyrån</h2>
        <address>
          Tranhult 11, 562 91 Månsarp<br />
          <a href="tel:+46761354649">0761-35 46 49</a><br />
          <a href="mailto:skogsbyran.jonkoping@telia.com">skogsbyran.jonkoping@telia.com</a>
        </address>
      </section>
    </article>
  );
}
