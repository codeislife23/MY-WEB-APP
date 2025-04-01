// Utility function to merge class names
export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

// Utility function to generate unique IDs
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// Utility function to validate file types
export function validateFileType(file, allowedTypes) {
  return allowedTypes.includes(file.type);
}

// Utility function to format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Utility function to debounce function calls
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Utility function to handle async operations with loading state
export async function withLoading(loadingFn, callback) {
  try {
    loadingFn(true);
    await callback();
  } finally {
    loadingFn(false);
  }
}

// Theme utility functions
export const getThemeFromStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') || 'dark';
  }
  return 'dark';
};

export const setThemeToStorage = (theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', theme);
  }
}; 