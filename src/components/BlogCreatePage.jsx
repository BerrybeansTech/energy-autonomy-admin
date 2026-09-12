import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import MediumEditor from './MediumEditor'
import { useBlog } from '../context/BlogContext'
import { useAuth } from '../context/AuthContext'
import { uploadApi, postsApi } from '../services/api'
import {
  Eye,
  Edit3,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Share2,
  Bookmark,
  LayoutDashboard,
  FileText,
  PenSquare,
  Type,
  ArrowLeft,
  ChevronUp,
  Link as LinkIcon,
  RotateCcw,
  AlertCircle,
  Globe
} from 'lucide-react'

/**
 * URL-friendly slug generator
 */
export function generateSlug(text) {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and special characters with hyphen
    .replace(/^-+|-+$/g, '')   // Trim leading/trailing hyphens
}

/**
 * Recursively extracts plain text string from Tiptap doc / JSON object
 */
export function extractPlainText(node) {
  if (!node) return ''
  if (typeof node === 'string') {
    try {
      const parsed = JSON.parse(node)
      if (parsed && typeof parsed === 'object') return extractPlainText(parsed)
    } catch {
      return node.trim()
    }
    return node.trim()
  }
  let text = ''
  if (node.text) text += node.text + ' '
  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child) => {
      text += extractPlainText(child) + ' '
    })
  }
  return text.trim()
}

/**
 * Creates a normalized fingerprint of post data to accurately detect true unsaved changes
 */
export function getPayloadFingerprint(p) {
  if (!p) return ''
  const t = (p.title || '').trim()
  const s = (p.slug || '').trim()
  const text = extractPlainText(p.contentJson || p.content_json || p.content)
  const img = p.featuredImage || p.featured_image || p.image || ''
  const label = (p.labelName || p.label_name || p.category || p.category_name || '').trim()
  const st = (p.seoTitle || p.seo_title || '').trim()
  const sd = (p.seoDescription || p.seo_description || p.excerpt || '').trim()
  return JSON.stringify({ t, s, text, img, label, st, sd })
}

/**
 * Checks if Tiptap doc has any actual non-empty text or non-text media
 */
export function hasEditorActualContent(doc) {
  if (!doc) return false
  if (typeof doc === 'string') {
    return doc.trim().length > 0
  }
  const text = extractPlainText(doc)
  if (text && text.trim().length > 0) return true

  let hasMedia = false
  const checkNode = (node) => {
    if (!node || hasMedia) return
    if (node.type === 'image' || node.type === 'youtube' || node.type === 'horizontalRule') {
      hasMedia = true
      return
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        checkNode(child)
        if (hasMedia) return
      }
    }
  }
  checkNode(doc)
  return hasMedia
}

