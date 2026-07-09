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

// Teacher navigation items
const TEACHER_NAV = [
  {
    label: 'Dashboard',
    path: '/teacher/dashboard',
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    label: 'Assignments',
    path: '/teacher/assignments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    label: 'Results',
    path: '/teacher/results',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  }
];

const TeacherLayout = () => {
  const [authorized, setAuthorized] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [orgContextKey, setOrgContextKey] = useState(0);

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
          window.dispatchEvent(new Event('brandingUpdated'));
          setOrgContextKey((k) => k + 1);
        }
      })
      .catch(() => {
        // Non-fatal
      });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsSidebarCollapsed(false);

      if (width > 1280 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!isSessionValid()) {
      setAuthorized(false);
      return;
    }
    const user = JSON.parse(localStorage.getItem('vms_user'));
    setAuthorized(user.role === 'TEACHER');
  }, []);

  if (authorized === null) return null;
  if (!authorized) return <Navigate to="/login" replace />;

  return (
    <div className={`layout ${isSidebarCollapsed ? 'layout--collapsed' : ''}`}>
      <Sidebar
        navItems={TEACHER_NAV}
        role="teacher"
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onSupportClick={() => setIsSupportModalOpen(true)}
      />
      <main className="layout__main">
        <Header
          searchPlaceholder="Search students, classes..."
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

export default TeacherLayout;
