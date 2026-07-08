/**
 * MJW Platform — Hardened PocketBase Client
 *
 * Implements the 7-point "Hardened Standard" from the PocketBase Auth & API
 * Hardening handover brief:
 *
 * Point 1 — pb.autoCancellation(false): Prevents ClientResponseError 0 in
 *            React 18 StrictMode caused by duplicate request cancellation.
 *
 * Point 2 — ensureAuth(): Refreshes the auth token before every write
 *            operation (create, update, delete) to prevent silent 403 errors
 *            caused by stale tokens.
 *
 * Point 3 — Global 403 Interceptor (pb.afterSend): Catches 401/403 responses,
 *            clears the auth store, and dispatches a `pb:authError` DOM event
 *            so AuthContext can force a clean logout.
 */
import PocketBase from 'pocketbase';

export const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL || 'https://mjwdesign-core.pockethost.io'
);

// Point 1: Disable auto-cancellation to prevent ClientResponseError 0 in
// React 18 StrictMode (double-invocation of useEffect).
pb.autoCancellation(false);

// Point 3: Global 401/403 interceptor.
// Clears the local auth store and fires a DOM event so AuthContext can
// react and redirect the user to the login screen without an infinite spinner.
pb.afterSend = (response, data) => {
  if (response.status === 401 || response.status === 403) {
    pb.authStore.clear();
    window.dispatchEvent(new Event('pb:authError'));
  }
  return data;
};

/**
 * Point 2 — ensureAuth()
 *
 * Call this before every write operation (create, update, delete).
 * It attempts to refresh the current auth token. If the refresh fails
 * (e.g. the session has expired server-side), it clears the auth store
 * and dispatches `pb:authError` so the UI can redirect to login.
 */
export async function ensureAuth(): Promise<void> {
  if (!pb.authStore.isValid) {
    pb.authStore.clear();
    window.dispatchEvent(new Event('pb:authError'));
    throw new Error('Not authenticated');
  }
  try {
    // Attempt a token refresh using the users collection.
    await pb.collection('users').authRefresh();
  } catch {
    pb.authStore.clear();
    window.dispatchEvent(new Event('pb:authError'));
    throw new Error('Session expired — please log in again');
  }
}