const BlogCreatePage = ({ onBackToDashboard }) => {
  const { user, logout } = useAuth() || {}
  const { id: routeId } = useParams()
  const [postId, setPostId] = useState(routeId || null)
  const [existingPostStatus, setExistingPostStatus] = useState(null)
  const [autosaveStatus, setAutosaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null)

  const blogContext = useBlog()
  const addPost = blogContext?.addPost
  const updatePost = blogContext?.updatePost
  const patchPost = blogContext?.patchPost
  const publishPost = blogContext?.publishPost
  const getPost = blogContext?.getPost
  const navigate = useNavigate()
  const location = useLocation()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState('published')
  const [subtitle, setSubtitle] = useState('')
  const [showSubtitleInput, setShowSubtitleInput] = useState(false)
  const [coverImage, setCoverImage] = useState('')
  const [coverFilename, setCoverFilename] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [labelName, setLabelName] = useState('')
  const tags = useMemo(() => (labelName && labelName.trim() ? [labelName.trim()] : []), [labelName])
  const [seoTitle, setSeoTitle] = useState('')
  const [isSeoTitleEdited, setIsSeoTitleEdited] = useState(false)
  const [seoDescription, setSeoDescription] = useState('')
  const [isSeoDescriptionEdited, setIsSeoDescriptionEdited] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublishSuccess, setIsPublishSuccess] = useState(false)
  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false)
  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  const titleTextareaRef = useRef(null)
  const subtitleTextareaRef = useRef(null)
  const isCreatingDraftRef = useRef(false)
  const createdDraftIdRef = useRef(null)
  const draftPromiseRef = useRef(null)
  const hasUserInteractedRef = useRef(false)
  const lastSavedPayloadRef = useRef('')
  const lastCachedPayloadRef = useRef('')
  const isSavingRef = useRef(false)

  // 3-Tier States
  const [restoredFromBackup, setRestoredFromBackup] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [pendingNavAction, setPendingNavAction] = useState(null)

  // Auto-resize title textarea to fit multiline content
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto'
      titleTextareaRef.current.style.height = titleTextareaRef.current.scrollHeight + 'px'
    }
  }, [title])

  // Auto-resize subtitle textarea to fit multiline content
  useEffect(() => {
    if (subtitleTextareaRef.current) {
      subtitleTextareaRef.current.style.height = 'auto'
      subtitleTextareaRef.current.style.height = subtitleTextareaRef.current.scrollHeight + 'px'
    }
  }, [subtitle, showSubtitleInput])
  
  const [editorJson, setEditorJson] = useState({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  })

  const [isPreviewMode, setIsPreviewMode] = useState(false)

  /**
   * Initializes a new draft in the database via POST /api/posts and updates URL.
   * Leverages draftPromiseRef and createdDraftIdRef to guarantee only 1 POST call is made.
   */
  const ensureDraftId = async (initialOverrides = {}) => {
    if (postId) return postId
    if (createdDraftIdRef.current) return createdDraftIdRef.current
    if (draftPromiseRef.current) {
      return await draftPromiseRef.current
    }

    draftPromiseRef.current = (async () => {
      isCreatingDraftRef.current = true
      try {
        setAutosaveStatus('saving')
        const finalTitle = initialOverrides.title !== undefined ? initialOverrides.title : (title || '')
        const finalLabelName = initialOverrides.labelName !== undefined
          ? initialOverrides.labelName
          : (labelName && labelName.trim() ? labelName.trim() : null)
        const finalSlug = initialOverrides.slug !== undefined
          ? initialOverrides.slug
          : ((finalTitle && finalTitle.trim()) ? generateSlug(finalTitle.trim()) : undefined)

        const payload = {
          title: finalTitle,
          slug: finalSlug,
          contentJson: initialOverrides.contentJson !== undefined ? initialOverrides.contentJson : editorJson,
          featuredImage: initialOverrides.featuredImage !== undefined ? initialOverrides.featuredImage : (coverImage || null),
          labelName: finalLabelName,
          status: 'draft',
          seoTitle: initialOverrides.seoTitle !== undefined ? initialOverrides.seoTitle : (seoTitle || null),
          seoDescription: initialOverrides.seoDescription !== undefined ? initialOverrides.seoDescription : (subtitle || null),
        }
        const res = await postsApi.create(payload)
        const newId = res?.id || res
        if (newId) {
          createdDraftIdRef.current = newId
          setPostId(newId)
          setExistingPostStatus('draft')
          // Update URL bar seamlessly without unmounting, remounting, or reloading the component
          window.history.replaceState(null, '', `/blog/edit/${newId}`)
          setAutosaveStatus('saved')
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          lastSavedPayloadRef.current = getPayloadFingerprint(payload)
          return newId
        }
      } catch (err) {
        console.error('Failed to initialize draft post:', err)
        setAutosaveStatus('error')
      } finally {
        isCreatingDraftRef.current = false
        draftPromiseRef.current = null
      }
      return null
    })()

    return await draftPromiseRef.current
  }

  /**
   * User interaction trigger: only called when user clicks/focuses or interacts with editor area
   */
  const handleEditorInteraction = () => {
    hasUserInteractedRef.current = true
    if (!postId && !createdDraftIdRef.current) {
      ensureDraftId()
    }
  }

  // Handle route change / mount: load existing post or create fresh draft
  useEffect(() => {
    let isMounted = true

    if (routeId) {
      if (createdDraftIdRef.current === routeId) {
        createdDraftIdRef.current = null
        return
      }
      setPostId(routeId)
      postsApi.getById(routeId).then((existing) => {
        if (!isMounted || !existing) return
        if (existing.title) {
          setTitle(existing.title)
          if (!existing.seo_title && !existing.seoTitle) {
            setSeoTitle(existing.title)
          }
          setSlug(generateSlug(existing.title))
        } else if (existing.slug && !existing.slug.startsWith('draft-')) {
          setSlug(existing.slug)
        } else {
          setSlug('')
        }
        if (existing.seo_title || existing.seoTitle) {
          setSeoTitle(existing.seo_title || existing.seoTitle)
          setIsSeoTitleEdited(true)
        }
        if (existing.status) {
          setStatus(existing.status)
          setExistingPostStatus(existing.status)
        }
        if (existing.excerpt || existing.seo_description || existing.seoDescription) {
          const desc = existing.seo_description || existing.seoDescription || existing.excerpt
          setSubtitle(desc)
          setShowSubtitleInput(true)
          setSeoDescription(desc)
          if (existing.seo_description || existing.seoDescription) {
            setIsSeoDescriptionEdited(true)
          }
        }
        if (existing.featured_image || existing.image) {
          const imgUrl = existing.featured_image || existing.image
          setCoverImage(imgUrl)
          const fname = imgUrl.split('/').pop().split('\\').pop()
          setCoverFilename(fname)
        }
        const existingLabel = existing.label_name || existing.labelName || existing.category || existing.category_name
        if (existingLabel && typeof existingLabel === 'string' && existingLabel.trim()) {
          setLabelName(existingLabel.trim())
        } else {
          setLabelName('')
        }
        const content = existing.content_json || existing.contentJson
        if (content && typeof content === 'object' && content.type === 'doc') {
          setEditorJson(content)
        } else if (content) {
          try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content
            if (parsed && (parsed.type === 'doc' || parsed.content)) {
              setEditorJson(parsed)
            }
          } catch {}
        }
        lastSavedPayloadRef.current = getPayloadFingerprint(existing)
        hasUserInteractedRef.current = false

        // Crash Recovery: Check SSD localStorage for any uncommitted words typed before sudden shutdown
        try {
          const backupRaw = localStorage.getItem('energy_blog_crash_backup')
          if (backupRaw) {
            const backup = JSON.parse(backupRaw)
            const isRecent = backup.timestamp && (Date.now() - backup.timestamp < 48 * 60 * 60 * 1000)
            const matchesPost = String(backup.postId) === String(routeId)
            if (isRecent && matchesPost) {
              const dbText = extractPlainText(content).trim()
              const backupText = extractPlainText(backup.contentJson).trim()
              // ONLY restore if backup ACTUALLY has more text than database (i.e. truly unsaved words from a crash)
              if (backupText.length > dbText.length + 3) {
                setEditorJson(backup.contentJson)
                if (backup.title && !existing.title) setTitle(backup.title)
                setRestoredFromBackup(true)
                hasUserInteractedRef.current = true
              } else {
                // Database already has this data (e.g. reload or already saved) -> remove stale local cache so no banner appears!
                localStorage.removeItem('energy_blog_crash_backup')
              }
            }
          }
        } catch (e) {
          console.warn('Crash recovery check failed:', e)
        }
      }).catch((err) => {
        console.error('Failed to load post by ID:', err)
      })
    } else {
      // Writing a new blog: initialize state cleanly with NO initial draft creation
      setPostId(null)
      createdDraftIdRef.current = null
      draftPromiseRef.current = null
      setExistingPostStatus('draft')
      setTitle('')
      setSlug('')
      setSubtitle('')
      setShowSubtitleInput(false)
      setCoverImage('')
      setCoverFilename('')
      setShowCoverInput(false)
      setLabelName('')
      setSeoTitle('')
      setIsSeoTitleEdited(false)
      setSeoDescription('')
      setIsSeoDescriptionEdited(false)
      setEditorJson({ type: 'doc', content: [{ type: 'paragraph' }] })
      setStatus('published')
      hasUserInteractedRef.current = false
      lastSavedPayloadRef.current = ''
      setAutosaveStatus('idle')
      setLastSavedTime(null)

      // Crash Recovery: Check SSD localStorage for any unsaved new post draft
      try {
        const backupRaw = localStorage.getItem('energy_blog_crash_backup')
        if (backupRaw) {
          const backup = JSON.parse(backupRaw)
          const isRecent = backup.timestamp && (Date.now() - backup.timestamp < 48 * 60 * 60 * 1000)
          const backupText = extractPlainText(backup.contentJson).trim()
          if (isRecent && !backup.postId && (backupText.length > 0 || (backup.title && backup.title.trim()))) {
            if (backup.title) setTitle(backup.title)
            if (backup.contentJson) setEditorJson(backup.contentJson)
            if (backup.subtitle) {
              setSubtitle(backup.subtitle)
              setShowSubtitleInput(true)
            }
            if (backup.labelName) setLabelName(backup.labelName)
            setRestoredFromBackup(true)
            hasUserInteractedRef.current = true
          } else {
            localStorage.removeItem('energy_blog_crash_backup')
          }
        }
      } catch (e) {
        console.warn('Crash recovery check failed:', e)
      }
    }

    return () => {
      isMounted = false
    }
  }, [routeId])

  // Helper to compile the active payload matching the backend schema
  const getFullPayload = (overrides = {}) => {
    const currentTitle = overrides.title !== undefined ? overrides.title : (title || '')
    const currentSlug = overrides.slug !== undefined
      ? overrides.slug
      : ((currentTitle && currentTitle.trim()) ? generateSlug(currentTitle.trim()) : undefined)
    const currentLabel = overrides.labelName !== undefined
      ? overrides.labelName
      : ((labelName && labelName.trim()) ? labelName.trim() : null)

    return {
      title: currentTitle,
      slug: currentSlug,
      contentJson: overrides.contentJson !== undefined ? overrides.contentJson : editorJson,
      featuredImage: overrides.featuredImage !== undefined ? overrides.featuredImage : (coverImage || null),
      labelName: currentLabel,
      seoTitle: overrides.seoTitle !== undefined ? overrides.seoTitle : ((seoTitle && seoTitle.trim()) ? seoTitle.trim() : (currentTitle || null)),
      seoDescription: overrides.seoDescription !== undefined ? overrides.seoDescription : ((seoDescription && seoDescription.trim()) ? seoDescription.trim() : (subtitle || null)),
      status: existingPostStatus === 'published' ? 'published' : 'draft',
    }
  }

  // Tier 1 & Direct Save to Backend PostgreSQL Database
  const saveToDatabase = async (contentJsonOverride = null) => {
    if (isSavingRef.current) return
    let targetId = postId || createdDraftIdRef.current
    if (!targetId) {
      if (!hasUserInteractedRef.current && !hasEditorActualContent(contentJsonOverride || editorJson) && !title.trim()) {
        return
      }
      targetId = await ensureDraftId(contentJsonOverride ? { contentJson: contentJsonOverride } : {})
      if (!targetId) return
    }

    const payload = getFullPayload(contentJsonOverride ? { contentJson: contentJsonOverride } : {})
    const payloadFingerprint = getPayloadFingerprint(payload)
    if (payloadFingerprint === lastSavedPayloadRef.current) return

    try {
      isSavingRef.current = true
      setAutosaveStatus('saving')
      await postsApi.patch(targetId, payload)
      lastSavedPayloadRef.current = payloadFingerprint
      setAutosaveStatus('saved')
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      // Completed line safely written to DB -> clear temporary SSD cache
      try {
        localStorage.removeItem('energy_blog_crash_backup')
      } catch {}
    } catch (err) {
      console.error('Autosave patch failed:', err)
      setAutosaveStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }

  // Tier 1 Callback: Triggered only when a line visually wraps or Enter is pressed
  const handleLineWrap = (updatedContentJson) => {
    if (!hasUserInteractedRef.current && !hasEditorActualContent(updatedContentJson)) return
    hasUserInteractedRef.current = true
    saveToDatabase(updatedContentJson)
  }

  // Tier 2: 5-Second Local Cache for Unfinished Lines (Writes to SSD; 0 API calls to server)
  useEffect(() => {
    const localCacheInterval = setInterval(() => {
      if (!hasUserInteractedRef.current) return

      const payload = getFullPayload()
      const payloadFingerprint = getPayloadFingerprint(payload)

      // Only write to SSD if there are unsaved words on current line AND they differ from previous cache
      if (payloadFingerprint !== lastSavedPayloadRef.current && payloadFingerprint !== lastCachedPayloadRef.current) {
        try {
          localStorage.setItem('energy_blog_crash_backup', JSON.stringify({
            ...payload,
            postId,
            subtitle,
            timestamp: Date.now(),
          }))
          lastCachedPayloadRef.current = payloadFingerprint
        } catch (e) {
          console.warn('LocalStorage backup failed:', e)
        }
      }
    }, 5000)

    return () => clearInterval(localCacheInterval)
  }, [title, subtitle, editorJson, coverImage, labelName, slug, seoTitle, seoDescription, postId, existingPostStatus])

  // Tier 3: Check if there are unsaved words on the current line
  const isDirty = () => {
    if (!hasUserInteractedRef.current) return false
    const currentFingerprint = getPayloadFingerprint(getFullPayload())
    return currentFingerprint !== lastSavedPayloadRef.current
  }

  // Tier 3 Navigation Interceptor: Blocks tab clicks if an unfinished line is pending
  const handleProtectedNavigation = (navigateAction) => {
    if (isDirty()) {
      setPendingNavAction(() => navigateAction)
      setShowLeaveModal(true)
    } else {
      navigateAction()
    }
  }

  // Window Unload Guard: Warns if user closes tab or refreshes with unsaved text
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [title, subtitle, editorJson, coverImage, labelName, slug, seoTitle, seoDescription, postId])

  // Title change handler with automatic title-based URL slug and SEO Title generation
  const handleTitleChange = (e) => {
    hasUserInteractedRef.current = true
    const val = e.target.value
    setTitle(val)
    const autoSlug = generateSlug(val)
    setSlug(autoSlug)
    if (!isSeoTitleEdited) {
      setSeoTitle(val)
    }
    if (errorMessage) setErrorMessage('')
    if (val.trim().length > 0 && !postId && !createdDraftIdRef.current) {
      ensureDraftId({ title: val, slug: autoSlug })
    }
  }

  // Calculate word count & reading time
  const { wordCount, readingTime } = useMemo(() => {
    let text = title + ' ' + subtitle + ' '
    const extractText = (node) => {
      if (!node) return
      if (node.text) text += node.text + ' '
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractText)
      }
    }
    if (editorJson && editorJson.content) {
      editorJson.content.forEach(extractText)
    }
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.ceil(words / 200))
    return { wordCount: words, readingTime: minutes }
  }, [title, subtitle, editorJson])

  // Verify if the user has entered content in the blog body ("Write your blog...")
  const hasBlogContent = useMemo(() => {
    if (!editorJson) return false
    let found = false
    const checkNode = (node) => {
      if (!node || found) return
      if (typeof node.text === 'string' && node.text.trim().length > 0) {
        found = true
        return
      }
      if (node.type === 'image' || node.type === 'youtube') {
        found = true
        return
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          checkNode(child)
          if (found) return
        }
      }
    }
    checkNode(editorJson)
    return found
  }, [editorJson])

  // Cover Image upload via backend /api/upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadingCover(true)
      setErrorMessage('')
      try {
        const res = await uploadApi.upload(file)
        const fileUrl = res.file?.url || res.file?.path
        const filename = res.file?.filename
        if (fileUrl) {
          hasUserInteractedRef.current = true
          setCoverImage(fileUrl)
          setCoverFilename(filename || fileUrl.split('/').pop().split('\\').pop())
          setShowCoverInput(false)
          if (!postId && !createdDraftIdRef.current) {
            ensureDraftId({ featuredImage: fileUrl })
          }
        }
      } catch (err) {
        console.error('Failed to upload cover image:', err)
        setErrorMessage('Cover image upload failed: ' + (err.message || 'Server error'))
      } finally {
        setUploadingCover(false)
        if (e.target) e.target.value = ''
      }
    }
  }

  // Cover Image remove with backend /api/upload/:filename deletion
  const handleRemoveCoverImage = async () => {
    hasUserInteractedRef.current = true
    if (coverFilename || (coverImage && coverImage.includes('/uploads/'))) {
      const filename = coverFilename || coverImage.split('/').pop().split('\\').pop()
      try {
        await uploadApi.delete(filename)
      } catch (err) {
        console.warn('Failed to delete cover image on backend:', err)
      }
    }
    setCoverImage('')
    setCoverFilename('')
  }

  // Publish / Update Handler using REST API
  const handlePublish = async () => {
    // 1. Content in editor is compulsory
    if (!hasBlogContent) {
      setErrorMessage('Please write your blog content before publishing.')
      return
    }

    // 2. Cover image is compulsory
    if (!coverImage) {
      setErrorMessage('Cover image is compulsory. Please upload a cover image for your article.')
      return
    }

    // 3. Title is compulsory
    if (!title || !title.trim()) {
      setErrorMessage('Title is compulsory. Please enter an article title.')
      return
    }

    // 4. Subtitle / Summary is compulsory
    if (!subtitle || !subtitle.trim()) {
      setErrorMessage('Subtitle / Summary excerpt is compulsory. Please enter a subtitle.')
      return
    }

    // 5. Label name is compulsory
    if (!labelName || !labelName.trim()) {
      setErrorMessage('Label Name is compulsory. Please enter a label name for your article.')
      return
    }

    const cleanTitle = title.trim()
    const finalSlug = generateSlug(cleanTitle) || 'article'
    const finalLabelName = labelName.trim()
    const finalSeoTitle = (seoTitle && seoTitle.trim()) ? seoTitle.trim() : cleanTitle
    const finalSeoDescription = (seoDescription && seoDescription.trim()) ? seoDescription.trim() : subtitle.trim()

    setErrorMessage('')
    setIsPublishing(true)

    try {
      let targetId = postId || createdDraftIdRef.current
      if (!targetId) {
        targetId = await ensureDraftId({
          title: cleanTitle,
          slug: finalSlug,
          contentJson: editorJson,
          featuredImage: coverImage,
          labelName: finalLabelName,
          seoTitle: finalSeoTitle,
          seoDescription: finalSeoDescription,
        })
      }

      const postPayload = {
        title: cleanTitle,
        slug: finalSlug,
        contentJson: editorJson,
        featuredImage: coverImage,
        labelName: finalLabelName,
        seoTitle: finalSeoTitle,
        seoDescription: finalSeoDescription,
        status: 'published',
      }

      // Publish article using POST /api/posts/:id/publish
      await postsApi.publish(targetId, postPayload)
      if (publishPost) {
        publishPost(targetId, postPayload).catch(() => {})
      }

      setAutosaveStatus('saved')
      setStatus('published')
      setExistingPostStatus('published')
      lastSavedPayloadRef.current = getPayloadFingerprint(postPayload)
      try {
        localStorage.removeItem('energy_blog_crash_backup')
      } catch {}
      setIsPublishSuccess(true)
      setIsPublishDrawerOpen(false)

      setTimeout(() => {
        setIsPublishSuccess(false)
        if (onBackToDashboard) {
          onBackToDashboard()
        } else {
          navigate('/blog')
        }
      }, 1200)
    } catch (err) {
      console.error('Failed to save/publish post:', err)
      let msg = err.data?.message || err.data?.error || err.message || 'Failed to save blog post.'
      if (msg.toLowerCase().includes('duplicate slug') || msg.toLowerCase().includes('already exists')) {
        msg = `A post with the URL slug "${finalSlug}" already exists.`
      }
      setErrorMessage(msg)
    } finally {
      setIsPublishing(false)
    }
  }

  // Clicking the top "Publish Article" button calls PATCH /api/posts/:id and opens the off-side popup
  const handleOpenPublishDrawer = async () => {
    const autoSlug = title.trim() ? generateSlug(title.trim()) : ''
    setSlug(autoSlug)
    if (!seoTitle && title.trim()) {
      setSeoTitle(title.trim())
    }
    if (!seoDescription && subtitle.trim()) {
      setSeoDescription(subtitle.trim())
    }
    setErrorMessage('')

    try {
      setIsOpeningDrawer(true)
      const currentLabelName = (labelName && labelName.trim()) ? labelName.trim() : null
      let targetId = postId || createdDraftIdRef.current
      if (!targetId) {
        targetId = await ensureDraftId({
          title: title || '',
          slug: autoSlug || undefined,
          contentJson: editorJson,
          featuredImage: coverImage || null,
          labelName: currentLabelName,
          seoTitle: seoTitle || title || null,
          seoDescription: seoDescription || subtitle || null,
        })
      }

      if (targetId) {
        setAutosaveStatus('saving')
        const patchPayload = {
          title: title || '',
          slug: autoSlug || undefined,
          contentJson: editorJson,
          featuredImage: coverImage || null,
          labelName: currentLabelName,
          seoTitle: (seoTitle && seoTitle.trim()) ? seoTitle.trim() : (title || null),
          seoDescription: (seoDescription && seoDescription.trim()) ? seoDescription.trim() : (subtitle || null),
          status: existingPostStatus === 'published' ? 'published' : 'draft',
        }
        await postsApi.patch(targetId, patchPayload)
        lastSavedPayloadRef.current = getPayloadFingerprint(patchPayload)
        try {
          localStorage.removeItem('energy_blog_crash_backup')
        } catch {}
        setAutosaveStatus('saved')
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (err) {
      console.error('Failed to patch post before opening drawer:', err)
      setAutosaveStatus('error')
    } finally {
      setIsOpeningDrawer(false)
      setIsPublishDrawerOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#242424] flex font-medium-sans relative selection:bg-purple-100 selection:text-purple-900">
      {/* ------------------------------------------------------------- */}
      {/* PERSISTENT ICON-ONLY / EXPANDABLE SIDEBAR                     */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#F7F8FA] border-r border-slate-200/80 z-40 flex flex-col transition-all duration-300 ease-in-out select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)] overflow-x-hidden ${
          isSidebarExpanded ? 'w-[240px]' : 'w-[64px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center transition-all duration-300 pt-2 ${
          isSidebarExpanded ? 'px-4 justify-between' : 'justify-center px-0'
        }`}>
          {isSidebarExpanded ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] flex items-center justify-center shadow-xs">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[14.5px] font-medium text-slate-800 leading-tight block truncate whitespace-nowrap">
                  Energy Autonomy
                </span>
              </div>

              {/* Collapse Sidebar Button at Far Right End */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarExpanded(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-auto"
                title="Collapse Sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSidebarExpanded(true);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#8F3EC9] hover:bg-purple-50 transition-colors cursor-pointer"
              title="Open Sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
          {/* Dashboard Item */}
          <div className="relative group flex justify-center">
            <Link
              to="/dashboard"
              onClick={(e) => {
                e.preventDefault()
                handleProtectedNavigation(() => navigate('/dashboard'))
              }}
              className={`transition-all duration-200 ${
                isSidebarExpanded
                  ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  : 'w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 p-0'
              }`}
            >
              <span className="shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              {isSidebarExpanded && (
                <span className="whitespace-nowrap overflow-hidden text-[13.5px]">
                  Dashboard
                </span>
              )}
            </Link>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Dashboard
              </div>
            )}
          </div>

          {/* Blog Management Item */}
          <div className="relative group flex justify-center">
            <Link
              to="/blog"
              onClick={(e) => {
                e.preventDefault()
                handleProtectedNavigation(() => navigate('/blog'))
              }}
              className={`transition-all duration-200 ${
                isSidebarExpanded
                  ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  : 'w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 p-0'
              }`}
            >
              <span className="shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors">
                <FileText className="w-5 h-5" />
              </span>
              {isSidebarExpanded && (
                <span className="whitespace-nowrap overflow-hidden text-[13.5px]">
                  Blog Management
                </span>
              )}
            </Link>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Blog Management
              </div>
            )}
          </div>

          {/* Write New Blog */}
          <div className="relative group flex justify-center">
            <Link
              to="/blog/create"
              onClick={(e) => {
                e.preventDefault()
                handleProtectedNavigation(() => navigate('/blog/create'))
              }}
              className={`transition-all duration-200 cursor-pointer ${
                isSidebarExpanded
                  ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium text-[#8F3EC9] bg-purple-50/80 border border-purple-200/80 shadow-[0_2px_8px_rgba(143,62,201,0.06)]'
                  : 'w-10 h-10 flex items-center justify-center rounded-lg text-[#8F3EC9] bg-purple-50/80 border border-purple-200/80 shadow-[0_2px_8px_rgba(143,62,201,0.06)] p-0'
              }`}
            >
              <span className="shrink-0 text-[#8F3EC9]">
                <PenSquare className="w-5 h-5" />
              </span>
              {isSidebarExpanded && (
                <span className="whitespace-nowrap overflow-hidden text-[13.5px]">
                  Write New Blog
                </span>
              )}
            </Link>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Write New Blog
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={`border-t border-slate-200 bg-inherit ${isSidebarExpanded ? 'p-3 pb-3.5 space-y-2.5' : 'p-2 flex flex-col items-center gap-2'}`}>
          {isSidebarExpanded ? (
            <div className="space-y-2.5">
              {/* User Info Header */}
              <div className="flex items-center gap-2.5 px-1 pt-0.5">
                <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white flex items-center justify-center font-medium text-sm shrink-0 shadow-2xs">
                  {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                    {user?.email || 'admin@gmail.com'}
                  </p>
                </div>
              </div>

              {/* Divider Line */}
              <div className="border-t border-slate-200" />

              {/* Actions */}
              <div className="space-y-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    handleProtectedNavigation(() => {
                      if (onBackToDashboard) onBackToDashboard()
                      else navigate('/blog')
                    })
                  }}
                  className="w-full h-9 flex items-center justify-center gap-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Exit Editor</span>
                </button>

                {logout && (
                  <button
                    type="button"
                    onClick={() => {
                      handleProtectedNavigation(() => {
                        logout()
                        navigate('/login')
                      })
                    }}
                    className="w-full h-10 flex items-center justify-center gap-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign out</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                title={`${user?.name || 'Admin'} (${user?.email || 'admin@gmail.com'})`}
                className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs cursor-default"
              >
                {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleProtectedNavigation(() => {
                    if (onBackToDashboard) onBackToDashboard()
                    else navigate('/blog')
                  })
                }}
                title="Exit Editor"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              {logout && (
                <button
                  type="button"
                  onClick={() => {
                    handleProtectedNavigation(() => {
                      logout()
                      navigate('/login')
                    })
                  }}
                  title="Sign out"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50/80 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER (OFFSET BY SIDEBAR)                            */}
      {/* ------------------------------------------------------------- */}
      <div className={`flex-1 flex flex-col min-h-screen bg-white transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'pl-[240px]' : 'pl-[64px]'
      }`}>
        {/* Top Action Bar */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleProtectedNavigation(() => {
                if (onBackToDashboard) onBackToDashboard()
                else navigate('/blog')
              })
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blogs</span>
          </button>

          {/* Center Autosave Status Indicator */}
          <div className="flex items-center gap-2">
            {autosaveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none animate-pulse">
                <svg className="w-3.5 h-3.5 animate-spin text-[#8F3EC9]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Saving draft...</span>
              </div>
            )}
            {autosaveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium select-none">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved{lastSavedTime ? ` · ${lastSavedTime}` : ''}</span>
              </div>
            )}
            {autosaveStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium select-none" title="Autosave error - will retry on next edit">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Save failed</span>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Preview Toggle */}
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isPreviewMode
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200'
              }`}
            >
              {isPreviewMode ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Mode</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </>
              )}
            </button>

            {/* Publish Article Button - Calls PATCH /api/posts/{id} and Opens Right-Side Drawer */}
            <button
              type="button"
              onClick={handleOpenPublishDrawer}
              disabled={isPublishing || isOpeningDrawer}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-[#8F3EC9] hover:bg-[#7B2EB3] active:bg-[#68249B] disabled:opacity-75 rounded-lg shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
            >
              {isOpeningDrawer ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Article</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 mb-3">
            <div className="flex items-center justify-between gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-red-400 hover:text-red-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Publish / Update Toast Alert */}
        {isPublishSuccess && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-zinc-800 flex items-center space-x-3 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold">{existingPostStatus === 'published' ? 'Blog Article Updated!' : 'Blog Article Published!'}</p>
              <p className="text-[11px] text-zinc-400">{existingPostStatus === 'published' ? 'Changes saved to database' : 'Article created and published via API'}</p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CANVAS MAIN BODY                                              */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 pb-24">
        {!isPreviewMode ? (
          /* ================= EDIT MODE ================= */
          <div className="space-y-4">
            {/* Crash Recovery Notification Banner */}
            {restoredFromBackup && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50/90 border border-purple-200/90 rounded-xl text-xs text-purple-900 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#8F3EC9] shrink-0" />
                  <span>
                    <strong>Restored draft from crash backup.</strong> Unsaved words were recovered from your local storage.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      saveToDatabase()
                      setRestoredFromBackup(false)
                    }}
                    className="font-bold text-[#8F3EC9] hover:text-[#7B2EB3] hover:underline cursor-pointer"
                  >
                    Save to Server Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try { localStorage.removeItem('energy_blog_crash_backup') } catch {}
                      setRestoredFromBackup(false)
                    }}
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Top Toolbar Row: Clean Borderless Inline Add Cover & Add Subtitle */}
            <div className="flex items-center gap-5 pt-2">
              {!coverImage && !showCoverInput && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCoverInput(true)
                    handleEditorInteraction()
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#8F3EC9] transition-colors cursor-pointer py-1 select-none group"
                >
                  <ImageIcon className="w-4 h-4 text-[#8F3EC9] group-hover:scale-110 transition-transform" />
                  <span>Add cover image</span>
                </button>
              )}

              {!showSubtitleInput && !subtitle && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSubtitleInput(true)
                    handleEditorInteraction()
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#8F3EC9] transition-colors cursor-pointer py-1 select-none group"
                >
                  <Type className="w-4 h-4 text-[#8F3EC9] group-hover:scale-110 transition-transform" />
                  <span>Add subtitle</span>
                </button>
              )}
            </div>

            {/* Cover Image Header Section */}
            <div className="relative group">
              {coverImage ? (
                <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-zinc-200 group">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={handleRemoveCoverImage}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors cursor-pointer"
                    title="Remove Cover Image from Server"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                showCoverInput && (
                  <div className="p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                      <span>Upload cover image to server</span>
                      <button
                        type="button"
                        onClick={() => setShowCoverInput(false)}
                        className="text-slate-600 hover:text-slate-900 cursor-pointer p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" strokeWidth={2.2} />
                      </button>
                    </div>

                    {uploadingCover ? (
                      <div className="flex items-center justify-center space-x-2 py-4 text-xs font-semibold text-[#8F3EC9]">
                        <svg className="w-5 h-5 animate-spin text-[#8F3EC9]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Uploading image to backend...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Title Input (Multiline Auto-expanding) */}
            <div className="pt-2">
              <textarea
                ref={titleTextareaRef}
                rows={1}
                value={title}
                onChange={handleTitleChange}
                placeholder="Title"
                className="w-full font-lora text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 placeholder:text-zinc-300 border-none outline-none focus:ring-0 p-0 m-0 bg-transparent resize-none overflow-hidden leading-tight block"
              />
            </div>

            {/* Subtitle Input */}
            {(showSubtitleInput || subtitle) && (
              <div className="relative flex items-start group/sub animate-fade-in my-2">
                <textarea
                  ref={subtitleTextareaRef}
                  rows={1}
                  autoFocus={showSubtitleInput && !subtitle}
                  value={subtitle}
                  onChange={(e) => {
                    hasUserInteractedRef.current = true
                    const val = e.target.value
                    setSubtitle(val)
                    if (!isSeoDescriptionEdited) {
                      setSeoDescription(val)
                    }
                    if (val.trim().length > 0 && !postId && !createdDraftIdRef.current) {
                      ensureDraftId({ seoDescription: val })
                    }
                  }}
                  placeholder="Write a subtitle or brief summary..."
                  className="w-full font-medium-sans italic text-lg sm:text-xl font-light text-zinc-600 placeholder:text-zinc-300 border-none outline-none focus:ring-0 p-0 m-0 bg-transparent pr-8 resize-none overflow-hidden leading-relaxed block"
                />
                <button
                  type="button"
                  onClick={() => {
                    hasUserInteractedRef.current = true
                    setSubtitle('')
                    setShowSubtitleInput(false)
                    if (!isSeoDescriptionEdited) {
                      setSeoDescription('')
                    }
                  }}
                  className="absolute right-0 top-1 text-slate-700 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Remove Subtitle"
                >
                  <X className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>
            )}

            {/* Default Divider Line under Subtitle / Header */}
            <div className="border-b border-zinc-200/80 my-4" />

            {/* Core Medium Tiptap Editor Component */}
            <div>
              <MediumEditor
                onJsonUpdate={(json) => {
                  setEditorJson(json)
                  if (errorMessage && errorMessage.toLowerCase().includes('blog content')) {
                    setErrorMessage('')
                  }
                  if (hasEditorActualContent(json)) {
                    hasUserInteractedRef.current = true
                    if (!postId && !createdDraftIdRef.current) {
                      ensureDraftId({ contentJson: json })
                    }
                  }
                }}
                onLineWrap={handleLineWrap}
                onEditorInteraction={handleEditorInteraction}
                initialContent={editorJson}
              />
            </div>
          </div>
        ) : (
          /* ================= READER PREVIEW MODE ================= */
          <article className="space-y-8 animate-in fade-in duration-300">
            {/* Title & Subtitle */}
            <header className="space-y-4">
              <h1 className="font-lora text-4xl md:text-5xl font-extrabold text-zinc-900 leading-tight">
                {title || 'Untitled Blog Post'}
              </h1>
              {subtitle && (
                <p className="font-medium-sans italic text-xl text-zinc-600 font-light leading-relaxed my-3.5">
                  {subtitle}
                </p>
              )}

              {/* Author Meta Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-b border-zinc-200 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#8F3EC9] text-white flex items-center justify-center font-bold text-sm">
                    EA
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-zinc-900">Energy Autonomy</h5>
                    <p className="text-xs text-zinc-500">
                      {existingPostStatus === 'published' ? 'Published' : 'Draft'} • {readingTime} min read
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-zinc-400">
                  <button className="hover:text-zinc-700 transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="hover:text-zinc-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* Cover Image in Reader View */}
            {coverImage && (
              <div className="w-full h-80 rounded-2xl overflow-hidden shadow-md">
                <img src={coverImage} alt="Article Cover" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Render Editor Output Preview */}
            <div className="prose prose-lg max-w-none font-medium-serif text-xl leading-relaxed text-zinc-800">
              <MediumEditor initialContent={editorJson} onJsonUpdate={null} />
            </div>

            {/* Article Tags Footer */}
            <div className="pt-8 border-t border-zinc-200 flex items-center space-x-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-purple-50 text-[#8F3EC9] border border-purple-100 text-xs rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        )}
      </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT-SIDE PUBLISH DRAWER / POPUP MODAL                       */}
      {/* ------------------------------------------------------------- */}
      {isPublishDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsPublishDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 animate-slide-in-right">
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {existingPostStatus === 'published' ? 'Review & Update Post' : 'Publish Article'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <span>All fields marked with</span>
                    <span className="text-rose-500 font-bold">*</span>
                    <span>are compulsory to publish</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublishDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="flex items-center justify-between gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMessage('')}
                      className="text-red-400 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* --- Section 1: Story Preview (Cover Image, Title, Subtitle) --- */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#8F3EC9]" />
                    Story Preview
                  </h4>

                  {/* Cover Image Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Cover Image <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {coverImage ? (
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">
                            Change Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveCoverImage}
                            className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                            title="Remove Cover Image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-5 border-2 border-dashed ${
                        errorMessage.toLowerCase().includes('cover image') ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/60'
                      } rounded-xl text-center hover:bg-purple-50/20 hover:border-purple-300 transition-all`}>
                        {uploadingCover ? (
                          <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[#8F3EC9]">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Uploading image to backend...</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer block py-1">
                            <ImageIcon className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                            <span className="text-xs font-semibold text-[#8F3EC9] hover:underline block">
                              Upload a cover image
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Recommended: 16:9 high resolution image
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Title <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="Article title..."
                      className={`w-full px-3.5 py-2.5 bg-white text-sm font-bold text-slate-900 rounded-xl border ${
                        !title.trim() && errorMessage.toLowerCase().includes('title') ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200'
                      } focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all`}
                    />
                  </div>

                  {/* Subtitle Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subtitle / Summary Excerpt <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={subtitle}
                      onChange={(e) => {
                        const val = e.target.value
                        setSubtitle(val)
                        if (!isSeoDescriptionEdited) {
                          setSeoDescription(val)
                        }
                        if (errorMessage) setErrorMessage('')
                      }}
                      placeholder="Write a brief subtitle or summary for readers..."
                      className={`w-full px-3.5 py-2 text-xs text-slate-700 rounded-xl border ${
                        !subtitle.trim() && errorMessage.toLowerCase().includes('subtitle') ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200'
                      } focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none resize-none leading-relaxed transition-all`}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* --- Section 2: Label Settings --- */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-[#8F3EC9]" />
                    Label Settings
                  </h4>

                  {/* Label Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Label Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={labelName}
                      onChange={(e) => {
                        setLabelName(e.target.value)
                        if (errorMessage) setErrorMessage('')
                      }}
                      placeholder="Enter label name (e.g. ENERGY & AWARENESS)..."
                      className={`w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-slate-800 rounded-xl border ${
                        !labelName.trim() && errorMessage.toLowerCase().includes('label')
                          ? 'border-rose-400 ring-1 ring-rose-300'
                          : 'border-slate-200'
                      } focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all`}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      The primary topic label displayed on the article card and page.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* --- Section 3: SEO Settings (SEO Title, SEO Description) --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#8F3EC9]" />
                      SEO Settings
                    </h4>
                    {(isSeoTitleEdited || isSeoDescriptionEdited) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSeoTitleEdited(false)
                          setIsSeoDescriptionEdited(false)
                          setSeoTitle(title)
                          setSeoDescription(subtitle)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#8F3EC9] cursor-pointer"
                        title="Reset SEO fields to match title and subtitle"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset SEO</span>
                      </button>
                    )}
                  </div>

                  {/* SEO Title Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        SEO Title <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className={`text-[10px] ${seoTitle.length > 60 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                        {seoTitle.length}/60 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => {
                        setSeoTitle(e.target.value)
                        setIsSeoTitleEdited(true)
                        if (errorMessage) setErrorMessage('')
                      }}
                      placeholder="Enter SEO meta title..."
                      className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Title tag displayed in search engine results and browser tabs.
                    </p>
                  </div>

                  {/* SEO Description Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        SEO Description <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className={`text-[10px] ${seoDescription.length > 160 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                        {seoDescription.length}/160 chars
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={seoDescription}
                      onChange={(e) => {
                        setSeoDescription(e.target.value)
                        setIsSeoDescriptionEdited(true)
                        if (errorMessage) setErrorMessage('')
                      }}
                      placeholder="Enter SEO meta description..."
                      className="w-full px-3.5 py-2 text-xs text-slate-700 rounded-xl border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none resize-none leading-relaxed transition-all"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Summary snippet displayed beneath your page title in Google search results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishDrawerOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Keep Editing
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#8F3EC9] hover:bg-[#7B2EB3] active:bg-[#68249B] disabled:opacity-75 rounded-xl shadow-md shadow-purple-500/15 hover:shadow-lg transition-all cursor-pointer"
                >
                  {isPublishing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Publishing to Live Blog...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{existingPostStatus === 'published' ? 'Update & Publish Article' : 'Post & Publish Article'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* TIER 3: UNSAVED EDITS NAVIGATION GUARD MODAL                  */}
      {/* ------------------------------------------------------------- */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Save Draft Before Leaving?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have an unfinished line or edits that haven't been saved to the server yet. Would you like to save this draft before leaving?
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false)
                  setPendingNavAction(null)
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer order-3 sm:order-1"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetDeleteId = postId || createdDraftIdRef.current
                  if (targetDeleteId) {
                    try {
                      await postsApi.delete(targetDeleteId)
                    } catch (err) {
                      console.error('Failed to delete discarded draft post:', err)
                    }
                  }
                  try {
                    localStorage.removeItem('energy_blog_crash_backup')
                  } catch {}
                  setShowLeaveModal(false)
                  if (pendingNavAction) {
                    const action = pendingNavAction
                    setPendingNavAction(null)
                    action()
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer order-2"
              >
                Discard & Leave
              </button>
              <button
                type="button"
                onClick={async () => {
                  await saveToDatabase()
                  try {
                    localStorage.removeItem('energy_blog_crash_backup')
                  } catch {}
                  setShowLeaveModal(false)
                  if (pendingNavAction) {
                    const action = pendingNavAction
                    setPendingNavAction(null)
                    action()
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-[#8F3EC9] hover:bg-[#7B2EB3] rounded-xl shadow-xs transition-colors cursor-pointer order-1 sm:order-3"
              >
                Save Draft & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogCreatePage
