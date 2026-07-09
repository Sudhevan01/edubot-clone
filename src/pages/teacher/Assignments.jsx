import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaPlus, FaEdit, FaTrashAlt, FaFilePdf, FaFileWord, FaFileImage, FaFileAlt,
  FaCalendarAlt, FaBookOpen, FaTimes, FaCloudUploadAlt, FaDownload, FaSearch, FaInfoCircle
} from 'react-icons/fa';
import { Clock, Book, Target } from 'lucide-react';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getTeacherClasses,
  getBaseUrl,
  downloadAssignmentFile
} from '../../services/api';
import './Teacher.css';
import '../admin/VisitorLogs.css';
import '../accounts/styling/Accounts.css';

const CustomSelect = ({ value, onChange, options, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="acad-filter-dropdown" ref={dropdownRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
      {icon}
      <div className="custom-select-trigger" style={{
        padding: '0 30px 0 44px',
        fontSize: '12.5px',
        fontWeight: 600,
        color: '#334155',
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}>
        {selectedOption?.label || placeholder}
      </div>
      
      <svg className="dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: `translateY(-50%) ${isOpen ? 'rotate(180deg)' : ''}`,
        transition: 'transform 0.2s ease',
        color: '#64748b',
        pointerEvents: 'none'
      }}>
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {isOpen && (
        <div className="custom-select-options" style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '6px',
          boxSizing: 'border-box'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: value === opt.value ? 700 : 500,
                color: value === opt.value ? '#1d4ed8' : '#475569',
                backgroundColor: value === opt.value ? '#eff6ff' : 'transparent',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterSubject, setFilterSubject] = useState('All Subjects');

  // Success/Error Feedback Alerts
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Form State
  const [formClass, setFormClass] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  const loadData = async () => {
    try {
      setLoading(true);
      const assignmentsRes = await getAssignments();
      if (assignmentsRes.success) {
        setAssignments(assignmentsRes.data);
      }
      const classesRes = await getTeacherClasses();
      if (classesRes.success && classesRes.data) {
        setAssignedClasses(classesRes.data);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
      showFeedback('error', 'Failed to retrieve assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Helper to show temporary feedback
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  // Populate form if editing
  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    const classVal = `${assignment.grade}-${assignment.section}`;
    setFormClass(classVal);
    setFormSubject(assignment.subject);
    setFormTitle(assignment.title);
    setFormDescription(assignment.description);

    // Format date string to YYYY-MM-DD safely
    let dateStr = '';
    if (assignment.dueDate) {
      const d = new Date(assignment.dueDate);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
    }
    setFormDueDate(dateStr);

    setAttachmentFile(null); // Reset new file selection
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setFormClass('');
    setFormSubject('');
    setFormTitle('');
    setFormDescription('');
    setFormDueDate('');
    setAttachmentFile(null);
    setIsModalOpen(true);
  };

  // Handle file input selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  // Extract classes list options (grade-section pairs)
  const uniqueClassesOptions = useMemo(() => {
    const list = assignedClasses.map(c => c.grade);
    return [...new Set(list)].sort();
  }, [assignedClasses]);

  // Dynamically filter subjects in dropdown
  const formSubjectsOptions = useMemo(() => {
    const list = assignedClasses
      .filter(c => {
        if (!formClass) return true;
        return c.grade === formClass;
      })
      .map(c => c.subject);
    return [...new Set(list)].sort();
  }, [assignedClasses, formClass]);

  // Search & Filtered assignments list
  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const itemClass = `${item.grade}-${item.section}`;
      const matchesClass = filterClass === 'All Classes' || itemClass === filterClass;
      const matchesSubject = filterSubject === 'All Subjects' || item.subject.toLowerCase() === filterSubject.toLowerCase();

      return matchesSearch && matchesClass && matchesSubject;
    });
  }, [assignments, searchQuery, filterClass, filterSubject]);

  // Unique lists for filtering sidebar/top headers
  const filterClassList = useMemo(() => {
    const list = assignments.map(item => `${item.grade}-${item.section}`);
    return ['All Classes', ...new Set(list)].sort();
  }, [assignments]);

  const filterSubjectList = useMemo(() => {
    const list = assignments.map(item => item.subject);
    return ['All Subjects', ...new Set(list)].sort();
  }, [assignments]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    console.log("DEBUG: assignedClasses =", assignedClasses);
    console.log("DEBUG: uniqueClassesOptions =", uniqueClassesOptions);
    console.log("DEBUG: formClass =", formClass);
    console.log("DEBUG: formSubjectsOptions =", formSubjectsOptions);
  }, [assignedClasses, uniqueClassesOptions, formClass, formSubjectsOptions]);

  // Due Date relative badge helper
  const getDueDateBadge = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', bg: 'var(--danger-50)', color: 'var(--danger-700)', border: 'var(--danger-200)' };
    } else if (diffDays === 0) {
      return { text: 'Due Today', bg: 'var(--warning-50)', color: 'var(--warning-700)', border: 'var(--warning-200)' };
    } else if (diffDays === 1) {
      return { text: 'Due Tomorrow', bg: '#fffbeb', color: '#b45309', border: '#fef3c7' };
    } else {
      return { text: `Due in ${diffDays} days`, bg: 'var(--primary-50)', color: '#2563EB', border: 'var(--primary-100)' };
    }
  };

  const handlePostOrUpdate = async (e) => {
    e.preventDefault();
    if (!formClass || !formSubject || !formTitle || !formDescription || !formDueDate) {
      showFeedback('error', 'All fields are required.');
      return;
    }

    try {
      setSubmitting(true);

      let grade = formClass;
      let section = '';
      if (formClass.includes('-')) {
        const parts = formClass.split('-');
        grade = parts[0];
        section = parts[1];
      }

      const formData = new FormData();
      formData.append('grade', grade);
      formData.append('section', section);
      formData.append('subject', formSubject);
      formData.append('title', formTitle);
      formData.append('description', formDescription);
      formData.append('dueDate', formDueDate);
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      let res;
      if (editingAssignment) {
        res = await updateAssignment(editingAssignment.id, formData);
      } else {
        res = await createAssignment(formData);
      }

      if (res.success) {
        showFeedback('success', editingAssignment ? 'Assignment updated successfully!' : 'Assignment posted successfully!');
        setIsModalOpen(false);
        loadData();
      } else {
        showFeedback('error', res.message || 'Failed to save assignment.');
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    try {
      const res = await deleteAssignment(id);
      if (res.success) {
        showFeedback('success', 'Assignment deleted successfully!');
        loadData();
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Failed to delete assignment.');
    }
  };

  const formatDisplayDateLocal = (dateStr) => {
    if (!dateStr) return '';
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFileAlt size={16} />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FaFilePdf size={18} style={{ color: '#ef4444' }} />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord size={18} style={{ color: '#2563EB' }} />;
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return <FaFileImage size={18} style={{ color: '#10b981' }} />;
    return <FaFileAlt size={18} style={{ color: 'var(--text-muted)' }} />;
  };

  const apiBaseUrl = getBaseUrl();

  // Statistics summaries
  const stats = useMemo(() => {
    const total = assignments.length;
    const dueToday = assignments.filter(a => {
      if (!a.dueDate) return false;
      const d = new Date(a.dueDate);
      if (isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dStr = `${year}-${month}-${day}`;

      const today = new Date();
      const tYear = today.getFullYear();
      const tMonth = String(today.getMonth() + 1).padStart(2, '0');
      const tDay = String(today.getDate()).padStart(2, '0');
      const todayStr = `${tYear}-${tMonth}-${tDay}`;

      return dStr === todayStr;
    }).length;

    // Unique classes targeted
    const classes = [...new Set(assignments.map(a => `${a.grade}-${a.section}`))].length;

    return { total, dueToday, classes };
  }, [assignments]);

  return (
    <div className="accounts-container" style={{ marginTop: '-10px' }}>

      {/* Scoped overrides — VisitorLogs theme, compact */}
      <style>{`
        .acad-filters.log-filters {
          gap: 8px;
          padding: 10px 16px;
          border-radius: 16px;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: center;
          background-color: var(--bg-card);
          border: 1px solid var(--neutral-200);
        }
        .acad-filters .search-input-wrapper-v2 {
          position: relative;
          flex: 1;
          min-width: 240px;
          height: 38px;
        }
        .acad-filters .search-input-wrapper-v2 input {
          width: 100%;
          height: 100%;
          padding: 0 12px 0 38px;
          border-radius: 10px;
          border: 1px solid var(--neutral-300);
          background-color: var(--bg-card);
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
        }
        .acad-filters .search-input-wrapper-v2 svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .acad-filters .acad-filter-dropdown {
          position: relative;
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s;
          box-sizing: border-box;
          min-width: unset !important;
          width: auto;
          height: 38px;
          flex-shrink: 0;
        }
        .acad-filters .acad-filter-dropdown:hover {
          border-color: #cbd5e1;
          background: white;
        }
        .acad-filters .acad-filter-dropdown select {
          padding: 0 8px 0 30px;
          font-size: 12.5px;
          min-width: 150px;
          width: auto;
          background: transparent;
          border: none;
          color: #334155;
          cursor: pointer;
          outline: none;
          appearance: none;
          height: 100%;
        }
        .acad-filters .acad-filter-dropdown svg {
          position: absolute;
          left: 10px;
          color: #64748b;
          pointer-events: none;
          z-index: 1;
        }

        /* Responsive Mobile Overrides */
        @media (max-width: 768px) {
          .acad-filters.log-filters {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .acad-filters .search-input-wrapper-v2 {
            width: 100% !important;
            flex: none !important;
            box-sizing: border-box !important;
          }
          .acad-filters .acad-filter-dropdown {
            display: flex !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .acad-filters .acad-filter-dropdown select {
            width: 100% !important;
            min-width: 0 !important;
            flex: 1 !important;
          }
          .acad-filters .post-assignment-btn {
            width: 100% !important;
            margin-left: 0 !important;
            justify-content: center !important;
          }
        }
        .acad-filters .post-assignment-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 18px;
          height: 38px;
          background-color: var(--primary-600);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          margin-left: auto;
          box-shadow: 0 4px 14px rgba(37,99,235,0.15);
          transition: all 0.2s ease-in-out;
        }
        .acad-filters .post-assignment-btn:hover {
          background-color: var(--primary-700);
          transform: translateY(-1px);
        }
        .acad-filters .post-assignment-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Stats Summary Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--neutral-200)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaBookOpen size={20} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Active</h4>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--neutral-200)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.08)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Due Today</h4>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.dueToday}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--neutral-200)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.08)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={20} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active Classes</h4>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.classes}</span>
          </div>
        </div>
      </div>

      {/* Feedback alerts */}
      {feedback.message && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: feedback.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
          color: feedback.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
          borderRadius: '10px', fontSize: '14px', fontWeight: 500,
          border: `1px solid ${feedback.type === 'success' ? 'var(--success-200)' : 'var(--danger-200)'}`,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <FaInfoCircle size={16} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Controls / Filters Row — VisitorLogs theme, compact */}
      <section className="acad-filters log-filters no-print">

        {/* Search */}
        <div className="search-input-wrapper-v2">
          <FaSearch size={14} />
          <input
            type="text"
            placeholder="Search assignments by title, description, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Class Filter */}
        <CustomSelect
          value={filterClass}
          onChange={(val) => setFilterClass(val)}
          options={filterClassList.map(c => ({
            value: c,
            label: c === 'All Classes' ? c : `Grade ${c}`
          }))}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
        />

        {/* Subject Filter */}
        <CustomSelect
          value={filterSubject}
          onChange={(val) => setFilterSubject(val)}
          options={filterSubjectList.map(s => ({
            value: s,
            label: s
          }))}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
        />

        {/* Post Assignment Button — margin-left: auto pushes it right */}
        <button className="post-assignment-btn" onClick={handleOpenCreate}>
          <FaPlus size={11} /> Post New Assignment
        </button>
      </section>

      {/* Main Grid View */}
      {loading ? (
        <div style={{ padding: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--neutral-200)', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Loading assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--neutral-300)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-50)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaBookOpen size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No Matching Assignments</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '380px' }}>Try adjusting your search criteria or filters to locate assignments.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredAssignments.map((assignment) => {
            const badge = getDueDateBadge(assignment.dueDate);
            return (
              <div
                key={assignment.id}
                style={{
                  backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--neutral-200)',
                  padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header Row: Subject, Class & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(37,99,235,0.06)', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {assignment.subject}
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--neutral-100)', color: 'var(--text-secondary)' }}>
                      Grade {assignment.grade}-{assignment.section}
                    </span>
                  </div>

                  {/* Actions Menu */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleOpenEdit(assignment)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--neutral-100)'; e.currentTarget.style.color = '#2563EB'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      title="Edit Assignment"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--danger-50)'; e.currentTarget.style.color = 'var(--danger-600)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      title="Delete Assignment"
                    >
                      <FaTrashAlt size={13} />
                    </button>
                  </div>
                </div>

                {/* Content details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.4' }}>{assignment.title}</h3>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {assignment.description}
                  </p>
                </div>

                {/* Attachment file section */}
                {assignment.attachmentName && (
                  <div style={{ marginTop: '4px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        downloadAssignmentFile(assignment.id, assignment.attachmentName);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
                        borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'var(--text-primary)',
                        textDecoration: 'none', fontWeight: 600, width: '100%', boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--neutral-200)'; e.currentTarget.style.backgroundColor = 'var(--neutral-50)'; }}
                    >
                      {getFileIcon(assignment.attachmentName)}
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                        {assignment.attachmentName || 'Download attachment'}
                      </span>
                      <FaDownload size={11} style={{ color: 'var(--text-muted)' }} />
                    </a>
                  </div>
                )}

                {/* Footer Section */}
                <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '16px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                  {/* Due Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <FaCalendarAlt size={13} style={{ color: '#2563EB', opacity: 0.8 }} />
                    <span>Due: <strong>{formatDisplayDateLocal(assignment.dueDate)}</strong></span>
                  </div>

                  {/* Relative Due Badge */}
                  {badge && (
                    <span style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                      backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                    }}>
                      {badge.text}
                    </span>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', width: '90%', maxWidth: '540px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid var(--neutral-200)', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {editingAssignment ? 'Modify details of your posted homework' : 'Fill details below to assign new work'}
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--neutral-100)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handlePostOrUpdate} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Target Class & Subject Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>Class Grade</label>
                  <select
                    value={formClass}
                    onChange={(e) => { setFormClass(e.target.value); setFormSubject(''); }}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', fontWeight: 500, height: '36px' }}
                    required
                  >
                    <option value="">Select Class</option>
                    {uniqueClassesOptions.map(c => <option key={c} value={c}>Grade {c}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', fontWeight: 500, cursor: formClass ? 'pointer' : 'not-allowed', height: '36px' }}
                    disabled={!formClass}
                    required
                  >
                    <option value="">{formClass ? 'Select Subject' : 'Select Class First'}</option>
                    {formSubjectsOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Title & Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>Assignment Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Project Phase 1"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', height: '36px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>Due Date</label>
                  <input
                    type="date"
                    min={(() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    })()}
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', cursor: 'pointer', height: '36px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              {/* Description textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>Instructions & Details</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions, references, or specific questions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', resize: 'vertical', minHeight: '60px', lineHeight: '1.4' }}
                  required
                />
              </div>

              {/* Attachment File Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>
                  {editingAssignment ? 'Replace Attachment (Optional)' : 'Upload Attachment (Optional)'}
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    id="assignment-file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="assignment-file"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '4px', height: '65px', border: '2px dashed var(--neutral-300)', borderRadius: '10px',
                      backgroundColor: 'var(--neutral-50)', cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--neutral-300)'; e.currentTarget.style.backgroundColor = 'var(--neutral-50)'; }}
                  >
                    <FaCloudUploadAlt size={22} style={{ color: '#2563EB', opacity: 0.85 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, padding: '0 12px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                      {attachmentFile ? attachmentFile.name : (editingAssignment && editingAssignment.attachmentName ? `Current: ${editingAssignment.attachmentName}` : 'Select PDF, Document, or Image')}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Max upload size: 10MB</span>
                  </label>

                  {attachmentFile && (
                    <button
                      type="button"
                      onClick={() => setAttachmentFile(null)}
                      style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: '#fee2e2', color: 'var(--danger-700)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}
                      title="Clear file Selection"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Modal buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1px solid var(--neutral-200)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB',
                    color: 'white', fontWeight: 600, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.75 : 1, display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                >
                  {submitting ? 'Saving...' : (editingAssignment ? 'Save Changes' : 'Post Assignment')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Global CSS loading keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      ` }} />

    </div>
  );
};

export default Assignments;
