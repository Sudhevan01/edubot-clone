import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Product from './pages/Product';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Accessibility from './pages/Accessibility';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

import './styles/global.css';

// Redirect Component to App Portal Subdomain
const RedirectToPortal = ({ path = '' }) => {
  useEffect(() => {
    const portalUrl = import.meta.env.VITE_APP_PORTAL_URL || 'https://app.educrop.in';
    window.location.href = `${portalUrl}${path}`;
  }, [path]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to login portal...</p>
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    // Unregister any active service workers and clear cache storage
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

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Landing Pages */}
        <Route path="/" element={<Homepage />} />
        <Route path="/product" element={<Product />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/accessibility" element={<Accessibility />} />

        {/* Redirect portal paths to the subdomain app */}
        <Route path="/login" element={<RedirectToPortal path="/login" />} />
        <Route path="/signup" element={<RedirectToPortal path="/signup" />} />
        <Route path="/forgot-password" element={<RedirectToPortal path="/forgot-password" />} />
        <Route path="/reset-password" element={<RedirectToPortal path="/reset-password" />} />

        {/* Defaults */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
