const API_BASE = import.meta.env.VITE_API_URL || 'https://energy-autonomy-backend.onrender.com';

export const BLOG_IMAGES = {};

/**
 * Resolves only real dynamic image URLs from backend API / uploads.
 * Eliminates all static dummy/mock images so only dynamic data is displayed.
 */
export const getBlogImage = (key) => {
  if (!key || typeof key !== 'string') return null;

  const trimmed = key.trim();
  if (!trimmed) return null;

  // Ignore dummy/static mock keys like "blog1", "blog2", "blog-banner", etc.
  if (
    trimmed === 'blog1' ||
    trimmed === 'blog2' ||
    trimmed === 'blog3' ||
    trimmed === 'blog4' ||
    trimmed === 'blog-banner' ||
    trimmed === 'blog-detail' ||
    (trimmed.toLowerCase().startsWith('blog') && !trimmed.includes('/') && !trimmed.includes('.'))
  ) {
    return null;
  }

  // Full URLs (Render uploads, external or blob)
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Backend upload paths
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${API_BASE}${cleanPath}`;
  }

  if (trimmed.startsWith('/')) {
    return `${API_BASE}${trimmed}`;
  }

  return null;
};
