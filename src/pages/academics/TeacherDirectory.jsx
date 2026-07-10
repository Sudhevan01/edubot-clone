import React, { useState, useEffect } from 'react';
import { getTeachersList, deleteStaff } from '../../services/api';
import ManageTeacherModal from './ManageTeacherModal';
import EditTeacherModal from './EditTeacherModal';
import CustomModal from '../../components/common/CustomModal';
import Toast from '../../components/common/Toast';
import { FaUserGraduate, FaChalkboardTeacher, FaEdit, FaTrashAlt, FaUserEdit } from 'react-icons/fa';

const TeacherDirectory = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isAlert: false
  });
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '' });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await getTeachersList();
      if (res.success) {
        setTeachers(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleManageClasses = (teacher) => {
    setSelectedTeacher(teacher);
    setIsManageClassesOpen(true);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleDeleteTeacher = (id) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Delete Teacher?',
      message: 'Are you sure you want to permanently remove this teacher? They will lose all access to the system immediately.',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          const response = await deleteStaff(id);
          if (response.success) {
            setTeachers(teachers.filter(t => t.id !== id));
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setToast({
              isOpen: true,
              title: 'Deleted Successfully',
              message: 'The teacher has been removed from the database.'
            });
          }
        } catch (error) {
          setModalConfig({
            isOpen: true,
            type: 'warning',
            title: 'Error',
            message: 'Failed to remove teacher: ' + error.message,
            isAlert: true
          });
        }
      }
    });
  };

  const handleManageClassesClose = (wasUpdated) => {
    setIsManageClassesOpen(false);
    setSelectedTeacher(null);
    if (wasUpdated) {
      fetchTeachers();
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleEditSuccess = () => {
    fetchTeachers();
    setToast({
      isOpen: true,
      title: 'Updated Successfully',
      message: 'The teacher credentials have been updated.'
    });
  };

  return (
    <div className="accounts-container" style={{ marginTop: '-10px' }}>
      <div className="accounts-form-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading teachers...
          </div>
        ) : teachers.length === 0 ? (
          <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No teachers found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--neutral-200)', textAlign: 'left', backgroundColor: 'var(--bg-subtle)' }}>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Contact Info</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Assigned Classes</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher.id} style={{ borderBottom: '1px solid var(--neutral-200)', transition: 'background-color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-700)', fontWeight: 'bold', flexShrink: 0 }}>
                          {teacher.name.substring(0, 2).toUpperCase()}
                        </div>
                        {teacher.name}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                      <div>{teacher.email}</div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                      {teacher.assignments && teacher.assignments.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {teacher.assignments.map(a => (
                            <span key={a.id} style={{ padding: '4px 8px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '4px', border: '1px solid var(--primary-200)', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {a.grade}-{a.section} ({a.subject})
                              {a.isClassTeacher ? <span style={{ backgroundColor: 'var(--primary-200)', color: 'var(--primary-800)', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 700 }}>Class Teacher</span> : null}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--danger-500)', fontWeight: 500 }}>No Classes Assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleManageClasses(teacher)}
                          title="Manage Classes"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--primary-600)', backgroundColor: 'transparent', color: 'var(--primary-600)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--primary-600)'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-600)'; }}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          title="Edit Credentials"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--neutral-400)', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <FaUserEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          title="Delete Teacher"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--danger-500)', backgroundColor: 'transparent', color: 'var(--danger-500)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--danger-500)'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--danger-500)'; }}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isManageClassesOpen && selectedTeacher && (
        <ManageTeacherModal
          teacher={selectedTeacher}
          onClose={handleManageClassesClose}
        />
      )}

      {isEditModalOpen && selectedTeacher && (
        <EditTeacherModal
          isOpen={isEditModalOpen}
          teacher={selectedTeacher}
          onClose={handleEditModalClose}
          onUpdate={handleEditSuccess}
        />
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

export default TeacherDirectory;
