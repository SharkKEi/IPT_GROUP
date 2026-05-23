/**
 * API Endpoints Constants
 * Centralized API path definitions to avoid hardcoded strings
 */

const BASE = '/accounts/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${BASE}/login/`,
    LOGOUT: `${BASE}/logout/`,
    REGISTER: `${BASE}/register/`,
    ACTIVATE: `${BASE}/activate/`,
    RESEND_ACTIVATION: `${BASE}/resend-activation/`,
    ME: `${BASE}/me/`,
    CSRF: `${BASE}/csrf/`,
    TOKEN: `${BASE}/token/`,
    TOKEN_REFRESH: `${BASE}/token/refresh/`,
  },

  // Chatbot
  CHATBOT: {
    SEND: `${BASE}/chatbot/`,
  },

  // School Data
  STUDENTS: {
    LIST: `${BASE}/students/`,
    DETAIL: (id) => `${BASE}/students/${id}/`,
  },

  SUBJECTS: {
    LIST: `${BASE}/subjects/`,
    DETAIL: (id) => `${BASE}/subjects/${id}/`,
  },

  SECTIONS: {
    LIST: `${BASE}/sections/`,
    DETAIL: (id) => `${BASE}/sections/${id}/`,
  },

  ENROLLMENTS: {
    LIST: `${BASE}/enrollments/`,
    DELETE: (id) => `${BASE}/enrollments/${id}/delete/`,
    SUMMARY: `${BASE}/enrollments/summary/`,
  },

  // Admin
  USERS: {
    LIST: `${BASE}/users/`,
    ROLE: (id) => `${BASE}/users/${id}/role/`,
  },
};

/**
 * Helper to build endpoint URL with optional ID
 * @param {string|function} endpoint - Endpoint string or function
 * @param {number} [id] - Optional ID for detail endpoints
 * @returns {string} Complete endpoint URL
 */
export function getEndpoint(endpoint, id = null) {
  if (typeof endpoint === 'function') {
    return endpoint(id);
  }
  return endpoint;
}
