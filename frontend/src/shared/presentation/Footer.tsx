import './footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">Skogsbyrån</div>
          <p className="footer-tagline">
            En modern mäklarbyrå med fokus på skog, mark och hållbara fastigheter.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Meny</h4>
            <a href="/">Startsida</a>
            <a href="/product/compare">Köpa</a>
            <a href="/sale">Sälja</a>
            <a href="/about">Om företaget</a>
          </div>

          <div className="footer-column">
            <h4>Kontakt</h4>
            <a href="mailto:info@skogsbyran.se">info@skogsbyran.se</a>
            <a href="tel:+46123456789">+46 12 345 67 89</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Skogsbyrån</span>
      </div>
    </footer>
  );
}

export default Footer;