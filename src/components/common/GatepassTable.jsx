import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './VisitorTable.css'; // Reuse table styles

const GatepassTable = ({ records, title, showViewAll = false, viewAllLink = "/admin/student-gatepass", isSuperAdmin = true }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [records, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = records.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(records.length / itemsPerPage);

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
      <div className="table-header-v2">
        <h2 className="table-title-v2">{title}</h2>
        {showViewAll && <Link to={viewAllLink} className="view-all-link-v2">View All Activity</Link>}
      </div>

      <div className="table-responsive-wrapper">
        <table className="entries-table-v2">
          <thead>
            <tr>
              <th>STUDENT NAME</th>
              <th>GRADE & SECTION</th>
              <th>PICKUP BY</th>
              <th>RELATION</th>
              <th>AUTHORITY</th>
              <th>STATUS</th>
              <th>DATE</th>
              <th>CHECKOUT TIME</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="visitor-cell-v2">
                      <div className="visitor-avatar-v2" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                        <span>{r.studentName.charAt(0)}</span>
                      </div>
                      <span className="visitor-name-v2">{r.studentName}</span>
                    </div>
                  </td>
                  <td><span className="reason-cell-v2">{r.grade}-{r.section}</span></td>
                  <td><span className="contact-cell-v2">{r.pickupBy}</span></td>
                  <td><span className="reason-cell-v2">{r.relation}</span></td>
                  <td><span className="reason-cell-v2">{r.authority}</span></td>
                  <td>
                    <span className={`type-pill-v2 ${r.status.toLowerCase() === 'approved' ? 'parent' : 'other'}`} style={{ textTransform: 'capitalize' }}>
                      {r.status}
                    </span>
                  </td>
                  <td><span className="date-v2">{r.date}</span></td>
                  <td><span className="time-v2" style={{ fontWeight: '700', color: '#1e293b' }}>{r.departureTime || r.time}</span></td>
                  <td>
                    <div className="action-group-v2">
                      <button className="action-btn-v2 edit" title="View/Print">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      {isSuperAdmin && (
                        <button className="action-btn-v2 delete" title="Delete">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No gatepass records found for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {records.length > 0 && (
        <div className="table-footer-v2">
          <div className="showing-entries-group-v2">
            <span className="showing-entries-v2">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, records.length)} of {records.length} entries
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

export default GatepassTable;
