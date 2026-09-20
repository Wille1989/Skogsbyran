import { NavLink, useLocation } from "react-router-dom";
import { IconChevronDown } from "@tabler/icons-react";
import "./Navbar.css";

function Navbar() {
  const isHome = useLocation().pathname === "/";

  return (
    <header className={`site-header ${isHome ? "home-hero" : "compact-header"}`}>

      <div className="inner-header">
        <div className="header-logo">
          <NavLink to="/" end className="site-brand" aria-label="Gå till startsidan">
            {isHome ? <h1 id="site-header-title">Skogsbyrån Jönköping</h1> : <span className="site-wordmark">Skogsbyrån</span>}
          </NavLink>
        </div>

        {isHome && (
          <div className="hero-copy">
            <p className="hero-eyebrow">Skog · Jord · Människor · Framtid</p>
            <p className="hero-statement">Din partner för skogs- och<br className="hero-line-break" /> lantbruksfastigheter</p>
            <p className="hero-intro">Rådgivning och fastighetsförmedling i Jönköping.<br /> För dig som äger, köper eller säljer skog, mark och lantbruksfastigheter.</p>
            <a href="#fastigheter" className="hero-cta">Fastigheter till salu <IconChevronDown size={22} aria-hidden="true" /></a>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
