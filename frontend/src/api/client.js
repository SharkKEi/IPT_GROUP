const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// A local variable to hold the token string when browser cookie-reading is blocked
let memoryCsrfToken = '';

export function getCsrfToken() {
  const name = 'csrftoken';
  for (const cookie of document.cookie.split(';')) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }
  return '';
}

/** Fetch CSRF cookie from Django (required before POST/PUT/PATCH/DELETE with session auth). */
export async function ensureCsrfCookie() {
  // Fallback to checking normal cookies first
  if (getCsrfToken()) return;

  try {
    // This hits your backend endpoint which now safely returns the token in JSON text!
    const response = await fetch(`${API_BASE}/accounts/api/csrf/`, { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      // Store the token string directly in memory so JavaScript can read it freely
      memoryCsrfToken = data.csrftoken || '';
    }
  } catch (error) {
    console.error("Error fetching secure CSRF token:", error);
  }
}

function applyCsrfHeaders(headers, method) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // If browser cookie storage is empty due to cross-origin blocks, use our memory variable!
    const token = getCsrfToken() || memoryCsrfToken;
    if (token) {
      headers['X-CSRFToken'] = token;
    }
  }
}

/**
 * Drop-in fetch replacement: credentials + CSRF on mutating requests.
 * Returns the raw Response (pages handle ok/json themselves).
 */
export async function jsonFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && options.body && method !== 'GET' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    await ensureCsrfCookie();
    applyCsrfHeaders(headers, method);
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export async function apiFetch(path, options = {}) {
  const response = await jsonFetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      typeof data.detail === 'string'
        ? data.detail
        : data.message || 'Request failed',
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const authApi = {
  login: async (body) => {
    const data = await apiFetch('/accounts/api/login/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await ensureCsrfCookie();
    return data;
  },
  logout: () => apiFetch('/accounts/api/logout/', { method: 'POST' }),
  me: () => apiFetch('/accounts/api/me/'),
  register: (formData) =>
    jsonFetch('/accounts/api/register/', { method: 'POST', body: formData }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.detail || 'Registration failed'), { data });
      return data;
    }),
  activate: (token) => apiFetch(`/accounts/api/activate/?token=${encodeURIComponent(token)}`),
  resendActivation: (email) =>
    apiFetch('/accounts/api/resend-activation/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export const chatbotApi = {
  send: (message) =>
    apiFetch('/accounts/api/chatbot/', { method: 'POST', body: JSON.stringify({ message }) }),
};

export function canManageSchool(role) {
  return role === 'admin' || role === 'staff';
}

export function isAdmin(role) {
  return role === 'admin';
}