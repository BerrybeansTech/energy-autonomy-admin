import blog1 from '@frontend/assets/blog/blog1.png';
import blog2 from '@frontend/assets/blog/blog2.png';
import blog3 from '@frontend/assets/blog/blog3.png';
import blog4 from '@frontend/assets/blog/blog4.png';
import blogBanner from '@frontend/assets/blog/blog-banner.png';
import blogDetail from '@frontend/assets/blog/blog-detail.png';

export const BLOG_IMAGES = {
  blog1: { label: 'Blog Image 1 (Energy)', src: blog1 },
  blog2: { label: 'Blog Image 2 (Capability)', src: blog2 },
  blog3: { label: 'Blog Image 3 (Silence & Fear)', src: blog3 },
  blog4: { label: 'Blog Image 4 (Restoration)', src: blog4 },
  'blog-banner': { label: 'Blog Banner', src: blogBanner },
  'blog-detail': { label: 'Blog Detail Featured', src: blogDetail },
};

const API_BASE = import.meta.env.VITE_API_URL || 'https://energy-autonomy-backend.onrender.com';

export const getBlogImage = (key) => {
  if (!key) return blog1;
  if (typeof key === 'string') {
    if (key.startsWith('data:') || key.startsWith('http://') || key.startsWith('https://') || key.startsWith('blob:')) {
      return key;
    }
    if (key.startsWith('/uploads/') || key.startsWith('uploads/')) {
      const cleanPath = key.startsWith('/') ? key : `/${key}`;
      return `${API_BASE}${cleanPath}`;
    }
    if (key.startsWith('/')) {
      return key;
    }
  }
  return BLOG_IMAGES[key]?.src || BLOG_IMAGES[key?.toLowerCase()]?.src || blog1;
};
