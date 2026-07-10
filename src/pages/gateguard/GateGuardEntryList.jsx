import React from 'react';
import DashboardOverview from '../../components/common/DashboardOverview';
import './GateGuardEntryList.css';

const GateGuardEntryList = () => {
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');

  return (
    <div className="admin-dashboard-v2">
      <DashboardOverview role="gateguard" />
    </div>
  );
};

export default GateGuardEntryList;
