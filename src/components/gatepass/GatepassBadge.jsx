import React from 'react';
import './GatepassBadge.css';
import { getQrUrl } from '../../services/api';

const GatepassBadge = ({ showPreview, entryMode, currentPass, formData }) => {
  const isFaculty = showPreview ? currentPass.isFaculty : entryMode === 'faculty';

  const rel      = showPreview ? currentPass?.relation    : formData?.relation;
  const phone    = showPreview ? currentPass?.pickupPhone : formData?.pickupPhone;
  const busRoute = showPreview ? currentPass?.busRoute    : formData?.busRoute;
  const showPhone = !isFaculty && (rel === 'Guardian' || rel === 'Other') && phone;

  return (
    <div id="printable-badge" className="visitor-badge-card">
      <div className="badge-content">
        <div className="badge-header-row">
          <img
            src={(() => {
              try {
                const org = JSON.parse(localStorage.getItem('vms_org'));
                return org?.logo || '/assets/images/logo1.png';
              } catch {
                return '/assets/images/logo1.png';
              }
            })()}
            alt="Logo"
            className="badge-logo"
          />
          <span className="badge-type-label">{isFaculty ? 'Faculty Gatepass' : 'Student Gatepass'}</span>
        </div>

        <div className="badge-middle-section">
          {/* ── LEFT COLUMN ── */}
          <div className="badge-info-left">
            <div className="badge-info-item">
              <label>{isFaculty ? 'FACULTY NAME' : 'STUDENT NAME'}</label>
              <h1 className="badge-visitor-name">
                {showPreview
                  ? (isFaculty ? currentPass.facultyName : currentPass.studentName)
                  : (isFaculty ? (formData.facultyName || 'Faculty Name') : (formData.studentName || 'Student Name'))}
              </h1>
            </div>

            <div className="badge-info-item">
              <label>{isFaculty ? 'DEPARTMENT' : 'GRADE & SECTION'}</label>
              <p className="badge-text-primary">
                {showPreview
                  ? (isFaculty ? currentPass.department : `${currentPass.grade} - ${currentPass.section}`)
                  : (isFaculty ? (formData.department || 'Department') : (formData.grade ? `${formData.grade} - ${formData.section}` : 'Grade - Section'))}
              </p>
            </div>

            {!isFaculty && (
              <div className="badge-info-item">
                <label>PICKED UP BY</label>
                {/* Name (Relation) */}
                <p className="badge-text-secondary" style={{ margin: 0 }}>
                  {showPreview
                    ? `${currentPass.pickupBy} (${currentPass.relation})`
                    : (formData.pickupBy ? `${formData.pickupBy} (${formData.relation})` : 'Guardian (Relation)')}
                </p>
                {/* Phone — only for Guardian / Other */}
                {showPhone && (
                  <p className="badge-text-secondary" style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    {phone}
                  </p>
                )}
              </div>
            )}

            <div className="badge-info-item">
              <label>APPROVING AUTHORITY</label>
              <p className="badge-text-secondary">{showPreview ? currentPass.authority : formData.authority}</p>
            </div>

            {isFaculty && (
              <div className="badge-info-item">
                <label>EXPECTED RETURN TIME</label>
                <p className="badge-text-secondary">
                  {showPreview ? (currentPass.expectedReturnTime || '-') : (formData.expectedReturnTime || '-')}
                </p>
              </div>
            )}

            <div className="badge-info-item">
              <label>PURPOSE OF LEAVING</label>
              <p className="badge-text-secondary">
                {showPreview ? currentPass.purpose : (formData.purpose || 'Reason for leaving')}
              </p>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="badge-photo-right">
            <div className="badge-qr-section-right">
              {showPreview && currentPass.qrCode ? (
                <img
                  src={getQrUrl(currentPass.qrCode)}
                  alt="QR Code"
                  className="badge-qr-image-small"
                />
              ) : (
                <div className="badge-qr-placeholder">
                  <span>QR PREVIEW</span>
                </div>
              )}
              <p className="badge-visitor-id-small">
                {showPreview ? (currentPass.displayId || currentPass.id) : 'GP-XXXXXX'}
              </p>

              {/* Date & Time */}
              <div className="badge-info-item" style={{ textAlign: 'center', marginTop: '8px' }}>
                <label style={{ margin: '0 auto 4px', display: 'block' }}>DATE & TIME</label>
                <p className="badge-text-secondary" style={{ fontSize: '13px' }}>
                  {showPreview ? `${currentPass.date} • ${currentPass.time}` : 'Date • Time'}
                </p>
              </div>

              {/* Bus Route — below Date & Time, student only */}
              {!isFaculty && (
                <div className="badge-info-item" style={{ textAlign: 'center', marginTop: '8px' }}>
                  <label style={{ margin: '0 auto 4px', display: 'block' }}>BUS ROUTE</label>
                  <p className="badge-text-secondary" style={{ fontSize: '13px' }}>
                    {busRoute || '-'}
                  </p>
                </div>
              )}

              {/* Exit Permitted By */}
              <div className="badge-info-item" style={{ textAlign: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', width: '100%' }}>
                <label style={{ margin: '0 auto 4px', display: 'block' }}>EXIT PERMITTED BY</label>
                <p className="badge-text-secondary" style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                  {showPreview
                    ? (currentPass.exitPermittedByName || currentPass.exitPermittedBy || 'Admin')
                    : (formData.exitPermittedBy || 'Admin')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatepassBadge;
