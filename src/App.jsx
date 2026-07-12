import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Product from './pages/Product';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Accessibility from './pages/Accessibility';
import Docs from './pages/Docs';
import './styles/global.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  useEffect(() => {
    // Unregister any active service workers and clear cache storage so that code changes take effect immediately in dev
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('PWA: Service Worker unregistered to load fresh assets');
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
          console.log('PWA: Cache cleared:', name);
        }
      });
    }
  }, []);

  const handleLoginClick = () => {
    window.location.href = 'https://org.educrop.com';
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Homepage onLoginClick={handleLoginClick} />} />
        <Route path="/product" element={<Product onLoginClick={handleLoginClick} />} />
        <Route path="/about" element={<About onLoginClick={handleLoginClick} />} />
        <Route path="/contact" element={<Contact onLoginClick={handleLoginClick} />} />
        <Route path="/privacy" element={<Privacy onLoginClick={handleLoginClick} />} />
        <Route path="/terms" element={<Terms onLoginClick={handleLoginClick} />} />
        <Route path="/accessibility" element={<Accessibility onLoginClick={handleLoginClick} />} />
        <Route path="/docs" element={<Docs onLoginClick={handleLoginClick} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
