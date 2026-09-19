import './Layout.css';
import Footer from './Footer';
import Navbar from './Navbar';
import { IconArrowLeft } from '@tabler/icons-react';
import { useCurrentUserQuery } from '@/modules/auth/hooks/auth.hooks.ts';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { ContactPanel, type ContactPanelHandle } from '@/modules/contact/components/ContactPanel';
import { ContactContext } from '@/modules/contact/context/ContactContext';
import { useRef } from 'react';

function Layout({ children }: { children: React.ReactNode }) {
  const { data: currentUser } = useCurrentUserQuery();
  const { pathname } = useLocation();
  const contactPanel = useRef<ContactPanelHandle>(null);
  const isPublicPage = pathname === '/' || pathname === '/om-oss' || Boolean(matchPath('/property/:propertyId', pathname));
  return (
    <ContactContext.Provider value={() => contactPanel.current?.open()}>
    <div className={`wrapper${pathname === '/' ? ' home-layout' : ''}${matchPath('/property/:propertyId', pathname) ? ' detail-layout' : ''}`}>
      {isPublicPage && currentUser?.isAdmin === true && (
        <Link to="/admin" className="admin-return-control">
          <IconArrowLeft size={17} aria-hidden="true" />Tillbaka till admin
        </Link>
      )}
      <Navbar />
          <main className="main-content">
            {children}
          </main>
      <Footer />
      {isPublicPage && <ContactPanel ref={contactPanel} />}
    </div>
    </ContactContext.Provider>
  );
}

export default Layout;
