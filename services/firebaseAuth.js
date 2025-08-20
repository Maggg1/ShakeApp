import { api } from './api';

// Stubbed Auth Service (no Firebase)
// This provides a similar interface but delegates to the API/offline mocks.
export const firebaseAuth = {
  async signIn(email, password) {
    const res = await api.login({ email, password });
    return { user: res.user, token: res.token };
  },
  async signUp(name, email, password) {
    const res = await api.register({ name, email, password });
    return { user: res.user, token: res.token };
  },
  async signOut() {
    await api.logout();
    return true;
  },
  async sendPasswordReset(email) {
    await api.sendPasswordReset(email);
    return true;
  },
  async sendEmailVerification() {
    // Not applicable without Firebase; treat as no-op
    return true;
  },
  getCurrentUser() {
    // Not stateful here; call api.getCurrentUser where needed
    return null;
  },
  onAuthStateChanged(callback) {
    // No real-time auth state; return no-op unsubscribe
    return () => {};
  },
};
