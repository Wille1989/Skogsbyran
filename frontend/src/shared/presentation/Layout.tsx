import './layout.css';
import Footer from './Footer';
import Navbar from './Navbar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrapper">
      <Navbar />
          <main className="main-content">
            {children}
          </main>
      <Footer />
    </div>
  );
}

export default Layout;