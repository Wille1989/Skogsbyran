import './Layout.css';
import Footer from './Footer';
import Navbar from './Navbar';
import { IconArrowLeft } from '@tabler/icons-react';
import { useCurrentUserQuery } from '@/modules/auth/hooks/auth.hooks.ts';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { ContactPanel } from '@/modules/contact/components/ContactPanel';

function Layout({ children }: { children: React.ReactNode }) {
  const { data: currentUser } = useCurrentUserQuery();
  const { pathname } = useLocation();
  const isPublicPage = pathname === '/' || pathname === '/om-oss' || Boolean(matchPath('/property/:propertyId', pathname));
  return (
    <div className={`wrapper${isPublicPage ? ' public-layout' : ''}${pathname === '/' ? ' home-layout' : ''}${matchPath('/property/:propertyId', pathname) ? ' detail-layout' : ''}`}>
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
      {isPublicPage && <ContactPanel />}
    </div>
  );
}

export default Layout;
