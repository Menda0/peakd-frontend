/**
 * Auth0 Action — Post Login
 *
 * Use this when roles assigned in Auth0 do not appear on the access token (e.g. API RBAC
 * “Add Roles in the Access Token” is off, or the role is not tied to the API).
 *
 * Deploy: Auth0 Dashboard → Actions → Library → Build Custom → Paste this file’s handler
 * body (the function) into the action, or import as needed. Add the action to the
 * “Login / Post Login” flow and Deploy.
 *
 * IMPORTANT: Set `API_AUDIENCE` to the exact same value as AUTH0_AUDIENCE in the Next app
 * (e.g. https://peakd-api). The access token will get a custom claim `${API_AUDIENCE}/roles`
 * (array of role name strings), which peakd-frontend/lib/auth0-partner.ts already reads.
 */

const API_AUDIENCE = "https://peakd-api";

/**
 * @param {{ authorization?: { roles?: string[] } }} event
 * @param {{ accessToken: { setCustomClaim: (key: string, value: unknown) => void } }} api
 */
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization?.roles;
  if (!Array.isArray(roles) || roles.length === 0) return;
  api.accessToken.setCustomClaim(`${API_AUDIENCE}/roles`, roles);
};
