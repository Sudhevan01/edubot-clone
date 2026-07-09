import React from 'react';

const GatepassForm = ({
  entryMode,
  formData,
  setFormData,
  setErrors,
  handleNameChange,
  errors,
  isFormValid,
  handleSubmit,
  loading,
  isViewMode,
  allowedGrades = [],
  allowedSections = [],
  allowedDepartments = [],
  allowedAuthorities = []
}) => {
  return (
    <div className="form-card-v2">
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid-v2">
          {entryMode === 'student' ? (
            <>
              <div className="form-row-v2">
                <div className="form-group-v2 span-8">
                  <label>Student Name</label>
                  <input
                    type="text"
                    placeholder="Enter Student's Full Name"
                    value={formData.studentName}
                    onChange={(e) => handleNameChange('studentName', e.target.value)}
                    className={errors.studentName ? 'border-error' : ''}
                    disabled={isViewMode}
                  />
                  {errors.studentName && <p className="error-text">{errors.studentName}</p>}
                </div>
                <div className="form-group-v2 span-2">
                  <label>Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => {
                      setFormData({ ...formData, grade: e.target.value });
                      if (setErrors) setErrors(prev => ({ ...prev, grade: '' }));
                    }}
                    className={errors.grade ? 'border-error' : ''}
                    disabled={isViewMode}
                  >
                    <option value="">Select</option>
                    {allowedGrades.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                  {errors.grade && <p className="error-text">{errors.grade}</p>}
                </div>
                <div className="form-group-v2 span-2">
                  <label>Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => {
                      setFormData({ ...formData, section: e.target.value });
                      if (setErrors) setErrors(prev => ({ ...prev, section: '' }));
                    }}
                    className={errors.section ? 'border-error' : ''}
                    disabled={isViewMode}
                  >
                    <option value="">Select</option>
                    {allowedSections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.section && <p className="error-text">{errors.section}</p>}
                </div>
              </div>

              <div className="form-row-v2">
                <div className="form-group-v2 span-8">
                  <label>Picked Up By</label>
                  <input
                    type="text"
                    placeholder="Enter Pickup Person Name"
                    value={formData.pickupBy}
                    onChange={(e) => handleNameChange('pickupBy', e.target.value)}
                    className={errors.pickupBy ? 'border-error' : ''}
                    disabled={isViewMode}
                  />
                  {errors.pickupBy && <p className="error-text">{errors.pickupBy}</p>}
                </div>
                <div className="form-group-v2 span-4">
                  <label>Relation</label>
                  <select
                    value={formData.relation}
                    onChange={(e) => {
                      setFormData({ ...formData, relation: e.target.value, pickupPhone: '' });
                      if (setErrors) setErrors(prev => ({ ...prev, relation: '', pickupPhone: '' }));
                    }}
                    className={errors.relation ? 'border-error' : ''}
                    disabled={isViewMode}
                  >
                    <option value="">Select</option>
                    {['Father', 'Mother', 'Guardian', 'Other'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {errors.relation && <p className="error-text">{errors.relation}</p>}
                </div>
              </div>

              {/* Phone number field for Guardian / Other */}
              {(formData.relation === 'Guardian' || formData.relation === 'Other') && (
                <div className="form-row-v2">
                  <div className="form-group-v2 span-6">
                    <label>Pickup Person Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={formData.pickupPhone || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d+]/g, '');
                        if (val.replace(/\D/g, '').length <= 10) {
                          setFormData({ ...formData, pickupPhone: val });
                          if (setErrors) setErrors(prev => ({ ...prev, pickupPhone: '' }));
                        }
                      }}
                      className={errors.pickupPhone ? 'border-error' : ''}
                      disabled={isViewMode}
                      maxLength={10}
                    />
                    {errors.pickupPhone && <p className="error-text">{errors.pickupPhone}</p>}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="form-row-v2">
              <div className="form-group-v2 span-8">
                <label>Faculty Name</label>
                <input
                  type="text"
                  placeholder="Enter Faculty's Full Name"
                  value={formData.facultyName}
                  onChange={(e) => handleNameChange('facultyName', e.target.value)}
                  className={errors.facultyName ? 'border-error' : ''}
                  disabled={isViewMode}
                />
                {errors.facultyName && <p className="error-text">{errors.facultyName}</p>}
              </div>
              <div className="form-group-v2 span-4">
                <label>Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({ ...formData, department: e.target.value });
                    if (setErrors) setErrors(prev => ({ ...prev, department: '' }));
                  }}
                  className={errors.department ? 'border-error' : ''}
                  disabled={isViewMode}
                >
                  <option value="">Select</option>
                  {allowedDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.department && <p className="error-text">{errors.department}</p>}
              </div>
            </div>
          )}
          {entryMode === 'student' ? (
            <div className="form-row-v2">
                <div className="form-group-v2 span-4">
                  <label>Bus Route</label>
                  <input
                    type="text"
                    placeholder="Enter Bus Route"
                    value={formData.busRoute || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, busRoute: e.target.value });
                      if (setErrors) setErrors(prev => ({ ...prev, busRoute: '' }));
                    }}
                    className={errors.busRoute ? 'border-error' : ''}
                    disabled={isViewMode}
                  />
                  {errors.busRoute && <p className="error-text">{errors.busRoute}</p>}
                </div>
              <div className="form-group-v2 span-4">
                <label>Approving Authority</label>
                <select
                  value={formData.authority}
                  onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                  disabled={isViewMode}
                >
                  <option value="">Select</option>
                  {allowedAuthorities.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="form-group-v2 span-4">
                <label>Exit Permitted By</label>
                <input
                  type="text"
                  value={formData.exitPermittedBy || ''}
                  readOnly
                  className="readonly-input-v2"
                  placeholder="Admin Name"
                />
              </div>
            </div>
          ) : (
            <div className="form-row-v2">
              <div className="form-group-v2 span-4">
                <label>Approving Authority</label>
                <select
                  value={formData.authority}
                  onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                  disabled={isViewMode}
                >
                  <option value="">Select</option>
                  {allowedAuthorities.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="form-group-v2 span-4">
                <label>Expected Return Time</label>
                <input
                  type="text"
                  placeholder="e.g. 2:30 PM, 2 hours"
                  value={formData.expectedReturnTime || ''}
                  onChange={(e) => setFormData({ ...formData, expectedReturnTime: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
              <div className="form-group-v2 span-4">
                <label>Exit Permitted By</label>
                <input
                  type="text"
                  value={formData.exitPermittedBy || ''}
                  readOnly
                  className="readonly-input-v2"
                  placeholder="Admin Name"
                />
              </div>
            </div>
          )}
          <div className="form-group-v2 span-12">
            <label>Purpose of Leaving</label>
            <textarea
              placeholder="Reason for early departure..."
              value={formData.purpose}
              onChange={(e) => {
                setFormData({ ...formData, purpose: e.target.value });
                if (setErrors) setErrors(prev => ({ ...prev, purpose: '' }));
              }}
              className={errors.purpose ? 'border-error' : ''}
              disabled={isViewMode}
            />
            {errors.purpose && <p className="error-text">{errors.purpose}</p>}
          </div>
        </div>
        {!isViewMode && (
          <button type="submit" className="generate-btn-v2" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            {loading ? 'Generating...' : 'Generate Gatepass'}
          </button>
        )}
      </form>
    </div>
  );
};

export default GatepassForm;
