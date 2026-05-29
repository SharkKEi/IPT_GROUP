/**
 * Frontend validation utilities
 * Reusable validation functions for forms
 */

export const validators = {
  /**
   * Validate username (3-150 chars, alphanumeric + underscore/dash)
   */
  username: (value) => {
    if (!value || value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 150) return 'Username must be under 150 characters';
    if (!/^[\w-]+$/.test(value)) return 'Username can only contain letters, numbers, underscores, and dashes';
    return null;
  },

  /**
   * Validate email
   */
  email: (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },

  /**
   * Validate password (min 6 chars)
   */
  password: (value) => {
    if (!value || value.length < 6) return 'Password must be at least 6 characters';
    return null;
  },

  /**
   * Validate password confirmation
   */
  passwordConfirm: (password, confirmPassword) => {
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  },

  /**
   * Validate student number
   */
  studentNumber: (value) => {
    if (!value) return 'Student number is required';
    if (value.length < 2) return 'Student number is too short';
    return null;
  },

  /**
   * Validate full name
   */
  fullName: (value) => {
    if (!value) return 'Full name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    if (value.length > 200) return 'Name is too long';
    return null;
  },

  /**
   * Validate subject code
   */
  subjectCode: (value) => {
    if (!value) return 'Subject code is required';
    if (value.length < 2 || value.length > 20) return 'Subject code must be 2-20 characters';
    return null;
  },

  /**
   * Validate positive integer
   */
  positiveInteger: (value, fieldName = 'Value') => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return `${fieldName} must be a positive number`;
    return null;
  },
};

/**
 * Validate file size (in MB)
 */
export function validateFileSize(file, maxMB = 5) {
  if (!file) return null;
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File must be under ${maxMB}MB`;
  }
  return null;
}

/**
 * Validate file type
 */
export function validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
  if (!file) return null;
  if (!allowedTypes.includes(file.type)) {
    return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }
  return null;
}

/**
 * Extract error message from API response
 */
export function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred';
  
  // If it's an error object with data property (from apiFetch)
  if (error.data) {
    const { detail, message, non_field_errors } = error.data;
    if (detail) return detail;
    if (message) return message;
    if (Array.isArray(non_field_errors) && non_field_errors.length) {
      return non_field_errors[0];
    }
    // Handle field-specific errors
    for (const [field, messages] of Object.entries(error.data)) {
      if (Array.isArray(messages)) return messages[0];
      if (typeof messages === 'string') return messages;
    }
  }
  
  return error.message || error.toString();
}
