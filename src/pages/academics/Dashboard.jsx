import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilePdf, FaFileExcel, FaIdCard, FaPercentage, FaUserTimes, FaSlidersH, FaSyncAlt } from 'react-icons/fa';
import { Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getAdminAttendanceSummary } from '../../services/api';
import '../../components/common/DashboardOverview.css';
import '../accounts/styling/Accounts.css';
import '../admin/VisitorLogs.css';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState('TOTAL RECORDS');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [filters, setFilters] = useState({
    grade: 'All Grades',
    section: 'All Sections',
    teacher: 'All Teachers',
    subject: 'All Subjects'
  });
  const today = new Date();
  // Set start date to the beginning of the previous month to display historical records by default
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const firstDay = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

  const lastDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastDay = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;
  const [dateRange, setDateRange] = useState({
    startDate: firstDay,
    endDate: lastDay
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await getAdminAttendanceSummary();
        if (response.success) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch attendance summary', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const filteredData = useMemo(() => {
    return data.map(item => ({
      ...item,
      status: (Number(item.present) > 0 || Number(item.absent) > 0) ? 'Submitted' : 'Pending'
    })).filter(item => {
      let gradeMatch = filters.grade === 'All Grades' || item.gradeSec.startsWith(filters.grade.replace('Grade ', ''));
      let secMatch = filters.section === 'All Sections' || item.gradeSec.endsWith(filters.section.replace('Section ', ''));
      let teacherMatch = filters.teacher === 'All Teachers' || item.name.includes(filters.teacher.replace('Dr. ', ''));
      let subjectMatch = filters.subject === 'All Subjects' || item.subject === filters.subject;

      let dateMatch = true;
      if (dateRange.startDate && dateRange.endDate) {
        const itemDate = new Date(item.date);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        itemDate.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        dateMatch = itemDate >= start && itemDate <= end;
      }

      return gradeMatch && secMatch && teacherMatch && subjectMatch && dateMatch;
    });
  }, [filters, dateRange, data]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalRecords = filteredData.length;
  const totalAbsent = filteredData.reduce((acc, curr) => acc + curr.absent, 0);
  const avgAttendance = filteredData.length > 0
    ? (filteredData.reduce((acc, curr) => acc + curr.percent, 0) / filteredData.length).toFixed(1)
    : 0;

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("No data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(filteredData.map(d => ({
      Date: d.date, Teacher: d.name, Subject: d.subject, Class: d.gradeSec,
      Present: d.present, Absent: d.absent, Attendance: `${d.percent}%`
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Attendance_Report.xlsx");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="accounts-container dashboard-overview admin-dashboard-v2">

      {/* Metrics Row */}
      <div className="stats-row-v2" style={{ gap: '16px' }} onMouseLeave={() => setHoveredCard(null)}>

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
          background: transparent;
          border: none;
          padding: 0 8px 0 30px;
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          outline: none;
          appearance: none;
          min-width: 78px;
          width: auto;
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
          width: 120px;
          min-width: 120px;
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

      {/* Controls / Filters Row — VisitorLogs theme, compact */}
      <section className="acad-filters log-filters no-print">

        {/* Date Range */}
        <div className="range-filter-group">
          <div className="acad-filter-dropdown date-picker-v2">
            <span className="filter-label">FROM</span>
            <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="acad-filter-dropdown date-picker-v2">
            <span className="filter-label">TILL</span>
            <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(p => ({ ...p, endDate: e.target.value }))} />
          </div>
        </div>

        {/* Grade Filter */}
        <CustomSelect
          value={filters.grade}
          onChange={(val) => handleFilterChange('grade', val)}
          options={[
            { value: 'All Grades', label: 'All Grades' },
            ...[...new Set(data.map(d => d.gradeSec.split('-')[0]))].filter(Boolean).map(g => ({
              value: `Grade ${g}`,
              label: `Grade ${g}`
            }))
          ]}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
        />

        {/* Section Filter */}
        <CustomSelect
          value={filters.section}
          onChange={(val) => handleFilterChange('section', val)}
          options={[
            { value: 'All Sections', label: 'All Sections' },
            ...[...new Set(data.map(d => d.gradeSec.split('-')[1]))].filter(Boolean).map(s => ({
              value: `Section ${s}`,
              label: `Section ${s}`
            }))
          ]}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
        />

        {/* Teacher Filter */}
        <CustomSelect
          value={filters.teacher}
          onChange={(val) => handleFilterChange('teacher', val)}
          options={[
            { value: 'All Teachers', label: 'All Teachers' },
            ...[...new Set(data.map(d => d.name))].filter(Boolean).map(t => ({
              value: t,
              label: t
            }))
          ]}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
        />

        {/* Subject Filter */}
        <CustomSelect
          value={filters.subject}
          onChange={(val) => handleFilterChange('subject', val)}
          options={[
            { value: 'All Subjects', label: 'All Subjects' },
            ...[...new Set(data.map(d => d.subject))].filter(Boolean).map(s => ({
              value: s,
              label: s
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

      {/* Data Table */}
      <div className="accounts-table-card" style={{ paddingBottom: '80px', overflowX: 'auto' }}>
        <div style={{ padding: 'var(--sp-5) var(--sp-6)', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Detailed Records</h3>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader size={32} className="spin" style={{ margin: '0 auto var(--sp-4)', display: 'block', color: 'var(--primary-600)' }} />
            Loading attendance records...
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: 'var(--sp-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No attendance records found matching the selected filters.
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
              {paginatedData.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {row.date.split(',')[0]}<br />{row.date.split(',')[1]}
                  </td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: row.bg, color: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{row.initials}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-sm)', lineHeight: '1.2' }}>{row.name.replace(' ', '\n')}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{row.subject}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{row.gradeSec}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>{row.present}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>{row.absent}</td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--neutral-200)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                        <div style={{ width: `${row.percent}%`, height: '100%', backgroundColor: row.percent >= 90 ? 'var(--success-500)' : 'var(--warning-500)', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{row.percent}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
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
                  <td className="no-print" style={{ padding: '16px 24px', borderBottom: idx === paginatedData.length - 1 ? 'none' : '1px solid var(--neutral-200)' }}>
                    <button
                      onClick={() => navigate(`/admin/academics/session/${row.id}`, { state: { sessionData: row } })}
                      style={{ padding: '6px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      View<br />Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
        {filteredData.length > 0 && (
          <div className="no-print" style={{ padding: 'var(--sp-4) var(--sp-6)', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalRecords}</strong> records
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >{'<'}</button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)',
                    border: currentPage === i + 1 ? 'none' : '1px solid var(--neutral-200)',
                    backgroundColor: currentPage === i + 1 ? 'var(--primary-600)' : 'transparent',
                    color: currentPage === i + 1 ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: currentPage === i + 1 ? 600 : 500
                  }}
                >{i + 1}</button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >{'>'}</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .accounts-container { padding: 0 !important; background: white !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
