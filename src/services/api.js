/**
 * Centralized API Service for Energy Autonomy Admin Panel
 * Connects directly to Energy-Autonomy-Backend REST API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://energy-autonomy-backend.onrender.com';

export const getAuthToken = () => {
  try {
    return localStorage.getItem('ea_admin_token') || null;
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('ea_admin_token', token);
    } else {
      localStorage.removeItem('ea_admin_token');
    }
  } catch (err) {
    console.error('Failed to store auth token:', err);
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('ea_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('ea_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ea_admin_user');
    }
  } catch (err) {
    console.error('Failed to store user info:', err);
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem('ea_admin_token');
    localStorage.removeItem('ea_admin_user');
  } catch (err) {
    console.error('Failed to clear auth:', err);
  }
};

const inFlightRequests = new Map();

/**
 * Core HTTP Request Wrapper with in-flight GET deduplication
 */
async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  // Deduplicate concurrent identical GET requests
  const cacheKey = method === 'GET' ? `${url}:${token || ''}` : null;
  if (cacheKey && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const execute = async () => {
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    // Attach Bearer token if present
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    // If body is NOT FormData, set JSON content type
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        clearAuth();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage =
          (data && typeof data === 'object' && (data.error || data.message)) ||
          `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err);
      throw err;
    } finally {
      if (cacheKey) {
        inFlightRequests.delete(cacheKey);
      }
    }
  };

  const promise = execute();
  if (cacheKey) {
    inFlightRequests.set(cacheKey, promise);
  }
  return promise;
}

/* ==========================================================================
   AUTHENTICATION API
   ========================================================================== */
export const authApi = {
  /**
   * Admin Login - authenticates against backend POST /api/auth/login
   */
  async login(email, password) {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      setAuthToken(data.token);
      const user = data.user || { email, role: 'admin' };
      setStoredUser(user);
    }

    return data;
  },

  logout() {
    clearAuth();
  },
};

/* ==========================================================================
   BLOG POSTS API
   ========================================================================== */
export const postsApi = {
  /**
   * List all blog posts (supports optional status filter: 'draft', 'published', 'archived')
   */
  async getAll(status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/api/posts${query}`, { method: 'GET' });
  },

  /**
   * Get single blog post by UUID or slug
   */
  async getById(idOrSlug) {
    return apiRequest(`/api/posts/${encodeURIComponent(idOrSlug)}`, { method: 'GET' });
  },

  /**
   * Create a new blog post
   */
  async create(payload) {
    return apiRequest('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update full blog post by ID
   */
  async update(id, payload) {
    return apiRequest(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Partially update blog post by ID
   */
  async patch(id, payload) {
    return apiRequest(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Publish blog post by ID (POST /api/posts/:id/publish)
   */
  async publish(id, payload = {}) {
    return apiRequest(`/api/posts/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update status of post ('draft', 'published', 'archived')
   */
  async updateStatus(id, status) {
    return apiRequest(`/api/posts/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Delete a post by ID
   */
  async delete(id) {
    return apiRequest(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

/* ==========================================================================
   IMAGE UPLOAD API
   ========================================================================== */
export const uploadApi = {
  /**
   * Upload single image file (multipart/form-data to POST /api/upload)
   * Returns: { message, file: { filename, originalName, mimetype, size, path, url } }
   */
  async upload(file) {
    const formData = new FormData();
    formData.append('image', file);

    return apiRequest('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Delete uploaded file by filename (DELETE /api/upload/:filename)
   */
  async delete(filename) {
    if (!filename) return null;
    // Extract basename if full path or URL passed
    const cleanFilename = filename.split('/').pop().split('\\').pop();
    return apiRequest(`/api/upload/${encodeURIComponent(cleanFilename)}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authApi,
  posts: postsApi,
  upload: uploadApi,
  getAuthToken,
  setAuthToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
};
