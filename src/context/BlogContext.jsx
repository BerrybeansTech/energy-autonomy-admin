import React, { createContext, useContext, useState } from 'react';
import { blogPosts as initialPosts } from '../data/blogData';

const BlogContext = createContext(null);

export const BlogProvider = ({ children }) => {
  const [posts, setPosts] = useState(initialPosts);

  const addPost = (post) => {
    const newPost = {
      ...post,
      id: Date.now(),
      slug: post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      publishedAt: new Date().toISOString().split('T')[0],
    };
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const updatePost = (id, updates) => {
    setPosts((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p))
    );
  };

  const deletePost = (id) => {
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)));
  };

  const getPost = (id) => posts.find((p) => String(p.id) === String(id));

  return (
    <BlogContext.Provider value={{ posts, addPost, updatePost, deletePost, getPost }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => useContext(BlogContext);
