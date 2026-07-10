import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const PAGE_TITLES = {
  "/admin/dashboard": {
    title: "Dashboard Overview",
  },
  "/admin/visitor-logs": {
    title: "Visitor Records",
  },
  "/admin/staff-directory": {
    title: "Staff Directory",
  },
  "/admin/student-gatepass": {
    title: "Gatepass Management",
  },
  "/admin/student-entry": {
    title: "Add New Student",
  },
  "/admin/vendor-entry": {
    title: "Add New Vendor",
  },
  "/admin/master-records": {
    title: "Master Records",
  },
  "/admin/settings": {
    title: "Settings",
  },
  "/admin/activity-logs": {
    title: "Activity Logs",
  },
  "/admin/accounts/dashboard": {
    title: "Accounts Dashboard",
  },
  "/admin/accounts/fees": {
    title: "Fee Receipts",
  },
  "/admin/accounts/salary": {
    title: "Salary Slips",
  },
  "/admin/accounts/templates": {
    title: "Receipt Templates",
  },
  "/admin/accounts/settings": {
    title: "Accounts Settings",
  },
  "/admin/accounts/employees": {
    title: "Employee Directory",
  },
  "/admin/academics/dashboard": {
    title: "Academics Dashboard",
  },
  "/admin/academics/teachers": {
    title: "Teacher Directory",
  },
  "/admin/academics/teachers/new": {
    title: "Add New Teacher",
  },
  "/admin/academics/attendance-logs": {
    title: "Attendance Logs",
  },
  "/admin/academics/settings": {
    title: "Academics Settings",
  },
  "/teacher/dashboard": {
    title: "Teacher Dashboard",
  },
  "/teacher/classes": {
    title: "Classes & Attendance",
  },
  "/teacher/schedules": {
    title: "My Schedules",
  },
  "/teacher/assignments": {
    title: "Assignments",
  },
  "/teacher/results": {
    title: "Student Results",
  }
};

/**
 * Reusable Header Component
 * @param {Object} props
 * @param {string} props.searchPlaceholder - Placeholder text for search
 * @param {Function} props.onMenuToggle - Callback to toggle mobile sidebar
 */
const Header = ({ searchPlaceholder = 'Search visitors, students, or staff...', onMenuToggle }) => {
  const [user, setUser] = useState(null);
  const [printerSize, setPrinterSize] = useState('58mm');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current title config
  const currentPath = location.pathname;
  const [customTitle, setCustomTitle] = useState('');

  useEffect(() => {
    const handleSetTitle = (e) => {
      if (e.detail && typeof e.detail === 'string') {
        setCustomTitle(e.detail);
      } else if (e.detail && e.detail.title) {
        setCustomTitle(e.detail.title);
      }
    };
    window.addEventListener('set-route-title', handleSetTitle);
    return () => {
      window.removeEventListener('set-route-title', handleSetTitle);
    };
  }, []);

  useEffect(() => {
    setCustomTitle('');
  }, [location.pathname]);

  const getPageConfig = (path) => {
    if (path.startsWith('/admin/student-entry/') && path.split('/').length > 3) {
      return {
        title: "Update Student"
      };
    }
    if (path.startsWith('/admin/vendor-entry/') && path.split('/').length > 3) {
      return {
        title: "Update Vendor"
      };
    }

    if (path.startsWith('/admin/academics/session') || path.startsWith('/teacher/session')) {
      return {
        title: "Class Attendance"
      };
    }

    const staticConfig = PAGE_TITLES[path];
    if (staticConfig) {
      return staticConfig;
    }

    if (path.startsWith('/admin/accounts')) {
      if (path.includes('/fees/new')) return { title: "New Fee Receipt" };
      if (path.includes('/salary/new')) return { title: "New Salary Slip" };
      if (path.includes('/templates/new')) return { title: "New Receipt Template" };
      if (path.includes('/whatsapp')) return { title: "WhatsApp Notification Dashboard" };
      return {
        title: "RMS"
      };
    }

    return {
      title: "VMS"
    };
  };

  const pageConfig = getPageConfig(currentPath);
  const displayTitle = customTitle || pageConfig.title;

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('vms_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    };

    const loadPrinterSize = () => {
      const size = localStorage.getItem('vms_printer_size') || '58mm';
      setPrinterSize(size);
    };

    loadUser();
    loadPrinterSize();

    // Listen for custom profile update event
    window.addEventListener('userProfileUpdated', loadUser);

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('userProfileUpdated', loadUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePrinterSizeChange = (size) => {
    localStorage.setItem('vms_printer_size', size);
    setPrinterSize(size);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
      {/* Hamburger menu for mobile */}
      <button className="app-header__menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div className="app-header__dynamic-title">
        {pageConfig.badge && (
          <div className="security-badge-standard header-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>{pageConfig.badge}</span>
          </div>
        )}
        <h1 className="app-header__page-title">{displayTitle}</h1>
      </div>

      <div className="app-header__actions-container">
        <button
          className="app-header__refresh-btn"
          onClick={() => window.location.reload()}
          title="Refresh Page"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>

        <div className="app-header__user-wrapper" ref={dropdownRef}>
          <div
            className={`app-header__user ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="app-header__user-info">
              <span className="app-header__user-name">{user?.name || 'User'}</span>
              <span className={`app-header__user-role role-${user?.role?.toLowerCase()}`}>
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
                  user?.role === 'ADMIN' ? 'Admin' :
                    user?.role === 'ACCOUNTANT' ? 'Accountant' :
                      user?.role === 'TEACHER' ? 'Teacher' :
                        user?.role === 'OPERATOR' ? 'Operator' : 'Gate Guard'}
                {(() => {
                  try {
                    const org = JSON.parse(localStorage.getItem('vms_org'));
                    return org?.name ? ` (${org.name})` : '';
                  } catch {
                    return '';
                  }
                })()}
              </span>
            </div>
            <div className="app-header__avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <svg
              className={`app-header__dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {isDropdownOpen && (
            <div className="app-header__dropdown">
              <div className="app-header__dropdown-section">
                <span className="app-header__dropdown-section-title">Printer Size</span>
                <div className="app-header__printer-size-selector">
                  <button
                    className={`app-header__printer-size-btn ${printerSize === '58mm' ? 'active' : ''}`}
                    onClick={() => handlePrinterSizeChange('58mm')}
                  >
                    58 mm
                  </button>
                  <button
                    className={`app-header__printer-size-btn ${printerSize === '75mm' ? 'active' : ''}`}
                    onClick={() => handlePrinterSizeChange('75mm')}
                  >
                    75 mm
                  </button>
                </div>
              </div>
              <div className="app-header__dropdown-divider" />
              <div className="app-header__dropdown-item app-header__dropdown-item--logout" onClick={handleLogout}>
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
  );
};

export default Header;
