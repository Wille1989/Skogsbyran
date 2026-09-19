import { NavLink, Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { IconHome, IconBuildingEstate, IconExternalLink, IconLogout, IconMenu2, IconX } from "@tabler/icons-react";
import { useAuth } from "@/modules/auth/hooks/auth.hooks.ts";
import "./AdminLayout.css";

export function AdminLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { onLogout, loading, errorMessage } = useAuth();
    return <div className="admin-layout">
        <a className="admin-skip" href="#admin-content">Hoppa till innehåll</a>
        <button className="admin-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />} Adminmeny
        </button>
        <aside id="admin-sidebar" className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
            <Link to="/admin" className="admin-brand" onClick={() => setMenuOpen(false)}>Skogsbyrån<span>ADMIN</span></Link>
            <nav aria-label="Administration" onClick={() => setMenuOpen(false)}>
                <NavLink to="/admin" end><IconHome size={23} />Översikt</NavLink>
                <NavLink to="/admin/properties"><IconBuildingEstate size={23} />Fastigheter</NavLink>
                <Link to="/"><IconExternalLink size={23} />Visa webbplatsen</Link>
            </nav>
            <div className="admin-sidebar-footer">
                <div className="admin-user"><span>AD</span>Administratör</div>
                <button type="button" disabled={loading} onClick={() => void onLogout()}><IconLogout size={22} />{loading ? "Loggar ut…" : "Logga ut"}</button>
                {errorMessage && <p role="alert">{errorMessage}</p>}
            </div>
        </aside>
        <main id="admin-content" className="admin-content" tabIndex={-1}><Outlet /></main>
    </div>;
}
