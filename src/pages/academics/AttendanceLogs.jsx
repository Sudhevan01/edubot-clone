import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getAttendanceLogs } from '../../services/api';
import { FaCalendarAlt, FaCalendarDay, FaSlidersH, FaSyncAlt, FaPrint, FaFilePdf, FaFileExcel, FaIdCard, FaPercentage, FaUserTimes } from 'react-icons/fa';
import '../admin/VisitorLogs.css';
import '../accounts/styling/Accounts.css';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

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

const AttendanceLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [activeCard, setActiveCard] = useState('TOTAL RECORDS');
  const [hoveredCard, setHoveredCard] = useState(null);

  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const fetchLogs = async (date) => {
    try {
      setLoading(true);
      const res = await getAttendanceLogs(date);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate]);

  const filteredLogs = logs.map(log => ({
    ...log,
    status: (Number(log.present) > 0 || Number(log.absent) > 0) ? 'Submitted' : 'Pending'
  })).filter(log => {
    let match = true;
    if (filterTeacher && log.teacherName && !log.teacherName.toLowerCase().includes(filterTeacher.toLowerCase())) match = false;
    if (filterClass && log.class && !log.class.toLowerCase().includes(filterClass.toLowerCase())) match = false;
    return match;
  });

  const totalRecords = filteredLogs.length;
  const totalAbsent = filteredLogs.reduce((acc, curr) => acc + curr.absent, 0);
  const avgAttendance = filteredLogs.length > 0
    ? (filteredLogs.reduce((acc, curr) => acc + curr.percent, 0) / filteredLogs.length).toFixed(1)
    : 0;

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      alert("No data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(filteredLogs.map(d => ({
      Teacher: d.teacherName, Subject: d.subject, Class: d.class, 'Time/Period': `${d.time} (Period ${d.period})`,
      Present: d.present, Absent: d.absent, Attendance: `${d.percent}%`
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Logs");
    XLSX.writeFile(wb, `Attendance_Logs_${selectedDate}.xlsx`);
  };

  const handleExportPDF = () => {
    window.print();
  };

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
        }
        .acad-filters .range-filter-group {
          gap: 6px;
          flex-shrink: 0;
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
        .acad-filters .date-picker-v2 {
          padding: 0 10px;
          min-width: unset;
          gap: 6px;
        }
        .acad-filters .date-picker-v2 input[type="date"] {
          font-size: 12.5px;
          width: 130px;
          min-width: 130px;
          cursor: pointer;
          pointer-events: all;
        }
        .acad-filters .filter-label {
          font-size: 10px;
          margin-right: 2px;
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }
        .acad-filters .export-csv-btn {
          padding: 0 16px;
          height: 38px;
          font-size: 13px;
          border-radius: 10px;
          flex-shrink: 0;
          white-space: nowrap;
          gap: 6px;
          margin-left: auto;
        }

        /* Responsive Mobile Layout Adjustments */
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
          .acad-filters .range-filter-group {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .acad-filters .acad-filter-dropdown {
            display: flex !important;
            width: 100% !important;
            flex-shrink: 1 !important;
            box-sizing: border-box !important;
          }
          .acad-filters .acad-filter-dropdown select {
            width: 100% !important;
            min-width: 0 !important;
            flex: 1 !important;
          }
          .acad-filters .date-picker-v2 {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .acad-filters .date-picker-v2 input[type="date"] {
            width: 100% !important;
            min-width: 0 !important;
            flex: 1 !important;
          }
          .acad-filters .export-csv-btn {
            width: 100% !important;
            margin-left: 0 !important;
            justify-content: center !important;
          }
        }
        @media (max-width: 540px) {
          .stats-row-v2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Metrics Row */}
      <div className="stats-row-v2 no-print" style={{ gap: '16px' }} onMouseLeave={() => setHoveredCard(null)}>

        {/* Card 1 */}
        <div
          className={`stat-card-v2 ${(hoveredCard === 'TOTAL RECORDS' || (!hoveredCard && activeCard === 'TOTAL RECORDS')) ? 'active' : ''}`}
          onMouseEnter={() => setHoveredCard('TOTAL RECORDS')}
          onClick={() => setActiveCard('TOTAL RECORDS')}
        >
          <div className="stat-card-v2__header">
            <div className="stat-card-v2__icon-box blue">
              <FaIdCard size={20} />
            </div>
          </div>
          <div className="stat-card-v2__info">
            <span className="stat-card-v2__label">TOTAL RECORDS</span>
            <h3 className="stat-card-v2__value">{totalRecords}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div
          className={`stat-card-v2 ${(hoveredCard === 'AVG. ATTENDANCE' || (!hoveredCard && activeCard === 'AVG. ATTENDANCE')) ? 'active' : ''}`}
          onMouseEnter={() => setHoveredCard('AVG. ATTENDANCE')}
          onClick={() => setActiveCard('AVG. ATTENDANCE')}
        >
          <div className="stat-card-v2__header">
            <div className="stat-card-v2__icon-box indigo">
              <FaPercentage size={20} />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: (hoveredCard === 'AVG. ATTENDANCE' || (!hoveredCard && activeCard === 'AVG. ATTENDANCE')) ? '#ffffff' : (avgAttendance >= 90 ? 'var(--success-600)' : 'var(--warning-600)') }}>
              ● {avgAttendance >= 90 ? 'Excellent' : 'Needs Attention'}
            </div>
          </div>
          <div className="stat-card-v2__info">
            <span className="stat-card-v2__label">AVG. ATTENDANCE</span>
            <h3 className="stat-card-v2__value">{avgAttendance}%</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div
          className={`stat-card-v2 ${(hoveredCard === 'TOTAL ABSENTEES' || (!hoveredCard && activeCard === 'TOTAL ABSENTEES')) ? 'active' : ''}`}
          onMouseEnter={() => setHoveredCard('TOTAL ABSENTEES')}
          onClick={() => setActiveCard('TOTAL ABSENTEES')}
          style={{ borderColor: (hoveredCard === 'TOTAL ABSENTEES' || (!hoveredCard && activeCard === 'TOTAL ABSENTEES')) ? 'transparent' : 'var(--danger-200)' }}
        >
          <div className="stat-card-v2__header">
            <div className="stat-card-v2__icon-box orange">
              <FaUserTimes size={20} />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: (hoveredCard === 'TOTAL ABSENTEES' || (!hoveredCard && activeCard === 'TOTAL ABSENTEES')) ? '#ffffff' : 'var(--danger-500)' }}>
              {totalAbsent > 0 ? 'ACTION REQUIRED' : 'ALL GOOD'}
            </div>
          </div>
          <div className="stat-card-v2__info">
            <span className="stat-card-v2__label">TOTAL ABSENTEES</span>
            <h3 className="stat-card-v2__value">{totalAbsent}</h3>
          </div>
        </div>

      </div>

      {/* Controls / Filters Row — VisitorLogs theme, compact */}
      <section className="acad-filters log-filters no-print">

        {/* Date Filter */}
        <div className="acad-filter-dropdown date-picker-v2">
          <span className="filter-label">DATE</span>
          <input
            type="date"
            value={selectedDate}
            max={(() => {
              const d = new Date();
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Teacher Filter */}
        <CustomSelect
          value={filterTeacher}
          onChange={(val) => setFilterTeacher(val)}
          options={[
            { value: '', label: 'All Teachers' },
            ...[...new Set(logs.map(log => log.teacherName).filter(Boolean))].sort().map(t => ({
              value: t,
              label: t
            }))
          ]}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
        />

        {/* Class Filter */}
        <CustomSelect
          value={filterClass}
          onChange={(val) => setFilterClass(val)}
          options={[
            { value: '', label: 'All Classes' },
            ...[...new Set(logs.map(log => log.class).filter(Boolean))].sort().map(c => ({
              value: c,
              label: c
            }))
          ]}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
        />

        {/* Export Button — margin-left: auto pushes it right; wraps to next line if no space */}
        <button className="export-csv-btn" onClick={handleExportExcel}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Excel
        </button>
      </section>

      <div className="accounts-table-card print-friendly" style={{ paddingBottom: '80px', overflowX: 'auto' }}>
        <div style={{ padding: 'var(--sp-5) var(--sp-6)', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Detailed Records</h3>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading attendance records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: 'var(--sp-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No classes scheduled or matching filters for this date.
          </div>
        ) : (
          <table className="accounts-table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Date</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Teacher</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Subject</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Grade/Sec</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Present</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Absent</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Attendance %</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Status</th>
                <th className="no-print" style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {(() => {
                      const formatted = formatDisplayDate(row.date);
                      const parts = formatted.split(',');
                      return (
                        <>
                          {parts[0]}<br />{parts[1] || ''}
                        </>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: row.bg || 'var(--primary-100)', color: row.color || 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{row.initials}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-sm)', lineHeight: '1.2' }}>{row.teacherName}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{row.subject}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{row.class}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>{row.present === 0 && row.absent === 0 ? 0 : row.present}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>{row.present === 0 && row.absent === 0 ? 0 : row.absent}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--neutral-200)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                        <div style={{ width: `${row.percent}%`, height: '100%', backgroundColor: row.percent >= 90 ? 'var(--success-500)' : 'var(--warning-500)', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{row.percent}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: row.status === 'Submitted' ? 'var(--success-50)' : 'var(--warning-50)',
                      color: row.status === 'Submitted' ? 'var(--success-700)' : 'var(--warning-700)'
                    }}>
                      {row.status === 'Submitted' ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                  <td className="no-print" style={{ padding: '16px 24px', borderBottom: idx === filteredLogs.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
                    <button
                      onClick={() => navigate(`/admin/academics/session/${row.id}`, { state: { sessionData: row } })}
                      style={{ padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.color = 'var(--primary-600)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--neutral-300)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceLogs;
