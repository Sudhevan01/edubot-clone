import React, { useState, useEffect } from 'react';
import './VisitorLogs.css';
import '../../components/common/DashboardOverview.css';
import { getAllVisits, deleteVisit, updateVisit, checkoutVisit, exportVisitorLogs, getQrUrl } from '../../services/api';
import CustomModal from '../../components/common/CustomModal';
import Toast from '../../components/common/Toast';
import { reprintVisitorPass } from '../../utils/vmsPrint';

const VisitorLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTableTab, setActiveTableTab] = useState('parent');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modal & Toast State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    const fetchVisitors = async () => {
      setLoading(true);
      try {
        const filters = {};
        filters.type = activeTableTab.toUpperCase();
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const response = await getAllVisits(filters);
        if (response.success) {
          const adapted = response.data.map(v => ({
            id: v.id,
            visitorId: v.displayId || v.visitorId,
            displayId: v.displayId,
            qrCode: v.qrCode || v.displayId || v.visitorId,
            name: v.visitorName || 'Unknown',
            type: v.visitorType || 'OTHER',
            studentName: v.studentName || '-',
            grade: v.grade || '-',
            section: v.section || '-',
            contact: v.visitorPhone || '-',
            relation: v.relation || '-',
            reason: v.purpose || '-',
            vehicleNumber: v.vehicleNumber || '-',
            noofentry: v.noofentry || 1,
            company: v.companyName || v.company || v.company_name || v.vendorCompany || v.visitorCompany || (v.visitor && (v.visitor.companyName || v.visitor.company || v.visitor.company_name)) || '-',
            date: new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOutTime: v.checkOut ? new Date(v.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            status: v.status === 'IN' ? 'ACTIVE' : 'CHECKED OUT',
            initials: (v.visitorName || '?').split(' ').map(n => n[0]).join('').toUpperCase(),
            avatar: v.visitorPhoto ? (v.visitorPhoto.startsWith('http') || v.visitorPhoto.startsWith('data:') ? v.visitorPhoto : `${import.meta.env.VITE_API_URL}/${v.visitorPhoto}`) : null,

            addedBy: v.createdByName || '-',
            addedByRole: (() => {
              const role = v.createdByRole;
              if (!role) return 'Admin';
              return role
                .toLowerCase()
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            })()
          }));
          setVisitors(adapted);
        }
      } catch (err) {
        console.error("Failed to fetch visitors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, [activeTableTab, startDate, endDate]);

  useEffect(() => {
    const handleSidebarClick = (e) => {
      if (e.detail && e.detail.path === '/admin/visitor-logs') {
        setSearchQuery('');
        setActiveTableTab('parent');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
        setItemsPerPage(10);
        setSelectedVisitor(null);
        setIsPreviewOpen(false);
      }
    };
    window.addEventListener('sidebar-click', handleSidebarClick);
    return () => {
      window.removeEventListener('sidebar-click', handleSidebarClick);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTableTab, startDate, endDate, itemsPerPage]);


  const filteredVisitors = visitors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.contact.includes(searchQuery)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVisitors = filteredVisitors.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  const getPaginationPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage <= 3) {
      const max = Math.max(3, currentPage + 1);
      for (let i = 2; i <= max; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push('...');
      const min = Math.min(totalPages - 2, currentPage - 1);
      for (let i = min; i < totalPages; i++) pages.push(i);
      pages.push(totalPages);
    } else {
      pages.push('...');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const handleView = (visitor) => {
    setSelectedVisitor(visitor);
    setIsPreviewOpen(true);
  };

  const handleCheckout = (id) => {
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
          const response = await checkoutVisit(id);
          if (response.success) {
            setVisitors(prev => prev.map(v => v.id === id ? { ...v, checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'CHECKED OUT' } : v));
            setModalConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setToast({
              isOpen: true,
              title: 'Checkout Successful',
              message: 'The visitor has been checked out successfully.'
            });
          }
        } catch (error) {
          console.error("Error checking out visitor:", error);
          setModalConfig(prev => ({ ...prev, isLoading: false, isOpen: false }));
          setToast({
            isOpen: true,
            title: 'Error',
            message: 'Failed to checkout: ' + error.message
          });
        }
      }
    });
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Delete Visitor Log?',
      message: 'Are you sure you want to permanently delete this visitor log? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      isLoading: false,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await deleteVisit(id);
          if (response.success) {
            setVisitors(prev => prev.filter(v => v.id !== id));
            setModalConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setToast({
              isOpen: true,
              title: 'Deleted Successfully',
              message: 'The visitor log record has been removed from the database.'
            });
          }
        } catch (error) {
          console.error("Error deleting record:", error);
          setModalConfig(prev => ({ ...prev, isLoading: false, isOpen: false }));
          setToast({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete: ' + error.message
          });
        }
      }
    });
  };

  const exportToCSV = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const blob = await exportVisitorLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Visitor_Logs_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({
        isOpen: true,
        title: 'Export Successful',
        message: 'Your visitor logs have been exported.'
      });
    } catch (err) {
      console.error("Failed to export visitor logs:", err);
      setToast({
        isOpen: true,
        title: 'Export Failed',
        message: 'Failed to export visitor logs: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const renderActionGroup = (v) => (
    <div className="action-group-v2">
      <button
        className="action-btn-v2 edit"
        title="View Details"
        onClick={() => handleView(v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>



      {isSuperAdmin && (
        <button
          className="action-btn-v2 delete"
          title="Delete Log"
          onClick={() => handleDelete(v.id)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="visitor-logs-page">
      <section className="controls-row-v2 log-filters">
        <div className="search-bar-v2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Search visitor by name, contact, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="range-filter-group">
          <div className="filter-dropdown-v2 date-picker-v2">
            <span className="filter-label">From</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="filter-dropdown-v2 date-picker-v2">
            <span className="filter-label">Till</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {isSuperAdmin && (
          <button className="export-csv-btn" onClick={exportToCSV}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </button>
        )}
      </section>

      {/* Dynamic Tabbed Table View */}
      <section className="table-container-v2 anim-fade-in">
        <div className="table-header-v2 visitor-tabs-row" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0', marginBottom: '24px', display: 'flex' }}>
          <h2
            className="table-title-v2"
            onClick={() => setActiveTableTab('parent')}
            style={{
              cursor: 'pointer',
              color: activeTableTab === 'parent' ? '#1d4ed8' : '#64748b',
              borderBottom: activeTableTab === 'parent' ? '3px solid #2563eb' : '3px solid transparent',
              paddingBottom: '16px',
              marginBottom: '-1px'
            }}
          >
            Parent Records
          </h2>
          <h2
            className="table-title-v2"
            onClick={() => setActiveTableTab('vendor')}
            style={{
              cursor: 'pointer',
              color: activeTableTab === 'vendor' ? '#1d4ed8' : '#64748b',
              borderBottom: activeTableTab === 'vendor' ? '3px solid #2563eb' : '3px solid transparent',
              paddingBottom: '16px',
              marginBottom: '-1px'
            }}
          >
            Vendor Records
          </h2>
          <h2
            className="table-title-v2"
            onClick={() => setActiveTableTab('other')}
            style={{
              cursor: 'pointer',
              color: activeTableTab === 'other' ? '#1d4ed8' : '#64748b',
              borderBottom: activeTableTab === 'other' ? '3px solid #2563eb' : '3px solid transparent',
              paddingBottom: '16px',
              marginBottom: '-1px'
            }}
          >
            Others Records
          </h2>
        </div>

        <div className="table-responsive-wrapper">
          <table className="entries-table-v2">
            <thead>
              {activeTableTab === 'parent' && (
                <tr>
                  <th>S.NO</th>
                  <th>VISITOR</th>
                  <th>STUDENT NAME</th>
                  <th>CLASS & SECTION</th>
                  <th>CONTACT NUMBER</th>
                  <th>RELATION</th>
                  <th>REASON FOR VISIT</th>
                  <th>ENTRIES</th>
                  <th>DATE</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>ENTRY BY</th>
                  <th>ACTION</th>
                </tr>
              )}
              {activeTableTab === 'vendor' && (
                <tr>
                  <th>S.NO</th>
                  <th>VISITOR</th>
                  <th>COMPANY NAME</th>
                  <th>REASON FOR THE VISIT</th>
                  <th>CONTACT NUMBER</th>
                  <th>VEHICLE NO</th>
                  <th>ENTRIES</th>
                  <th>DATE</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>ENTRY BY</th>
                  <th>ACTION</th>
                </tr>
              )}
              {activeTableTab === 'other' && (
                <tr>
                  <th>S.NO</th>
                  <th>VISITOR</th>
                  <th>CONTACT NUMBER</th>
                  <th>REASON FOR THE VISIT</th>
                  <th>ENTRIES</th>
                  <th>DATE</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>ENTRY BY</th>
                  <th>ACTION</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTableTab === 'parent' ? 13 : (activeTableTab === 'vendor' ? 12 : 10)} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
                    Loading records...
                  </td>
                </tr>
              ) : paginatedVisitors.length > 0 ? (
                paginatedVisitors.map((v, i) => (
                  <tr key={v.id}>
                    <td data-label="S.NO">{filteredVisitors.length - (startIndex + i)}</td>
                    <td data-label="VISITOR">
                      <div className="visitor-cell-v2">
                        <div 
                          className="visitor-avatar-v2" 
                          onClick={() => handleView(v)} 
                          style={{ cursor: 'pointer' }}
                          title="Click to preview visitor"
                        >
                          {v.avatar ? (
                            <img
                              src={v.avatar}
                              alt={v.name}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span style={{ display: v.avatar ? 'none' : 'flex' }}>{v.initials}</span>
                        </div>
                        <span className="visitor-name-v2">{v.name}</span>
                      </div>
                    </td>

                    {/* Tab-Specific Columns */}
                    {activeTableTab === 'parent' && (
                      <>
                        <td data-label="STUDENT NAME"><span className="contact-cell-v2">{v.studentName || '-'}</span></td>
                        <td data-label="CLASS & SECTION"><span className="contact-cell-v2">{v.grade} {v.section && v.section !== '-' ? `- ${v.section}` : ''}</span></td>
                        <td data-label="CONTACT NUMBER"><span className="contact-cell-v2">{v.contact}</span></td>
                        <td data-label="RELATION"><span className="contact-cell-v2">{v.relation || '-'}</span></td>
                        <td data-label="REASON FOR VISIT"><span className="reason-cell-v2">{v.reason}</span></td>
                      </>
                    )}
                    {activeTableTab === 'vendor' && (
                      <>
                        <td data-label="COMPANY NAME"><span className="contact-cell-v2"><strong>{v.company}</strong></span></td>
                        <td data-label="REASON FOR THE VISIT"><span className="reason-cell-v2">{v.reason}</span></td>
                        <td data-label="CONTACT NUMBER"><span className="contact-cell-v2">{v.contact}</span></td>
                        <td data-label="VEHICLE NO"><span className="contact-cell-v2">{v.vehicleNumber}</span></td>
                      </>
                    )}
                    {activeTableTab === 'other' && (
                      <>
                        <td data-label="CONTACT NUMBER"><span className="contact-cell-v2">{v.contact}</span></td>
                        <td data-label="REASON FOR THE VISIT"><span className="reason-cell-v2">{v.reason}</span></td>
                      </>
                    )}

                    <td data-label="ENTRIES"><span className="contact-cell-v2">{v.noofentry || 1}</span></td>
                    <td data-label="DATE"><span className="date-v2">{v.date}</span></td>
                    <td data-label="CHECK IN"><span className="time-v2">{v.time || '-'}</span></td>
                    <td data-label="CHECK OUT"><span className="time-v2">{v.checkOutTime || '-'}</span></td>
                    <td data-label="ENTRY BY">
                      <div className="added-by-v2">
                        <span className="added-by-name">{v.addedBy || 'System'}</span>
                        <span className="added-by-role">{v.addedByRole || 'Admin'}</span>
                      </div>
                    </td>
                    <td data-label="ACTION">
                      {renderActionGroup(v)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTableTab === 'parent' ? 12 : (activeTableTab === 'vendor' ? 11 : 9)} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    No {activeTableTab} records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredVisitors.length > 0 && (
          <div className="table-footer-v2">
            <div className="showing-entries-group-v2">
              <span className="showing-entries-v2">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredVisitors.length)} of {filteredVisitors.length} entries
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="entries-select-v2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="pagination-v2">
              <button
                className="page-btn-prev-next"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              {getPaginationPages().map((page, index) => (
                page === '...' ? (
                  <span key={`dots-${index}`} className="pagination-dots-v2">...</span>
                ) : (
                  <button
                    key={`page-${page}-${index}`}
                    className={`page-btn-v2 ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              ))}
              <button
                className="page-btn-prev-next"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {isPreviewOpen && selectedVisitor && (
        <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="preview-modal-v2" onClick={e => e.stopPropagation()}>
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
                       <img src={getQrUrl(selectedVisitor.qrCode || selectedVisitor.displayId || selectedVisitor.visitorId || selectedVisitor.id)} alt="QR Code" />
                       {(selectedVisitor.displayId || selectedVisitor.visitorId) && (
                         <span className="v-pass-status">{selectedVisitor.displayId || selectedVisitor.visitorId}</span>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="print-btn"
                onClick={() => !selectedVisitor.checkOutTime && reprintVisitorPass(selectedVisitor)}
                disabled={!!selectedVisitor.checkOutTime}
                title={selectedVisitor.checkOutTime ? 'Cannot reprint: visitor has already checked out' : 'Reprint Badge'}
                style={{
                  background: selectedVisitor.checkOutTime ? '#94a3b8' : '#2563eb',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  flex: 1,
                  border: 'none',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: selectedVisitor.checkOutTime ? 'not-allowed' : 'pointer',
                  opacity: selectedVisitor.checkOutTime ? 0.6 : 1
                }}
              >
                {selectedVisitor.checkOutTime ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                )}
                Reprint Badge
              </button>
              <button className="close-action-btn" onClick={() => setIsPreviewOpen(false)} style={{ background: '#f1f5f9', color: '#64748b', padding: '12px', borderRadius: '12px', flex: 1, border: 'none', fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}

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

export default VisitorLogs;
