import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emulator: 10.0.2.2 → host machine. Physical device: use your PC LAN IP.
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

const TOKEN_KEY = 'school_portal_tokens';

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

export async function apiRequest(path, options = {}) {
  const tokens = await getStoredTokens();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (tokens?.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && tokens?.refresh && !path.includes('/token/')) {
    const refreshRes = await fetch(`${API_BASE}/accounts/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    const refreshData = await refreshRes.json().catch(() => ({}));
    if (refreshRes.ok && refreshData.access) {
      const next = { ...tokens, access: refreshData.access };
      await setStoredTokens(next);
      headers.Authorization = `Bearer ${refreshData.access}`;
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
      return response.json().catch(() => ({}));
    }
    await setStoredTokens(null);
  }

  if (!response.ok) {
    const err = new Error(data.detail || JSON.stringify(data) || 'Request failed');
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
  const res = await fetch(`${API_BASE}/accounts/api/register/`, {
    method: 'POST',
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Registration failed');
  return data;
}

export async function logout() {
  await setStoredTokens(null);
}

export const canManage = (role) => role === 'admin' || role === 'staff';
