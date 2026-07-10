import React, { useState, useEffect } from 'react';
import { User, Shield, Eye, EyeOff, Info, Calendar, Save, LayoutGrid, ChevronDown, CheckCircle, Plus, Trash2, Clock } from 'lucide-react';
import { getOrgSettings, registerStaff } from '../../services/api';
import '../accounts/styling/Accounts.css';

const AddTeacher = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    grades: [], // Multi-select grades
    gradeAssignments: {}
  });

  // Dynamic Options from Settings
  const [availableGrades, setAvailableGrades] = useState(['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']);
  const [availableSections, setAvailableSections] = useState(['Section A', 'Section B', 'Section C']);
  const [availableSubjects, setAvailableSubjects] = useState(['Mathematics', 'English', 'Physics', 'Chemistry']);

  useEffect(() => {
    getOrgSettings().then(res => {
      if (res && res.data) {
        const d = res.data;
        let parsedGrades = availableGrades;
        let parsedSections = availableSections;
        let parsedSubjects = availableSubjects;

        if (d.grades) {
          parsedGrades = d.grades.split(',').map(s => s.trim()).filter(Boolean);
          if (parsedGrades.length > 0) setAvailableGrades(parsedGrades);
        }
        if (d.sections) {
          parsedSections = d.sections.split(',').map(s => s.trim()).filter(Boolean);
          if (parsedSections.length > 0) setAvailableSections(parsedSections);
        }
        if (d.departments) {
          parsedSubjects = d.departments.split(',').map(s => s.trim()).filter(Boolean);
          if (parsedSubjects.length > 0) setAvailableSubjects(parsedSubjects);
        }

        // Removed the auto-assignment of the first grade to keep it empty by default
      }
    }).catch(err => console.error("Error fetching settings:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'fullName') {
      newValue = value.replace(/[^a-zA-Z\s]/g, ''); // Only letters and spaces
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleGrade = (grade) => {
    setFormData(prev => {
      const isSelected = prev.grades.includes(grade);
      if (isSelected && prev.grades.length === 1) return prev; // Keep at least one

      const newGrades = isSelected
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade];

      const newAssignments = { ...prev.gradeAssignments };

      if (isSelected) {
        delete newAssignments[grade];
      } else {
        newAssignments[grade] = {
          section: availableSections.length > 0 ? availableSections[0] : '',
          subject: availableSubjects.length > 0 ? availableSubjects[0] : '',
          schedules: []
        };
      }

      return {
        ...prev,
        grades: newGrades,
        gradeAssignments: newAssignments
      };
    });
  };

  const updateAssignment = (grade, field, value) => {
    setFormData(prev => ({
      ...prev,
      gradeAssignments: {
        ...prev.gradeAssignments,
        [grade]: {
          ...prev.gradeAssignments[grade],
          [field]: value
        }
      }
    }));
  };

  const addSchedule = (grade) => {
    setFormData(prev => ({
      ...prev,
      gradeAssignments: {
        ...prev.gradeAssignments,
        [grade]: {
          ...prev.gradeAssignments[grade],
          schedules: [
            ...(prev.gradeAssignments[grade].schedules || []),
            { day: 'Monday', period: 'Period 1', startTime: '09:00', endTime: '10:00' }
          ]
        }
      }
    }));
  };

  const addMonFriSchedule = (grade) => {
    setFormData(prev => {
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const newSchedules = weekdays.map(day => ({ day, period: 'Period 1', startTime: '09:00', endTime: '10:00' }));
      return {
        ...prev,
        gradeAssignments: {
          ...prev.gradeAssignments,
          [grade]: {
            ...prev.gradeAssignments[grade],
            schedules: [
              ...(prev.gradeAssignments[grade].schedules || []),
              ...newSchedules
            ]
          }
        }
      };
    });
  };

  const updateSchedule = (grade, index, field, value) => {
    setFormData(prev => {
      const newSchedules = [...prev.gradeAssignments[grade].schedules];
      const oldVal = newSchedules[index][field];
      newSchedules[index] = { ...newSchedules[index], [field]: value };

      // Cascade timing changes if editing the first row (index 0)
      if (index === 0 && (field === 'startTime' || field === 'endTime' || field === 'showTiming' || field === 'period')) {
        newSchedules.forEach((s, i) => {
          if (i !== 0 && s[field] === oldVal) {
            newSchedules[i] = { ...newSchedules[i], [field]: value };
          }
        });
      }

      return {
        ...prev,
        gradeAssignments: {
          ...prev.gradeAssignments,
          [grade]: {
            ...prev.gradeAssignments[grade],
            schedules: newSchedules
          }
        }
      };
    });
  };

  const removeSchedule = (grade, index) => {
    setFormData(prev => {
      const newSchedules = [...prev.gradeAssignments[grade].schedules];
      newSchedules.splice(index, 1);
      return {
        ...prev,
        gradeAssignments: {
          ...prev.gradeAssignments,
          [grade]: {
            ...prev.gradeAssignments[grade],
            schedules: newSchedules
          }
        }
      };
    });
  };

  const handleSave = async () => {
    let newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.email.trim()) newErrors.email = "Email Address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the real backend API to register the teacher
      await registerStaff({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: 'TEACHER',
        gradeAssignments: formData.gradeAssignments
      });

      setIsSubmitting(false);
      setSuccess(true);

      // Reset form after a delay
      setTimeout(() => {
        setSuccess(false);
        setFormData(prev => ({
          fullName: '',
          email: '',
          password: '',
          grades: [],
          gradeAssignments: {}
        }));
      }, 3000);
    } catch (err) {
      setIsSubmitting(false);
      alert(err.message || 'Failed to register teacher. They might already exist.');
    }
  };

  return (
    <div className="accounts-container">
      {success && (
        <div style={{ marginBottom: 'var(--sp-6)', padding: '16px 20px', backgroundColor: 'var(--success-50)', border: '1px solid var(--success-200)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle color="var(--success-600)" />
          <span style={{ color: 'var(--success-800)', fontWeight: 600, fontSize: 'var(--font-md)' }}>Teacher profile successfully created and saved!</span>
        </div>
      )}

      <div className="teacher-form-columns-grid">

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)', height: '100%' }}>

          {/* Personal Information */}
          <div className="accounts-form-card" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--font-xl)', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 var(--sp-6) 0' }}>
              <User size={24} color="var(--primary-600)" /> Personal Information
            </h3>

            <div className="accounts-form-group" style={{ marginBottom: 'var(--sp-5)' }}>
              <label className="accounts-form-label">Full Name <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="accounts-form-input" placeholder="e.g. Dr. Sarah Jenkins" style={{ border: errors.fullName ? '1px solid #ef4444' : '1px solid var(--neutral-300)' }} />
              {errors.fullName && <p style={{ color: '#ef4444', fontSize: '12.5px', marginTop: '4px', margin: 0 }}>{errors.fullName}</p>}
            </div>

            <div className="accounts-form-group" style={{ marginBottom: 'var(--sp-5)' }}>
              <label className="accounts-form-label">Email Address <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="accounts-form-input" placeholder="name@gmail.com or name@school.edu" style={{ border: errors.email ? '1px solid #ef4444' : '1px solid var(--neutral-300)' }} />
              {errors.email && <p style={{ color: '#ef4444', fontSize: '12.5px', marginTop: '4px', margin: 0 }}>{errors.email}</p>}
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Password <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="accounts-form-input"
                  placeholder="••••••••••••"
                  style={{ width: '100%', border: errors.password ? '1px solid #ef4444' : '1px solid var(--neutral-300)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#ef4444', fontSize: '12.5px', marginTop: '4px', margin: 0 }}>{errors.password}</p>}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)', height: '100%' }}>

          {/* Class Assignment */}
          <div className="accounts-form-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--font-xl)', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 var(--sp-6) 0' }}>
              <LayoutGrid size={24} color="var(--primary-600)" /> Class Assignment
            </h3>

            <div className="accounts-form-group" style={{ marginBottom: 'var(--sp-6)' }}>
              <label className="accounts-form-label" style={{ marginBottom: 'var(--sp-3)' }}>Grades</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                {availableGrades.map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={(e) => { e.preventDefault(); toggleGrade(grade); }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: formData.grades.includes(grade) ? 'none' : '1px solid var(--neutral-300)',
                      backgroundColor: formData.grades.includes(grade) ? 'var(--primary-600)' : 'var(--bg-card)',
                      color: formData.grades.includes(grade) ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
              {formData.grades.map(grade => (
                <div key={grade} className="teacher-assignment-grid">
                  <div style={{ gridColumn: '1 / -1', fontWeight: 'bold', fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{grade} Assignments</div>

                  <div className="accounts-form-group">
                    <label className="accounts-form-label">Section</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={formData.gradeAssignments[grade]?.section || ''}
                        onChange={(e) => updateAssignment(grade, 'section', e.target.value)}
                        className="accounts-form-input" style={{ width: '100%', appearance: 'none' }}
                      >
                        {availableSections.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                      <ChevronDown size={20} color="var(--text-muted)" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div className="accounts-form-group">
                    <label className="accounts-form-label">Subject</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={formData.gradeAssignments[grade]?.subject || ''}
                        onChange={(e) => updateAssignment(grade, 'subject', e.target.value)}
                        className="accounts-form-input" style={{ width: '100%', appearance: 'none' }}
                      >
                        {availableSubjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <ChevronDown size={20} color="var(--text-muted)" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  {/* Schedules Section */}
                  <div style={{ gridColumn: '1 / -1', marginTop: 'var(--sp-2)' }}>
                    <div style={{ marginTop: 'var(--sp-4)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.gradeAssignments[grade]?.isClassTeacher || false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            gradeAssignments: {
                              ...prev.gradeAssignments,
                              [grade]: { ...prev.gradeAssignments[grade], isClassTeacher: e.target.checked }
                            }
                          }))}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                        />
                        <span style={{ fontWeight: 500 }}>
                          Assign as Class Teacher for Grade {grade} Section {formData.gradeAssignments[grade]?.section || '...'}
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                      <label className="accounts-form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} /> Weekly Schedule
                      </label>
                      <button type="button" onClick={() => addMonFriSchedule(grade)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: 'var(--font-sm)', fontWeight: '600', cursor: 'pointer' }}>
                        <Plus size={16} /> Add Timing
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                      {formData.gradeAssignments[grade]?.schedules?.map((sched, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                          {/* Row 1: Day, Period, Delete */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select value={sched.day} onChange={(e) => updateSchedule(grade, idx, 'day', e.target.value)} style={{ flex: 1, padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={sched.period} onChange={(e) => updateSchedule(grade, idx, 'period', e.target.value)} style={{ flex: 1, padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}>
                              <option value="">Select Period</option>
                              {Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <button type="button" onClick={() => removeSchedule(grade, idx)} style={{ flex: '0 0 auto', background: 'var(--danger-50)', border: '1px solid var(--danger-100)', color: 'var(--danger-600)', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Remove Period">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          {/* Row 2: Timing Options */}
                          <div style={{ width: '100%' }}>
                            {sched.showTiming || sched.startTime || sched.endTime ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input type="time" value={sched.startTime || ''} onChange={(e) => updateSchedule(grade, idx, 'startTime', e.target.value)} style={{ flex: 1, minWidth: '100px', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>to</span>
                                <input type="time" value={sched.endTime || ''} onChange={(e) => updateSchedule(grade, idx, 'endTime', e.target.value)} style={{ flex: 1, minWidth: '100px', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }} />
                                <button type="button" onClick={() => { updateSchedule(grade, idx, 'startTime', ''); updateSchedule(grade, idx, 'endTime', ''); updateSchedule(grade, idx, 'showTiming', false); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger-600)', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', textDecoration: 'underline' }}>Clear</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => updateSchedule(grade, idx, 'showTiming', true)} style={{ width: '100%', background: 'var(--neutral-100)', border: '1px dashed var(--neutral-300)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, transition: 'background 0.2s' }}>
                                + Add Specific Timing
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!formData.gradeAssignments[grade]?.schedules || formData.gradeAssignments[grade]?.schedules.length === 0) && (
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>No timings added yet.</div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <div className="accounts-form-group" style={{ marginBottom: 'var(--sp-6)' }}>
              <label className="accounts-form-label" style={{ marginBottom: 'var(--sp-3)' }}>Assigned Schedule Preview</label>
              <div style={{ border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-xl)', padding: 'var(--sp-10) var(--sp-5)', textAlign: 'center', backgroundColor: 'var(--neutral-50)' }}>
                <Calendar size={32} color="var(--neutral-400)" style={{ marginBottom: 'var(--sp-3)' }} />
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  Previewing timetable for:<br />
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    {formData.grades.map(g => (
                      <div key={g} style={{ padding: '8px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                          {formData.gradeAssignments[g]?.subject || 'N/A'} ({g} - {formData.gradeAssignments[g]?.section || 'N/A'})
                        </strong>
                        {formData.gradeAssignments[g]?.schedules?.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                            {formData.gradeAssignments[g].schedules.map((s, i) => (
                              <li key={i}>{s.day}, {s.period} ({s.startTime} - {s.endTime})</li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>No timings assigned</span>
                        )}
                      </div>
                    ))}
                  </div>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: 'var(--sp-4)', backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-lg)' }}>
              <Info size={20} color="var(--primary-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--primary-800)', fontWeight: '600', lineHeight: '1.4' }}>Additional subjects can be added after initial save.</div>
            </div>
          </div>

        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--sp-3)',
        marginTop: 'var(--sp-4)',
        paddingTop: 'var(--sp-4)',
        borderTop: '1px solid var(--neutral-200)'
      }}>
        <button
          onClick={() => window.history.back()}
          style={{ padding: '12px 24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          style={{ padding: '12px 24px', backgroundColor: 'var(--primary-600)', opacity: isSubmitting ? 0.7 : 1, border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-inverse)', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-md)' }}
        >
          <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Teacher'}
        </button>
      </div>

      <style>{`
        .teacher-form-columns-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--layout-gap);
        }
        .teacher-assignment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-4);
          padding: var(--sp-4);
          background-color: var(--neutral-50);
          border-radius: var(--radius-lg);
        }
        @media (max-width: 820px) {
          .teacher-form-columns-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
        @media (max-width: 540px) {
          .teacher-assignment-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AddTeacher;
