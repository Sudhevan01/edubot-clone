import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VisitorTable from './VisitorTable';
import CustomModal from './CustomModal';
import Toast from './Toast';
import './DashboardOverview.css';
import { getDashboardStats, getTodaysEntries, getTodaysGatepasses, checkoutVisit, deleteVisit, getQrUrl } from '../../services/api';
import { normalizeVisitorData, normalizeGatepassData, convertToTableFormat } from '../../utils/dataNormalization';
import { reprintVisitorPass } from '../../utils/vmsPrint';

const StatCard = ({ title, count, icon, colorClass, isActive, onClick }) => (
  <div className={`stat-card-v2 ${isActive ? 'active' : ''}`} onClick={onClick}>
    <div className="stat-card-v2__header">
      <div className={`stat-card-v2__icon-box ${colorClass}`}>
        {icon}
      </div>
    </div>
    <div className="stat-card-v2__info">
      <span className="stat-card-v2__label">{title}</span>
      <h3 className="stat-card-v2__value">{count}</h3>
    </div>
  </div>
);

const DashboardOverview = ({ role = 'gateguard' }) => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stats, setStats] = useState({
    totalVisitors: 0,
    todaysVisits: 0,
    todaysGatepasses: 0,
    breakdown: { PARENT: 0, VENDOR: 0, OTHER: 0 },
    totalEntries: 0,
    trends: { total: 'Stable', PARENT: 'Stable', VENDOR: 'Stable', OTHER: 'Stable', GATEPASS: 'Stable' }
  });
  const [visitors, setVisitors] = useState([]);
  const [todaysGatepasses, setTodaysGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modal & Toast State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    isLoading: false
  });
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '' });

  const handleView = (visitor) => {
    setSelectedVisitor(visitor);
    setIsPreviewOpen(true);
  };

  const handleManualCheckout = (visitId) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Checkout Visitor?',
      message: 'Are you sure you want to manually checkout this visitor?',
      confirmText: 'Checkout',
      isLoading: false,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await checkoutVisit(visitId);
          if (response.success) {
            setModalConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setToast({
              isOpen: true,
              title: 'Checkout Successful',
              message: 'The visitor has been checked out successfully.'
            });
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (err) {
          console.error("Checkout failed:", err);
          setModalConfig(prev => ({ ...prev, isLoading: false, isOpen: false }));
          setToast({
            isOpen: true,
            title: 'Error',
            message: 'Failed to checkout: ' + err.message
          });
        }
      }
    });
  };

  const handleDelete = (visitId) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Delete Visitor Log?',
      message: 'Are you sure you want to delete this visitor entry?',
      confirmText: 'Delete',
      isLoading: false,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await deleteVisit(visitId);
          if (response.success) {
            setModalConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setToast({
              isOpen: true,
              title: 'Deleted Successfully',
              message: 'The entry has been deleted successfully.'
            });
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (err) {
          console.error("Delete failed:", err);
          setModalConfig(prev => ({ ...prev, isLoading: false, isOpen: false }));
          setToast({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete: ' + err.message
          });
        }
      }
    });
  };

  const handleTypeChange = (value) => {
    const valUpper = value.toUpperCase();
    setTypeFilter(valUpper);
    setActiveCard(valUpper === 'ALL' ? 'All' : valUpper);
  };

  const handleCardClick = (type) => {
    const typeUpper = type.toUpperCase();
    setActiveCard(typeUpper === 'ALL' ? 'All' : typeUpper);
    setTypeFilter(typeUpper);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Optimization: Fetch both entries and gatepasses in parallel
        const [entriesData, gpData] = await Promise.all([
          getTodaysEntries(),
          getTodaysGatepasses()
        ]);

        let currentVisitors = [];
        let currentGPs = [];

        if (entriesData.success) {
          currentVisitors = normalizeVisitorData(entriesData.data);
          setVisitors(currentVisitors);
        }

        if (gpData.success) {
          currentGPs = normalizeGatepassData(gpData.data);
          setTodaysGatepasses(currentGPs.slice(0, 5));
        }

        // Calculate stats locally
        const breakdown = {
          PARENT: currentVisitors.filter(v => v.type === 'PARENT').length,
          VENDOR: currentVisitors.filter(v => v.type === 'VENDOR').length,
          OTHER: currentVisitors.filter(v => v.type === 'OTHER').length
        };

        setStats({
          totalEntries: currentVisitors.length + currentGPs.length,
          todaysVisits: currentVisitors.length,
          todaysGatepasses: currentGPs.length,
          breakdown,
          trends: { total: 'Stable', PARENT: 'Stable', VENDOR: 'Stable', OTHER: 'Stable', GATEPASS: 'Stable' }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredVisitors = visitors.filter(v => {
    const queryMatch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.contact.includes(searchQuery);
    const typeMatch = (typeFilter === 'ALL' || typeFilter === 'GATEPASS') ? true : v.type === typeFilter;
    return queryMatch && typeMatch;
  });

  // Normalize gatepass data to match VisitorTable format when filtered
  const normalizedGatepasses = todaysGatepasses.map(convertToTableFormat);

  const displayVisitors = typeFilter === 'GATEPASS'
    ? normalizedGatepasses.filter(gp => gp.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredVisitors;

  const isSuperAdmin = role === 'superadmin' || role === 'SUPER_ADMIN';

  return (
    <div className="dashboard-overview">
      {/* Stats Cards Section */}
      <section className="stats-row-v2">
        <StatCard
          title="TOTAL ENTRIES"
          count={stats.totalEntries}
          colorClass="blue"
          isActive={activeCard === 'All'}
          onClick={() => handleCardClick('All')}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
        />
        <StatCard
          title="PARENT VISITORS"
          count={stats.breakdown.PARENT}
          colorClass="indigo"
          isActive={activeCard === 'PARENT'}
          onClick={() => handleCardClick('PARENT')}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
        <StatCard
          title="VENDOR VISITORS"
          count={stats.breakdown.VENDOR}
          colorClass="orange"
          isActive={activeCard === 'VENDOR'}
          onClick={() => handleCardClick('VENDOR')}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18h6a1 1 0 0 0 1-1v-4.5c0-1.1-.9-2-2-2h-5V18Z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>}
        />
        <StatCard
          title="OTHER VISITORS"
          count={stats.breakdown.OTHER}
          colorClass="purple"
          isActive={activeCard === 'OTHER'}
          onClick={() => handleCardClick('OTHER')}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>}
        />
        <StatCard
          title="GATEPASSES TODAY"
          count={stats.todaysGatepasses}
          colorClass="green"
          isActive={activeCard === 'GATEPASS'}
          onClick={() => handleCardClick('GATEPASS')}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
      </section>

      {/* Search and Filters Section */}
      <section className="controls-row-v2">
        <div className="search-bar-v2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Search visitor by name, contact, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-dropdown-v2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          <select value={typeFilter} onChange={(e) => handleTypeChange(e.target.value)}>
            <option value="ALL">Filter by Type</option>
            <option value="PARENT">Parent</option>
            <option value="VENDOR">Vendor</option>
            <option value="GATEPASS">Gatepass</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </section>

      {/* Visitor Entries Table Section */}
      <div className="dashboard-tables-container">
        {(typeFilter === 'ALL' || typeFilter === 'PARENT') && (
          <VisitorTable
            visitors={displayVisitors.filter(v => v.type === 'PARENT')}
            title="Today's Parent Entries"
            tableType="PARENT"
            showViewAll={role !== 'gateguard'}
            viewAllLink='/admin/visitor-logs'
            isSuperAdmin={isSuperAdmin}
            role={role}
            showActions={true}
            isDashboard={true}
            hideDelete={true}
            onView={(v) => handleView(v)}
            onCheckout={(id) => handleManualCheckout(id)}
            onDelete={(id) => handleDelete(id)}
          />
        )}

        {(typeFilter === 'ALL' || typeFilter === 'VENDOR') && (
          <VisitorTable
            visitors={displayVisitors.filter(v => v.type === 'VENDOR')}
            title="Today's Vendor Entries"
            tableType="VENDOR"
            showViewAll={role !== 'gateguard'}
            viewAllLink='/admin/visitor-logs'
            isSuperAdmin={isSuperAdmin}
            role={role}
            showActions={true}
            isDashboard={true}
            hideDelete={true}
            onView={(v) => handleView(v)}
            onCheckout={(id) => handleManualCheckout(id)}
            onDelete={(id) => handleDelete(id)}
          />
        )}

        {(typeFilter === 'ALL' || typeFilter === 'OTHER') && (
          <VisitorTable
            visitors={displayVisitors.filter(v => v.type !== 'PARENT' && v.type !== 'VENDOR' && v.type !== 'GATEPASS')}
            title="Today's Other Entries"
            tableType="OTHER"
            showViewAll={role !== 'gateguard'}
            viewAllLink='/admin/visitor-logs'
            isSuperAdmin={isSuperAdmin}
            role={role}
            showActions={true}
            isDashboard={true}
            hideDelete={true}
            onView={(v) => handleView(v)}
            onCheckout={(id) => handleManualCheckout(id)}
            onDelete={(id) => handleDelete(id)}
          />
        )}

        {/* Today's Gatepass Activity Section */}
        {(typeFilter === 'ALL' || typeFilter === 'GATEPASS') && (
          <section className="table-container-v2">
            <div className="table-header-v2">
              <h2 className="table-title-v2">Today's Gatepass Activity</h2>
              {role !== 'gateguard' && <Link to={`/${role}/student-gatepass`} className="view-all-link-v2">View All Gatepasses</Link>}
            </div>

            <div className="table-responsive-wrapper">
              <table className="entries-table-v2">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>CLASS / DEPARTMENT</th>
                    <th>BUS ROUTE</th>
                    <th>PICKUP BY</th>
                    <th>PURPOSE</th>
                    <th>DATE</th>
                    <th>CHECKOUT TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysGatepasses.length > 0 ? (
                    todaysGatepasses.map((p) => (
                      <tr key={p.id}>
                        <td data-label="NAME">
                          <div className="visitor-cell-v2">
                            <span className="visitor-name-v2">{p.name}</span>
                          </div>
                        </td>
                        <td data-label="CLASS / DEPARTMENT"><span className="contact-cell-v2">{p.grade} {p.type !== 'FACULTY' ? `- ${p.section}` : ''}</span></td>
                        <td data-label="BUS ROUTE"><span className="contact-cell-v2">{p.busRoute || '-'}</span></td>
                        <td data-label="PICKUP BY"><span className="contact-cell-v2">{p.pickupBy}</span></td>
                        <td data-label="PURPOSE"><span className="contact-cell-v2">{p.purpose}</span></td>
                        <td data-label="DATE"><span className="date-v2">{p.date} • {p.createdAtTime}</span></td>
                        <td data-label="CHECKOUT TIME"><span className="time-v2">{p.time}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        No gatepass activity today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>

      {/* Visitor Preview Modal */}
      <CustomModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      >
        {selectedVisitor && (
          <div className="preview-modal-v2">
            <div className="modal-header">
              <h3>Visitor Entry Preview</h3>
              <button className="close-btn" onClick={() => setIsPreviewOpen(false)}>&times;</button>
            </div>

            <div className="preview-content">
              <div id="printable-badge" className="visitor-pass-card">
                <div className="v-pass-header">
                  <img 
                    src={(() => {
                      try {
                        const org = JSON.parse(localStorage.getItem('vms_org'));
                        return org?.logo || '/assets/images/logo1.png';
                      } catch {
                        return '/assets/images/logo1.png';
                      }
                    })()} 
                    alt="Logo" 
                    className="v-pass-logo" 
                  />
                  <span className="v-pass-title">Visitor Pass</span>
                </div>

                <div className="v-pass-body">
                  <div className="v-pass-info">
                    <div className="v-pass-field">
                      <label>NAME</label>
                      <h1>{selectedVisitor.name}</h1>
                    </div>
                    <div className="v-pass-field">
                      <label>VISITOR TYPE</label>
                      <p className="type-value">{selectedVisitor.type.toUpperCase()}</p>
                    </div>
                    <div className="v-pass-field">
                      <label>REASON FOR VISIT</label>
                      <p>{selectedVisitor.reason}</p>
                    </div>
                    <div className="v-pass-field">
                      <label>ENTRY TIME</label>
                      <p>{selectedVisitor.time}</p>
                    </div>
                  </div>

                  <div className="v-pass-media">
                    <div className="v-pass-photo">
                      {selectedVisitor.avatar && !selectedVisitor.avatar.endsWith('/null') && !selectedVisitor.avatar.endsWith('/undefined') && !selectedVisitor.avatar.endsWith('/-') && selectedVisitor.avatar !== `${import.meta.env.VITE_API_URL}/` ? (
                        <img src={selectedVisitor.avatar} alt="Visitor" />
                      ) : (
                        <div className="v-pass-initials">{selectedVisitor.initials}</div>
                      )}
                    </div>
                    <div className="v-pass-qr">
                      <img src={getQrUrl(selectedVisitor.qrCode || selectedVisitor.visitorId || selectedVisitor.id)} alt="QR Code" />
                      {selectedVisitor.visitorId && (
                        <span className="v-pass-status">{selectedVisitor.visitorId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {!selectedVisitor.checkOutTime && (
                <button className="print-btn" onClick={() => reprintVisitorPass(selectedVisitor)} style={{ background: '#2563eb', color: 'white', padding: '12px', borderRadius: '12px', flex: 1, border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Reprint Badge
                </button>
              )}
              <button className="close-action-btn" onClick={() => setIsPreviewOpen(false)} style={{ background: '#f1f5f9', color: '#64748b', padding: '12px', borderRadius: '12px', flex: 1, border: 'none', fontWeight: 700, width: selectedVisitor.checkOutTime ? '100%' : undefined }}>Close</button>
            </div>
          </div>
        )}
      </CustomModal>



      <CustomModal
        {...modalConfig}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <Toast
        {...toast}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default DashboardOverview;
