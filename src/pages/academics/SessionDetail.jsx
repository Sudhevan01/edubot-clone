import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaRegCalendarAlt, FaCheck, FaTimes, FaSearch, FaFilter, FaEdit, FaTrashAlt, FaCheckCircle, FaClipboardCheck, FaInfoCircle, FaIdCard, FaPercentage, FaUserTimes, FaPrint, FaFileCsv } from 'react-icons/fa';
import '../../components/common/DashboardOverview.css';
import '../accounts/styling/Accounts.css';

import { getClassStudents, submitAttendance } from '../../services/api';

const SessionDetail = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams(); 
  const id = routeId.includes('_') ? routeId.split('_')[0] : routeId;
  const location = useLocation();
  const [filter, setFilter] = useState('All Students');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredDropdownItem, setHoveredDropdownItem] = useState(null);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
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
  const [hoveredCard, setHoveredCard] = useState(null);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const canEdit = () => {
    if (!isSubmitted) return true;
    if (isSuperAdmin) return true;
    
    let submissionTime = null;
    if (submittedAt) {
      submissionTime = new Date(submittedAt).getTime();
    } else {
      const localSubmittedAt = localStorage.getItem(`attendance_submitted_at_${id}`);
      if (localSubmittedAt) {
        submissionTime = new Date(localSubmittedAt).getTime();
      }
    }
    
    if (submissionTime) {
      const diffMs = new Date().getTime() - submissionTime;
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours <= 24;
    }
    
    return false;
  };

  const sessionData = location.state?.sessionData || {
    gradeSec: '10-A',
    subject: 'Mathematics',
    date: 'Thursday, Oct 24, 2023',
    time: '09:00 - 09:45',
    section: 'Advanced Geometry',
    name: 'Ms. Sarah Jenkins',
  };

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        let queryDate = '';
        if (sessionData.date) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(sessionData.date)) {
            queryDate = sessionData.date;
          } else {
            const d = new Date(sessionData.date);
            if (!isNaN(d.getTime())) {
              queryDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
          }
        }
        const res = await getClassStudents(id, queryDate);
        if (res && res.success && res.data) {
          const studentsList = Array.isArray(res.data) ? res.data : (res.data.students || []);
          const submittedState = res.data.isSubmitted || false;
          setIsSubmitted(submittedState);
          if (res.data.submittedAt) {
            setSubmittedAt(res.data.submittedAt);
          }
          
          const mapped = studentsList.map(s => ({
             id: s.id,
             rollNo: s.id || '-',
             name: s.name || 'Unknown Student',
             status: (s.status || 'Present').toLowerCase(),
             prevStatus: 'Consistent',
             img: ''
          }));
          setStudents(mapped);
        }

      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [sessionData.gradeSec, sessionData.date]);

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const totalStudents = students.length;
  const attendanceRate = totalStudents === 0 ? 0 : Math.round((presentCount / totalStudents) * 100);

  const filteredStudents = students.filter(s => {
    if (filter === 'Present' && s.status !== 'present') return false;
    if (filter === 'Absent' && s.status !== 'absent') return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleToggleStatus = (id, newStatus) => {
    if (isSubmitted && !isSuperAdmin && !isEditing) return;
    setStudents(students.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleEdit = (id) => {
    alert(`Edit functionality for student ${id}`);
  };

  const handleConfirmSubmit = async () => {
    try {
      const attendanceData = students.map(s => ({
        studentId: s.id,
        status: s.status.charAt(0).toUpperCase() + s.status.slice(1)
      }));
      
      // Ensure date is in YYYY-MM-DD format (using local time to avoid timezone shift)
      const now = new Date();
      let formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      if (sessionData.date) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(sessionData.date)) {
          formattedDate = sessionData.date;
        } else {
          const d = new Date(sessionData.date);
          if (!isNaN(d.getTime())) {
            formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        }
      }

      const payload = {
        assignmentId: id,
        date: formattedDate,
        attendance: attendanceData
      };
      const res = await submitAttendance(payload);
      if (res.success) {
        alert('Attendance is submitted successfully!');
        const now = new Date().toISOString();
        setSubmittedAt(now);
        localStorage.setItem(`attendance_submitted_at_${id}`, now);
        setIsSubmitted(true);
        setIsEditing(false);
        setIsModalOpen(false);
        if (isSuperAdmin) {
          navigate('/admin/academics/dashboard');
        } else {
          navigate('/teacher/dashboard');
        }
      } else {
        alert(res.message || 'Failed to submit attendance');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while submitting attendance.');
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["Roll No", "Student Name", "Previous Status", "Current Status"];
    const rows = students.map(s => [
      s.rollNo || '-',
      s.name || '',
      s.prevStatus || '',
      s.status.charAt(0).toUpperCase() + s.status.slice(1)
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const gradeSec = (sessionData.gradeSec || 'class').replace(/[^a-zA-Z0-9]/g, '_');
    const subject = (sessionData.subject || 'subject').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = sessionData.date || new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Attendance_${gradeSec}_${subject}_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="accounts-container print-friendly">
      
      {/* ── Top Section: Premium Dashboard Row ── */}
      <div className="sd-top-row">
        
        {/* Session Info Card */}
        <div className="sd-info-card">
          <div className="sd-info-card__content">
            <div className="sd-info-card__badges">
              <span className="sd-badge sd-badge--active">SESSION ACTIVE</span>
              <span className="sd-badge sd-badge--date">• {sessionData.date}</span>
            </div>
            <h1 className="sd-info-card__title">Grade {sessionData.gradeSec}, {sessionData.subject}</h1>
            {(sessionData.section || sessionData.time) && (
              <p className="sd-info-card__subtitle">
                {sessionData.section ? `Section: ${sessionData.section}` : ''}
                {sessionData.section && sessionData.time ? ' | ' : ''}
                {sessionData.time || ''}
              </p>
            )}
            <div className="sd-info-card__assignee">
              <div className="sd-avatar-stack">
                <div className="sd-avatar" style={{ backgroundColor: 'var(--primary-200)' }}>A</div>
                <div className="sd-avatar" style={{ backgroundColor: 'var(--success-200)' }}>K</div>
                <div className="sd-avatar" style={{ backgroundColor: '#e9d5ff' }}>R</div>
                <div className="sd-avatar sd-avatar--count">+{Math.max(0, totalStudents - 3)}</div>
              </div>
              <span className="sd-info-card__assigned-text">Assigned to: <strong>{sessionData.name}</strong></span>
            </div>
          </div>
          <FaRegCalendarAlt className="sd-info-card__bg-icon" />
        </div>

        {/* Stat Cards */}
        <div className="sd-stat-cards" onMouseLeave={() => setHoveredCard(null)}>
          
          <div
            className={`sd-stat-card ${(hoveredCard === 'All Students' || (!hoveredCard && filter === 'All Students')) ? 'sd-stat-card--active' : ''}`}
            onMouseEnter={() => setHoveredCard('All Students')}
            onClick={() => setFilter('All Students')}
          >
            <div className="sd-stat-card__icon sd-stat-card__icon--blue">
              <FaIdCard size={22} />
            </div>
            <div className="sd-stat-card__text">
              <span className="sd-stat-card__label">TOTAL STUDENTS</span>
              <h3 className="sd-stat-card__value">{totalStudents}</h3>
            </div>
          </div>

          <div
            className={`sd-stat-card ${(hoveredCard === 'Present' || (!hoveredCard && filter === 'Present')) ? 'sd-stat-card--active' : ''}`}
            onMouseEnter={() => setHoveredCard('Present')}
            onClick={() => setFilter('Present')}
          >
            <div className="sd-stat-card__icon sd-stat-card__icon--green">
              <FaCheck size={22} />
            </div>
            <div className="sd-stat-card__text">
              <span className="sd-stat-card__label">PRESENT</span>
              <h3 className="sd-stat-card__value">{presentCount}</h3>
            </div>
          </div>

          <div
            className={`sd-stat-card ${(hoveredCard === 'Absent' || (!hoveredCard && filter === 'Absent')) ? 'sd-stat-card--active' : ''}`}
            onMouseEnter={() => setHoveredCard('Absent')}
            onClick={() => setFilter('Absent')}
          >
            <div className="sd-stat-card__icon sd-stat-card__icon--orange">
              <FaUserTimes size={22} />
            </div>
            <div className="sd-stat-card__text">
              <span className="sd-stat-card__label">ABSENT</span>
              <h3 className="sd-stat-card__value">{absentCount}</h3>
            </div>
          </div>

          <div
            className={`sd-stat-card ${hoveredCard === 'Attendance' ? 'sd-stat-card--active' : ''}`}
            onMouseEnter={() => setHoveredCard('Attendance')}
            style={{ cursor: 'default' }}
          >
            <div className="sd-stat-card__icon sd-stat-card__icon--purple">
              <FaPercentage size={22} />
            </div>
            <div className="sd-stat-card__text">
              <span className="sd-stat-card__label">ATTENDANCE %</span>
              <h3 className="sd-stat-card__value">{attendanceRate}%</h3>
            </div>
          </div>

        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        minHeight: '68px',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>

        {/* ── Left group: Search + Filter ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>

          {/* Search input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <FaSearch style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: '#9CA3AF', fontSize: '15px', pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px 0 42px',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
                fontSize: '14px',
                fontWeight: 400,
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#6366F1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Filter button */}
          <button style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <FaFilter size={15} />
          </button>
        </div>

        {/* ── Right group: Dropdown + Edit ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* All Students dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '170px',
                height: '44px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
                color: '#374151',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'background-color 0.2s, border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filter}</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>▼</span>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                zIndex: 50,
                minWidth: '170px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {['All Students', 'Present', 'Absent'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setFilter(tab); setDropdownOpen(false); }}
                    onMouseEnter={() => setHoveredDropdownItem(tab)}
                    onMouseLeave={() => setHoveredDropdownItem(null)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: 'none',
                      backgroundColor: (filter === tab || hoveredDropdownItem === tab) ? '#F3F4F6' : 'transparent',
                      color: filter === tab ? '#111827' : '#6B7280',
                      fontWeight: filter === tab ? 600 : 500,
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      width: '100%',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Edit button – only within 24 h of submission */}
          {isSubmitted && canEdit() && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                width: '110px',
                height: '44px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isEditing ? '#EF4444' : '#2563EB',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                flexShrink: 0,
                boxShadow: isEditing ? '0 1px 4px rgba(239,68,68,0.25)' : '0 1px 4px rgba(37,99,235,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = isEditing ? '#DC2626' : '#1D4ED8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = isEditing ? '#EF4444' : '#2563EB'; }}
            >
              {isEditing ? 'Cancel' : (
                <>
                  <FaEdit size={15} /> Edit
                </>
              )}
            </button>
          )}

        </div>
        
        <div className="no-print" style={{ marginLeft: 'auto' }}>
          <button 
            onClick={handleExportCSV}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              height: '44px', padding: '0 16px', backgroundColor: '#2563EB', color: 'white', 
              border: 'none', borderRadius: '10px', fontWeight: 500, fontSize: '14px', 
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(37,99,235,0.25)', transition: 'background-color 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
          >
            <FaFileCsv size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="accounts-table-card" style={{ paddingBottom: '80px', overflowX: 'auto' }}>
        <table className="accounts-table" style={{ width: '100%', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Roll No</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Student Name</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Previous Status</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Attendance Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading students from master records...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No students found for this class.
                </td>
              </tr>
            ) : filteredStudents.map((s, idx) => (
              <tr key={s.id} style={{ 
                borderBottom: '1px solid var(--neutral-200)', 
                backgroundColor: s.status === 'absent' ? 'var(--danger-50)' : 'var(--bg-card)',
                borderLeft: s.status === 'absent' ? '4px solid var(--danger-500)' : '4px solid transparent'
              }}>
                <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.rollNo !== '-' ? `#${s.rollNo}` : '-'}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {s.img ? (
                      <img src={s.img} alt={s.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--neutral-200)', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', border: '1px solid var(--primary-200)' }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    backgroundColor: s.prevStatus.includes('Absent') ? 'var(--danger-50)' : s.prevStatus === 'Irregular' ? 'var(--warning-50)' : 'var(--success-50)', 
                    color: s.prevStatus.includes('Absent') ? 'var(--danger-700)' : s.prevStatus === 'Irregular' ? 'var(--warning-700)' : 'var(--success-700)', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600 
                  }}>
                    {s.prevStatus}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '4px', border: '1px solid #e2e8f0', opacity: (isSubmitted && !isSuperAdmin && !isEditing) ? 0.6 : 1 }}>
                    <button 
                      onClick={() => handleToggleStatus(s.id, 'present')}
                      disabled={isSubmitted && !isSuperAdmin && !isEditing}
                      style={{ 
                        width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        borderRadius: '6px', border: 'none', cursor: (isSubmitted && !isSuperAdmin && !isEditing) ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        backgroundColor: s.status === 'present' ? '#22c55e' : 'transparent',
                        color: s.status === 'present' ? '#ffffff' : '#64748b',
                        boxShadow: s.status === 'present' ? '0 2px 4px rgba(34,197,94,0.3)' : 'none'
                      }}>
                      <FaCheck size={14} />
                    </button>
                    <div style={{ width: '1px', backgroundColor: '#cbd5e1', margin: '0 4px' }}></div>
                    <button 
                      onClick={() => handleToggleStatus(s.id, 'absent')}
                      disabled={isSubmitted && !isSuperAdmin && !isEditing}
                      style={{ 
                        width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        borderRadius: '6px', border: 'none', cursor: (isSubmitted && !isSuperAdmin && !isEditing) ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        backgroundColor: s.status === 'absent' ? '#ef4444' : 'transparent',
                        color: s.status === 'absent' ? '#ffffff' : '#64748b',
                        boxShadow: s.status === 'absent' ? '0 2px 4px rgba(239,68,68,0.3)' : 'none'
                      }}>
                      <FaTimes size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky Footer */}
      {(!isSubmitted || isSuperAdmin || isEditing) && (
        <div style={{ 
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 100
        }} className="no-print">
          <button 
            onClick={() => setIsModalOpen(true)} 
            style={{ 
              padding: '12px 24px', borderRadius: '8px', border: 'none', 
              backgroundColor: '#2563EB', color: '#ffffff', fontWeight: 600, fontSize: '15px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.15)', 
              transition: 'background-color 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
          >
            <FaCheckCircle size={18} /> {isSubmitted ? 'Update Attendance' : 'Submit Attendance'}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '90%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaClipboardCheck size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Confirm Attendance Submission</h2>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                You are about to submit attendance for <strong>Grade {sessionData.gradeSec} {sessionData.subject}</strong>.
              </p>
              
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                  <span>Present:</span>
                  <span style={{ color: '#1d4ed8', fontWeight: 700 }}>{presentCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                  <span>Absent:</span>
                  <span style={{ color: '#b91c1c', fontWeight: 700 }}>{absentCount}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '10px 24px', backgroundColor: 'transparent', border: 'none', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSubmit}
                style={{ padding: '10px 24px', backgroundColor: '#2563EB', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionDetail;
