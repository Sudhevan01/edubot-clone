import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaSearch, FaInfoCircle, FaSave, FaFilter, FaAward } from 'react-icons/fa';
import { getTeacherClasses, getClassStudents } from '../../services/api';

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
    <div className="teacher-results-filter-select-wrapper" ref={dropdownRef} style={{
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid var(--neutral-300)',
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text-primary)',
      minWidth: '200px',
      userSelect: 'none',
      boxSizing: 'border-box'
    }} onClick={() => setIsOpen(!isOpen)}>
      {icon}
      <div className="custom-select-trigger" style={{
        padding: '0 20px 0 0',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
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
        color: 'var(--text-secondary)',
        opacity: 0.7,
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
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--neutral-300)',
          borderRadius: '8px',
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
                color: value === opt.value ? 'var(--primary-600)' : 'var(--text-secondary)',
                backgroundColor: value === opt.value ? 'rgba(37,99,235,0.08)' : 'transparent',
                borderRadius: '6px',
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

const Results = () => {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Settings
  const [selectedClassId, setSelectedClassId] = useState('');
  const [examName, setExamName] = useState('Quarterly Exam');
  const [maxMarks, setMaxMarks] = useState(100);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Marks state: { studentId: score }
  const [marksObtained, setMarksObtained] = useState({});
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
  const orgId = org.id || 1;

  // Load teacher classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await getTeacherClasses();
        if (res.success && res.data) {
          setAssignedClasses(res.data);
          if (res.data.length > 0) {
            setSelectedClassId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load teacher classes:', err);
        showFeedback('error', 'Failed to retrieve class assignments.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Find currently selected class details
  const selectedClassDetails = useMemo(() => {
    return assignedClasses.find(c => c.id === selectedClassId) || null;
  }, [assignedClasses, selectedClassId]);

  // Load students and saved marks from localStorage
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await getClassStudents(selectedClassId, '');
        if (res && res.success && res.data) {
          const studentsList = Array.isArray(res.data) ? res.data : (res.data.students || []);
          setStudents(studentsList);

          // Restore saved marks
          const storageKey = `teacher_marks_simple_${orgId}_${selectedClassId}_${examName}`;
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setMarksObtained(parsed.scores || {});
              setMaxMarks(parsed.maxMarks || 100);
            } catch (e) {
              setMarksObtained({});
            }
          } else {
            setMarksObtained({});
          }
        }
      } catch (err) {
        console.error('Failed to fetch class students:', err);
        showFeedback('error', 'Failed to load students list.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClassId, examName, orgId]);

  // Helper to show temporary feedback
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  // Handle Marks input change
  const handleMarkChange = (studentId, val) => {
    const numericVal = val === '' ? '' : parseFloat(val);
    if (numericVal !== '' && (isNaN(numericVal) || numericVal < 0 || numericVal > maxMarks)) {
      return; // prevent invalid marks
    }
    setMarksObtained(prev => ({
      ...prev,
      [studentId]: val === '' ? '' : numericVal
    }));
  };

  // Submit and save marks to localStorage
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setSubmitting(true);
    try {
      const storageKey = `teacher_marks_simple_${orgId}_${selectedClassId}_${examName}`;
      const payload = {
        classId: selectedClassId,
        examName,
        maxMarks,
        subject: selectedClassDetails?.subject || 'General',
        scores: marksObtained,
        submittedAt: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(payload));

      await new Promise(resolve => setTimeout(resolve, 600));
      showFeedback('success', 'Student marks saved successfully!');
    } catch (err) {
      showFeedback('error', 'Failed to save student scores.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered students for list display
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.rollNo || s.id).includes(searchQuery);
      return matchesSearch;
    });
  }, [students, searchQuery]);

  return (
    <div className="teacher-results-container">

      {/* Search and Filters Bar - Formatted EXACTLY like Dashboard & Assignments filters */}
      <div className="teacher-results-filters">

        {/* Class Selection Dropdown */}
        <CustomSelect
          value={selectedClassId}
          onChange={(val) => setSelectedClassId(val)}
          options={assignedClasses.map(c => ({
            value: c.id,
            label: `Grade ${c.grade} (${c.subject})`
          }))}
          icon={<FaFilter size={13} style={{ color: 'var(--text-secondary)', opacity: 0.7 }} />}
        />

        {/* Exam Type selection */}
        <CustomSelect
          value={examName}
          onChange={(val) => setExamName(val)}
          options={[
            { value: 'Quarterly Exam', label: 'Quarterly Exam' },
            { value: 'Half Yearly Exam', label: 'Half Yearly Exam' },
            { value: 'Final Exam', label: 'Final Exam' },
            { value: 'Unit Test 1', label: 'Unit Test 1' },
            { value: 'Unit Test 2', label: 'Unit Test 2' }
          ]}
          icon={<FaFilter size={13} style={{ color: 'var(--text-secondary)', opacity: 0.7 }} />}
        />

        {/* Max Marks input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Max Marks:</span>
          <input
            type="number"
            value={maxMarks}
            onChange={(e) => setMaxMarks(Math.max(1, parseInt(e.target.value) || 100))}
            style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', fontWeight: 700, width: '45px', textAlign: 'center' }}
          />
        </div>

        {/* Search input field */}
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} />
          <input
            type="text"
            placeholder="Search student by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Notification Toast Alert */}
      {feedback.message && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: feedback.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
          color: feedback.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
          borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          border: `1px solid ${feedback.type === 'success' ? 'var(--success-200)' : 'var(--danger-200)'}`,
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'
        }}>
          <FaInfoCircle size={14} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Loading overlay spinner */}
      {loading ? (
        <div style={{ padding: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading student records...</span>
        </div>
      ) : students.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--neutral-300)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaAward size={20} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No Students Assigned</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>We couldn't locate any students for the selected class grade.</p>
          </div>
        </div>
      ) : (
        /* Results Table Card */
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--neutral-200)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', width: '220px', textAlign: 'center' }}>Marks Obtained</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => {
                  const score = marksObtained[s.id];

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid var(--neutral-200)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--neutral-50)'
                      }}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {s.rollNo || s.id}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {s.name || 'Anonymous Student'}
                      </td>
                      <td style={{ padding: '8px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            min={0}
                            max={maxMarks}
                            value={score === undefined ? '' : score}
                            onChange={(e) => handleMarkChange(s.id, e.target.value)}
                            placeholder="-"
                            style={{
                              width: '80px',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--neutral-300)',
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: 700,
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--neutral-300)'}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>/ {maxMarks}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save Footer Bar */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--neutral-50)' }}>
            <button
              type="button"
              onClick={handleSaveMarks}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                backgroundColor: 'var(--primary-600)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.12)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--primary-700)'; }}
              onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--primary-600)'; }}
            >
              <FaSave size={13} /> {submitting ? 'Saving...' : 'Save & Publish Marks'}
            </button>
          </div>
        </div>
      )}

      {/* Global CSS spinner keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .teacher-results-container {
          padding: 0 16px 24px 16px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .teacher-results-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          margin-bottom: 24px;
          margin-top: 10px;
        }
        @media (max-width: 768px) {
          .teacher-results-filters {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .teacher-results-filters > div {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .teacher-results-filters select, .teacher-results-filters input {
            width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
        }
      ` }} />

    </div>
  );
};

export default Results;
