import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, Users, BookOpen, FileText, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../components/common/DashboardOverview.css';
import '../accounts/styling/Accounts.css';
import './Teacher.css';

const Dashboard = () => {
  const [hoveredCard, setHoveredCard] = useState('classes');
  const [hoveredClassCard, setHoveredClassCard] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const firstName = user.name ? user.name.split(' ')[0] : 'Teacher';

  // Get current date string
  const today = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  const [assignedClasses, setAssignedClasses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { getTeacherClasses } = await import('../../services/api');
        const data = await getTeacherClasses();
        if (data.success && data.data) {
          setAssignedClasses(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch teacher classes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const pendingAttendanceCount = assignedClasses.filter(c => c.status === 'Pending' || c.status === 'In Session').length;
  const submittedAttendanceCount = assignedClasses.filter(c => c.status === 'Completed').length;
  const totalStudents = assignedClasses.reduce((acc, c) => acc + (c.students || 0), 0);

  return (
    <div className="accounts-container" style={{ marginTop: '-18px' }}>
      {/* Clean Card Welcome Banner */}
      <div className="no-print" style={{
        backgroundColor: 'var(--bg-card)',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--neutral-200)',
        borderLeft: '4px solid var(--primary-500)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            margin: '0 0 4px 0', 
            letterSpacing: '-0.5px' 
          }}>
            Good Morning, <span style={{ color: 'var(--primary-600)' }}>{firstName}</span>
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: 0, 
            fontSize: '13.5px',
            fontWeight: 500
          }}>
            {formattedDate} &bull; You have <strong style={{ color: 'var(--text-primary)' }}>{assignedClasses.length} classes</strong> scheduled today.
          </p>
        </div>
      </div>

      <div className="stats-row-v2">
        {/* Classes Today */}
        <div 
          className={`stat-card-v2 ${hoveredCard === 'classes' ? 'active' : ''}`}
          onMouseEnter={() => setHoveredCard('classes')}
        >
          <div className="stat-card-v2__header">
            <div className="stat-card-v2__icon-box blue">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="stat-card-v2__info">
            <span className="stat-card-v2__label">CLASSES TODAY</span>
            <h3 className="stat-card-v2__value">{String(assignedClasses.length).padStart(2, '0')}</h3>
            <span className="stat-card-v2__subtitle" style={{ fontSize: '12px', marginTop: '4px', display: 'block', color: 'var(--text-muted)' }}>+1 compared to yesterday</span>
          </div>
        </div>

        {/* Attendance Pending */}
        <div 
          className={`stat-card-v2 ${hoveredCard === 'pending' ? 'active' : ''}`}
          onMouseEnter={() => setHoveredCard('pending')}
        >
          <div className="stat-card-v2__header">
            <div className="stat-card-v2__icon-box orange">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-card-v2__info">
            <span className="stat-card-v2__label">ATTENDANCE PENDING</span>
            <h3 className="stat-card-v2__value">{String(pendingAttendanceCount).padStart(2, '0')}</h3>
            <span className="stat-card-v2__subtitle" style={{ fontSize: '12px', marginTop: '4px', display: 'block', color: 'var(--text-muted)' }}>Due in next 15 minutes</span>
          </div>
        </div>

        {/* Attendance Submitted */}
        <div 
          className={`stat-card-v2 ${hoveredCard === 'submitted' ? 'active' : ''}`}
          onMouseEnter={() => setHoveredCard('submitted')}
        >
          <div className="stat-card-v2__header">
            <div className="stat-card-v2__icon-box green">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-card-v2__info">
            <span className="stat-card-v2__label">ATTENDANCE SUBMITTED</span>
            <h3 className="stat-card-v2__value">{String(submittedAttendanceCount).padStart(2, '0')}</h3>
            <span className="stat-card-v2__subtitle" style={{ fontSize: '12px', marginTop: '4px', display: 'block', color: 'var(--text-muted)' }}>75% daily completion</span>
          </div>
        </div>

        {/* Students Assigned */}
        <div 
          className={`stat-card-v2 ${hoveredCard === 'students' ? 'active' : ''}`}
          onMouseEnter={() => setHoveredCard('students')}
        >
          <div className="stat-card-v2__header">
            <div className="stat-card-v2__icon-box indigo">
              <Users size={20} />
            </div>
          </div>
          <div className="stat-card-v2__info">
            <span className="stat-card-v2__label">STUDENTS ASSIGNED</span>
            <h3 className="stat-card-v2__value">{totalStudents}</h3>
            <span className="stat-card-v2__subtitle" style={{ fontSize: '12px', marginTop: '4px', display: 'block', color: 'var(--text-muted)' }}>Active across all grades</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Assigned Classes Today</h3>
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--neutral-100)', padding: '4px', borderRadius: '8px' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: viewMode === 'list' ? '1px solid var(--neutral-200)' : '1px solid transparent', backgroundColor: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
            >
              List View
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: viewMode === 'grid' ? '1px solid var(--neutral-200)' : '1px solid transparent', backgroundColor: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
            >
              Grid View
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="classes-grid">
            {assignedClasses.map((cls) => (
              <div 
                key={cls.id}
                onClick={() => navigate(`/teacher/session/${cls.id}`, { state: { sessionData: cls.stateData } })}
                style={{ cursor: 'pointer', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: hoveredClassCard === cls.id ? '1px solid var(--primary-300)' : (cls.status === 'In Session' ? '1px solid var(--primary-500)' : '1px solid var(--neutral-200)'), padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s', boxShadow: hoveredClassCard === cls.id ? '0 4px 12px rgba(37,99,235,0.08)' : (cls.status === 'In Session' ? '0 4px 12px rgba(37,99,235,0.08)' : '0 1px 2px rgba(0,0,0,0.02)') }}
                onMouseEnter={() => setHoveredClassCard(cls.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: cls.status === 'In Session' ? 700 : 600, color: cls.status === 'In Session' ? 'var(--primary-600)' : 'var(--text-secondary)' }}>{cls.time}</span>
                  <span style={{ 
                    padding: '3px 6px', borderRadius: '4px', fontSize: '10px', 
                    fontWeight: cls.status === 'In Session' ? 700 : 600, 
                    backgroundColor: cls.status === 'Completed' ? 'var(--success-50)' : cls.status === 'In Session' ? 'var(--primary-50)' : 'var(--indigo-50)', 
                    color: cls.status === 'Completed' ? 'var(--success-700)' : cls.status === 'In Session' ? 'var(--primary-700)' : 'var(--indigo-700)',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    {cls.status === 'In Session' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-600)' }}></span>}
                    {cls.status}
                  </span>
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>{cls.subject}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {cls.grade}
                    {cls.isClassTeacher && (
                      <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 5px', borderRadius: '4px' }}>Class Teacher</span>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <Users size={12} />
                    <span>{cls.students} Students</span>
                  </div>
                  {cls.status === 'Completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--success-600)' }}>
                      <CheckCircle size={12} />
                      <span>Attendance Done</span>
                    </div>
                  )}
                  {cls.status === 'In Session' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--warning-600)' }}>
                      <AlertCircle size={12} />
                      <span>Due Now</span>
                    </div>
                  )}
                </div>
                <button style={{ 
                  width: '100%', padding: '6px', marginTop: '2px', borderRadius: '6px', 
                  border: cls.status === 'In Session' ? 'none' : '1px solid var(--neutral-200)', 
                  backgroundColor: cls.status === 'In Session' ? 'var(--primary-600)' : (cls.status === 'Completed' ? 'var(--neutral-50)' : 'transparent'), 
                  color: cls.status === 'In Session' ? 'white' : 'var(--text-primary)', 
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer' 
                }}>
                  {cls.actionText}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="accounts-table-card" style={{ overflowX: 'auto' }}>
            <table className="accounts-table" style={{ width: '100%', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject & Grade</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Students</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedClasses.map((cls, index) => (
                  <tr 
                    key={cls.id} 
                    style={{ borderBottom: index < assignedClasses.length - 1 ? '1px solid var(--neutral-100)' : 'none', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: hoveredClassCard === cls.id ? 'var(--neutral-50)' : 'transparent' }}
                    onClick={() => navigate(`/teacher/session/${cls.id}`, { state: { sessionData: cls.stateData } })}
                    onMouseEnter={() => setHoveredClassCard(cls.id)}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: cls.status === 'In Session' ? 600 : 500, color: cls.status === 'In Session' ? 'var(--primary-600)' : 'var(--text-primary)' }}>{cls.time}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{cls.subject}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cls.grade}
                        {cls.isClassTeacher && (
                          <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 6px', borderRadius: '4px' }}>Class Teacher</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} />
                        <span>{cls.students}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', 
                        fontWeight: 600, 
                        backgroundColor: cls.status === 'Completed' ? 'var(--success-50)' : cls.status === 'In Session' ? 'var(--primary-50)' : 'var(--indigo-50)', 
                        color: cls.status === 'Completed' ? 'var(--success-700)' : cls.status === 'In Session' ? 'var(--primary-700)' : 'var(--indigo-700)',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}>
                        {cls.status === 'In Session' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-600)' }}></span>}
                        {cls.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button style={{ 
                        padding: '8px 16px', borderRadius: '8px', 
                        border: cls.status === 'In Session' ? 'none' : '1px solid var(--neutral-200)', 
                        backgroundColor: cls.status === 'In Session' ? 'var(--primary-600)' : 'white', 
                        color: cls.status === 'In Session' ? 'white' : 'var(--text-primary)', 
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer' 
                      }}>
                        {cls.actionText}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
