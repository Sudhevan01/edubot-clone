import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaCog } from 'react-icons/fa';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import SupportModal from '../common/SupportModal';
import './GateGuardLayout.css'; /* Reuses the same layout CSS */
import { isSessionValid } from '../../utils/session';
import { getOrgContext } from '../../services/api';

// Admin navigation items
const ADMIN_NAV = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    label: 'Visitor Logs',
    path: '/admin/visitor-logs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
  },
  {
    label: 'Staff Directory',
    path: '/admin/staff-directory',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    label: 'Gatepass',
    path: '/admin/student-gatepass',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <polyline points="16 11 18 13 22 9"></polyline>
      </svg>
    ),
  },
  {
    label: 'Add Student',
    path: '/admin/student-entry',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <line x1="19" y1="8" x2="19" y2="14"></line>
        <line x1="16" y1="11" x2="22" y2="11"></line>
      </svg>
    ),
  },
  {
    label: 'Add Vendor',
    path: '/admin/vendor-entry',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
  },
];

const AdminLayout = () => {
  const [authorized, setAuthorized] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  // orgContextKey forces a re-render after the org context is refreshed from the server
  const [orgContextKey, setOrgContextKey] = useState(0);
  const location = useLocation();

  // Refresh org context (rmsEnabled, status) from the server on every mount.
  // This ensures that changes made by the ERP admin (e.g. enabling RMS mid-session)
  // are picked up without requiring the user to log out and back in.
  useEffect(() => {
    if (!isSessionValid()) return;
    getOrgContext()
      .then((res) => {
        if (res && res.data) {
          const ctx = res.data;
          const stored = JSON.parse(localStorage.getItem('vms_org') || '{}');
          const updated = {
            ...stored,
            rmsEnabled: !!ctx.rmsEnabled,
            vmsEnabled: ctx.vmsEnabled !== 0 && ctx.vmsEnabled !== false,
            amsEnabled: !!ctx.amsEnabled,
            name: ctx.name || stored.name,
            logo: ctx.logo || stored.logo,
            themeColor: ctx.themeColor || stored.themeColor,
            grades: ctx.grades || stored.grades || '',
            sections: ctx.sections || stored.sections || '',
          };
          localStorage.setItem('vms_org', JSON.stringify(updated));
          setOrgContextKey((k) => k + 1); // trigger re-render with fresh values
        }
      })
      .catch(() => {
        // Non-fatal — fall back to cached localStorage value
      });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsSidebarCollapsed(false);

      // Auto-close mobile sidebar when scaling up to desktop (> 1280px)
      if (width > 1280 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!isSessionValid()) {
      setAuthorized(false);
      return;
    }
    const user = JSON.parse(localStorage.getItem('vms_user'));
    setAuthorized(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'OPERATOR');
  }, []);

  if (authorized === null) return null;
  if (!authorized) return <Navigate to="/login" replace />;

  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');

  let enabledModules = [];
  try {
    const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
    enabledModules = org.modules || [];
  } catch (e) {
    console.error(e);
  }

  const isSystemAdmin = user.role === 'SUPER_ADMIN' && !user.organizationId;
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isAccountsView = location.pathname.startsWith('/admin/accounts');
  const isAcademicsView = location.pathname.startsWith('/admin/academics');
  const isFeesView = location.pathname.startsWith('/admin/accounts/fees') || location.pathname.startsWith('/admin/accounts/whatsapp');

  const org = JSON.parse(localStorage.getItem('vms_org') || '{}');

  // Block Accounts access if RMS is disabled
  if (isAccountsView && !org.rmsEnabled) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Block Academics access if AMS is disabled
  if (isAcademicsView && !org.amsEnabled) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Block non-Accounts access if VMS is disabled (except for Staff Directory)
  const isVmsEnabled = org.vmsEnabled !== 0 && org.vmsEnabled !== false;
  const isStaffDirectoryView = location.pathname === '/admin/staff-directory';
  if (!isVmsEnabled && !isAccountsView && !isStaffDirectoryView) {
    return <Navigate to="/admin/accounts/dashboard" replace />;
  }

  // Accountant role cannot view normal VMS views or non-fee accounts views
  if (user.role === 'ACCOUNTANT' && !isFeesView) {
    return <Navigate to="/admin/accounts/fees?view=list" replace />;
  }

  // Operator role cannot view Accounts views
  if (user.role === 'OPERATOR' && isAccountsView) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const navItems = [];
  const showAccountsMenu = isAccountsView || !isVmsEnabled;

  if (showAccountsMenu) {
    if (user.role === 'ACCOUNTANT') {
      navItems.push({
        label: 'Create Fee Receipt',
        path: '/admin/accounts/fees/new',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        ),
      });

      navItems.push({
        label: 'Receipt History',
        path: '/admin/accounts/fees?view=list',
        checkActive: (loc) => loc.pathname === '/admin/accounts/fees' && new URLSearchParams(loc.search).get('view') !== 'analytics',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        ),
      });

      navItems.push({
        label: 'Fee Analytics',
        path: '/admin/accounts/fees?view=analytics',
        checkActive: (loc) => loc.pathname === '/admin/accounts/fees' && new URLSearchParams(loc.search).get('view') === 'analytics',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        ),
      });

      navItems.push({
        label: 'WhatsApp Delivery',
        path: '/admin/accounts/whatsapp',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        ),
      });
    } else {
      // Accounts Sidebar Menu
      navItems.push({
        label: 'Dashboard',
        path: '/admin/accounts/dashboard',
        end: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        ),
      });

      navItems.push({
        label: 'Fee Receipts',
        path: '/admin/accounts/fees',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        ),
      });

      navItems.push({
        label: 'Salary Slips',
        path: '/admin/accounts/salary',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <line x1="16" y1="2" x2="16" y2="4"></line>
            <line x1="8" y1="2" x2="8" y2="4"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        ),
      });

      navItems.push({
        label: 'Receipt Templates',
        path: '/admin/accounts/templates',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <path d="M9 9h8M9 13h8M9 17h5"></path>
          </svg>
        ),
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      navItems.push({
        label: 'Accounts Settings',
        path: '/admin/accounts/settings',
        icon: <FaCog size={18} />,
      });
      // Show Staff Directory in Accounts sidebar if VMS is disabled
      if (!isVmsEnabled) {
        const staffItem = ADMIN_NAV.find(item => item.path === '/admin/staff-directory');
        if (staffItem) navItems.push(staffItem);
      }
    }

    if ((user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && isVmsEnabled) {
      navItems.push({
        label: 'Exit Accounts',
        path: '/admin/dashboard',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        )
      });
    }
  } else if (isAcademicsView) {
    // Academics Sidebar Menu
    navItems.push({
      label: 'Dashboard',
      path: '/admin/academics/dashboard',
      end: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    });
    navItems.push({
      label: 'Teacher Directory',
      path: '/admin/academics/teachers',
      end: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    });
    navItems.push({
      label: 'Add Teacher',
      path: '/admin/academics/teachers/new',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      ),
    });

    navItems.push({
      label: 'Attendance Logs',
      path: '/admin/academics/attendance-logs',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    });


    navItems.push({
      label: 'Settings',
      path: '/admin/academics/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    });

    navItems.push({
      label: 'Exit Academics',
      path: '/admin/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      ),
    });
  } else {
    // Standard VMS Sidebar Menu
    const visitorSystemSubItems = [];

    // Always show Dashboard
    const dashboardItem = ADMIN_NAV.find(item => item.path === '/admin/dashboard');
    if (dashboardItem) visitorSystemSubItems.push(dashboardItem);

    // Visitor Management
    if (isSystemAdmin || enabledModules.includes('Visitor Management')) {
      const logsItem = ADMIN_NAV.find(item => item.path === '/admin/visitor-logs');
      if (logsItem) visitorSystemSubItems.push(logsItem);
    }

    // Student Gatepass OR Faculty Gatepass
    if (isSystemAdmin || enabledModules.includes('Student Gatepass') || enabledModules.includes('Faculty Gatepass')) {
      const gpItem = ADMIN_NAV.find(item => item.path === '/admin/student-gatepass');
      if (gpItem) visitorSystemSubItems.push(gpItem);
    }

    if (visitorSystemSubItems.length > 0) {
      navItems.push({
        label: 'Visitor System',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <circle cx="12" cy="10" r="2.5"></circle>
            <path d="M8.5 15.5a3.5 3.5 0 0 1 7 0"></path>
          </svg>
        ),
        subItems: visitorSystemSubItems
      });
    }

    // Staff Directory (Only visible for SUPER_ADMIN)
    if (user.role === 'SUPER_ADMIN') {
      const staffItem = ADMIN_NAV.find(item => item.path === '/admin/staff-directory');
      if (staffItem) navItems.push(staffItem);
    }

    // Student Gatepass (Add Student)
    if (isSystemAdmin || enabledModules.includes('Student Gatepass')) {
      const studentEntryItem = ADMIN_NAV.find(item => item.path === '/admin/student-entry');
      if (studentEntryItem) navItems.push(studentEntryItem);
    }

    // Vendor Management (Add Vendor)
    if (isSystemAdmin || enabledModules.includes('Vendor Management')) {
      const vendorEntryItem = ADMIN_NAV.find(item => item.path === '/admin/vendor-entry');
      if (vendorEntryItem) navItems.push(vendorEntryItem);
    }

    // Academics Link (Only show if not OPERATOR and AMS is enabled)
    if (user.role !== 'OPERATOR' && org.amsEnabled) {
      navItems.push({
        label: 'Academics',
        path: '/admin/academics',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        ),
      });
    }

    // Accounts Link (Only show if not OPERATOR and RMS is enabled)
    if (user.role !== 'OPERATOR' && org.rmsEnabled) {
      navItems.push({
        label: 'Accounts',
        path: '/admin/accounts/dashboard',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        ),
      });
    }

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      navItems.push({
        label: 'Master Records',
        path: '/admin/master-records',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        ),
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      navItems.push({
        label: 'Activity Logs',
        path: '/admin/activity-logs',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3"></path>
            <circle cx="12" cy="12" r="9"></circle>
          </svg>
        ),
      });

      navItems.push({
        label: 'Settings',
        path: '/admin/settings',
        icon: <FaCog size={18} />,
      });
    }
  }

  return (
    <div className={`layout ${isSidebarCollapsed ? 'layout--collapsed' : ''}`}>
      <Sidebar
        navItems={navItems}
        role="admin"
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onSupportClick={() => setIsSupportModalOpen(true)}
      />
      <main className="layout__main">
        <Header
          searchPlaceholder="Search visitors, students, or staff..."
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <div className="layout__content">
          <Outlet />
        </div>
        <Footer />
      </main>

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
