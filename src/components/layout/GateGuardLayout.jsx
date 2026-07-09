import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import Footer from './Footer';
import SupportModal from '../common/SupportModal';
import './GateGuardLayout.css';
import { isSessionValid } from '../../utils/session';

const GateGuardLayout = () => {
  const [authorized, setAuthorized] = useState(null);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isEntryList = location.pathname === '/gateguard/entry-list';
  const isCheckout = location.pathname === '/gateguard/checkout';
  const displayName = user?.name || 'Fakruddin S';

  useEffect(() => {
    if (!isSessionValid()) {
      setAuthorized(false);
      return;
    }
    const userData = JSON.parse(localStorage.getItem('vms_user'));
    setUser(userData);
    setAuthorized(userData.role === 'GATEGUARD' || userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN');

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  if (authorized === null) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!authorized) return <Navigate to="/login" replace />;

  return (
    <div className="eduguard-layout">
      {/* Top Header - Reverted to original format with Logo and Name */}
      <header className="eduguard-header">
        <div className="header-left">
          <div className="logo-box" onClick={() => navigate((user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? '/admin/dashboard' : '/gateguard/dashboard')} style={{ cursor: 'pointer' }}>
            <img 
              src={(() => {
                try {
                  const org = JSON.parse(localStorage.getItem('vms_org'));
                  return org?.logo || '/assets/images/logo1.png';
                } catch {
                  return '/assets/images/logo1.png';
                }
              })()} 
              alt="logo" 
              className='logo-img' 
            />
          </div>
          {(isEntryList || isCheckout) && (
            <div className="header-page-title">
              <span className="header-title-text">{isEntryList ? 'Entry List' : 'Visitor Checkout'}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <button
            className="checkout-scanner-btn"
            onClick={() => navigate('/gateguard/checkout')}
            title="Checkout Scanner"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <line x1="7" y1="12" x2="17" y2="12"></line>
            </svg>
          </button>

          <button
            className="header-refresh-btn"
            onClick={() => window.location.reload()}
            title="Refresh Page"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          <div className="user-profile-wrapper" ref={dropdownRef}>
            <div
              className={`user-profile ${isDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ cursor: 'pointer' }}
            >
              <div className="user-text">
                <span className="user-name">{displayName}</span>
                <span className="user-role">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
                    user?.role === 'ADMIN' ? 'Admin' :
                    user?.role === 'ACCOUNTANT' ? 'Accountant' : 'Gate Guard'}
                </span>
              </div>
              <div className="user-avatar" style={{ background: '#2563eb', color: 'white', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                {displayName.charAt(0)}
              </div>
              <svg
                className={`dropdown-arrow-icon ${isDropdownOpen ? 'open' : ''}`}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {isDropdownOpen && (
              <div className="profile-dropdown-menu">
                {user?.role === 'GATEGUARD' && (
                  <div className="dropdown-menu-item" onClick={() => { setIsDropdownOpen(false); navigate('/gateguard/dashboard'); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>New Entry</span>
                  </div>
                )}
                <div className="dropdown-menu-item" onClick={() => { setIsDropdownOpen(false); navigate('/gateguard/entry-list'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  <span>Entry List</span>
                </div>
                <div className="dropdown-menu-item" onClick={() => { setIsDropdownOpen(false); setIsSupportModalOpen(true); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>Support</span>
                </div>
                <div className="dropdown-menu-divider"></div>
                <div className="dropdown-menu-item logout-item" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`eduguard-main ${location.pathname === '/gateguard/dashboard' || location.pathname === '/gateguard' ? 'dashboard-main' : ''}`}>
        <Outlet />
        <Footer />
      </main>

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};

export default GateGuardLayout;
