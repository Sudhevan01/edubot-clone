/**
 * Session utility — validates that the stored vms_user session is still valid.
 *
 * The JWT is signed with a 30-day expiry on the backend. This utility decodes
 * the JWT's `exp` claim client-side (no secret needed — just base64 decode)
 * and clears the stored session if the token has expired.
 *
 * Why: localStorage persists forever in PWAs. Without this check, a user who
 * was "logged out" by idle timeout will be auto-logged back in when they
 * reopen the PWA the next day.
 */

const SESSION_KEY = 'vms_user';

/**
 * Decode the payload of a JWT without verifying the signature.
 * @param {string} token
 * @returns {object|null}
 */
const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Check if the stored session is still valid.
 * Clears localStorage and returns false if the session has expired or is invalid.
 *
 * @returns {boolean} true if session is valid, false if expired/missing
 */
export const isSessionValid = () => {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return false;

  let user;
  try {
    user = JSON.parse(stored);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }

  if (!user || !user.token) {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }

  // Decode the JWT and check expiry
  const payload = decodeJwtPayload(user.token);
  if (!payload || !payload.exp) {
    // Can't validate — treat as invalid to force re-login
    localStorage.removeItem(SESSION_KEY);
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp < nowSeconds) {
    // Token has expired — clear session
    localStorage.removeItem(SESSION_KEY);
    return false;
  }

  return true;
};

/**
 * Clear the stored session.
 */
export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

/**
 * Get the stored user object (only if session is valid).
 * @returns {object|null}
 */
export const getSessionUser = () => {
  if (!isSessionValid()) return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};
