import React, { useState, useEffect } from 'react';
import './ActivityLogs.css';
import { getAuditLogs } from '../../services/api';
import Toast from '../../components/common/Toast';

const ActivityLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [availableActions, setAvailableActions] = useState([]);
  const [availableEntities, setAvailableEntities] = useState([]);
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getAuditLogs({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        action: actionFilter,
        entityType: entityTypeFilter
      });

      if (response.success) {
        setLogs(response.data.logs || []);
        setTotalItems(response.data.pagination?.total || 0);
        setAvailableActions(response.data.filters?.actions || []);
        setAvailableEntities(response.data.filters?.entityTypes || []);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setToast({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to load activity logs.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage, actionFilter, entityTypeFilter, searchQuery]);

  // Listen to sidebar clicks to reset view
  useEffect(() => {
    const handleSidebarClick = (e) => {
      if (e.detail && e.detail.path === '/admin/activity-logs') {
        setSearchQuery('');
        setActionFilter('');
        setEntityTypeFilter('');
        setCurrentPage(1);
      }
    };
    window.addEventListener('sidebar-click', handleSidebarClick);
    return () => {
      window.removeEventListener('sidebar-click', handleSidebarClick);
    };
  }, []);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

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

  // Helper to map action code to user readable title
  const formatAction = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'Added';
      case 'UPDATE':
        return 'Modified';
      case 'DELETE':
        return 'Removed';
      case 'CHECKIN':
        return 'Checked In';
      case 'CHECKOUT':
        return 'Checked Out';
      case 'IMPORT':
        return 'Imported';
      default:
        return action || '—';
    }
  };

  // Helper to map entity type code to user readable label
  const formatEntity = (entity) => {
    switch (entity) {
      case 'Visitor':
        return 'Visitor';
      case 'Visit':
        return 'Visit Record';
      case 'Student':
        return 'Student';
      case 'User':
        return 'Staff User';
      case 'Gatepass':
        return 'Gatepass';
      case 'StudentGatepass':
        return 'Student Gatepass';
      case 'FacultyGatepass':
        return 'Faculty Gatepass';
      case 'Organization':
        return 'School Settings';
      default:
        return entity || '—';
    }
  };

  // Helper for action badges styling
  const getActionBadgeClass = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'audit-badge create';
      case 'UPDATE':
        return 'audit-badge update';
      case 'DELETE':
        return 'audit-badge delete';
      case 'CHECKIN':
        return 'audit-badge checkin';
      case 'CHECKOUT':
        return 'audit-badge checkout';
      case 'IMPORT':
        return 'audit-badge import';
      default:
        return 'audit-badge default';
    }
  };

  const getInitials = (name) => {
    return (name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="activity-logs-page">
      <section className="log-filters">
        <div className="search-bar-v2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by user name, email, or details..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="range-filter-group">
          <div className="filter-dropdown-v2">
            <span className="filter-label">Action</span>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Actions</option>
              {availableActions.map(act => (
                <option key={act} value={act}>{formatAction(act)}</option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown-v2">
            <span className="filter-label">Entity</span>
            <select value={entityTypeFilter} onChange={(e) => { setEntityTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Entities</option>
              {availableEntities.map(ent => (
                <option key={ent} value={ent}>{formatEntity(ent)}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="audit-table-container anim-fade-in">
        <div className="table-responsive-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="audit-state-cell">
                    <div className="audit-spinner"></div>
                    Loading activity logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="audit-row-hover">
                    <td data-label="Timestamp" className="audit-time-cell">
                      {formatDate(log.createdAt)}
                    </td>
                    <td data-label="User">
                      <div className="audit-user-info">
                        <span className="audit-user-name">{log.userName}</span>
                        <span className="audit-user-email">{log.userEmail}</span>
                      </div>
                    </td>
                    <td data-label="Role">
                      <span className="audit-user-role">
                        {log.userRole?.replace('_', ' ')}
                      </span>
                    </td>
                    <td data-label="Action">
                      <span className={getActionBadgeClass(log.action)}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td data-label="Target">
                      <div className="audit-target-cell">
                        <span className="target-type">{formatEntity(log.entityType)}</span>
                        {log.entityId && <span className="target-id">#{log.entityId}</span>}
                      </div>
                    </td>
                    <td data-label="Details" className="audit-desc-cell">
                      {log.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="audit-state-cell">
                    No activity logs found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && logs.length > 0 && (
          <div className="table-footer-v2">
            <div className="showing-entries-group-v2">
              <span className="showing-entries-v2">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="entries-select-v2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
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

      <Toast
        {...toast}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ActivityLogs;
