import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMasterRecords, updateMasterRecord, deleteMasterRecord } from '../../services/api';
import CustomModal from '../../components/common/CustomModal';
import Toast from '../../components/common/Toast';
import './MasterRecords.css';
import '../../components/common/VisitorTable.css';

const MasterRecords = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // Get visible tabs based on tenant active modules
  const getVisibleTabs = () => {
    let enabledModules = [];
    try {
      const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
      enabledModules = org.modules || [];
    } catch (e) {
      console.error(e);
    }

    const isSystemAdmin = user.role === 'SUPER_ADMIN' && !user.organizationId;

    if (isSystemAdmin || enabledModules.length === 0) {
      return [
        { id: 'students', label: 'Registered Students' },
        { id: 'vendors', label: 'Registered Vendors' },
        { id: 'visitors', label: 'Visitor Identities' }
      ];
    }

    const tabs = [];
    if (enabledModules.includes('Student Gatepass') || enabledModules.includes('Faculty Gatepass')) {
      tabs.push({ id: 'students', label: 'Registered Students' });
    }
    if (enabledModules.includes('Vendor Management')) {
      tabs.push({ id: 'vendors', label: 'Registered Vendors' });
    }
    if (enabledModules.includes('Visitor Management')) {
      tabs.push({ id: 'visitors', label: 'Visitor Identities' });
    }
    return tabs;
  };

  const visibleTabs = getVisibleTabs();
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || 'students');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, itemsPerPage]);

  // Visitor Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getMasterRecords(activeTab);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching master records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    if (activeTab === 'visitors') {
      setEditingItem(item);
      setEditFormData({ ...item });
    } else {
      const route = activeTab === 'students' ? 'student-entry' : 'vendor-entry';
      navigate(`/admin/${route}/${item.id}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await updateMasterRecord(activeTab, editingItem.id, editFormData);
      if (response.success) {
        setEditingItem(null);
        fetchData(); // Refresh list
        setToast({
          isOpen: true,
          title: 'Update Successful',
          message: 'The visitor record has been updated successfully.'
        });
      }
    } catch (error) {
      console.error("Error updating record:", error);
      alert('Failed to update: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Delete Master Record?',
      message: 'Are you sure you want to permanently delete this master record? This action cannot be undone and may affect visitor history.',
      confirmText: 'Delete Permanently',
      isLoading: false,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const response = await deleteMasterRecord(activeTab, id);
          if (response.success) {
            fetchData(); // Refresh list
            setModalConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setToast({
              isOpen: true,
              title: 'Deleted Successfully',
              message: 'The master record has been removed from the database.'
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

  const filteredData = data.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const fieldsToSearch = [
      item.name,
      item.studentName,
      item.phone,
      item.company,
      item.fatherName,
      item.fatherPhone,
      item.motherName,
      item.motherPhone,
      item.guardianName,
      item.guardianPhone,
      item.grade,
      item.section,
      item.email,
      item.type
    ];
    return fieldsToSearch.some(val => 
      val && String(val).toLowerCase().includes(searchStr)
    );
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
    <div className="master-records-container">
      <div className="master-controls">
        <div className="tab-navigation">
          {visibleTabs.map(tab => (
            <button 
              key={tab.id} 
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-bar-v2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="records-table-container">
        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>Loading records...</p></div>
        ) : (
          <table className="master-table entries-table-v2">
            <thead>
              {activeTab === 'students' && (
                <tr><th>NAME</th><th>GRADE & SEC</th><th>FATHER NAME</th><th>FATHER CONTACT</th><th>MOTHER NAME</th><th>MOTHER CONTACT</th><th>GUARDIAN NAME</th><th>GUARDIAN CONTACT</th>{isSuperAdmin && <th>ACTION</th>}</tr>
              )}
              {activeTab === 'vendors' && (
                <tr><th>VENDOR NAME</th><th>COMPANY</th><th>PHONE</th><th>REGISTERED ON</th>{isSuperAdmin && <th>ACTION</th>}</tr>
              )}
              {activeTab === 'visitors' && (
                <tr><th>VISITOR NAME</th><th>PHONE</th><th>LAST UPDATED</th>{isSuperAdmin && <th>ACTION</th>}</tr>
              )}
            </thead>
            <tbody>
              {paginatedData.length > 0 ? paginatedData.map((item) => (
                <tr key={item.id}>
                  {activeTab === 'students' && (
                    <>
                      <td data-label="NAME"><strong>{item.name || item.studentName || '-'}</strong></td>
                      <td data-label="GRADE & SEC">{item.grade || '-'} - {item.section || '-'}</td>
                      <td data-label="FATHER NAME">{item.fatherName || '-'}</td>
                      <td data-label="FATHER CONTACT">{item.fatherPhone || '-'}</td>
                      <td data-label="MOTHER NAME">{item.motherName || '-'}</td>
                      <td data-label="MOTHER CONTACT">{item.motherPhone || '-'}</td>
                      <td data-label="GUARDIAN NAME">{item.guardianName || '-'}</td>
                      <td data-label="GUARDIAN CONTACT">{item.guardianPhone || '-'}</td>
                    </>
                  )}
                  {activeTab === 'vendors' && (
                    <>
                      <td data-label="VENDOR NAME"><strong>{item.name || '-'}</strong></td>
                      <td data-label="COMPANY">{item.company || '-'}</td>
                      <td data-label="PHONE">{item.phone || '-'}</td>
                      <td data-label="REGISTERED ON">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    </>
                  )}
                  {activeTab === 'visitors' && (
                    <>
                      <td data-label="VISITOR NAME"><strong>{item.name || 'Unknown'}</strong></td>
                      <td data-label="PHONE">{item.phone || '-'}</td>
                      <td data-label="LAST UPDATED">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</td>
                    </>
                  )}
                  {isSuperAdmin && (
                    <td data-label="ACTION">
                      <div className="action-group-v2">
                        <button className="action-btn-v2 edit" onClick={() => handleEditClick(item)} title="Edit Record">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className="action-btn-v2 delete" onClick={() => handleDelete(item.id)} title="Delete Record">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan="10" className="no-records">No master records found.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {!loading && filteredData.length > 0 && (
          <div className="table-footer-v2">
            <div className="showing-entries-group-v2">
              <span className="showing-entries-v2">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
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
      </div>

      {editingItem && activeTab === 'visitors' && (
        <div className="modal-overlay">
          <div className="edit-modal-v2">
            <div className="modal-header">
              <h3>Edit Visitor Record</h3>
              <button className="close-btn" onClick={() => setEditingItem(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="edit-form">
              <div className="form-scroll-area">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Visitor Name</label>
                    <input name="name" value={editFormData.name || ''} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" value={editFormData.phone || ''} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Visitor Type</label>
                    <select name="type" value={editFormData.type || ''} onChange={handleInputChange}>
                      <option value="PARENT">PARENT</option>
                      <option value="VENDOR">VENDOR</option>
                      <option value="OFFICIAL">OFFICIAL</option>
                      <option value="GUEST">GUEST</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setEditingItem(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="update-btn" disabled={saving}>{saving ? 'Updating...' : 'Update Record'}</button>
              </div>
            </form>
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

export default MasterRecords;
