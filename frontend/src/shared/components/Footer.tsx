import { IconTrees, IconUserHeart, IconShieldCheck, IconPlant } from '@tabler/icons-react';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-values">
        <span><IconTrees size={32} stroke={1} aria-hidden="true" />Skog och mark</span>
        <span><IconUserHeart size={32} stroke={1} aria-hidden="true" />Dina intressen i fokus</span>
        <span><IconShieldCheck size={32} stroke={1} aria-hidden="true" />Oberoende rådgivning</span>
        <span><IconPlant size={32} stroke={1} aria-hidden="true" />Trygga fastighetsaffärer</span>
      </div>
      <p className="footer-copyright">© {new Date().getFullYear()} Skogsbyrån i Jönköping</p>
    </footer>
  );
}

export default Footer;
