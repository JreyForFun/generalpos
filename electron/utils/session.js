/**
 * In-memory session manager for the Main process.
 * Session is NEVER written to disk — lives only in RAM.
 * Cleared on logout or app quit.
 */

let activeSession = null;

/**
 * Set the active session after successful PIN authentication.
 * @param {{ cashierId: number, name: string, role: string }} sessionData
 */
function setSession(sessionData) {
  activeSession = {
    cashierId: sessionData.cashierId,
    name: sessionData.name,
    role: sessionData.role,
    loginTime: new Date().toISOString(),
  };
}

/**
 * Get the current active session.
 * @returns {{ cashierId: number, name: string, role: string, loginTime: string } | null}
 */
function getSession() {
  return activeSession;
}

/**
 * Clear the active session (logout or app quit).
 */
function clearSession() {
  activeSession = null;
}

/**
 * Check if a session exists and has the required role.
 * @param {string|string[]} requiredRole - Role or array of roles allowed
 * @returns {{ authorized: boolean, session: object|null, error: string|null }}
 */
function requireRole(requiredRole) {
  if (!activeSession) {
    return { authorized: false, session: null, error: 'No active session' };
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(activeSession.role)) {
    return { authorized: false, session: activeSession, error: 'Unauthorized' };
  }

  return { authorized: true, session: activeSession, error: null };
}

module.exports = { setSession, getSession, clearSession, requireRole };
