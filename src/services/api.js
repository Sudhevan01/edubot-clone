let API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    API_URL = 'http://localhost:5000/api';
  } else {
    API_URL = 'https://api-olrunursrq-uc.a.run.app/api';
  }
}
if (API_URL && !API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}

/**
 * Common fetch wrapper for API calls
 */
const apiFetch = async (endpoint, options = {}) => {
  const userStr = localStorage.getItem('vms_user');
  const token = userStr ? JSON.parse(userStr).token : null;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set application/json if not uploading FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text || `Error ${response.status}: ${response.statusText}` };
  }

  if (!response.ok) {
    const err = new Error(data.message || 'Something went wrong');
    err.errors = data.errors;
    throw err;
  }

  return data;
};

export const login = (email, password, organizationCode) => apiFetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password, organizationCode }),
});

export const signup = (data) => apiFetch('/auth/signup', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const checkExists = (email, phone) => apiFetch('/auth/check-exists', {
  method: 'POST',
  body: JSON.stringify({ email, phone }),
});

export const checkEmail = (email) => apiFetch('/auth/check-email', {
  method: 'POST',
  body: JSON.stringify({ email }),
});

export const getOrgContext = () => apiFetch('/organization/context');
export const getOrgSettings = () => apiFetch('/organization/settings');

export const updateOrgSettings = (data) => apiFetch('/organization/settings', {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const uploadOrgLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return apiFetch('/organization/upload-logo', {
    method: 'POST',
    body: formData,
  });
};

export const forgotPassword = (email) => apiFetch('/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email }),
});

export const resetPassword = (token, email, password) => apiFetch('/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ token, email, password }),
});


export const registerStaff = (data) => apiFetch('/auth/register', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getStaff = () => apiFetch('/users');
export const updateStaff = (id, data) => apiFetch(`/users/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteStaff = (id) => apiFetch(`/users/${id}`, {
  method: 'DELETE',
});

// Teacher APIs
export const getTeacherClasses = () => apiFetch('/teacher/classes');
export const getClassStudents = (assignmentId, date) => {
  const params = date ? `?date=${date}` : '';
  return apiFetch(`/teacher/classes/${assignmentId}/students${params}`);
};
export const submitAttendance = (data) => apiFetch('/teacher/attendance', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const getAdminAttendanceSummary = () => apiFetch('/teacher/admin/attendance-summary');

// Teacher Assignments APIs
export const getAssignments = () => apiFetch('/teacher/assignments');
export const createAssignment = (formData) => apiFetch('/teacher/assignments', {
  method: 'POST',
  body: formData
});
export const deleteAssignment = (id) => apiFetch(`/teacher/assignments/${id}`, {
  method: 'DELETE'
});
export const updateAssignment = (id, formData) => apiFetch(`/teacher/assignments/${id}`, {
  method: 'PUT',
  body: formData
});
export const downloadAssignmentFile = async (id, filename) => {
  const userStr = localStorage.getItem('vms_user');
  const token = userStr ? JSON.parse(userStr).token : null;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/teacher/assignments/${id}/file`, { headers });
  if (!response.ok) throw new Error('Failed to download file');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'attachment';
  a.click();
  window.URL.revokeObjectURL(url);
};


// Teacher Management APIs
export const getTeachersList = () => apiFetch('/admin/teachers');
export const updateTeacherAssignments = (id, data) => apiFetch(`/admin/teachers/${id}/assignments`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

// Visitor APIs
export const registerVisitor = (data) => apiFetch('/visitors', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getActiveVisits = () => apiFetch('/visitors/active');

export const checkoutVisit = (id) => apiFetch(`/visitors/checkout/${id}`, {
  method: 'PATCH',
});

export const getAllVisits = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/visitors?${params}`);
};

// Gatepass APIs
export const createStudentGatepass = (data) => apiFetch('/gatepass/student', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const createFacultyGatepass = (data) => apiFetch('/gatepass/faculty', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getTodaysGatepasses = () => apiFetch('/gatepass/today');
export const getAllGatepasses = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/gatepass?${params}`);
};

export const deleteGatepass = (id) => apiFetch(`/gatepass/${id}`, {
  method: 'DELETE',
});

// Student & Vendor APIs
export const registerStudent = (data) => apiFetch('/students', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const importStudents = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/students/import', {
    method: 'POST',
    body: formData
  });
};

