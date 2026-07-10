/**
 * Normalizes API response data into a standard format for the UI tables.
 */

export const normalizeVisitorData = (data) => {
  if (!Array.isArray(data)) return [];

  return data.map(v => {
    // Helper to find field in v or nested visit/visitor objects
    const f = (names) => {
      for (const name of names) {
        if (v[name]) return v[name];
        if (v.visit && v.visit[name]) return v.visit[name];
        if (v.visitor && v.visitor[name]) return v.visitor[name];
      }
      return null;
    };

    const photo = f(['visitorPhoto', 'photo', 'avatar', 'image', 'visitorImage']);
    const visitorName = f(['visitorName', 'name', 'parentName', 'vendorName', 'otherName']) || 'Unknown';
    const visitorPhone = f(['visitorPhone', 'phone', 'parentContact', 'vendorContact', 'otherContact']) || '-';
    const type = f(['visitorType', 'type', 'category']) || 'OTHER';
    const relation = f(['relation', 'visitorRelation', 'parentRelation', 'studentRelation', 'relationship', 'visitorRelationship', 'visitor_relation', 'v_relation', 'vRelation']);

    const noofentry = f(['noofentry', 'noOfEntries', 'noOfEntry', 'numberOfEntries']) || 1;

    return {
      id: v.id || (v.visit && v.visit.id) || (v.visitor && v.visitor.id),
      visitorId: (() => {
        const displayIdRaw = v.displayId || v.visit?.displayId;
        if (!displayIdRaw) {
          const fallbackId = v.visitorId || v.visit?.visitorId || v.id || (v.visit && v.visit.id);
          return fallbackId ? `V-${fallbackId}` : null;
        }
        return displayIdRaw.toString().startsWith('V-') ? displayIdRaw : `V-${displayIdRaw}`;
      })(),
      qrCode: (() => {
        const qrCodeRaw = v.qrCode || v.visit?.qrCode || v.displayId || v.visit?.displayId;
        if (!qrCodeRaw) {
          const fallbackId = v.visitorId || v.visit?.visitorId || v.id || (v.visit && v.visit.id);
          return fallbackId ? `V-${fallbackId}` : null;
        }
        const qrStr = qrCodeRaw.toString();
        if (qrStr.startsWith('V-') || qrStr.startsWith('STUDENT_GP') || qrStr.startsWith('FACULTY_GP')) {
          return qrStr;
        }
        return `V-${qrStr}`;
      })(),
      name: visitorName,
      type: type,
      studentName: type.toString().toUpperCase().trim() === 'VENDOR' ? '' : (v.studentName || v.visit?.studentName || '-'),
      grade: type.toString().toUpperCase().trim() === 'VENDOR' ? '' : (v.grade || v.visit?.grade || v.class || v.visit?.class || '-'),
      section: type.toString().toUpperCase().trim() === 'VENDOR' ? '' : (v.section || v.visit?.section || '-'),
      relation: type.toString().toUpperCase().trim() === 'VENDOR' ? '' : (relation || '-'),
      company: f(['company', 'companyName', 'vendorCompany']) || '-',
      contact: visitorPhone,
      reason: v.purpose || v.visit?.purpose || v.reason || v.visit?.reason || '-',
      vehicleNumber: v.vehicleNumber || v.visit?.vehicleNumber || '-',
      noofentry: noofentry || v.noofentry || v.visit?.noofentry || 1,
      date: new Date(v.createdAt || v.visit?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date(v.createdAt || v.visit?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: (v.checkOut || v.visit?.checkOut) ? new Date(v.checkOut || v.visit?.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      avatar: photo ? (photo.startsWith('http') || photo.startsWith('data:') ? photo : `${import.meta.env.VITE_API_URL}/${photo}`) : null,

      initials: visitorName.charAt(0).toUpperCase() || 'V',
      addedBy: v.createdByName || v.visit?.createdByName || 'System',
      addedByRole: (() => {
        const role = v.createdByRole || v.visit?.createdByRole;
        if (!role) return 'Admin';
        return role
          .toLowerCase()
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      })()
    };
  });
};

export const normalizeGatepassData = (data) => {
  return data.map(p => ({
    ...p,
    id: p.id,
    name: p.type === 'FACULTY' ? p.facultyName : p.studentName,
    studentName: p.type === 'FACULTY' ? p.facultyName : p.studentName,
    grade: p.type === 'FACULTY' ? p.department : p.grade,
    section: p.type === 'FACULTY' ? '-' : p.section,
    pickupBy: p.type === 'FACULTY' ? 'N/A' : p.pickupBy,
    date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAtTime: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    time: p.exitTime
      ? new Date(p.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'NOT EXITED',
    type: p.type,
    busRoute: p.busRoute || '',
    status: 'Approved'
  }));
};

export const convertToTableFormat = (gp) => ({
  id: gp.id,
  name: gp.name,
  type: 'GATEPASS',
  studentName: gp.studentName,
  grade: gp.grade,
  section: gp.section,
  busRoute: gp.busRoute || '',
  contact: gp.pickupBy,
  reason: gp.purpose || 'Early Departure',
  noofentry: 1,
  date: gp.date,
  time: gp.time,
  checkOutTime: gp.exitTime ? new Date(gp.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
  initials: gp.name?.charAt(0).toUpperCase() || 'G',
  addedBy: gp.authority || 'Admin',
  addedByRole: 'Authorized'
});
