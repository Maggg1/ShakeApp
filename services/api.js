import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure your API here.
export const API_BASE_URL = 'https://adminmanagementsystem.up.railway.app';

// Toggle offline mode: when true, uses in-memory mocks
export const OFFLINE_MODE = false;
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// Basic in-memory mocks used during offline mode
const todayISO = () => new Date().toISOString();
const defaultUsername = 'Offline User';
let MOCK_USER = {
  id: 'offline-user',
  username: defaultUsername,
  email: 'offline@example.com',
  avatarIndex: 0,
  totalShakes: 0,
  dailyShakes: 0,
  createdAt: todayISO(),
};
let MOCK_SHAKES = [];
let MOCK_ACTIVITIES = [];

// Auth token storage
const TOKEN_KEY = '@api_token_v1';
let currentToken = null;
const OVERLAY_KEY = '@api_user_overlay_v1';
async function getToken() {
  if (currentToken) return currentToken;
  try {
    const t = await AsyncStorage.getItem(TOKEN_KEY);
    currentToken = t;
    return t;
  } catch (_) {
    return null;
  }
}
async function setToken(token) {
  currentToken = token || null;
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, String(token));
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}

async function getOverlay() {
  try {
    const raw = await AsyncStorage.getItem(OVERLAY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
async function setOverlay(obj) {
  try {
    if (obj && Object.keys(obj).length) {
      await AsyncStorage.setItem(OVERLAY_KEY, JSON.stringify(obj));
    } else {
      await AsyncStorage.removeItem(OVERLAY_KEY);
    }
  } catch (_) {}
}
function mergeUser(remote, overlay) {
  if (!overlay) return remote;
  return { ...(remote || {}), ...(overlay || {}) };
}

function parseAnyDate(v) {
  if (v == null) return null;
  if (typeof v === 'number') {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) {
      const n = parseInt(s, 10);
      const ms = n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      return isNaN(d) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }
  if (typeof v === 'object') {
    if (typeof v.toDate === 'function') {
      try {
        const d = v.toDate();
        return isNaN(d) ? null : d;
      } catch (_) {}
    }
    if (typeof v.seconds === 'number') {
      const d = new Date(v.seconds * 1000);
      return isNaN(d) ? null : d;
    }
  }
  return null;
}

function extractCreatedAt(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const levels = [
    obj,
    obj.user,
    obj.profile,
    obj.data,
    obj.data?.user,
    obj.data?.profile,
    obj.account,
    obj.meta,
    obj.metadata,
  ].filter(Boolean);
  const keys = [
    'createdAt','created_at','created',
    'registeredAt','registered_at',
    'createdOn','created_on',
    'joinedAt','joined_at','joinDate',
    'accountCreatedAt','account_created_at',
    'creationTime','createdDate','created_time','dateCreated',
    'signUpDate','signupDate','signUp_at','signup_at',
    'firstLoginAt','first_login_at',
  ];
  for (const lvl of levels) {
    for (const k of keys) {
      const d = parseAnyDate(lvl[k]);
      if (d) return d.toISOString();
    }
  }
  // deep scan up to depth 3
  const visited = new WeakSet();
  const matchesKey = (k) => /created|register|joined|signup|signUp|creation/i.test(k);
  let found = null;
  const dfs = (o, depth=0) => {
    if (!o || typeof o !== 'object' || visited.has(o) || depth>3 || found) return;
    visited.add(o);
    for (const [k,v] of Object.entries(o)) {
      if (found) break;
      if (matchesKey(k)) {
        const d = parseAnyDate(v);
        if (d) { found = d.toISOString(); break; }
      }
      if (v && typeof v === 'object') dfs(v, depth+1);
    }
  };
  dfs(obj, 0);
  return found;
}

// Main API fetch wrapper
async function authFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const isFormData = body instanceof FormData;
  const url = `${API_BASE_URL}${path}`;

  console.debug(`[api] ${method} ${url}`);

  const token = await getToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders,
      ...headers,
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  console.debug(`[api] <- ${res.status} ${method} ${url}`);

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    console.warn(`[api] ERROR ${res.status} ${method} ${url}: ${message}`);
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Helper: try multiple paths in order, returning first success; only swallows 404s
async function tryFetchPaths(paths, options) {
  let lastErr = null;
  for (const p of paths) {
    try {
      return await authFetch(p, options);
    } catch (e) {
      lastErr = e;
      if (e && e.status === 404) {
        // try next path
        continue;
      }
      // non-404 -> rethrow
      throw e;
    }
  }
  // if all failed, throw last error
  if (lastErr) throw lastErr;
  throw new Error('No paths provided');
}

// Extract token from various backend response shapes
function extractToken(res) {
  return res?.token || res?.accessToken || res?.data?.token || res?.data?.accessToken || null;
}

// Auth
async function login({ email, password }) {
  const payload = { email, password };
  if (OFFLINE_MODE) {
    await delay(300);
    const nameFromEmail = (email || '').split('@')[0] || defaultUsername;
    MOCK_USER = {
      ...MOCK_USER,
      email: email || MOCK_USER.email,
      username: MOCK_USER.username || nameFromEmail,
    };
    MOCK_ACTIVITIES.unshift({
      id: `act-${Date.now()}`,
      type: 'login',
      description: 'Logged in (offline)',
      timestamp: new Date(),
    });
    return { token: 'offline-token', user: MOCK_USER };
  }
  const res = await tryFetchPaths(
    ['/api/auth/login'],
    { method: 'POST', body: payload }
  );
  const token = extractToken(res);
  if (token) await setToken(token);
  return { ...res, token };
}

async function register({ name, email, password }) {
  const payload = { name, email, password };
  if (OFFLINE_MODE) {
    await delay(300);
    MOCK_USER = {
      ...MOCK_USER,
      username: name || MOCK_USER.username,
      email: email || MOCK_USER.email,
      createdAt: todayISO(),
    };
    return { token: 'offline-token', user: MOCK_USER };
  }
  let res = await tryFetchPaths(
    ['/api/auth/register'],
    { method: 'POST', body: payload }
  );
  let token = extractToken(res);
  if (!token) {
    // Fallback: attempt to login to receive token
    try {
      const loginRes = await login({ email, password });
      token = loginRes?.token || token;
    } catch (_) {
      // ignore
    }
  }
  if (token) await setToken(token);
  return { ...res, token };
}

// Auth user (optional — may require auth on server)
async function getCurrentUser() {
  if (OFFLINE_MODE) {
    await delay(150);
    return { ...MOCK_USER };
  }
  const remote = await tryFetchPaths(['/api/auth/me'], { method: 'GET' });
  const overlay = await getOverlay();
  const merged = mergeUser(remote, overlay);
  if (!merged?.createdAt) {
    const derived = extractCreatedAt(merged);
    if (derived) merged.createdAt = derived;
  }
  return merged;
}

async function updateProfile(partial) {
  if (OFFLINE_MODE) {
    await delay(150);
    MOCK_USER = { ...MOCK_USER, ...(partial || {}) };
    return { ...MOCK_USER };
  }
  try {
    const updated = await tryFetchPaths(['/api/users/me'], { method: 'PATCH', body: partial });
    // Persist overlay to reflect immediately in getCurrentUser
    const overlay = await getOverlay();
    const nextOverlay = { ...(overlay || {}), ...(partial || {}) };
    await setOverlay(nextOverlay);
    return updated;
  } catch (e) {
    if (e && e.status === 404) {
      // Backend has no profile update endpoint; merge with current user client-side and persist overlay
      try {
        const current = await getCurrentUser();
        const merged = { ...(current || {}), ...(partial || {}) };
        const overlay = await getOverlay();
        const nextOverlay = { ...(overlay || {}), ...(partial || {}) };
        await setOverlay(nextOverlay);
        return merged;
      } catch (_) {
        // As a last resort, just persist the partial as overlay
        await setOverlay(partial || {});
        return { ...(partial || {}) };
      }
    }
    throw e;
  }
}

async function logout() {
  if (OFFLINE_MODE) {
    await delay(100);
    return true;
  }
  await setToken(null);
  await setOverlay(null);
  return true;
}

// Password reset
async function sendPasswordReset(email) {
  if (OFFLINE_MODE) {
    await delay(150);
    return { ok: true };
  }
  return tryFetchPaths(
    ['/api/auth/forgot-password'],
    { method: 'POST', body: { email } }
  );
}

// Activities
async function logActivity({ type, description, metadata = {} }) {
  if (OFFLINE_MODE) {
    await delay(100);
    const entry = {
      id: `act-${Date.now()}`,
      type,
      description,
      metadata,
      timestamp: new Date(),
    };
    MOCK_ACTIVITIES.unshift(entry);
    return { ok: true };
  }
  try {
    return await tryFetchPaths(
      ['/api/activities'],
      { method: 'POST', body: { type, description, metadata } }
    );
  } catch (e) {
    if (e && e.status === 404) {
      // Activities endpoint not available on this backend; treat as non-fatal
      return { ok: false, skipped: true };
    }
    throw e;
  }
}

async function getRecentShakeActivities({ limit = 20 } = {}) {
  if (OFFLINE_MODE) {
    await delay(120);
    const shakes = MOCK_ACTIVITIES.filter((a) => a.type === 'shake');
    return shakes.slice(0, limit);
  }
  const qs = `?type=shake&limit=${encodeURIComponent(limit)}`;
  try {
    return await tryFetchPaths([
      `/api/activities${qs}`,
    ], { method: 'GET' });
  } catch (e) {
    if (e && e.status === 404) {
      // Backend doesn't expose activities listing; return empty list
      return [];
    }
    throw e;
  }
}

// Shakes
async function recordShake({ count = 1, timestamp = new Date().toISOString() } = {}) {
  if (OFFLINE_MODE) {
    await delay(100);
    const entry = { id: `shake-${Date.now()}`, count, timestamp };
    MOCK_SHAKES.unshift(entry);
    MOCK_ACTIVITIES.unshift({
      id: `act-${Date.now()}-shake`,
      type: 'shake',
      title: 'Shake',
      count,
      timestamp: new Date(timestamp),
    });
    MOCK_USER = {
      ...MOCK_USER,
      totalShakes: (MOCK_USER.totalShakes || 0) + count,
      dailyShakes: (MOCK_USER.dailyShakes || 0) + count,
      lastShakeTime: timestamp,
    };
    return entry;
  }
  return tryFetchPaths(['/api/shakes'], { method: 'POST', body: { count, timestamp } });
}

async function getShakes({ from, to, date } = {}) {
  if (OFFLINE_MODE) {
    await delay(100);
    let items = [...MOCK_SHAKES];
    if (date) items = items.filter((s) => (s.timestamp || '').startsWith(date));
    if (from) items = items.filter((s) => new Date(s.timestamp) >= new Date(from));
    if (to) items = items.filter((s) => new Date(s.timestamp) <= new Date(to));
    return items;
  }
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const qs = params.toString();
  const path = `/api/shakes${qs ? `?${qs}` : ''}`;
  return tryFetchPaths([path], { method: 'GET' });
}

async function getShakesToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return getShakes({ date: `${yyyy}-${mm}-${dd}` });
}

// Feedback
async function submitFeedback({ title, message, category, rating }) {
  if (OFFLINE_MODE) {
    await delay(150);
    MOCK_ACTIVITIES.unshift({
      id: `act-${Date.now()}-fb`,
      type: 'feedback',
      title,
      description: message,
      rating,
      category,
      timestamp: new Date(),
    });
    return { ok: true };
  }
  return tryFetchPaths(
    ['/api/feedbacks'],
    { method: 'POST', body: { title, message, category, rating } }
  );
}

export const api = {
  // config
  API_BASE_URL,

  // auth
  login,
  register,
  getCurrentUser,
  updateProfile,
  logout,
  sendPasswordReset,

  // activities
  logActivity,
  getRecentShakeActivities,

  // shakes
  recordShake,
  getShakes,
  getShakesToday,

  // feedback
  submitFeedback,
};