export const searchStudentByPhone = (phone) => apiFetch(`/students/search/${encodeURIComponent(phone)}`);

export const registerVendor = (data) => apiFetch('/vendors', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const searchVendorByPhone = (phone) => apiFetch(`/vendors/search/${encodeURIComponent(phone)}`);

export const searchVisitorByPhone = (phone) => apiFetch(`/visitors/phone/${encodeURIComponent(phone)}`);

export const updateVisit = (id, data) => apiFetch(`/visitors/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const deleteVisit = (id) => apiFetch(`/visitors/${id}`, {
  method: 'DELETE',
});

export const deleteVisitor = (id) => apiFetch(`/visitors/master/${id}`, {
  method: 'DELETE',
});

// Authenticated Export APIs
export const exportVisitorLogs = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const userStr = localStorage.getItem('vms_user');
  const token = userStr ? JSON.parse(userStr).token : null;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/visitors/export?${params}`, { headers });
  if (!response.ok) throw new Error('Failed to export visitor logs');
  return response.blob();
};

export const exportGatepasses = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const userStr = localStorage.getItem('vms_user');
  const token = userStr ? JSON.parse(userStr).token : null;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/gatepass/export?${params}`, { headers });
  if (!response.ok) throw new Error('Failed to export gatepasses');
  return response.blob();
};

// Master Records APIs
export const getMasterRecords = (tab) => apiFetch(`/master/${tab}`);
export const getMasterRecordById = (tab, id) => apiFetch(`/master/${tab}/${id}`);
export const updateMasterRecord = (tab, id, data) => apiFetch(`/master/${tab}/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteMasterRecord = (tab, id) => apiFetch(`/master/${tab}/${id}`, {
  method: 'DELETE'
});

// Dashboard & Stats APIs
export const getDashboardStats = () => apiFetch('/dashboard/stats');
export const getTodaysEntries = () => apiFetch('/dashboard/todays-entries');

// ── License Key APIs (SUPER_ADMIN only) ──────────────────────────────────────
export const getKeys = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/keys?${params}`);
};

export const generateKey = (data) => apiFetch('/keys/generate', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getAuditLogs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/audit-logs?${params}`);
};

export const getAttendanceLogs = (date) => {
  const params = new URLSearchParams({ date }).toString();
  return apiFetch(`/admin/attendance-logs?${params}`);
};

// Accounts Module APIs
export const getAccountsSummary = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/dashboard/summary?${params}`);
};
export const getFeeAnalytics = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/dashboard/analytics/fees?${params}`);
};
export const getSalaryAnalytics = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/dashboard/analytics/salary?${params}`);
};

export const getFeeReceipts = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/fees?${params}`);
};

export const getFeeReceiptById = (id) => apiFetch(`/accounts/fees/${id}`);

export const createFeeReceipt = (data) => apiFetch('/accounts/fees', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const revokeKey = (id) => apiFetch(`/keys/${id}/revoke`, {
  method: 'PATCH',
});

// QR Code URL Generator
export const getQrUrl = (token) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(token)}`;
};

export const previewFeeReceipt = (data) => apiFetch('/accounts/fees/preview', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateFeeReceipt = (id, data) => apiFetch(`/accounts/fees/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const getSalaryReceipts = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/salary?${params}`);
};

export const getSalaryReceiptById = (id) => apiFetch(`/accounts/salary/${id}`);

export const createSalaryReceipt = (data) => apiFetch('/accounts/salary/manual', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const previewSalaryReceipt = (data) => apiFetch('/accounts/salary/manual/preview', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateSalaryReceipt = (id, data) => apiFetch(`/accounts/salary/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const getAccountsSettings = () => apiFetch('/accounts/settings');

export const updateAccountsSetting = (key, value) => apiFetch('/accounts/settings', {
  method: 'POST',
  body: JSON.stringify({ key, value }),
});

export const uploadAccountsSettingImage = (type, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return apiFetch(`/accounts/settings/upload/${type}`, {
    method: 'POST',
    body: formData,
  });
};

export const searchAccountsStudents = (search) => apiFetch(`/accounts/students?search=${encodeURIComponent(search)}`);

