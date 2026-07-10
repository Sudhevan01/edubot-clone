import React, { useState } from 'react';
import { updateTeacherAssignments, getOrgSettings } from '../../services/api';
import { FaTimes, FaPlus, FaSave, FaClock, FaTrashAlt } from 'react-icons/fa';

const ManageTeacherModal = ({ teacher, onClose, onSave }) => {
  // Use a deep copy of teacher assignments
  const [assignments, setAssignments] = useState(
    teacher.assignments ? JSON.parse(JSON.stringify(teacher.assignments)) : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [grades, setGrades] = useState(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']);
  const [sections, setSections] = useState(['Section A', 'Section B', 'Section C', 'Section D']);
  const [subjects, setSubjects] = useState(['Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science', 'Physical Education']);

  React.useEffect(() => {
    getOrgSettings().then(res => {
      if (res && res.data) {
        const d = res.data;
        if (d.grades) {
          const parsed = d.grades.split(',').map(s => s.trim()).filter(Boolean);
          if (parsed.length > 0) setGrades(parsed);
        }
        if (d.sections) {
          const parsed = d.sections.split(',').map(s => s.trim()).filter(Boolean);
          if (parsed.length > 0) setSections(parsed);
        }
        if (d.departments) {
          const parsed = d.departments.split(',').map(s => s.trim()).filter(Boolean);
          if (parsed.length > 0) setSubjects(parsed);
        }
      }
    }).catch(err => console.error("Error fetching settings in modal:", err));
  }, []);

  const handleAddClass = () => {
    setAssignments([{ grade: '', section: '', subject: '' }, ...assignments]);
  };

  const handleRemoveClass = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...assignments];
    updated[index][field] = value;
    setAssignments(updated);
  };

  const handleAddSchedule = (index) => {
    const updated = [...assignments];
    if (!updated[index].schedules) updated[index].schedules = [];
    updated[index].schedules.push({ day: 'Monday', period: 'Period 1', startTime: '09:00', endTime: '10:00' });
    setAssignments(updated);
  };

  const handleAddMonFriSchedule = (index) => {
    const updated = [...assignments];
    if (!updated[index].schedules) updated[index].schedules = [];
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const newSchedules = weekdays.map(day => ({ day, period: 'Period 1', startTime: '09:00', endTime: '10:00' }));
    updated[index].schedules.push(...newSchedules);
    setAssignments(updated);
  };

  const handleUpdateSchedule = (assignmentIndex, scheduleIndex, field, value) => {
    const updated = [...assignments];
    const oldVal = updated[assignmentIndex].schedules[scheduleIndex][field];
    updated[assignmentIndex].schedules[scheduleIndex][field] = value;

    if (scheduleIndex === 0 && (field === 'startTime' || field === 'endTime' || field === 'showTiming' || field === 'period')) {
      updated[assignmentIndex].schedules.forEach((s, i) => {
        if (i !== 0 && s[field] === oldVal) {
          s[field] = value;
        }
      });
    }

    setAssignments(updated);
  };

  const handleRemoveSchedule = (assignmentIndex, scheduleIndex) => {
    const updated = [...assignments];
    updated[assignmentIndex].schedules.splice(scheduleIndex, 1);
    setAssignments(updated);
  };

  const handleSave = async () => {
    // Validate all fields
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      if (!a.grade || !a.section || !a.subject) {
        setError('Please fill in all grade, section, and subject fields before saving.');
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        assignments: assignments.map(a => ({
          ...a,
          isClassTeacher: a.isClassTeacher ? 1 : 0
        }))
      };

      const res = await updateTeacherAssignments(teacher.id, payload);
      if (res.success) {
      if (typeof onSave === 'function') onSave(); // Refresh directory
      onClose(true);
    } else {
      setError(res.message || 'Failed to save assignments.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '90%', maxWidth: '600px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Manage Classes</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{teacher.name} ({teacher.email})</p>
          </div>
          <button onClick={() => onClose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ padding: '12px', backgroundColor: 'var(--danger-50)', color: 'var(--danger-700)', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', border: '1px solid var(--danger-200)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Assigned Classes</h4>
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); handleAddClass(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'var(--neutral-100)', color: 'var(--text-primary)', border: '1px solid var(--neutral-300)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              <FaPlus size={12} /> Add Class
            </button>
          </div>

          {assignments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--neutral-300)', borderRadius: '8px' }}>
              No classes currently assigned. Click "Add Class" to assign one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assignments.map((assignment, index) => (
                <div key={assignment.id || assignment.uid || index} className="modal-assignments-grid">
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Grade</label>
                    <select 
                      value={assignment.grade} 
                      onChange={(e) => handleChange(index, 'grade', e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', outline: 'none', fontSize: '14px', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select Grade</option>
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Section</label>
                    <select 
                      value={assignment.section} 
                      onChange={(e) => handleChange(index, 'section', e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', outline: 'none', fontSize: '14px', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select Section</option>
                      {sections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Subject</label>
                    <select 
                      value={assignment.subject} 
                      onChange={(e) => handleChange(index, 'subject', e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', outline: 'none', fontSize: '14px', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => handleRemoveClass(index)}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remove Class"
                  >
                    <FaTimes size={16} />
                  </button>

                  {/* Schedules Section */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '4px', borderTop: '1px dashed var(--neutral-300)', paddingTop: '12px' }}>
                    <div style={{ marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!assignment.isClassTeacher}
                          onChange={(e) => handleChange(index, 'isClassTeacher', e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                        />
                        <span style={{ fontWeight: 500 }}>
                          Assign as Class Teacher for Grade {assignment.grade || '...'} Section {assignment.section || '...'}
                        </span>
                      </label>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaClock size={12} /> Weekly Schedule
                      </label>
                      <button 
                        onClick={() => handleAddMonFriSchedule(index)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <FaPlus size={10} /> Add Timing
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {assignment.schedules?.map((sched, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                          {/* Row 1: Day, Period, Delete */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select value={sched.day || ''} onChange={(e) => handleUpdateSchedule(index, sIdx, 'day', e.target.value)} style={{ flex: 1, padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={sched.period || ''} onChange={(e) => handleUpdateSchedule(index, sIdx, 'period', e.target.value)} style={{ flex: 1, padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}>
                              <option value="">Select Period</option>
                              {Array.from({length: 8}, (_, i) => `Period ${i + 1}`).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <button onClick={() => handleRemoveSchedule(index, sIdx)} style={{ flex: '0 0 auto', background: 'var(--danger-50)', border: '1px solid var(--danger-100)', color: 'var(--danger-600)', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Remove Period">
                              <FaTrashAlt size={16} />
                            </button>
                          </div>
                          {/* Row 2: Timing Options */}
                          <div style={{ width: '100%' }}>
                            {sched.showTiming || sched.startTime || sched.endTime ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input type="time" value={sched.startTime || ''} onChange={(e) => handleUpdateSchedule(index, sIdx, 'startTime', e.target.value)} style={{ flex: 1, minWidth: '100px', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>to</span>
                                <input type="time" value={sched.endTime || ''} onChange={(e) => handleUpdateSchedule(index, sIdx, 'endTime', e.target.value)} style={{ flex: 1, minWidth: '100px', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }} />
                                <button type="button" onClick={() => { handleUpdateSchedule(index, sIdx, 'startTime', ''); handleUpdateSchedule(index, sIdx, 'endTime', ''); handleUpdateSchedule(index, sIdx, 'showTiming', false); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger-600)', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', textDecoration: 'underline' }}>Clear</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => handleUpdateSchedule(index, sIdx, 'showTiming', true)} style={{ width: '100%', background: 'var(--neutral-100)', border: '1px dashed var(--neutral-300)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, transition: 'background 0.2s' }}>
                                + Add Specific Timing
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!assignment.schedules || assignment.schedules.length === 0) && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No timings added yet.</div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'var(--bg-subtle)' }}>
          <button 
            onClick={() => onClose(false)}
            style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-300)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--primary-600)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
          >
            <FaSave size={14} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <style>{`
          .modal-assignments-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            padding: 16px;
            background-color: var(--neutral-50);
            border-radius: 12px;
            position: relative;
          }
          @media (max-width: 540px) {
            .modal-assignments-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}</style>

      </div>
    </div>
  );
};

export default ManageTeacherModal;
