import './Layout.css';
import Footer from './Footer';
import Navbar from './Navbar';
import { matchPath, useLocation } from 'react-router-dom';
import { ContactPanel, type ContactPanelHandle } from '@/modules/contact/presentation/ContactPanel';
import { ContactContext } from '@/modules/contact/presentation/ContactContext';
import { useRef } from 'react';

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const contactPanel = useRef<ContactPanelHandle>(null);
  const isPublicPage = pathname === '/' || pathname === '/om-oss' || Boolean(matchPath('/property/:propertyId', pathname));
  return (
    <ContactContext.Provider value={() => contactPanel.current?.open()}>
    <div className={`wrapper${pathname === '/' ? ' home-layout' : ''}${matchPath('/property/:propertyId', pathname) ? ' detail-layout' : ''}`}>
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