// Template Builder APIs
export const getTemplates = (archived = false) => apiFetch(`/accounts/templates?archived=${archived}`);
export const getActiveTemplate = (type) => apiFetch(`/accounts/templates/active/${type}`);
export const getTemplateById = (id) => apiFetch(`/accounts/templates/${id}`);
export const createTemplate = (data) => apiFetch('/accounts/templates', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateTemplate = (id, data) => apiFetch(`/accounts/templates/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const cloneTemplate = (id) => apiFetch(`/accounts/templates/${id}/clone`, {
  method: 'POST',
});
export const activateTemplate = (id) => apiFetch(`/accounts/templates/${id}/activate`, {
  method: 'POST',
});
export const deleteTemplate = (id) => apiFetch(`/accounts/templates/${id}`, {
  method: 'DELETE',
});
export const restoreTemplate = (id) => apiFetch(`/accounts/templates/${id}/restore`, {
  method: 'POST',
});
export const deleteTemplatePermanently = (id) => apiFetch(`/accounts/templates/${id}/permanent`, {
  method: 'DELETE',
});


// Email queue system APIs
export const getEmailSettings = () => apiFetch('/accounts/email-queue/settings');
export const updateEmailSettings = (data) => apiFetch('/accounts/email-queue/settings', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const getEmailStats = () => apiFetch('/accounts/email-queue/stats');
export const getEmailLogs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/email-queue/logs?${params}`);
};
export const retryEmails = (data) => apiFetch('/accounts/email-queue/retry', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const sendTestEmail = (data) => apiFetch('/accounts/email-queue/test-email', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const pauseEmailQueue = () => apiFetch('/accounts/email-queue/pause', {
  method: 'POST'
});

export const resumeEmailQueue = () => apiFetch('/accounts/email-queue/resume', {
  method: 'POST'
});

// WhatsApp queue system APIs
export const getWhatsAppStats = () => apiFetch('/accounts/whatsapp/stats');
export const getWhatsAppLogs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/whatsapp/logs?${params}`);
};
export const retryWhatsApp = (data) => apiFetch('/accounts/whatsapp/retry', {
  method: 'POST',
  body: JSON.stringify(data)
});



export const getAccountsEmployees = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/accounts/employees?${params}`);
};

export const createAccountsEmployee = (data) => apiFetch('/accounts/employees', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateAccountsEmployee = (id, data) => apiFetch(`/accounts/employees/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteAccountsEmployee = (id) => apiFetch(`/accounts/employees/${id}`, {
  method: 'DELETE'
});

export const getBaseUrl = () => {
  let url = API_URL;
  if (url.endsWith('/api')) {
    url = url.substring(0, url.length - 4);
  } else if (url.endsWith('/api/')) {
    url = url.substring(0, url.length - 5);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return url;
};

export const downloadAccountsPdf = async (url, filename) => {
  const userStr = localStorage.getItem('vms_user');
  const token = userStr ? JSON.parse(userStr).token : null;

  const connector = url.includes('?') ? '&' : '?';
  let targetUrl = token ? `${API_URL}${url}${connector}token=${token}` : `${API_URL}${url}`;

  // Clean double slashes (except in protocol)
  targetUrl = targetUrl.replace(/([^:]\/)\/+/g, '$1');

  const response = await fetch(targetUrl);
  if (!response.ok) throw new Error('Failed to download PDF');
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(blobUrl);
};

export const retryFeeWhatsApp = (receiptId) => apiFetch('/accounts/whatsapp/retry-fee', {
  method: 'POST',
  body: JSON.stringify({ receiptId }),
});

export const getFeeWhatsAppLogs = (receiptId) => apiFetch(`/accounts/whatsapp/logs/fee/${receiptId}`);

export const deleteFeeReceipt = (id) => apiFetch(`/accounts/fees/${id}`, {
  method: 'DELETE',
});

export const deleteSalaryReceipt = (id) => apiFetch(`/accounts/salary/${id}`, {
  method: 'DELETE',
});

export const exportFeeReceipts = async (filters = {}, format = 'excel') => {
  const params = new URLSearchParams({ ...filters, format }).toString();
  const filename = format === 'pdf' ? 'fee_receipts.pdf' : 'fee_receipts.xlsx';
  return downloadAccountsPdf(`/accounts/fees/export?${params}`, filename);
};

export const exportSalaryReceipts = async (filters = {}, format = 'excel') => {
  const params = new URLSearchParams({ ...filters, format }).toString();
  const filename = format === 'pdf' ? 'salary_slips.pdf' : 'salary_slips.xlsx';
  return downloadAccountsPdf(`/accounts/salary/export?${params}`, filename);
};
