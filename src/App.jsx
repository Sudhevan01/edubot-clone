import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Homepage from './pages/landing/homepage/Homepage';
import Product from './pages/landing/product/Product';
import About from './pages/landing/about/About';
import Contact from './pages/landing/contact/Contact';
import Privacy from './pages/landing/privacy/Privacy';
import Terms from './pages/landing/terms/Terms';
import Accessibility from './pages/landing/accessibility/Accessibility';
import { isSessionValid } from './utils/session';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Scroll specific layout containers if they handle their own overflow
    const gateGuardMain = document.querySelector('.eduguard-main');
    if (gateGuardMain) {
      gateGuardMain.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

import GateGuardLayout from './components/layout/GateGuardLayout';
import AdminLayout from './components/layout/AdminLayout';
import TeacherLayout from './components/layout/TeacherLayout';

// Gate Guard Pages
import GateGuardDashboard from './pages/gateguard/Dashboard';
import VisitorEntry from './pages/gateguard/VisitorEntry';
import VisitorCheckout from './pages/gateguard/VisitorCheckout';
import GateGuardEntryList from './pages/gateguard/GateGuardEntryList';


// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import VisitorLogs from './pages/admin/VisitorLogs';
import StaffDirectory from './pages/admin/StaffDirectory';
import StudentGatepass from './pages/admin/StudentGatepass';
import StudentEntry from './pages/admin/StudentEntry';
import VendorEntry from './pages/admin/VendorEntry';
import MasterRecords from './pages/admin/MasterRecords';
import Settings from './pages/admin/Settings';
import ActivityLogs from './pages/admin/ActivityLogs';

// Accounts Pages
import AccountsDashboard from './pages/accounts/Dashboard';
import FeesList from './pages/accounts/FeesList';
import FeeForm from './pages/accounts/FeeForm';
import FeePreview from './pages/accounts/FeePreview';
import FeeSuccess from './pages/accounts/FeeSuccess';
import SalaryList from './pages/accounts/SalaryList';
import SalaryForm from './pages/accounts/SalaryForm';
import SalaryPreview from './pages/accounts/SalaryPreview';
import SalarySuccess from './pages/accounts/SalarySuccess';
import AccountsSettings from './pages/accounts/Settings';
import Employees from './pages/accounts/Employees';
import TemplatesList from './pages/accounts/TemplatesList';
import TemplateForm from './pages/accounts/TemplateForm';
import WhatsAppDelivery from './pages/accounts/WhatsAppDelivery';

// Academics Pages
import AcademicsDashboard from './pages/academics/Dashboard';
import AddTeacher from './pages/academics/AddTeacher';
import TeacherDirectory from './pages/academics/TeacherDirectory';
import SessionDetail from './pages/academics/SessionDetail';
import AttendanceLogs from './pages/academics/AttendanceLogs';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAssignments from './pages/teacher/Assignments';
import TeacherResults from './pages/teacher/Results';

import './styles/global.css';
import PWAHandler from './components/PWAHandler';


// Authentication Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();

  // Check JWT expiry on every protected page load
  if (!isSessionValid()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = JSON.parse(localStorage.getItem('vms_user'));
  const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
  const isVmsEnabled = org.vmsEnabled !== 0 && org.vmsEnabled !== false;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'OPERATOR')
      ? (isVmsEnabled ? '/admin/dashboard' : '/admin/accounts/dashboard')
      : (user.role === 'ACCOUNTANT' ? '/admin/accounts/fees' : (user.role === 'TEACHER' ? '/teacher/dashboard' : '/gateguard/dashboard'));
    return <Navigate to={redirectPath} replace />;
  }

  return children;
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

    const applyBranding = () => {
      const storedOrg = localStorage.getItem('vms_org');
      if (storedOrg) {
        try {
          const org = JSON.parse(storedOrg);
          if (org.themeColor) {
            document.documentElement.style.setProperty('--primary-500', org.themeColor);
            document.documentElement.style.setProperty('--primary-600', org.themeColor + 'e6');
            document.documentElement.style.setProperty('--primary-700', org.themeColor + 'cc');
          }
          if (org.name) {
            document.title = `${org.name} - VMS`;
          }
        } catch (e) {
          console.error('Error applying branding:', e);
        }
      }
    };

    applyBranding();

    window.addEventListener('storage', applyBranding);
    window.addEventListener('brandingUpdated', applyBranding);

    return () => {
      window.removeEventListener('storage', applyBranding);
      window.removeEventListener('brandingUpdated', applyBranding);
    };
  }, []);

  return (
    <BrowserRouter>
      <PWAHandler />
      <ScrollToTop />


      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Gate Guard routes — Protected */}
        <Route path="/gateguard" element={
          <ProtectedRoute allowedRoles={['GATEGUARD', 'ADMIN', 'SUPER_ADMIN']}>
            <GateGuardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<GateGuardDashboard />} />
          <Route path="visitor-entry" element={<VisitorEntry />} />
          <Route path="checkout" element={<VisitorCheckout />} />
          <Route path="entry-list" element={<GateGuardEntryList />} />
        </Route>

        {/* Teacher routes — Protected */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherDashboard />} />
          <Route path="schedules" element={<TeacherDashboard />} />
          <Route path="session/:id" element={<SessionDetail />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="results" element={<TeacherResults />} />
        </Route>

        {/* Admin routes — Protected */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="visitor-logs" element={<VisitorLogs />} />
          <Route path="staff-directory" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <StaffDirectory />
            </ProtectedRoute>
          } />
          <Route path="student-gatepass" element={<StudentGatepass />} />
          <Route path="student-entry" element={<StudentEntry />} />
          <Route path="student-entry/:id" element={<StudentEntry />} />
          <Route path="vendor-entry" element={<VendorEntry />} />
          <Route path="vendor-entry/:id" element={<VendorEntry />} />
          <Route path="master-records" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <MasterRecords />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="activity-logs" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <ActivityLogs />
            </ProtectedRoute>
          } />

          {/* Accounts Module Routes */}
          <Route path="accounts/dashboard" element={<AccountsDashboard />} />
          <Route path="accounts/fees" element={<FeesList />} />
          <Route path="accounts/fees/new" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
              <FeeForm />
            </ProtectedRoute>
          } />
          <Route path="accounts/fees/edit/:id" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <FeeForm />
            </ProtectedRoute>
          } />
          <Route path="accounts/fees/success/:id" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']}>
              <FeeSuccess />
            </ProtectedRoute>
          } />
          <Route path="accounts/fees/:id" element={<FeePreview />} />
          <Route path="accounts/salary" element={<SalaryList />} />
          <Route path="accounts/salary/new" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <SalaryForm />
            </ProtectedRoute>
          } />
          <Route path="accounts/salary/edit/:id" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <SalaryForm />
            </ProtectedRoute>
          } />
          <Route path="accounts/salary/success/:id" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <SalarySuccess />
            </ProtectedRoute>
          } />
          <Route path="accounts/salary/:id" element={<SalaryPreview />} />
          <Route path="accounts/settings" element={<AccountsSettings />} />
          <Route path="accounts/templates" element={<TemplatesList />} />
          <Route path="accounts/templates/new" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <TemplateForm />
            </ProtectedRoute>
          } />
          <Route path="accounts/templates/:id" element={<TemplateForm />} />
          <Route path="accounts/whatsapp" element={<WhatsAppDelivery />} />

          {/* Academics Module Routes */}
          <Route path="academics" element={<Navigate to="dashboard" replace />} />
          <Route path="academics/dashboard" element={<AcademicsDashboard />} />
          <Route path="academics/session/:id" element={<SessionDetail />} />
          <Route path="academics/teachers" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <TeacherDirectory />
            </ProtectedRoute>
          } />
          <Route path="academics/teachers/new" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AddTeacher />
            </ProtectedRoute>
          } />
          <Route path="academics/attendance-logs" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AttendanceLogs />
            </ProtectedRoute>
          } />
        </Route>


        {/* Defaults */}
        <Route path="/" element={<Homepage />} />
        <Route path="/product" element={<Product />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
