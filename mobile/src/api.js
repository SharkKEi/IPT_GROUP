import AsyncStorage from '@react-native-async-storage/async-storage';

const FALLBACK_API_BASE = 'https://ipt-group-mission-enrollment-backend.onrender.com';
const TOKEN_KEY = 'school_portal_tokens';
const DEFAULT_TIMEOUT_MS = 12000;

function normalizeBaseUrl(url) {
  return url?.trim().replace(/\/+$/, '');
}

function resolveApiBase() {
  const configured = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  if (configured) return configured;

  return FALLBACK_API_BASE;
}

export const API_BASE = resolveApiBase();

export async function getStoredTokens() {
  const raw = await AsyncStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setStoredTokens(tokens) {
  if (tokens) {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export function getErrorMessage(data, fallback = 'Request failed') {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    if (Array.isArray(value)) return `${firstKey}: ${value.join(', ')}`;
    if (typeof value === 'string') return `${firstKey}: ${value}`;
    if (value && typeof value === 'object') return `${firstKey}: ${JSON.stringify(value)}`;
  }
  return fallback;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(
        `Cannot reach backend at ${API_BASE}. Check your internet connection.`,
      );
    }
    throw new Error(
      `Network error. Backend: ${API_BASE}. Check your internet connection.`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest(path, options = {}) {
  const tokens = await getStoredTokens();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (tokens?.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  let response = await fetchWithTimeout(`${API_BASE}${path}`, { ...options, headers });
  let data = await response.json().catch(() => ({}));

  if (response.status === 401 && tokens?.refresh && !path.includes('/token/')) {
    const refreshRes = await fetchWithTimeout(`${API_BASE}/accounts/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    const refreshData = await refreshRes.json().catch(() => ({}));
    if (refreshRes.ok && refreshData.access) {
      const next = { ...tokens, access: refreshData.access };
      await setStoredTokens(next);
      headers.Authorization = `Bearer ${refreshData.access}`;
      response = await fetchWithTimeout(`${API_BASE}${path}`, { ...options, headers });
      data = await response.json().catch(() => ({}));
    } else {
      await setStoredTokens(null);
    }
  }

  if (!response.ok) {
    const err = new Error(getErrorMessage(data, `Request failed (${response.status})`));
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function login(username, password) {
  const data = await apiRequest('/accounts/api/token/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  await setStoredTokens({ access: data.access, refresh: data.refresh });
  return data.user;
}

export async function register(form) {
  const body = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v != null && v !== '') body.append(k, v);
  });
  const res = await fetchWithTimeout(`${API_BASE}/accounts/api/register/`, {
    method: 'POST',
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, 'Registration failed'));
  return data;
}

export async function logout() {
  await setStoredTokens(null);
}

export const canManage = (role) => role === 'admin' || role === 'staff';
export const isAdmin = (role) => role === 'admin';
