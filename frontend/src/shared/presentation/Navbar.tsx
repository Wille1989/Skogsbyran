import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/data/auth.hooks";
import { getStoredAuthSession, isAdminSession, isAuthenticated } from "../../user/data/authSession";
import "./navbar.css";

function Navbar() {
  const { onLogout } = useAuth();
  const navigate = useNavigate();
  const session = getStoredAuthSession();
  const isLoggedIn = isAuthenticated(session);
  const isAdmin = isAdminSession(session);

  const handleLogOutClick = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="inner-header">
        <div className="header-logo">
          <NavLink to="/" end className="site-brand" aria-label="Gå till startsidan">
            <h1 className="site-brand-mark">Skogsbyrån</h1>
            <span className="site-brand-subtitle">Skog, mark och hållbara affärer</span>
          </NavLink>
        </div>

        {!isLoggedIn ? (
          <NavLink to="/login" className="nav-button" aria-label="Logga in som admin">
            <span aria-hidden="true">•••</span>
          </NavLink>
        ) : (
          <button
            type="button"
            className="nav-button"
            onClick={handleLogOutClick}
            aria-label={isAdmin ? "Logga ut som admin" : "Logga ut"}
          >
            <span aria-hidden="true">•••</span>
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
            </ul>
          </nav>
        </section>
      </div>
    </header>
  );
}

export default Navbar;
