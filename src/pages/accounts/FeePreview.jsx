import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFeeReceiptById, downloadAccountsPdf, getAccountsSettings } from '../../services/api';
import './styling/Accounts.css';

const convertNumberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numVal = Math.floor(Number(num));
  if (numVal <= 0) return 'Zero Rupees Only';
  if (numVal > 999999999) return 'Amount too high';

  let n = ('000000000' + numVal).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
  return str.trim();
};

const maskAccountNumber = (accountNo) => {
  if (!accountNo) return '-';
  const clean = String(accountNo).trim();
  if (clean.length <= 4) return clean;
  return 'X'.repeat(clean.length - 4) + clean.slice(-4);
};

const FeePreview = () => {
  const { id } = useParams();
  const [fee, setFee] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [feeRes, settingsRes] = await Promise.all([
          getFeeReceiptById(id),
          getAccountsSettings()
        ]);

        if (feeRes.success) {
          setFee(feeRes.data);
        } else {
          setError(feeRes.message || 'Fee receipt not found.');
        }

        if (settingsRes.success) {
          setSettings(settingsRes.data);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownload = async () => {
    if (!fee) return;
    try {
      await downloadAccountsPdf(`/accounts/fees/${fee.id}/pdf`, `${fee.receipt_no}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF: ' + err.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="accounts-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="login-card__spinner" style={{ width: '40px', height: '40px', borderLeftColor: 'var(--primary-500)' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading receipt details...</p>
      </div>
    );
  }

  if (error || !fee) {
    return (
      <div className="accounts-container">
        <div className="login-card__error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error || 'Receipt details not found.'}
        </div>
        <div style={{ marginTop: '16px' }}>
          <Link to="/admin/accounts/fees" className="accounts-btn accounts-btn--secondary">
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  // Define details to show in breakdown
  const breakdowns = [
    { label: 'School Maintenance Fee', value: Number(fee.school_maintenance_fee || 0) },
    { label: 'Term Fee', value: Number(fee.term_fee || 0) },
    { label: 'Tuition Fee', value: Number(fee.tuition_fee || 0) },
    { label: 'Computer Fee', value: Number(fee.computer_fee || 0) },
    { label: 'Library Fee', value: Number(fee.library_fee || 0) },
    { label: 'Lab Fee', value: Number(fee.lab_fee || 0) },
    { label: 'Smart Class Fee', value: Number(fee.smart_class_fee || 0) },
    { label: 'Sports & Games Fee', value: Number(fee.sports_games_fee || 0) },
    { label: 'Others Fee', value: Number(fee.others_fee || 0) }
  ].filter(item => item.value > 0);

  return (
    <div className="accounts-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="accounts-list-header">
        <div>
          <h1 className="accounts-header__title">Fee Receipt Details</h1>
          <p className="accounts-header__subtitle">View details of receipt {fee.receipt_no}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          <Link to="/admin/accounts/fees" className="accounts-btn accounts-btn--secondary">
            Back to List
          </Link>
          <button onClick={handleDownload} className="accounts-btn accounts-btn--primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      <div className="accounts-form-card">
        {/* Printable/Preview Layout sheet */}
        {(() => {
          const snapshot = fee.template_snapshot ? (typeof fee.template_snapshot === 'string' ? JSON.parse(fee.template_snapshot) : fee.template_snapshot) : null;
          const currentLayout = snapshot?.layout || {
            header_alignment: 'center',
            logo_position: 'left',
            watermark_opacity: 0.08,
            watermark_position: 'center',
            receipt_font_size: 'medium',
            primary_color: '#0F172A',
            secondary_color: '#475569',
            footer_text: 'Thank you for your cooperation.'
          };
          const currentBranding = snapshot?.branding || settings || {};
          const previewFontSize = currentLayout.receipt_font_size === 'small' ? '11px' : (currentLayout.receipt_font_size === 'large' ? '14px' : '13px');

          let feeRows = [];
          const dynamicValues = typeof fee.dynamic_values === 'string' ? JSON.parse(fee.dynamic_values) : fee.dynamic_values;

          if (snapshot && snapshot.template && snapshot.template.fields) {
            snapshot.template.fields.forEach(field => {
              if (field.is_active) {
                const val = dynamicValues ? dynamicValues[field.field_name] : fee[field.field_name];
                if (val !== undefined && val !== null && val !== '') {
                  feeRows.push({
                    label: field.field_label,
                    value: (field.field_type === 'currency' || field.field_type === 'number') ? Number(val).toFixed(2) : String(val)
                  });
                }
              }
            });
          } else {
            // Legacy fallback
            feeRows = [
              { label: 'School Maintenance Fee', value: Number(fee.school_maintenance_fee || 0) },
              { label: 'Term Fee', value: Number(fee.term_fee || 0) },
              { label: 'Tuition Fee', value: Number(fee.tuition_fee || 0) },
              { label: 'Computer Fee', value: Number(fee.computer_fee || 0) },
              { label: 'Library Fee', value: Number(fee.library_fee || 0) },
              { label: 'Lab Fee', value: Number(fee.lab_fee || 0) },
              { label: 'Smart Class Fee', value: Number(fee.smart_class_fee || 0) },
              { label: 'Sports & Games Fee', value: Number(fee.sports_games_fee || 0) },
              { label: 'Others Fee', value: Number(fee.others_fee || 0) }
            ].filter(item => item.value > 0).map(row => ({
              label: row.label,
              value: Number(row.value).toFixed(2)
            }));
          }

          return (
            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'flex-start', paddingBottom: '12px' }}>
              <div style={{ 
                width: '100%',
                maxWidth: '520px',
                minWidth: '520px',
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
                border: '1.5px solid ' + currentLayout.primary_color,
                padding: '12px 16px',
                boxSizing: 'border-box',
                minHeight: '500px',
                position: 'relative'
              }}>
                {/* Watermark Logo */}
                {currentLayout.watermark_opacity > 0 && currentBranding.watermark_logo && (
                  <div style={
                    currentLayout.watermark_position === 'tile' ? {
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundImage: `url(${currentBranding.watermark_logo})`,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'repeat',
                      backgroundSize: '80px',
                      opacity: currentLayout.watermark_opacity,
                      pointerEvents: 'none',
                      zIndex: 0
                    } : {
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundImage: `url(${currentBranding.watermark_logo})`,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '170px',
                      width: '170px',
                      height: '170px',
                      opacity: currentLayout.watermark_opacity,
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
                    justifyContent: currentLayout.header_alignment === 'left' ? 'flex-start' : (currentLayout.header_alignment === 'right' ? 'flex-end' : 'center'), 
                    alignItems: 'center', 
                    minHeight: currentLayout.logo_position !== 'hidden' && currentBranding.school_logo ? '60px' : 'auto'
                  }}>
                    {currentLayout.logo_position !== 'hidden' && currentBranding.school_logo && (
                      <img 
                        src={currentBranding.school_logo} 
                        alt="Logo" 
                        style={
                          currentLayout.header_alignment === 'center' ? {
                            width: '55px',
                            height: '55px',
                            objectFit: 'contain',
                            position: 'absolute',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            left: currentLayout.logo_position === 'left' ? '0px' : 'auto',
                            right: currentLayout.logo_position === 'right' ? '0px' : 'auto'
                          } : {
                            width: '55px',
                            height: '55px',
                            objectFit: 'contain',
                            marginRight: currentLayout.logo_position === 'left' ? '16px' : '0px',
                            marginLeft: currentLayout.logo_position === 'right' ? '16px' : '0px',
                            order: currentLayout.logo_position === 'right' ? 2 : 0
                          }
                        } 
                      />
                    )}
                      <div style={{ 
                        textAlign: currentLayout.header_alignment, 
                        order: 1,
                        width: currentLayout.header_alignment === 'center' ? '100%' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5px'
                      }}>
                        {(() => {
                          let fieldOrder = ["school_name", "extra_info", "school_address", "school_phone", "alternative_contact_number", "school_email", "website"];
                          if (currentBranding.header_fields_order) {
                            try {
                              fieldOrder = typeof currentBranding.header_fields_order === 'string' ? JSON.parse(currentBranding.header_fields_order) : currentBranding.header_fields_order;
                            } catch (e) {}
                          }

                          const items = [];
                          const primaryColor = currentLayout.primary_color || '#000000';
                          const secondaryColor = currentLayout.secondary_color || '#000000';

                          for (let i = 0; i < fieldOrder.length; i++) {
                            const key = fieldOrder[i];

                            if (key === 'school_name') {
                              items.push(
                                <h4 key="school_name" style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: primaryColor, textTransform: 'uppercase' }}>
                                  {currentBranding.school_name || 'DCS INTERNATIONAL SCHOOL'}
                                </h4>
                              );
                            }
                            else if (key === 'extra_info') {
                              if (currentBranding.extra_info) {
                                items.push(
                                  <p key="extra_info" style={{ fontSize: '8px', margin: 0, color: '#000000', fontWeight: 'normal' }}>
                                    {currentBranding.extra_info}
                                  </p>
                                );
                              }
                            }
                            else if (key === 'school_address') {
                              items.push(
                                <p key="school_address" style={{ fontSize: '7.5px', margin: 0, color: '#64748b' }}>
                                  {currentBranding.school_address || 'Dummy Layout, Electronic City, Bengaluru - 560 100'}
                                </p>
                              );
                            }
                            else if (key === 'school_phone') {
                              const nextKey = fieldOrder[i + 1];
                              const phoneVal = currentBranding.school_phone || currentBranding.phone;
                              if (nextKey === 'alternative_contact_number' && (phoneVal || currentBranding.alternative_contact_number)) {
                                items.push(
                                  <p key="combined_phone" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                    Phone: {phoneVal || '(M) : 9876543210'}{currentBranding.alternative_contact_number ? `, ${currentBranding.alternative_contact_number}` : ''}
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
                              if (currentBranding.alternative_contact_number) {
                                items.push(
                                  <p key="alternative_contact_number" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                    Phone: {currentBranding.alternative_contact_number}
                                  </p>
                                );
                              }
                            }
                            else if (key === 'school_email') {
                              const nextKey = fieldOrder[i + 1];
                              if (nextKey === 'website' && currentBranding.school_email && currentBranding.website) {
                                items.push(
                                  <p key="combined_email_website" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                    Email: {currentBranding.school_email} &nbsp; | &nbsp; Website: {currentBranding.website}
                                  </p>
                                );
                                i++;
                              } else if (currentBranding.school_email) {
                                items.push(
                                  <p key="school_email" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                    Email: {currentBranding.school_email}
                                  </p>
                                );
                              }
                            }
                            else if (key === 'website') {
                              if (currentBranding.website) {
                                items.push(
                                  <p key="website" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                    Website: {currentBranding.website}
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
                    <div style={{ borderBottom: `0.5px solid ${currentLayout.primary_color}`, width: '100%' }}></div>
                    <div style={{ borderBottom: '1.5px solid ' + currentLayout.primary_color, width: '100%' }}></div>
                  </div>
                </div>

                {/* Receipt title */}
                <div style={{ textAlign: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                  <h5 style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', margin: 0, textTransform: 'uppercase', color: currentLayout.primary_color }}>
                    Fee Receipt
                  </h5>
                </div>

                {/* Metadata layout grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px 20px', marginBottom: '16px', fontSize: '9.5px', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Student's Name :</span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {fee.student_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Grade :</span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {fee.class}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Phone No. :</span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {fee.phone_number || '-'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '40px', flexShrink: 0 }}>No. :</span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontWeight: 'bold', color: 'red', fontFamily: 'Courier, monospace', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {fee.receipt_no}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '40px', flexShrink: 0 }}>Date :</span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {new Date(fee.date).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '40px', flexShrink: 0 }}>Year :</span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {fee.academic_year}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                      <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '85px', flexShrink: 0 }}>Payment Mode:</span>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {fee.payment_mode || 'Cash'}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const paymentDetails = fee.payment_details ? (typeof fee.payment_details === 'string' ? JSON.parse(fee.payment_details) : fee.payment_details) : null;
                    return null;
                  })()}
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid ' + currentLayout.primary_color, marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>SL. NO.</th>
                      <th style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'left', width: '60%', fontWeight: 'bold' }}>DESCRIPTION</th>
                      <th style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'right', width: '30%', fontWeight: 'bold' }}>AMOUNT (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'center' }}>{idx + 1}.</td>
                        <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px' }}>{row.label}</td>
                        <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{row.value}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr style={{ fontWeight: 'bold' }}>
                      <td colSpan="2" style={{ border: '1px solid ' + currentLayout.primary_color, borderTop: '2px solid ' + currentLayout.primary_color, padding: '6px', textAlign: 'right', textTransform: 'uppercase' }}>TOTAL</td>
                      <td style={{ border: '1px solid ' + currentLayout.primary_color, borderTop: '2px solid ' + currentLayout.primary_color, padding: '6px', textAlign: 'right', color: currentLayout.primary_color }}>
                        Rs. {Number(fee.amount).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Rupees in Words */}
                <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: '10px', fontSize: '9px', position: 'relative', zIndex: 1 }}>
                  <strong style={{ color: currentLayout.primary_color, marginRight: '4px', whiteSpace: 'nowrap', width: '90px' }}>Rupees in Words:</strong>
                  <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                    {fee.amount_in_words || convertNumberToWords(fee.amount)}
                  </div>
                </div>

                {/* Note Section */}
                {currentLayout.show_note !== false && (
                  <div style={{ marginTop: '12px', fontSize: '8px', position: 'relative', zIndex: 1, textAlign: 'left' }}>
                    <strong style={{ color: currentLayout.primary_color }}>Note :</strong>
                    <div style={{ marginTop: '4px', color: '#000' }}>
                      {(currentLayout.note_text || "1. This is a computer generated receipt.\n2. Fees once paid will not be refunded.")
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
                {(() => {
                  const paymentDetails = fee.payment_details ? (typeof fee.payment_details === 'string' ? JSON.parse(fee.payment_details) : fee.payment_details) : null;
                  return fee.payment_mode && fee.payment_mode !== 'Cash' && currentLayout.show_payment_details !== false && (
                    <div style={{
                      marginTop: '15px',
                      border: `0.5px solid ${currentLayout.secondary_color}`,
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
                        color: currentLayout.primary_color,
                        marginBottom: '6px',
                        fontSize: '8.5px',
                        textTransform: 'uppercase'
                      }}>
                        Payment Details
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Payment Mode</span>
                          <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                          <span style={{ color: '#000' }}>{fee.payment_mode}</span>
                        </div>
                        {paymentDetails && (
                          <>
                            {fee.payment_mode === 'UPI' && paymentDetails.transactionId && (
                              <div style={{ display: 'flex' }}>
                                <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Transaction ID</span>
                                <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                <span style={{ color: '#000' }}>{paymentDetails.transactionId}</span>
                              </div>
                            )}
                            {(fee.payment_mode === 'Bank' || fee.payment_mode === 'Bank Transfer') && (
                              <>
                                {paymentDetails.utrNumber && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>UTR Number</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{paymentDetails.utrNumber}</span>
                                  </div>
                                )}
                                {paymentDetails.bankName && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Bank Name</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{paymentDetails.bankName}</span>
                                  </div>
                                )}
                                {paymentDetails.accountNo && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Account No</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{maskAccountNumber(paymentDetails.accountNo)}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {(fee.payment_mode === 'Card' || fee.payment_mode === 'Card Payment') && (
                              <>
                                {paymentDetails.transactionId && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Transaction ID</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{paymentDetails.transactionId}</span>
                                  </div>
                                )}
                                {paymentDetails.cardType && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Card Type</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{paymentDetails.cardType}</span>
                                  </div>
                                )}
                                {paymentDetails.cardNumber && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Card Number</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{paymentDetails.cardNumber}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {(fee.payment_mode === 'Cheque' || fee.payment_mode === 'Cheque Payment') && (
                              <>
                                {paymentDetails.chequeNumber && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Cheque No.</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{paymentDetails.chequeNumber}</span>
                                  </div>
                                )}
                                {paymentDetails.bankName && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Bank</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{paymentDetails.bankName}</span>
                                  </div>
                                )}
                                {paymentDetails.chequeDate && (
                                  <div style={{ display: 'flex' }}>
                                    <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Date</span>
                                    <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                    <span style={{ color: '#000' }}>{new Date(paymentDetails.chequeDate).toLocaleDateString('en-IN')}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                        </div>
                      </div>
                    );
                })()}

                 {/* Signatures Row */}
                 <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', fontSize: '8.5px', position: 'relative', zIndex: 1, marginTop: '35px' }}>
                   <div style={{ textAlign: 'center', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     {currentBranding.accountant_signature ? (
                       <img src={currentBranding.accountant_signature} alt="Accountant" style={{ height: '25px', objectFit: 'contain', marginBottom: '2px' }} />
                     ) : (
                       <div style={{ height: '25px' }}></div>
                     )}
                     <div style={{ borderTop: '0.5px solid ' + currentLayout.primary_color, width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>Accountant Signature</div>
                   </div>
                 </div>

                {/* Footer Text */}
                {currentLayout.show_footer !== false && currentLayout.footer_text && (
                  <div style={{ textAlign: 'center', fontSize: '8px', fontStyle: 'italic', color: currentLayout.secondary_color, marginTop: '20px', position: 'relative', zIndex: 1 }}>
                    {currentLayout.footer_text}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
};

export default FeePreview;
