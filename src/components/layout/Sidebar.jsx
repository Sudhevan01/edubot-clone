import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

/**
 * Reusable Sidebar Component
 * @param {Object} props
 * @param {Array} props.navItems - Array of { label, path, icon (JSX) }
 * @param {string} props.role - 'admin' | 'gateguard' | 'superadmin'
 * @param {boolean} props.isOpen - Mobile sidebar open state
 * @param {boolean} props.isCollapsed - Desktop collapsed state
 * @param {Function} props.onClose - Callback to close sidebar on mobile
 */
const Sidebar = ({ navItems = [], role = 'gateguard', isOpen = false, isCollapsed = false, onClose, onSupportClick }) => {
  const navigate = useNavigate();

  const [logo, setLogo] = useState(() => {
    try {
      const org = JSON.parse(localStorage.getItem('vms_org'));
      return org?.logo || '';
    } catch {
      return '';
    }
  });

  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const updateLogo = () => {
      try {
        const org = JSON.parse(localStorage.getItem('vms_org'));
        setLogo(org?.logo || '');
      } catch {
        setLogo('');
      }
    };

    window.addEventListener('storage', updateLogo);
    window.addEventListener('brandingUpdated', updateLogo);

    return () => {
      window.removeEventListener('storage', updateLogo);
      window.removeEventListener('brandingUpdated', updateLogo);
    };
  }, []);



  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('vms_user');
    navigate('/login', { replace: true });
  };

  const handleNavClick = (path) => {
    if (window.location.pathname === path) {
      window.dispatchEvent(new CustomEvent('sidebar-click', { detail: { path } }));
    }
    // Close sidebar on mobile after navigation
    if (onClose) onClose();
  };

  const handleSupportClick = (e) => {
    e.preventDefault();
    if (onSupportClick) onSupportClick();
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Close button for mobile */}
        <button className="sidebar__close-btn" onClick={onClose} aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Brand */}
        <div className="sidebar__brand">
          {logo ? (
            <div className="sidebar__logo" onClick={() => navigate(role === 'admin' ? '/admin/dashboard' : role === 'teacher' ? '/teacher/dashboard' : '/gateguard/dashboard')} style={{ cursor: 'pointer' }}>
              <img 
                src={logo} 
                alt="logo" 
                className='sidebar__logo-img' 
              />
            </div>
          ) : (
            <div className="sidebar__logo-mock" onClick={() => navigate(role === 'admin' ? '/admin/dashboard' : role === 'teacher' ? '/teacher/dashboard' : '/gateguard/dashboard')} style={{ cursor: 'pointer' }}>
              Set Logo
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {navItems.map((item) => {
            if (item.subItems && item.subItems.length > 0) {
              const isExpanded = !!expandedMenus[item.label];
              const isAnyChildActive = item.subItems.some(sub => {
                if (sub.checkActive) return sub.checkActive(window.location);
                return window.location.pathname === sub.path;
              });

              return (
                <div key={item.label} className="sidebar__submenu-group">
                  <button
                    type="button"
                    className={`sidebar__nav-item sidebar__submenu-toggle ${isAnyChildActive ? 'sidebar__nav-item--active' : ''}`}
                    onClick={() => toggleSubmenu(item.label)}
                  >
                    <span className="sidebar__nav-icon">{item.icon}</span>
                    <span className="sidebar__nav-label">{item.label}</span>
                    {!isCollapsed && (
                      <span className="sidebar__submenu-arrow" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="sidebar__submenu-items" style={{ paddingLeft: isCollapsed ? '0' : '16px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {item.subItems.map((sub) => {
                        const isSubActive = (isActive) => {
                          if (sub.checkActive) return sub.checkActive(window.location);
                          return isActive;
                        };
                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            className={({ isActive }) =>
                              `sidebar__nav-item ${isSubActive(isActive) ? 'sidebar__nav-item--active' : ''}`
                            }
                            end={sub.end}
                            onClick={() => handleNavClick(sub.path)}
                          >
                            <span className="sidebar__nav-icon">{sub.icon}</span>
                            <span className="sidebar__nav-label">{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isItemActive = (isActive) => {
              if (item.checkActive) {
                return item.checkActive(window.location);
              }
              return isActive;
            };
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__nav-item ${isItemActive(isActive) ? 'sidebar__nav-item--active' : ''}`
                }
                end={item.end}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                <span className="sidebar__nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <a href="#" className="sidebar__nav-item" onClick={handleSupportClick}>
            <span className="sidebar__nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </span>
            <span className="sidebar__nav-label">Support</span>
          </a>
          <button className="sidebar__nav-item sidebar__nav-item--logout" onClick={handleLogout}>
            <span className="sidebar__nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span className="sidebar__nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
