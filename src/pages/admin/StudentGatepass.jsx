import React, { useState, useEffect, useRef } from 'react';
import './StudentGatepass.css';
import { createStudentGatepass, createFacultyGatepass, getAllGatepasses, deleteGatepass, exportGatepasses, getOrgSettings } from '../../services/api';
import { sortGrades, sortSections } from '../../utils/sorting';
import CustomModal from '../../components/common/CustomModal';
import Toast from '../../components/common/Toast';
import GatepassForm from '../../components/gatepass/GatepassForm';
import GatepassBadge from '../../components/gatepass/GatepassBadge';
// 🔒 RE-ENABLED: Gatepass printing functions enabled
import { triggerGatePassPrint, reprintGatePass } from '../../utils/vmsPrint';

const StudentGatepass = () => {
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const userRole = user.role;
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPass, setCurrentPass] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [entryMode, setEntryMode] = useState('student'); // 'student' or 'faculty'
  const [activeTableTab, setActiveTableTab] = useState('student'); // 'student' or 'faculty'
  const [isViewMode, setIsViewMode] = useState(false);
  const dropdownRef = useRef(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isAlert: false
  });
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '' });

  const defaultGrades = ['NUR', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => String(i + 1))];
  const defaultSections = ['A', 'B', 'C', 'D', 'E'];
  const defaultDepartments = [];
  const defaultAuthorities = [];
  const [allowedGrades, setAllowedGrades] = useState(defaultGrades);
  const [allowedSections, setAllowedSections] = useState(defaultSections);
  const [allowedDepartments, setAllowedDepartments] = useState(defaultDepartments);
  const [allowedAuthorities, setAllowedAuthorities] = useState(defaultAuthorities);

  const [formData, setFormData] = useState({
    studentName: '',
    grade: '',
    section: '',
    busRoute: '',
    pickupBy: '',
    relation: '',
    pickupPhone: '',
    otherRelation: '',
    purpose: '',
    authority: '',
    exitPermittedBy: user.name || '',
    facultyName: '',
    department: '',
    expectedReturnTime: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const showError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }));
    setTimeout(() => {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }, 2000);
  };

  const handleNameChange = (field, value) => {
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    } else {
      showError(field, 'Only letters are allowed');
    }
  };

  const isFormValid = () => {
    if (entryMode === 'student') {
      const { studentName, grade, section, pickupBy, relation, purpose, authority, exitPermittedBy, pickupPhone } = formData;
      if (!studentName || !/^[A-Za-z\s]+$/.test(studentName)) return false;
      if (!grade || !section || !pickupBy || !relation || !purpose || !authority || !exitPermittedBy) return false;
      if (!/^[A-Za-z\s]+$/.test(pickupBy)) return false;
      // require phone for Guardian or Other
      if ((relation === 'Guardian' || relation === 'Other') && (!pickupPhone || pickupPhone.replace(/\D/g, '').length !== 10)) return false;
      return true;
    } else {
      const { facultyName, department, authority, exitPermittedBy, purpose } = formData;
      if (!facultyName || !/^[A-Za-z\s]+$/.test(facultyName)) return false;
      if (!department || !authority || !exitPermittedBy || !purpose) return false;
      return true;
    }
  };

  const [passes, setPasses] = useState([]);

  useEffect(() => {
    try {
      const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
      if (org.grades) setAllowedGrades(sortGrades(org.grades.split(',').map(g => g.trim())));
      if (org.sections) setAllowedSections(sortSections(org.sections.split(',').map(s => s.trim())));
      if (org.departments) setAllowedDepartments(org.departments.split(',').map(d => d.trim()));
      if (org.approvingAuthorities) setAllowedAuthorities(org.approvingAuthorities.split(',').map(a => a.trim()));
    } catch (e) {}

    const loadSettings = async () => {
      try {
        const response = await getOrgSettings();
        if (response.success && response.data) {
          if (response.data.grades) {
            setAllowedGrades(sortGrades(response.data.grades.split(',').map(g => g.trim())));
          }
          if (response.data.sections) {
            setAllowedSections(sortSections(response.data.sections.split(',').map(s => s.trim())));
          }
          if (response.data.departments) {
            setAllowedDepartments(response.data.departments.split(',').map(d => d.trim()));
          }
          if (response.data.approvingAuthorities) {
            setAllowedAuthorities(response.data.approvingAuthorities.split(',').map(a => a.trim()));
          }
        }
      } catch (err) {
        console.error('Failed to load custom grades/sections/departments/authorities:', err);
      }
    };
    loadSettings();
  }, []);

  // Load passes from API
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to top when form is opened
  useEffect(() => {
    if (showEntryForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showEntryForm]);

  useEffect(() => {
    const handleSidebarClick = (e) => {
      if (e.detail && e.detail.path === '/admin/student-gatepass') {
        setShowEntryForm(false);
        setShowPreview(false);
        setSearchQuery('');
        setStatusFilter('All');
        setGradeFilter('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
        setActiveTableTab('student');
      }
    };
    window.addEventListener('sidebar-click', handleSidebarClick);
    return () => {
      window.removeEventListener('sidebar-click', handleSidebarClick);
    };
  }, []);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, gradeFilter, startDate, endDate, activeTableTab, itemsPerPage]);

  // Load passes from API
  useEffect(() => {
    const fetchPasses = async () => {
      try {
        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const response = await getAllGatepasses(filters);
        if (response.success) {
          // Adapt backend data to frontend expected format
          const adapted = response.data.map(p => ({
            ...p,
            isFaculty: p.type === 'FACULTY',
            date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Approved',
            authority: p.approvingAuthority
          }));
          setPasses(adapted);
        }
      } catch (err) {
        console.error("Failed to fetch gatepasses:", err);
      }
    };
    fetchPasses();
  }, [startDate, endDate]);

  const handleGenerate = async (e) => {
    e.preventDefault();

    // Perform manual validation to show errors
    const newErrors = {};
    if (entryMode === 'student') {
      if (!formData.studentName) newErrors.studentName = 'Student name is required';
      if (!formData.grade) newErrors.grade = 'Grade is required';
      if (!formData.section) newErrors.section = 'Section is required';
      if (!formData.pickupBy) newErrors.pickupBy = 'Pickup person name is required';
      if (!formData.relation) newErrors.relation = 'Relation is required';
      if ((formData.relation === 'Guardian' || formData.relation === 'Other') &&
          (!formData.pickupPhone || formData.pickupPhone.replace(/\D/g, '').length !== 10)) {
        newErrors.pickupPhone = 'A valid 10-digit phone number is required for Guardian / Other';
      }
      if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    } else {
      if (!formData.facultyName) newErrors.facultyName = 'Faculty name is required';
      if (!formData.department) newErrors.department = 'Department is required';
      if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('vms_user'));
      const apiData = {
        ...formData,
        approvingAuthority: formData.authority
      };

      let response;
      if (entryMode === 'student') {
        response = await createStudentGatepass(apiData);
      } else {
        response = await createFacultyGatepass(apiData);
      }

      if (response.success) {
        const newPass = {
          ...response.data,
          isFaculty: entryMode === 'faculty',
          date: new Date(response.data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date(response.data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Approved',
          authority: response.data.approvingAuthority
        };

        // 🔒 RE-ENABLED: Gatepass Bluetooth printing enabled
        console.log('[VMS Print] Gatepass created — triggering gate pass print');
        triggerGatePassPrint(newPass);

        // Small delay: give the Android Bluetooth bridge time to initiate the print
        // before React re-renders and potentially causes focus/layout shifts.
        await new Promise(r => setTimeout(r, 700));

        // UI update happens AFTER print is dispatched
        setPasses([newPass, ...passes]);
        setCurrentPass(newPass);
        setShowPreview(true);
        setIsViewMode(true);
        setErrors({}); // Clear any existing errors
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Generation Failed',
        message: err.message || "Failed to generate gatepass",
        isAlert: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Print pass handler
  const handlePrintPass = () => {
    console.log('[VMS Debug] handlePrintPass clicked. currentPass:', currentPass);
    if (!currentPass) {
      alert('[VMS Debug] Cannot print: currentPass is null or undefined!');
      return;
    }
    try {
      reprintGatePass(currentPass);
    } catch (error) {
      console.error('[VMS Debug] reprintGatePass throw error:', error);
      alert('[VMS Debug] Error triggering print: ' + error.message);
    }
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Delete Gatepass?',
      message: 'Are you sure you want to permanently delete this gatepass record? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          const response = await deleteGatepass(id);
          if (response.success) {
            setPasses(passes.filter(p => p.id !== id));
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setToast({
              isOpen: true,
              title: 'Deleted Successfully',
              message: 'The gatepass record has been removed from the database.'
            });
          }
        } catch (err) {
          setModalConfig({
            isOpen: true,
            type: 'warning',
            title: 'Error',
            message: 'Failed to delete gatepass: ' + err.message,
            isAlert: true
          });
        }
      }
    });
  };

  const handleView = (pass) => {
    setCurrentPass(pass);
    setShowViewModal(true);
  };

  const handleOpenForm = (mode) => {
    setEntryMode(mode);
    setShowEntryForm(true);
    setIsViewMode(false);
    setDropdownOpen(false);
    setFormData({
      studentName: '',
      grade: '',
      section: '',
      busRoute: '',
      pickupBy: '',
      relation: '',
      pickupPhone: '',
      otherRelation: '',
      purpose: '',
      authority: allowedAuthorities[0] || 'Principal',
      exitPermittedBy: user.name || '',
      facultyName: '',
      department: '',
      expectedReturnTime: ''
    });
    setShowPreview(false);
  };

  const exportToExcel = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const blob = await exportGatepasses(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gatepass_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({
        isOpen: true,
        title: 'Export Successful',
        message: 'Your gatepass logs have been exported.'
      });
    } catch (err) {
      console.error("Failed to export gatepasses:", err);
      setToast({
        isOpen: true,
        title: 'Export Failed',
        message: 'Failed to export gatepasses: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEntryForm = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const filteredPasses = passes.filter(p => {
    if (activeTableTab === 'student' && p.isFaculty) return false;
    if (activeTableTab === 'faculty' && !p.isFaculty) return false;

    const nameToMatch = (p.isFaculty ? (p.facultyName || p.name) : (p.studentName || p.name)) || '';
    const passId = String(p.displayId || p.id || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = nameToMatch.toLowerCase().includes(searchLower) || passId.includes(searchLower);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesGradeOrDept = gradeFilter === 'All' ||
      (!p.isFaculty && String(p.grade) === gradeFilter) ||
      (p.isFaculty && String(p.department) === gradeFilter);

    return matchesSearch && matchesStatus && matchesGradeOrDept;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPasses = filteredPasses.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredPasses.length / itemsPerPage);

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
    <div className="gatepass-management-v2">
      {/* Filters & Actions Section (Always Visible) */}
      <section className="controls-row-v2 gatepass-filters">
        <div className="search-bar-v2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder={activeTableTab === 'student' ? "Search by student name or Pass ID..." : "Search by faculty name or Pass ID..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-dropdown-v2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            {activeTableTab === 'student' ? (
              <>
                <option value="All">All Grades</option>
                {allowedGrades.map((grade) => (
                  <option key={grade} value={grade}>{grade.match(/^\d+$/) ? `Grade ${grade}` : grade}</option>
                ))}
              </>
            ) : (
              <>
                <option value="All">All Departments</option>
                {allowedDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="range-filter-group">
          <div className="filter-dropdown-v2 date-picker-v2">
            <span className="filter-label">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-dropdown-v2 date-picker-v2">
            <span className="filter-label">Till</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>



        {userRole === 'SUPER_ADMIN' && (
          <button className="export-csv-btn" onClick={exportToExcel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </button>
        )}

        <div className="generate-btn-wrapper" style={{ position: 'relative', flexShrink: 0 }} ref={dropdownRef}>
          <button className="new-entry-btn-v2" onClick={toggleEntryForm}>
            Generate Gatepass
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          {dropdownOpen && (
            <div className="gatepass-dropdown-menu" style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              width: '180px',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              <div
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}
                onClick={() => handleOpenForm('student')}
                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                Student Pass
              </div>
              <div
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}
                onClick={() => handleOpenForm('faculty')}
                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                Faculty Pass
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Form and Preview side-by-side (Conditional) */}
      {showEntryForm && (
        <div className="entry-mode-container anim-fade-in" style={{ marginBottom: '32px' }}>
          <div className="gatepass-entry-grid">
            <GatepassForm
              entryMode={entryMode}
              formData={formData}
              setFormData={setFormData}
              setErrors={setErrors}
              handleNameChange={handleNameChange}
              errors={errors}
              isFormValid={isFormValid}
              handleSubmit={handleGenerate}
              loading={loading}
              isViewMode={isViewMode}
              allowedGrades={allowedGrades}
              allowedSections={allowedSections}
              allowedDepartments={allowedDepartments}
              allowedAuthorities={allowedAuthorities}
            />

            <div className="preview-card-v2">
              <GatepassBadge
                showPreview={showPreview}
                entryMode={entryMode}
                currentPass={currentPass}
                formData={formData}
              />

              <div className="preview-actions-v2">
                <button className="back-btn-v2" onClick={() => { setShowEntryForm(false); setShowPreview(false); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Close Form
                </button>
                <button
                  className="print-pass-btn-v2"
                  onClick={handlePrintPass}
                  disabled={!showPreview || !!currentPass?.exitTime}
                  title={currentPass?.exitTime ? 'Cannot print: pass has already been checked out' : 'Print Pass'}
                  style={currentPass?.exitTime ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  {currentPass?.exitTime ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  )}
                  Print Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Table Section (Always Visible Below Filters/Form) */}
      <section className="table-container-v2 anim-fade-in">
        <div className="table-header-v2 gatepass-tabs">
          <h2
            className={`table-title-v2 gatepass-tab ${activeTableTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTableTab('student')}
          >
            Student Records
          </h2>
          <h2
            className={`table-title-v2 gatepass-tab ${activeTableTab === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveTableTab('faculty')}
          >
            Faculty Records
          </h2>
        </div>

        <div className="table-responsive-wrapper">
          <table className="entries-table-v2">
            <thead>
              {activeTableTab === 'student' ? (
                <tr>
                  <th>NAME</th>
                  <th>GRADE & SEC</th>
                  <th>BUS ROUTE</th>
                  <th>PICKUP BY</th>
                  <th>RELATION</th>
                  <th>AUTHORITY</th>
                  <th>PURPOSE</th>
                  <th>EXIT PERMITTED BY</th>
                  <th>DATE</th>
                  <th>CHECKOUT TIME</th>
                  <th>ACTION</th>
                </tr>
              ) : (
                <tr>
                  <th>NAME</th>
                  <th>DEPARTMENT</th>
                  <th>AUTHORITY</th>
                  <th>PURPOSE</th>
                  <th>EXIT PERMITTED BY</th>
                  <th>DATE</th>
                  <th>EXPECTED RETURN</th>
                  <th>CHECKOUT TIME</th>
                  <th>RETURN TIME</th>
                  <th>ACTION</th>
                </tr>
              )}
            </thead>
            <tbody>
              {paginatedPasses.length > 0 ? (
                paginatedPasses.map((p) => (
                  <tr key={p.id}>
                    <td data-label="NAME">
                      <div className="visitor-cell-v2">
                        <div className="visitor-avatar-v2">
                          <span>{p.isFaculty ? (p.facultyName || '?').charAt(0) : (p.studentName || '?').charAt(0)}</span>
                        </div>
                        <span className="visitor-name-v2">{p.isFaculty ? p.facultyName : p.studentName}</span>
                      </div>
                    </td>
                    {activeTableTab === 'student' ? (
                      <>
                        <td data-label="GRADE & SEC"><span className="contact-cell-v2">{p.isFaculty ? p.department : `${p.grade} - ${p.section}`}</span></td>
                        <td data-label="BUS ROUTE"><span className="contact-cell-v2">{p.isFaculty ? 'N/A' : (p.busRoute || '-')}</span></td>
                        <td data-label="PICKUP BY">
                          <span className="contact-cell-v2" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{p.isFaculty ? 'N/A' : p.pickupBy}</span>
                            {!p.isFaculty && (p.relation === 'Guardian' || p.relation === 'Other') && p.pickupPhone && (
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>{p.pickupPhone}</span>
                            )}
                          </span>
                        </td>
                        <td data-label="RELATION"><span className="reason-cell-v2">{p.isFaculty ? 'N/A' : p.relation}</span></td>
                        <td data-label="AUTHORITY"><span className="added-by-name">{p.authority}</span></td>
                        <td data-label="PURPOSE"><span className="reason-cell-v2">{p.purpose}</span></td>
                        <td data-label="EXIT PERMITTED BY"><span className="added-by-name">{p.exitPermittedByName || '-'} ({p.exitPermittedByRole || 'Admin'})</span></td>
                        <td data-label="DATE"><span className="date-v2">{p.date} • {p.time}</span></td>
                        <td data-label="CHECKOUT TIME"><span className="time-v2">{p.exitTime ? new Date(p.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOT EXITED'}</span></td>

                      </>
                    ) : (
                      <>
                        <td data-label="DEPARTMENT"><span className="contact-cell-v2">{p.department}</span></td>
                        <td data-label="AUTHORITY"><span className="added-by-name">{p.authority}</span></td>
                        <td data-label="PURPOSE"><span className="reason-cell-v2">{p.purpose}</span></td>
                        <td data-label="EXIT PERMITTED BY"><span className="added-by-name">{p.exitPermittedByName || '-'} ({p.exitPermittedByRole || 'Admin'})</span></td>
                        <td data-label="DATE"><span className="date-v2">{p.date} • {p.time}</span></td>
                        <td data-label="EXPECTED RETURN"><span className="contact-cell-v2">{p.expectedReturnTime || '-'}</span></td>
                        <td data-label="CHECKOUT TIME"><span className="time-v2">{p.exitTime ? new Date(p.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOT EXITED'}</span></td>
                        <td data-label="RETURN TIME"><span className="time-v2">{p.returnTime ? new Date(p.returnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span></td>
                      </>
                    )}
                    <td data-label="ACTION">
                      <div className="action-group-v2">
                        <button className="action-btn-v2 edit" title="View/Print" onClick={() => handleView(p)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button className="action-btn-v2 delete" title="Delete" onClick={() => handleDelete(p.id)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTableTab === 'student' ? 13 : 10} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    No gatepass records found for {activeTableTab}s.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredPasses.length > 0 && (
          <div className="table-footer-v2">
            <div className="showing-entries-group-v2">
              <span className="showing-entries-v2">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPasses.length)} of {filteredPasses.length} entries
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

      {showViewModal && currentPass && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="preview-modal-v2" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gatepass Preview</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>

            <div className="preview-content" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="gatepass-modal-badge-wrapper" style={{ width: '100%', maxWidth: '450px' }}>
                <GatepassBadge
                  showPreview={true}
                  entryMode={currentPass.isFaculty ? 'faculty' : 'student'}
                  currentPass={currentPass}
                  formData={formData}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="close-action-btn"
                onClick={() => setShowViewModal(false)}
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                className="print-btn"
                onClick={handlePrintPass}
                disabled={!!currentPass?.exitTime}
                title={currentPass?.exitTime ? 'Cannot print: pass has already been checked out' : 'Print Pass'}
                style={{
                  flex: 1,
                  opacity: currentPass?.exitTime ? 0.6 : 1,
                  cursor: currentPass?.exitTime ? 'not-allowed' : 'pointer',
                  background: currentPass?.exitTime ? '#94a3b8' : undefined
                }}
              >
                {currentPass?.exitTime ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                )}
                Print Pass
              </button>
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

export default StudentGatepass;
