import React from 'react';
import DashboardOverview from '../../components/common/DashboardOverview';
import './Dashboard.css';

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');

  return (
    <div className="admin-dashboard-v2">
      <DashboardOverview role={user.role === 'SUPER_ADMIN' ? 'superadmin' : 'admin'} />
    </div>
  );
};

export default AdminDashboard;
