const LOCKED_SUPPORT_ACCOUNTS = [
  'info@devcreationsblr.com',
  'devcreationsblr@gmail.com',
  'hr@devcreationsblr.com'
];

export function isLockedSupportAccount(email) {
  if (!email) return false;
  return LOCKED_SUPPORT_ACCOUNTS.includes(email.toLowerCase().trim());
}

export default LOCKED_SUPPORT_ACCOUNTS;
