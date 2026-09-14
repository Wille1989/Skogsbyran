import './layout.css';
import Footer from './Footer';
import Navbar from './Navbar';
import { matchPath, useLocation } from 'react-router-dom';
import { ContactPanel } from '@/modules/contact/presentation/ContactPanel';

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isPublicPage = pathname === '/' || pathname === '/om-oss' || Boolean(matchPath('/property/:propertyId', pathname));
  return (
    <div className={`wrapper${pathname === '/' ? ' home-layout' : ''}`}>
      <Navbar />
          <main className="main-content">
            {children}
          </main>
      <Footer />
      {isPublicPage && <ContactPanel />}
    </div>
  );
}

export default Layout;
