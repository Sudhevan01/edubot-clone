import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './VisitorTable.css';

const VisitorTable = ({ visitors, title, role, showViewAll = false, viewAllLink = "#", isSuperAdmin = true, showActions = true, isDashboard = false, hideDelete = false, tableType, onView, onCheckout, onDelete, onPermanentDelete, children }) => {
  const showRelation = tableType !== 'VENDOR' && tableType !== 'OTHER' && tableType !== 'GATEPASS';
  const showStudentInfo = tableType !== 'VENDOR' && tableType !== 'OTHER';
  const showVehicleNo = !tableType || tableType === 'VENDOR';

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [visitors, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVisitors = visitors.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(visitors.length / itemsPerPage);

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

  return (
    <section className="table-container-v2">
      {children}
      <div className="table-header-v2">
        <h2 className="table-title-v2">{title}</h2>
        {showViewAll && <Link to={viewAllLink} className="view-all-link-v2">View All Logs</Link>}
      </div>

      <div className="table-responsive-wrapper">
        <table className="entries-table-v2">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>VISITOR</th>
              {showRelation && <th>RELATION</th>}
              {showStudentInfo && <th>STUDENT NAME</th>}
              {showStudentInfo && <th>CLASS & SECTION</th>}
              <th>CONTACT NUMBER</th>
              <th>REASON FOR VISIT</th>
              {showVehicleNo && <th>VEHICLE NO.</th>}
              <th>NO OF ENTRIES</th>
              <th>DATE</th>
              <th>CHECK IN</th>
              <th>CHECK OUT</th>
              <th>ENTRY BY</th>
              {showActions && <th>{isDashboard ? 'REPRINT' : 'ACTION'}</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedVisitors.length > 0 ? (
              paginatedVisitors.map((v, index) => (
                <tr key={v.id || index}>
                  <td data-label="S.NO">{visitors.length - (startIndex + index)}</td>
                  <td data-label="VISITOR">
                    <div className="visitor-cell-v2">
                      <div 
                        className="visitor-avatar-v2" 
                        onClick={() => onView && onView(v)} 
                        style={{ cursor: 'pointer' }}
                        title="Click to preview visitor"
                      >
                        {v.avatar ? (
                          <img
                            src={v.avatar}
                            alt={v.name}
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error("Image load failed:", v.avatar);
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
                  {showRelation && <td data-label="RELATION"><span className="contact-cell-v2">{v.relation || '-'}</span></td>}
                  {showStudentInfo && <td data-label="STUDENT NAME"><span className="contact-cell-v2">{v.studentName || '-'}</span></td>}
                  {showStudentInfo && <td data-label="CLASS & SECTION"><span className="contact-cell-v2">{v.grade || '-'} {v.section && v.section !== '-' ? `- ${v.section}` : ''}</span></td>}
                  <td data-label="CONTACT NUMBER"><span className="contact-cell-v2">{v.contact}</span></td>
                  <td data-label="REASON FOR VISIT"><span className="reason-cell-v2">{v.reason}</span></td>
                  {showVehicleNo && <td data-label="VEHICLE NO."><span className="contact-cell-v2">{v.vehicleNumber || '-'}</span></td>}
                  <td data-label="NO OF ENTRIES" style={{ textAlign: 'center', fontWeight: 'bold' }}>{v.noofentry}</td>
                  <td data-label="DATE"><span className="date-v2">{v.date}</span></td>
                  <td data-label="CHECK IN"><span className="time-v2">{v.time || '-'}</span></td>
                  <td data-label="CHECK OUT"><span className="time-v2">{v.checkOutTime || '-'}</span></td>
                  <td data-label="ENTRY BY">
                    <div className="added-by-v2">
                      <span className="added-by-name">{v.addedBy || 'System'}</span>
                      <span className="added-by-role">{v.addedByRole || 'Admin'}</span>
                    </div>
                  </td>
                  <td data-label={isDashboard ? 'REPRINT' : 'ACTION'}>
                    <div className="action-group-v2">
                      {/* REPRINT OR VIEW BUTTON */}
                      {isDashboard ? (
                        <button
                          className="action-btn-v2 view"
                          title={v.checkOutTime ? "Checked out - reprint disabled" : "Reprint Pass"}
                          onClick={() => !v.checkOutTime && onView && onView(v)}
                          disabled={!!v.checkOutTime}
                          style={{
                            cursor: v.checkOutTime ? 'not-allowed' : 'pointer',
                            opacity: v.checkOutTime ? 0.4 : 1,
                            backgroundColor: v.checkOutTime ? '#f1f5f9' : undefined,
                            color: v.checkOutTime ? '#94a3b8' : undefined
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                          </svg>
                        </button>
                      ) : (
                        <button
                          className="action-btn-v2 edit"
                          title="View Details"
                          onClick={() => onView && onView(v)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                      )}

                      {/* MANUAL CHECKOUT BUTTON (Available for all roles if visitor is still IN) */}
                      {!v.checkOutTime && (
                        <button
                          className="action-btn-v2 checkout"
                          title="Manual Checkout"
                          onClick={() => onCheckout && onCheckout(v.id)}
                          style={{ background: '#ecfdf5', color: '#10b981' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                      )}

                      {/* DELETE BUTTONS (Super Admin Only, hidden if hideDelete is true) */}
                      {(isSuperAdmin && !hideDelete) && (
                        <>
                          <button
                            className="action-btn-v2 delete"
                            title="Delete Log"
                            onClick={() => onDelete && onDelete(v.id)}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                          {onPermanentDelete && (
                            <button
                              className="action-btn-v2 delete-master"
                              title="Delete Visitor Master Data"
                              onClick={() => onPermanentDelete(v)}
                              style={{ color: '#dc2626', background: '#fee2e2' }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" /></svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={16} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No visitor entries today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {visitors.length > 0 && (
        <div className="table-footer-v2">
          <div className="showing-entries-group-v2">
            <span className="showing-entries-v2">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, visitors.length)} of {visitors.length} entries
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
  );
};

export default VisitorTable;
