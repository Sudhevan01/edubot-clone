import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { getTemplateById, createTemplate, updateTemplate, getAccountsSettings } from '../../services/api';
import './styling/Accounts.css';

const DEFAULT_FEE_FIELDS = [
  { field_name: 'tuition_fee', field_label: 'Tuition Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 0, is_custom: 0 },
  { field_name: 'admission_fee', field_label: 'Admission Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 1, is_custom: 0 },
  { field_name: 'library_fee', field_label: 'Library Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 2, is_custom: 0 },
  { field_name: 'lab_fee', field_label: 'Lab Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 3, is_custom: 0 },
  { field_name: 'exam_fee', field_label: 'Exam Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 4, is_custom: 0 },
  { field_name: 'transport_fee', field_label: 'Transport Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 5, is_custom: 0 },
  { field_name: 'sports_games_fee', field_label: 'Sports & Games Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 6, is_custom: 0 },
  { field_name: 'school_maintenance_fee', field_label: 'Maintenance Fee', field_type: 'currency', field_category: 'fee', is_required: 0, is_active: 1, display_order: 7, is_custom: 0 }
];

const DEFAULT_SALARY_FIELDS = [
  { field_name: 'basic_salary', field_label: 'Basic Salary', field_type: 'currency', field_category: 'earning', is_required: 1, is_active: 1, display_order: 0, is_custom: 0 },
  { field_name: 'hra', field_label: 'HRA', field_type: 'currency', field_category: 'earning', is_required: 0, is_active: 1, display_order: 1, is_custom: 0 },
  { field_name: 'da', field_label: 'DA', field_type: 'currency', field_category: 'earning', is_required: 0, is_active: 1, display_order: 2, is_custom: 0 },
  { field_name: 'bonus', field_label: 'Bonus', field_type: 'currency', field_category: 'earning', is_required: 0, is_active: 1, display_order: 3, is_custom: 0 },
  { field_name: 'incentives', field_label: 'Incentives', field_type: 'currency', field_category: 'earning', is_required: 0, is_active: 1, display_order: 4, is_custom: 0 },
  { field_name: 'pf', field_label: 'PF', field_type: 'currency', field_category: 'deduction', is_required: 0, is_active: 1, display_order: 5, is_custom: 0 },
  { field_name: 'tax', field_label: 'Tax', field_type: 'currency', field_category: 'deduction', is_required: 0, is_active: 1, display_order: 6, is_custom: 0 }
];

const TemplateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const queryType = searchParams.get('type') || 'fee';

  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const isSuperAdmin = false;

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState(queryType);
  const [version, setVersion] = useState(1);
  const [fields, setFields] = useState([]);
  const [layout, setLayout] = useState({
    header_alignment: 'center',
    logo_position: 'left',
    watermark_opacity: 0.08,
    watermark_position: 'center',
    receipt_font_size: 'medium',
    primary_color: '#0F172A',
    secondary_color: '#475569',
    footer_text: 'Thank you for your cooperation.',
    note_text: '1. This is a computer generated receipt.\n2. Fees once paid will not be refunded.'
  });

  const [branding, setBranding] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  // Custom Field Form State
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customField, setCustomField] = useState({
    field_label: '',
    field_type: 'currency',
    field_category: 'fee',
    is_required: false
  });

  // Fetch school settings and template if edit
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Load school settings
        const settingsRes = await getAccountsSettings();
        if (settingsRes.success) {
          setBranding(settingsRes.data);
        }

        if (isEdit) {
          const res = await getTemplateById(id);
          if (res.success && res.data) {
            const data = res.data;
            setTemplateName(data.template_name);
            setTemplateType(data.template_type);
            setVersion(data.version);
            setFields(data.fields || []);
            if (data.layout) {
              setLayout(data.layout);
            }
          }
        } else {
          // Initialize defaults
          setTemplateName(`Custom ${queryType === 'fee' ? 'Fee' : 'Salary'} Template`);
          setFields(queryType === 'fee' ? [...DEFAULT_FEE_FIELDS] : [...DEFAULT_SALARY_FIELDS]);
          setCustomField(prev => ({
            ...prev,
            field_category: queryType === 'fee' ? 'fee' : 'earning'
          }));
        }
      } catch (err) {
        console.error(err);
        setError('Error loading template builder details.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEdit, queryType]);

  const handleLayoutChange = (e) => {
    const { name, value } = e.target;
    setLayout(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFieldLabelChange = (index, val) => {
    const updated = [...fields];
    updated[index].field_label = val;
    setFields(updated);
  };

  const handleFieldToggleActive = (index) => {
    const updated = [...fields];
    // basic_salary should remain active and required for salary
    if (templateType === 'salary' && updated[index].field_name === 'basic_salary') {
      return;
    }
    updated[index].is_active = updated[index].is_active ? 0 : 1;
    setFields(updated);
  };

  const handleFieldToggleRequired = (index) => {
    const updated = [...fields];
    // basic_salary is always required
    if (templateType === 'salary' && updated[index].field_name === 'basic_salary') {
      return;
    }
    updated[index].is_required = updated[index].is_required ? 0 : 1;
    setFields(updated);
  };

  const moveField = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate display_orders
    updated.forEach((f, idx) => {
      f.display_order = idx;
    });

    setFields(updated);
  };

  const deleteField = (index) => {
    const updated = fields.filter((_, idx) => idx !== index);
    updated.forEach((f, idx) => {
      f.display_order = idx;
    });
    setFields(updated);
  };

  const handleAddCustomField = () => {
    setModalErrors({});
    if (!customField.field_label || !customField.field_label.trim()) {
      setModalErrors({ field_label: 'Field label is mandatory.' });
      return;
    }

    const fieldName = customField.field_label.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString().slice(-4);
    const newF = {
      field_name: fieldName,
      field_label: customField.field_label.trim(),
      field_type: customField.field_type,
      field_category: templateType === 'fee' ? 'fee' : customField.field_category,
      is_required: customField.is_required ? 1 : 0,
      is_active: 1,
      display_order: fields.length,
      is_custom: 1
    };

    setFields([...fields, newF]);
    setShowCustomFieldModal(false);
    setCustomField({
      field_label: '',
      field_type: 'currency',
      field_category: templateType === 'fee' ? 'fee' : 'earning',
      is_required: false
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setErrors({});

    if (!templateName || !templateName.trim()) {
      setErrors({ templateName: 'Template name is mandatory.' });
      setError('Please correct the validation errors below.');
      return;
    }

    const payload = {
      template_name: templateName.trim(),
      template_type: templateType,
      fields,
      layout
    };

    try {
      setLoading(true);
      let res;
      if (isEdit) {
        res = await updateTemplate(id, payload);
      } else {
        res = await createTemplate(payload);
      }

      if (res.success) {
        setSuccess('Template saved successfully!');
        setTimeout(() => navigate('/admin/accounts/templates'), 1200);
      } else {
        setError(res.message || 'Failed to save template.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit template configurations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accounts-container" style={{ gap: '20px' }}>
      <div className="accounts-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="accounts-header__title">
            {isEdit ? `Edit Template Builder (v${version})` : 'New Receipt Template'}
          </h1>
          <p className="accounts-header__subtitle">
            Customize layout settings, adjust branding parameters, toggle fields, and define custom heads.
          </p>
        </div>
        <Link to="/admin/accounts/templates" className="accounts-btn accounts-btn--secondary">
          Back to List
        </Link>
      </div>

      {isSuperAdmin && (
        <div style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', padding: '12px 16px', borderRadius: '8px', width: '100%', fontWeight: 600, fontSize: '14px', border: '1px solid var(--primary-200)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          Note: Receipt templates are view-only for Super Admin accounts.
        </div>
      )}
      {error && <div className="login-card__error" role="alert" style={{ width: '100%' }}>{error}</div>}
      {success && (
        <div style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--success-200)', fontSize: '14px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Main Workspace split panel: Form Builder Canvas vs Real-time Preview */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', width: '100%', alignItems: 'flex-start' }}>
        {/* Left Side: Controls & Fields Canvas */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Template Details Card */}
          <div className="accounts-form-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '16px' }}>Template Config</h3>
            <div className="accounts-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    if (errors.templateName) setErrors(prev => ({ ...prev, templateName: '' }));
                  }}
                  className={`accounts-form-input ${errors.templateName ? 'border-error' : ''}`}
                  required
                  disabled={isSuperAdmin}
                />
                {errors.templateName && <p className="error-text" style={{ marginTop: '4px' }}>{errors.templateName}</p>}
              </div>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Template Type</label>
                <input
                  type="text"
                  value={templateType === 'fee' ? 'Fee Receipt' : 'Salary Slip'}
                  className="accounts-form-input"
                  style={{ background: 'var(--neutral-100)', cursor: 'not-allowed' }}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Layout Settings Card */}
          <div className="accounts-form-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '16px' }}>Branding & Styling Layout</h3>
            <div className="accounts-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Header Align</label>
                <select name="header_alignment" value={layout.header_alignment} onChange={handleLayoutChange} className="accounts-form-select" disabled={isSuperAdmin}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Logo Position</label>
                <select name="logo_position" value={layout.logo_position} onChange={handleLayoutChange} className="accounts-form-select" disabled={isSuperAdmin}>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Watermark Placement</label>
                <select name="watermark_position" value={layout.watermark_position} onChange={handleLayoutChange} className="accounts-form-select" disabled={isSuperAdmin}>
                  <option value="center">Center</option>
                  <option value="tile">Tile (Grid)</option>
                </select>
              </div>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Font Size Scale</label>
                <select name="receipt_font_size" value={layout.receipt_font_size} onChange={handleLayoutChange} className="accounts-form-select" disabled={isSuperAdmin}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Watermark Opacity</label>
                <input
                  type="range"
                  name="watermark_opacity"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={layout.watermark_opacity}
                  onChange={handleLayoutChange}
                  style={{ accentColor: 'var(--primary-500)', marginTop: '8px' }}
                  disabled={isSuperAdmin}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right' }}>{(layout.watermark_opacity * 100).toFixed(0)}%</span>
              </div>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Primary Color</label>
                <input type="color" name="primary_color" value={layout.primary_color} onChange={handleLayoutChange} style={{ height: '38px', padding: 0, width: '100%', border: '1px solid var(--neutral-300)', borderRadius: '4px', cursor: 'pointer' }} disabled={isSuperAdmin} />
              </div>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Secondary Color</label>
                <input type="color" name="secondary_color" value={layout.secondary_color} onChange={handleLayoutChange} style={{ height: '38px', padding: 0, width: '100%', border: '1px solid var(--neutral-300)', borderRadius: '4px', cursor: 'pointer' }} disabled={isSuperAdmin} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="layout-show-note"
                  checked={layout.show_note !== false}
                  onChange={(e) => setLayout(prev => ({ ...prev, show_note: e.target.checked }))}
                  disabled={isSuperAdmin}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="layout-show-note" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Show Note Section
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="layout-show-payment"
                  checked={layout.show_payment_details !== false}
                  onChange={(e) => setLayout(prev => ({ ...prev, show_payment_details: e.target.checked }))}
                  disabled={isSuperAdmin}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="layout-show-payment" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Show Payment Details
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="layout-show-footer"
                  checked={layout.show_footer !== false}
                  onChange={(e) => setLayout(prev => ({ ...prev, show_footer: e.target.checked }))}
                  disabled={isSuperAdmin}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="layout-show-footer" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Show Footer Text
                </label>
              </div>
            </div>

            <div className="accounts-form-group" style={{ marginTop: '12px' }}>
              <label className="accounts-form-label">Footer Text (Terms / Details)</label>
              <textarea name="footer_text" value={layout.footer_text || ''} onChange={handleLayoutChange} className="accounts-form-textarea" rows="2" style={{ resize: 'none' }} disabled={isSuperAdmin || layout.show_footer === false}></textarea>
            </div>
            <div className="accounts-form-group" style={{ marginTop: '12px' }}>
              <label className="accounts-form-label">Custom Note Text (Supports newlines)</label>
              <textarea
                name="note_text"
                placeholder={templateType === 'fee' ? "1. This is a computer generated receipt.\n2. Fees once paid will not be refunded." : "1. This is a computer generated slip.\n2. All amounts are in Indian Rupees."}
                value={layout.note_text || ''}
                onChange={handleLayoutChange}
                className="accounts-form-textarea"
                rows="3"
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                disabled={isSuperAdmin || layout.show_note === false}
              />
            </div>
          </div>

          {/* Field Builder canvas */}
          <div className="accounts-form-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-700)', margin: 0 }}>Receipt Fields Canvas</h3>
              {!isSuperAdmin && (
                <button type="button" onClick={() => { setModalErrors({}); setShowCustomFieldModal(true); }} className="accounts-btn accounts-btn--primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  + Add Custom Head
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fields.map((f, idx) => (
                <div key={f.field_name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--neutral-200)', backgroundColor: f.is_active ? 'white' : 'var(--neutral-50)', opacity: f.is_active ? 1 : 0.6 }}>
                  {/* Reordering indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button type="button" onClick={() => moveField(idx, 'up')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }} disabled={idx === 0 || isSuperAdmin}>
                      ▲
                    </button>
                    <button type="button" onClick={() => moveField(idx, 'down')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }} disabled={idx === fields.length - 1 || isSuperAdmin}>
                      ▼
                    </button>
                  </div>
 
                  {/* Name Label Editor */}
                  <div style={{ flexGrow: 1 }}>
                    <input
                      type="text"
                      value={f.field_label}
                      onChange={(e) => handleFieldLabelChange(idx, e.target.value)}
                      style={{ fontSize: '13px', fontWeight: 700, border: 'none', borderBottom: '1px dashed var(--neutral-300)', width: '100%', outline: 'none', padding: '2px 0' }}
                      disabled={isSuperAdmin}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span>Key: <code>{f.field_name}</code></span>
                      <span>Type: <strong style={{ textTransform: 'capitalize' }}>{f.field_type}</strong></span>
                      {templateType === 'salary' && (
                        <span>Category: <strong style={{ textTransform: 'capitalize', color: f.field_category === 'deduction' ? 'var(--danger-600)' : 'var(--success-700)' }}>{f.field_category}</strong></span>
                      )}
                    </div>
                  </div>
 
                  {/* Settings toggles */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      <input type="checkbox" checked={f.is_active === 1} onChange={() => handleFieldToggleActive(idx)} disabled={isSuperAdmin} />
                      Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      <input type="checkbox" checked={f.is_required === 1} onChange={() => handleFieldToggleRequired(idx)} disabled={isSuperAdmin} />
                      Req.
                    </label>
                    {f.is_custom === 1 && !isSuperAdmin && (
                      <button type="button" onClick={() => deleteField(idx)} style={{ color: 'var(--danger-600)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px' }}>
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Link to="/admin/accounts/templates" className="accounts-btn accounts-btn--secondary">{isSuperAdmin ? 'Back to List' : 'Cancel'}</Link>
            {!isSuperAdmin && (
              <button type="button" onClick={() => handleSubmit()} disabled={loading} className="accounts-btn accounts-btn--primary">
                {loading ? 'Saving Layout...' : 'Save Template Layout'}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Real-time preview panel */}
        <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-700)', margin: 0 }}>Real-time Receipt Preview</h3>
                 <div style={{ 
            width: '100%',
            maxWidth: '520px',
            margin: '0 auto',
            backgroundColor: '#fff',
            boxShadow: 'var(--shadow-lg)',
            padding: '20px',
            boxSizing: 'border-box',
            fontFamily: '"Times New Roman", Times, serif',
            position: 'relative',
            borderRadius: '0px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              border: '1.5px solid ' + layout.primary_color,
              padding: '12px 16px',
              boxSizing: 'border-box',
              minHeight: '500px',
              position: 'relative'
            }}>
              {/* Watermark Logo */}
              {layout.watermark_opacity > 0 && branding.watermark_logo && (
                <div style={
                  layout.watermark_position === 'tile' ? {
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url(${branding.watermark_logo})`,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '80px',
                    opacity: layout.watermark_opacity,
                    pointerEvents: 'none',
                    zIndex: 0
                  } : {
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundImage: `url(${branding.watermark_logo})`,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '170px',
                    width: '170px',
                    height: '170px',
                    opacity: layout.watermark_opacity,
                    pointerEvents: 'none',
                    zIndex: 0
                  }
                }></div>
              )}

              {/* Header Content */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, marginBottom: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  width: '100%', 
                  position: 'relative',
                  justifyContent: layout.header_alignment === 'left' ? 'flex-start' : (layout.header_alignment === 'right' ? 'flex-end' : 'center'), 
                  alignItems: 'center', 
                  minHeight: layout.logo_position !== 'hidden' && branding.school_logo ? '60px' : 'auto'
                }}>
                  {layout.logo_position !== 'hidden' && branding.school_logo && (
                    <img 
                      src={branding.school_logo} 
                      alt="Logo" 
                      style={
                        layout.header_alignment === 'center' ? {
                          width: '55px',
                          height: '55px',
                          objectFit: 'contain',
                          position: 'absolute',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          left: layout.logo_position === 'left' ? '0px' : 'auto',
                          right: layout.logo_position === 'right' ? '0px' : 'auto'
                        } : {
                          width: '55px',
                          height: '55px',
                          objectFit: 'contain',
                          marginRight: layout.logo_position === 'left' ? '16px' : '0px',
                          marginLeft: layout.logo_position === 'right' ? '16px' : '0px',
                          order: layout.logo_position === 'right' ? 2 : 0
                        }
                      } 
                    />
                  )}
                  <div style={{ 
                    textAlign: layout.header_alignment, 
                    order: 1,
                    width: layout.header_alignment === 'center' ? '100%' : 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5px'
                  }}>
                    {(() => {
                      let fieldOrder = ["school_name", "extra_info", "school_address", "school_phone", "alternative_contact_number", "school_email", "website"];
                      if (branding.header_fields_order) {
                        try {
                          fieldOrder = typeof branding.header_fields_order === 'string' ? JSON.parse(branding.header_fields_order) : branding.header_fields_order;
                        } catch (e) {}
                      }

                      const items = [];
                      const primaryColor = layout.primary_color || '#000000';
                      const secondaryColor = layout.secondary_color || '#000000';

                      for (let i = 0; i < fieldOrder.length; i++) {
                        const key = fieldOrder[i];

                        if (key === 'school_name') {
                          items.push(
                            <h4 key="school_name" style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: primaryColor, textTransform: 'uppercase' }}>
                              {branding.school_name || 'DCS INTERNATIONAL SCHOOL'}
                            </h4>
                          );
                        }
                        else if (key === 'extra_info') {
                          if (branding.extra_info) {
                            items.push(
                              <p key="extra_info" style={{ fontSize: '8px', margin: 0, color: '#000000', fontWeight: 'normal' }}>
                                {branding.extra_info}
                              </p>
                            );
                          }
                        }
                        else if (key === 'school_address') {
                          items.push(
                            <p key="school_address" style={{ fontSize: '7.5px', margin: 0, color: '#64748b' }}>
                              {branding.school_address || 'Dummy Layout, Electronic City, Bengaluru - 560 100'}
                            </p>
                          );
                        }
                        else if (key === 'school_phone') {
                          const nextKey = fieldOrder[i + 1];
                          const phoneVal = branding.school_phone || branding.phone;
                          if (nextKey === 'alternative_contact_number' && (phoneVal || branding.alternative_contact_number)) {
                            items.push(
                              <p key="combined_phone" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                Phone: {phoneVal || '(M) : 9876543210'}{branding.alternative_contact_number ? `, ${branding.alternative_contact_number}` : ''}
                              </p>
                            );
                            i++;
                          } else {
                            items.push(
                              <p key="school_phone" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                Phone: {phoneVal || '(M) : 9876543210'}
                              </p>
                            );
                          }
                        }
                        else if (key === 'alternative_contact_number') {
                          if (branding.alternative_contact_number) {
                            items.push(
                              <p key="alternative_contact_number" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                Phone: {branding.alternative_contact_number}
                              </p>
                            );
                          }
                        }
                        else if (key === 'school_email') {
                          const nextKey = fieldOrder[i + 1];
                          if (nextKey === 'website' && branding.school_email && branding.website) {
                            items.push(
                              <p key="combined_email_website" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                Email: {branding.school_email} &nbsp; | &nbsp; Website: {branding.website}
                              </p>
                            );
                            i++;
                          } else if (branding.school_email) {
                            items.push(
                              <p key="school_email" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                Email: {branding.school_email}
                              </p>
                            );
                          }
                        }
                        else if (key === 'website') {
                          if (branding.website) {
                            items.push(
                              <p key="website" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                Website: {branding.website}
                              </p>
                            );
                          }
                        }
                      }
                      return items;
                    })()}
                  </div>
                </div>
                {/* Double bottom lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '10px' }}>
                  <div style={{ borderBottom: `0.5px solid ${layout.primary_color}`, width: '100%' }}></div>
                  <div style={{ borderBottom: `1.5px solid ${layout.primary_color}`, width: '100%' }}></div>
                </div>
              </div>

              {/* Receipt title */}
              <div style={{ textAlign: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                <h5 style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', margin: 0, textTransform: 'uppercase', color: layout.primary_color }}>
                  {templateType === 'fee' ? 'Fee Receipt' : 'Salary Slip'}
                </h5>
              </div>

              {/* Metadata layout grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px 20px', marginBottom: '16px', fontSize: '9.5px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>
                      {templateType === 'fee' ? "Student's Name :" : "Employee Name :"}
                    </span>
                    <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                      John Doe
                    </div>
                  </div>
                  {templateType === 'salary' && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>
                        Employee ID :
                      </span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        EMP-2026-0042
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>
                      {templateType === 'fee' ? "Class :" : "Month :"}
                    </span>
                    <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                      {templateType === 'fee' ? 'Grade 8 Section A' : 'June 2026'}
                    </div>
                  </div>
                  {templateType === 'fee' && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>
                        Phone No. :
                      </span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        9876543210
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: templateType === 'fee' ? '40px' : '80px', flexShrink: 0 }}>No. :</span>
                    <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontWeight: 'bold', color: 'red', fontFamily: 'Courier, monospace', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                      {templateType === 'fee' ? 'FEE-2026-0001' : 'SAL-2026-0001'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: templateType === 'fee' ? '40px' : '80px', flexShrink: 0 }}>Date :</span>
                    <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                      {new Date().toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: templateType === 'fee' ? '40px' : '80px', flexShrink: 0 }}>
                      {templateType === 'fee' ? "Year :" : "Designation :"}
                    </span>
                    <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                      {templateType === 'fee' ? '2026-27' : 'Teacher'}
                    </div>
                  </div>
                  {templateType === 'fee' && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: layout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '85px', flexShrink: 0 }}>
                        Payment Mode:
                      </span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        Bank Transfer
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid ' + layout.primary_color, marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid ' + layout.primary_color, padding: '5px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>SL. NO.</th>
                    <th style={{ border: '1px solid ' + layout.primary_color, padding: '5px', textAlign: 'left', width: '60%', fontWeight: 'bold' }}>DESCRIPTION</th>
                    <th style={{ border: '1px solid ' + layout.primary_color, padding: '5px', textAlign: 'right', width: '30%', fontWeight: 'bold' }}>AMOUNT (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.filter(f => f.is_active === 1).map((f, idx) => {
                    let mockValue = '1200.00';
                    if (f.field_type !== 'currency') mockValue = 'N/A';
                    if (f.field_category === 'deduction') mockValue = '-250.00';
                    return (
                      <tr key={f.field_name}>
                        <td style={{ border: '1px solid ' + layout.primary_color, padding: '5px', textAlign: 'center' }}>{idx + 1}.</td>
                        <td style={{ border: '1px solid ' + layout.primary_color, padding: '5px' }}>{f.field_label}</td>
                        <td style={{ border: '1px solid ' + layout.primary_color, padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{mockValue}</td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr style={{ fontWeight: 'bold' }}>
                    <td colSpan="2" style={{ border: '1px solid ' + layout.primary_color, borderTop: '2px solid ' + layout.primary_color, padding: '6px', textAlign: 'right', textTransform: 'uppercase' }}>TOTAL</td>
                    <td style={{ border: '1px solid ' + layout.primary_color, borderTop: '2px solid ' + layout.primary_color, padding: '6px', textAlign: 'right', color: layout.primary_color }}>
                      {templateType === 'fee' ? 'Rs. 4500.00' : 'Rs. 24750.00'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {templateType === 'fee' ? (
                <>
                  {/* Rupees in Words */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: '10px', fontSize: '9px', position: 'relative', zIndex: 1 }}>
                    <strong style={{ color: layout.primary_color, marginRight: '4px', whiteSpace: 'nowrap', width: '90px' }}>Rupees in Words:</strong>
                    <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                      Four Thousand Five Hundred Rupees Only
                    </div>
                  </div>

                  {/* Note Section */}
                  {layout.show_note !== false && (
                    <div style={{ marginTop: '12px', fontSize: '8px', position: 'relative', zIndex: 1, textAlign: 'left' }}>
                      <strong style={{ color: layout.primary_color }}>Note :</strong>
                      <div style={{ marginTop: '4px', color: '#000' }}>
                        {(layout.note_text || "1. This is a computer generated receipt.\n2. Fees once paid will not be refunded.")
                          .split('\n')
                          .map(line => line.trim())
                          .filter(Boolean)
                          .map((line, i) => (
                            <div key={i} style={{ marginLeft: '10px', marginTop: '2px' }}>{line}</div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Payment Details Container */}
                  {layout.show_payment_details !== false && (
                    <div style={{
                      marginTop: '15px',
                      border: `0.5px solid ${layout.secondary_color}`,
                      padding: '8px 12px',
                      position: 'relative',
                      zIndex: 1,
                      fontSize: '8px',
                      textAlign: 'left'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        color: layout.primary_color,
                        marginBottom: '6px',
                        fontSize: '8.5px',
                        textTransform: 'uppercase'
                      }}>
                        Payment Details
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Payment Mode</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>Cheque Payment</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Cheque No.</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>45563225566333233</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Bank</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>SBI</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Date</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>{new Date().toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signatures & Seal Row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', fontSize: '8.5px', position: 'relative', zIndex: 1, marginTop: '35px' }}>
                    <div style={{ textAlign: 'center', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {branding.accountant_signature ? (
                        <img src={branding.accountant_signature} alt="Accountant" style={{ height: '25px', objectFit: 'contain', marginBottom: '2px' }} />
                      ) : (
                        <div style={{ height: '25px' }}></div>
                      )}
                      <div style={{ borderTop: '0.5px solid ' + layout.primary_color, width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>Accountant Signature</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Rupees in Words */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: '10px', fontSize: '9px', position: 'relative', zIndex: 1 }}>
                    <strong style={{ color: layout.primary_color, marginRight: '4px', whiteSpace: 'nowrap', width: '90px' }}>Rupees in Words:</strong>
                    <div style={{ flex: 1, borderBottom: `0.5px dashed ${layout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                      Twenty Four Thousand Seven Hundred Fifty Rupees Only
                    </div>
                  </div>

                  {/* Note Section */}
                  {layout.show_note !== false && (
                    <div style={{ marginTop: '12px', fontSize: '8px', position: 'relative', zIndex: 1, textAlign: 'left' }}>
                      <strong style={{ color: layout.primary_color }}>Note :</strong>
                      <div style={{ marginTop: '4px', color: '#000' }}>
                        {(layout.note_text || "1. This is a computer generated slip.\n2. All amounts are in Indian Rupees.")
                          .split('\n')
                          .map(line => line.trim())
                          .filter(Boolean)
                          .map((line, i) => (
                            <div key={i} style={{ marginLeft: '10px', marginTop: '2px' }}>{line}</div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Payment Details Container */}
                  {layout.show_payment_details !== false && (
                    <div style={{
                      marginTop: '15px',
                      border: `0.5px solid ${layout.secondary_color}`,
                      padding: '8px 12px',
                      position: 'relative',
                      zIndex: 1,
                      fontSize: '8px',
                      textAlign: 'left'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        color: layout.primary_color,
                        marginBottom: '6px',
                        fontSize: '8.5px',
                        textTransform: 'uppercase'
                      }}>
                        Payment Details
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Payment Mode</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>Bank Transfer</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Bank Name</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>HDFC Bank</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Account Number</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>XXXXXXXXXX7890</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>IFSC Code</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>HDFC0001234</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>UTR Number</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>UTR1234567890</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: layout.primary_color }}>Payment Date</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: layout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>{new Date().toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signatures Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8.5px', position: 'relative', zIndex: 1, marginTop: '55px' }}>
                    <div style={{ textAlign: 'center', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ height: '35px' }}></div>
                      <div style={{ borderTop: '0.5px solid ' + layout.primary_color, width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>Signature of Employee</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {branding.salary_seal ? (
                        <img src={branding.salary_seal} alt="Salary Seal" style={{ height: '35px', objectFit: 'contain', marginBottom: '2px' }} />
                      ) : (
                        <div style={{ height: '35px' }}></div>
                      )}
                      <div style={{ borderTop: '0.5px solid ' + layout.primary_color, width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>Signature of Employer</div>
                    </div>
                  </div>
                </>
              )}

              {/* Footer Text */}
              {layout.show_footer !== false && layout.footer_text && (
                <div style={{ textAlign: 'center', fontSize: '8px', fontStyle: 'italic', color: layout.secondary_color, marginTop: '20px', position: 'relative', zIndex: 1 }}>
                  {layout.footer_text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Field Modal Backdrop */}
      {showCustomFieldModal && (
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '400px', backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-2xl)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--primary-700)' }}>Create Custom Field</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Field Label (Display Name) *</label>
                <input
                  type="text"
                  placeholder="e.g. Smart Class Fee or PTA Contrib."
                  value={customField.field_label}
                  onChange={(e) => {
                    setCustomField({ ...customField, field_label: e.target.value });
                    if (modalErrors.field_label) setModalErrors(prev => ({ ...prev, field_label: '' }));
                  }}
                  className={`accounts-form-input ${modalErrors.field_label ? 'border-error' : ''}`}
                  required
                />
                {modalErrors.field_label && <p className="error-text" style={{ marginTop: '4px' }}>{modalErrors.field_label}</p>}
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Field Type</label>
                <select
                  value={customField.field_type}
                  onChange={(e) => setCustomField({ ...customField, field_type: e.target.value })}
                  className="accounts-form-select"
                >
                  <option value="currency">Currency (Numeric Amount)</option>
                  <option value="number">Numeric (Standard Number)</option>
                  <option value="text">Text (General Note)</option>
                </select>
              </div>

              {templateType === 'salary' && (
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Salary Category</label>
                  <select
                    value={customField.field_category}
                    onChange={(e) => setCustomField({ ...customField, field_category: e.target.value })}
                    className="accounts-form-select"
                  >
                    <option value="earning">Earning / Allowance</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="custom-field-req"
                  checked={customField.is_required}
                  onChange={(e) => setCustomField({ ...customField, is_required: e.target.checked })}
                />
                <label htmlFor="custom-field-req" style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Mark as Required Input
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={() => { setShowCustomFieldModal(false); setModalErrors({}); }} className="accounts-btn accounts-btn--secondary" style={{ padding: '6px 12px' }}>
                Cancel
              </button>
              <button type="button" onClick={handleAddCustomField} className="accounts-btn accounts-btn--primary" style={{ padding: '6px 12px' }}>
                Add to Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateForm;
