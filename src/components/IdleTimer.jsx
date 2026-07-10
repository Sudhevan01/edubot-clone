import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const IdleTimer = ({ timeout = 30 * 60 * 1000 }) => { // Default 30 minutes
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);

  const logout = () => {
    console.log('User inactive. Logging out...');
    localStorage.removeItem('vms_user');
    navigate('/login', { replace: true });
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timer if user is logged in and not on public pages
    const user = localStorage.getItem('vms_user');
    const isPublicPage = ['/login', '/forgot-password', '/reset-password'].includes(location.pathname);

    if (user && !isPublicPage) {
      timeoutRef.current = setTimeout(logout, timeout);
    }
  };

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetTimer();

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location.pathname]); // Re-run effect when path changes to check public pages

  return null;
};

export default IdleTimer;
