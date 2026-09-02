import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/data/auth.hooks";
import "./navbar.css";

function Navbar() {
  const { isAuthenticated, isAdmin, onLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogOutClick = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header className={`site-header ${isAdmin ? "has-admin-session-banner" : ""}`}>
      {isAdmin ? (
        <div className="admin-session-banner" role="status">
          Du är inloggad som admin
        </div>
      ) : null}

      <div className="inner-header">
        <div className="header-logo">
          <NavLink to="/" end className="site-brand" aria-label="Gå till startsidan">
            <h1 className="site-brand-mark">Skogsbyrån</h1>
            <span className="site-brand-subtitle">Skog, mark och hållbara affärer</span>
          </NavLink>
        </div>

        {!isAuthenticated ? (
          <NavLink to="/login" className="nav-button" aria-label="Logga in som admin">
            Logga in
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

        <section aria-labelledby="site-header-title">
          <h2 id="site-header-title">Vi är Skogsbyrån.</h2>
          <p>
            Fastighetsförmedling och rådgivning för skog, mark och gårdar.
            Med fötterna stadigt i myllan.
          </p>
          <p>
            Vi hjälper dig att hitta rätt väg genom köp, försäljning och
            långsiktigt ägande av naturens värden.
          </p>

          <nav className="navigation-bar" aria-label="Huvudmeny">
            <ul className="navigation-bar-list">
              <li>
                <NavLink to="/">Fastigheter till salu</NavLink>
              </li>
              <li>
                <NavLink to="/sale">Sälja med Skogsbyrån</NavLink>
              </li>
              <li>
                <NavLink to="/about">Kontakt</NavLink>
              </li>
              {isAdmin ? (
                <li>
                  <NavLink to="/dashboard/property/create">Skapa fastighet</NavLink>
                </li>
              ) : null}
            </ul>
          </nav>
        </section>
      </div>
    </header>
  );
}

export default Navbar;
