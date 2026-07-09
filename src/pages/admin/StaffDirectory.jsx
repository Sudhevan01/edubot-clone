import React, { useState, useEffect } from 'react';
import './StaffDirectory.css';
import AddGateGuardModal from './AddGateGuardModal';
import { getStaff, deleteStaff } from '../../services/api';
import CustomModal from '../../components/common/CustomModal';
import Toast from '../../components/common/Toast';
import { isLockedSupportAccount } from '../../utils/lockedSupportAccounts';

const StaffDirectory = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [editData, setEditData] = useState(null);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'warning',
        title: '',
        message: '',
        onConfirm: null,
        isAlert: false
    });
    const [toast, setToast] = useState({ isOpen: false, title: '', message: '' });

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await getStaff();
            if (response.success) {
                setStaff(response.data);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const showLockedToast = () => {
        setToast({ isOpen: true, title: 'Action Disabled', message: 'This account is reserved for technical support and cannot be edited or deleted.' });
    };

    const handleDelete = (id, email, memberRole) => {
        if (isLockedSupportAccount(email)) {
            showLockedToast();
            return;
        }
        if (memberRole === 'SUPER_ADMIN') {
            const superAdmins = staff.filter(s => s.role === 'SUPER_ADMIN');
            const primarySuperAdminId = superAdmins.length > 0 ? Math.min(...superAdmins.map(s => s.id)) : null;
            if (Number(id) === Number(primarySuperAdminId)) {
                setToast({ isOpen: true, title: 'Action Disabled', message: 'The primary Super Admin of the organization cannot be deleted.' });
                return;
            }
        }
        setModalConfig({
            isOpen: true,
            type: 'warning',
            title: 'Delete Staff Member?',
            message: 'Are you sure you want to permanently remove this staff member? They will lose all access to the system immediately.',
            confirmText: 'Delete Permanently',
            onConfirm: async () => {
                try {
                    const response = await deleteStaff(id);
                    if (response.success) {
                        setStaff(staff.filter(op => op.id !== id));
                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                        setToast({
                            isOpen: true,
                            title: 'Deleted Successfully',
                            message: 'The staff member record has been removed from the database.'
                        });
                    }
                } catch (error) {
                    setModalConfig({
                        isOpen: true,
                        type: 'warning',
                        title: 'Error',
                        message: 'Failed to remove staff: ' + error.message,
                        isAlert: true
                    });
                }
            }
        });
    };

    const handleEdit = (member) => {
        if (isLockedSupportAccount(member.email)) {
            showLockedToast();
            return;
        }
        if (member.role === 'SUPER_ADMIN') {
            const superAdmins = staff.filter(s => s.role === 'SUPER_ADMIN');
            const primarySuperAdminId = superAdmins.length > 0 ? Math.min(...superAdmins.map(s => s.id)) : null;
            if (Number(member.id) === Number(primarySuperAdminId)) {
                setToast({ isOpen: true, title: 'Action Disabled', message: 'The primary Super Admin of the organization cannot be edited.' });
                return;
            }
        }
        setEditData(member);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleAddSuccess = (isEditMode = false) => {
        fetchStaff();
        setToast({
            isOpen: true,
            title: isEditMode ? 'Updated Successfully' : 'Registered Successfully',
            message: isEditMode ? 'The staff member record has been updated.' : 'A new staff member has been added to the system.'
        });
    };

    const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
    const isVmsEnabled = org.vmsEnabled !== 0 && org.vmsEnabled !== false;
    const isRmsEnabled = !!org.rmsEnabled;

    // Filter staff members based on currently enabled modules (VMS/RMS)
    const activeStaff = staff.filter(member => {
        const isVmsRole = ['GATEGUARD', 'OPERATOR', 'SECURITY', 'RECEPTIONIST'].includes(member.role);
        const isRmsRole = ['ACCOUNTANT'].includes(member.role);
        if (isVmsRole && !isVmsEnabled) return false;
        if (isRmsRole && !isRmsEnabled) return false;
        if (member.role === 'TEACHER') return false;
        return true;
    });

    // Calculate Dynamic Stats
    const gateGuardCount = activeStaff.filter(s => s.role === 'GATEGUARD').length;
    const adminCount = activeStaff.filter(s => s.role === 'ADMIN' || s.role === 'SUPER_ADMIN').length;
    const accountantCount = activeStaff.filter(s => s.role === 'ACCOUNTANT').length;

    // Get last activity (most recent join/update)
    const lastActivityTime = activeStaff.length > 0
        ? new Date(Math.max(...activeStaff.map(s => new Date(s.updatedAt || s.createdAt)))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '00:00';

    // Filtering logic
    const filteredStaff = activeStaff.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || member.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, itemsPerPage]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStaff = filteredStaff.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

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
        <div className="staff-page-content">
            <section className="staff-stats-row">
                {isVmsEnabled && (
                    <div className="staff-stat-card">
                        <div className="stat-icon-box">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <div className="stat-info-group">
                            <span className="stat-val-text">{gateGuardCount}</span>
                            <span className="stat-label-text">Gate Guards</span>
                        </div>
                    </div>
                )}

                <div className="staff-stat-card">
                    <div className="stat-icon-box" style={{ background: '#f3e8ff', color: '#a855f7' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="7" r="4" />
                            <path d="M10 14H5a4 4 0 0 0-4 4v3" />
                            <path d="M12 18a4 4 0 0 0 4-4v-1" />
                            <circle cx="16.5" cy="16.5" r="5.5" fill="#f3e8ff" stroke="none" />
                            <g transform="translate(11.1, 11.1) scale(0.45)">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </g>
                        </svg>
                    </div>
                    <div className="stat-info-group">
                        <span className="stat-val-text">{adminCount}</span>
                        <span className="stat-label-text">System Administrators</span>
                    </div>
                </div>

                {isRmsEnabled && (
                    <div className="staff-stat-card">
                        <div className="stat-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <div className="stat-info-group">
                            <span className="stat-val-text">{accountantCount}</span>
                            <span className="stat-label-text">Accountants</span>
                        </div>
                    </div>
                )}

            </section>

            <section className="controls-row-v2">
                <div className="search-bar-v2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        type="text"
                        placeholder="Search by name, role or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-dropdown-v2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="All">Filter by Role</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ADMIN">Admin</option>
                        {isVmsEnabled && <option value="GATEGUARD">Gate Guard</option>}
                        {isRmsEnabled && <option value="ACCOUNTANT">Accountant</option>}
                        {isVmsEnabled && <option value="OPERATOR">Operator</option>}
                    </select>
                </div>

                {isSuperAdmin && (
                    <button className="new-entry-btn-v2" onClick={() => setIsModalOpen(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="16" y1="11" x2="22" y2="11" />
                        </svg>
                        Add Staff
                    </button>
                )}
            </section>

            <section className="directory-card">

                <table className="staff-table">
                    <thead>
                        <tr>
                            <th>Staff Member</th>
                            <th className="role-column">Role</th>
                            <th>Email Address</th>
                            <th>Joined Date</th>
                            {isSuperAdmin && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStaff.map((op, i) => (
                            <tr key={op.id}>
                                <td>
                                    <div className="staff-profile-cell">
                                        <div className="staff-avatar" style={{ background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {op.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="staff-name">{op.name}</span>
                                            <span className="staff-id">ID: {op.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="role-column"><span className={`role-pill role-${op.role.toLowerCase()}`}>{
                                    op.role === 'GATEGUARD' ? 'Gate Guard' :
                                        op.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                            op.role === 'ADMIN' ? 'Admin' :
                                                op.role === 'ACCOUNTANT' ? 'Accountant' : 
                                                    op.role === 'OPERATOR' ? 'Operator' : op.role
                                }</span></td>
                                <td className="email-cell">
                                    <div>{op.email}</div>
                                </td>
                                <td className="date-cell">{new Date(op.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                                {isSuperAdmin && (
                                    <td>
                                        <div className="action-group-v2">
                                            {
                                                (() => {
                                                    const superAdmins = staff.filter(s => s.role === 'SUPER_ADMIN');
                                                    const primarySuperAdminId = superAdmins.length > 0 ? Math.min(...superAdmins.map(s => s.id)) : null;
                                                    const isPrimarySuperAdmin = op.role === 'SUPER_ADMIN' && Number(op.id) === Number(primarySuperAdminId);
                                                    const locked = isLockedSupportAccount(op.email) || isPrimarySuperAdmin;
                                                    const tooltipText = isLockedSupportAccount(op.email)
                                                        ? 'Locked for support'
                                                        : isPrimarySuperAdmin
                                                            ? 'The primary Super Admin cannot be edited or deleted'
                                                            : 'Edit Staff';
                                                    const deleteTooltipText = isLockedSupportAccount(op.email)
                                                        ? 'Locked for support'
                                                        : isPrimarySuperAdmin
                                                            ? 'The primary Super Admin cannot be edited or deleted'
                                                            : 'Delete Staff';
                                                    return (
                                                        <>
                                                            <button className={`action-btn-v2 edit ${locked ? 'locked' : ''}`} title={tooltipText} onClick={() => locked ? showLockedToast() : handleEdit(op)}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                            </button>
                                                            <button className={`action-btn-v2 delete ${locked ? 'locked' : ''}`} title={deleteTooltipText} onClick={() => locked ? showLockedToast() : handleDelete(op.id, op.email, op.role)}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                            </button>
                                                        </>
                                                    );
                                                })()
                                            }
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredStaff.length > 0 && (
                    <div className="table-footer-v2">
                        <div className="showing-entries-group-v2">
                            <span className="showing-entries-v2">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStaff.length)} of {filteredStaff.length} entries
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
            <AddGateGuardModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onAdd={handleAddSuccess}
                editData={editData}
            />
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

export default StaffDirectory;
