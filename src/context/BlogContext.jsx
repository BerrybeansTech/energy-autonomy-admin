import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { postsApi } from '../services/api';
import { useAuth } from './AuthContext';

const BlogContext = createContext(null);

/**
 * Extracts plain text recursively from Tiptap doc JSON
 */
function extractTextFromTiptap(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractTextFromTiptap).join(' ');
  if (typeof node === 'object') {
    let text = node.text || '';
    if (node.content && Array.isArray(node.content)) {
      text += ' ' + node.content.map(extractTextFromTiptap).join(' ');
    }
    return text;
  }
  return '';
}

/**
 * Normalizes backend database post object for frontend components
 */
export function normalizePost(raw) {
  if (!raw) return null;

  let contentJson = raw.content_json || raw.contentJson || null;
  if (typeof contentJson === 'string') {
    try {
      contentJson = JSON.parse(contentJson);
    } catch {
      contentJson = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: contentJson }] }],
      };
    }
  }

  // Plain text excerpt fallback
  const plainText = contentJson ? extractTextFromTiptap(contentJson).trim() : '';
  const excerpt =
    raw.seo_description ||
    raw.seoDescription ||
    raw.excerpt ||
    (plainText ? plainText.slice(0, 160) + (plainText.length > 160 ? '…' : '') : '');

  // Format date
  const rawDate = raw.published_at || raw.publishedAt || raw.created_at || raw.createdAt;
  const publishedAt = rawDate ? new Date(rawDate).toISOString().split('T')[0] : '';

  const readMinutes = raw.reading_time || raw.readingTime || Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200));

  return {
    ...raw,
    id: raw.id,
    title: raw.title || 'Untitled Blog Post',
    slug: raw.slug || '',
    category: raw.category_name || raw.categoryName || raw.category || 'General',
    categoryName: raw.category_name || raw.categoryName || raw.category || 'General',
    status: raw.status || 'draft',
    image: raw.featured_image || raw.featuredImage || raw.image || '',
    featuredImage: raw.featured_image || raw.featuredImage || raw.image || '',
    contentJson: contentJson,
    content_json: contentJson,
    content: plainText,
    excerpt: excerpt,
    readingTime: `${readMinutes} min read`,
    readTime: `${readMinutes} min read`,
    publishedAt: publishedAt,
    createdAt: raw.created_at || raw.createdAt || '',
    updatedAt: raw.updated_at || raw.updatedAt || '',
    tags: raw.tags || (raw.category_name ? [raw.category_name] : ['Energy Autonomy']),
  };
}

export const BlogProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchPosts = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await postsApi.getAll(status);
      const normalized = Array.isArray(data) ? data.map(normalizePost) : [];
      setPosts(normalized);
      setLoading(false);
      return normalized;
    } catch (err) {
      console.error('Failed to fetch posts from API:', err);
      setError(err.message || 'Failed to load posts.');
      setLoading(false);
      return [];
    }
  }, []);

  // Fetch posts initially and when auth state changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, isAuthenticated]);

  /**
   * Get single post by UUID or slug
   */
  const getPost = async (idOrSlug) => {
    if (!idOrSlug) return null;
    // Check cached list first
    const found = posts.find(
      (p) => String(p.id) === String(idOrSlug) || String(p.slug) === String(idOrSlug)
    );
    if (found) return found;

    // Fetch from backend API
    try {
      const raw = await postsApi.getById(idOrSlug);
      return normalizePost(raw);
    } catch (err) {
      console.error(`Post not found for id/slug: ${idOrSlug}`, err);
      return null;
    }
  };

  /**
   * Add / Create new post via API
   */
  const addPost = async (postData) => {
    try {
      const payload = {
        title: postData.title,
        slug: postData.slug,
        contentJson: postData.contentJson || postData.content_json || postData.content,
        featuredImage: postData.featuredImage || postData.image || null,
        categoryName: postData.categoryName || postData.category || null,
        status: postData.status || 'draft',
        seoTitle: postData.seoTitle || postData.title || null,
        seoDescription: postData.seoDescription || postData.excerpt || null,
      };

      const createdRaw = await postsApi.create(payload);
      const normalized = normalizePost(createdRaw);
      setPosts((prev) => [normalized, ...prev.filter((p) => p.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      console.error('Failed to create post via API:', err);
      throw err;
    }
  };

  /**
   * Update existing post via API
   */
  const updatePost = async (id, updates) => {
    try {
      const payload = {
        title: updates.title,
        slug: updates.slug,
        contentJson: updates.contentJson || updates.content_json || updates.content,
        featuredImage: updates.featuredImage !== undefined ? updates.featuredImage : updates.image,
        categoryName: updates.categoryName !== undefined ? updates.categoryName : updates.category,
        status: updates.status,
        seoTitle: updates.seoTitle !== undefined ? updates.seoTitle : updates.title,
        seoDescription: updates.seoDescription !== undefined ? updates.seoDescription : updates.excerpt,
      };

      const updatedRaw = await postsApi.update(id, payload);
      const normalized = normalizePost(updatedRaw);
      setPosts((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? normalized : p))
      );
      return normalized;
    } catch (err) {
      console.error(`Failed to update post ${id} via API:`, err);
      throw err;
    }
  };

  /**
   * Update status of post (quick toggle: 'draft' <-> 'published')
   */
  const updateStatus = async (id, status) => {
    try {
      const updatedRaw = await postsApi.updateStatus(id, status);
      const normalized = normalizePost(updatedRaw);
      setPosts((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? normalized : p))
      );
      return normalized;
    } catch (err) {
      console.error(`Failed to update post status for ${id}:`, err);
      throw err;
    }
  };

  /**
   * Delete post via API
   */
  const deletePost = async (id) => {
    try {
      await postsApi.delete(id);
      setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      return true;
    } catch (err) {
      console.error(`Failed to delete post ${id} via API:`, err);
      throw err;
    }
  };

  return (
    <BlogContext.Provider
      value={{
        posts,
        loading,
        error,
        fetchPosts,
        getPost,
        addPost,
        createPost: addPost,
        updatePost,
        updateStatus,
        deletePost,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => useContext(BlogContext);
export default BlogContext;
