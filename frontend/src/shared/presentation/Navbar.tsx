import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { IconChevronDown } from "@tabler/icons-react";
import { useAuth } from "@/modules/auth/data/auth.hooks";
import "./Navbar.css";

function Navbar() {
  const { isAuthenticated, isAdmin, onLogout } = useAuth();
  const navigate = useNavigate();
  const isHome = useLocation().pathname === "/";

  const handleLogOutClick = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header className={`site-header ${isHome ? "home-hero" : "compact-header"} ${isAdmin ? "has-admin-session-banner" : ""}`}>
      {isAdmin ? (
        <div className="admin-session-banner" role="status">
          Du är inloggad som admin
        </div>
      ) : null}

      <div className="inner-header">
        <div className="header-logo">
          <NavLink to="/" end className="site-brand" aria-label="Gå till startsidan">
            {isHome ? <h1 id="site-header-title">Skogsbyrån</h1> : <span className="site-wordmark">Skogsbyrån</span>}
          </NavLink>
        </div>

        {!isAuthenticated ? (
          <NavLink to="/login" className="nav-button" aria-label="Logga in som admin">
            ...
          </NavLink>
        ) : (
          <button
            type="button"
            className="nav-button"
            onClick={handleLogOutClick}
            aria-label={isAdmin ? "Logga ut som admin" : "Logga ut"}
          >
            Logga ut
          </button>
        )}

        {isHome && (
          <div className="hero-copy">
            <p className="hero-eyebrow">Skog · Jord · Människor · Framtid</p>
            <p className="hero-statement">Din partner för skogs- och<br className="hero-line-break" /> lantbruksfastigheter</p>
            <p className="hero-intro">Rådgivning och fastighetsförmedling i Jönköping.<br /> För dig som äger, köper eller säljer skog, mark och lantbruksfastigheter.</p>
            <a href="#fastigheter" className="hero-cta">Fastigheter till salu <IconChevronDown size={22} aria-hidden="true" /></a>
          </div>
        )}
        {isAdmin && <NavLink className="header-admin-link" to="/dashboard/property/create">Skapa fastighet</NavLink>}
      </div>
    </header>
  );
}

export default Navbar;
