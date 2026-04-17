'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import BlogGenerator from '@/components/blog/BlogGenerator'
import {
  FileText, ExternalLink, Loader2, Eye, Copy, CheckCircle2,
  X, Trash2, Globe, Clock,
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'

// ── Kajabi URLs ────────────────────────────────────────────────────────────────
const KAJABI_NEW_POST   = 'https://app.kajabi.com/admin/sites/2147533064/blog_posts/new'
const KAJABI_BLOG_ADMIN = 'https://app.kajabi.com/admin/sites/2147533064/blog_posts'

function buildRtlHtml(content: string) {
  return `<div dir="rtl" style="direction:rtl;text-align:right;font-family:'Heebo',Arial,sans-serif;line-height:1.7;color:#1a1a1a">\n${content}\n</div>`
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface BlogPost {
  id: string
  title: string
  metaDescription: string | null
  slug: string | null
  status: string
  imageUrl: string | null
  kajabiPostId: string | null
  createdAt: string
  publishedAt: string | null
}

interface FullBlogPost extends BlogPost {
  content: string
}

// ── Slide-over panel ──────────────────────────────────────────────────────────
function BlogDetailPanel({
  postId,
  onClose,
  onDeleted,
}: {
  postId: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [post, setPost] = useState<FullBlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/blog/${postId}`)
      .then(r => r.json())
      .then(data => {
        setPost(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [postId])

  async function handleCopy() {
    if (!post) return
    try {
      await navigator.clipboard.writeText(buildRtlHtml(post.content))
      setCopied(true)
      window.open(KAJABI_NEW_POST, '_blank')
      setTimeout(() => setCopied(false), 6000)
    } catch {
      // fallback
    }
  }

  function handlePreview() {
    if (!post) return
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(
        `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${post.title}</title>` +
        `<style>body{font-family:sans-serif;max-width:800px;margin:auto;padding:2rem}</style>` +
        `</head><body>${post.content}</body></html>`
      )
      w.document.close()
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/blog/${postId}`, { method: 'DELETE' })
      onDeleted()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const isPublished = post?.status === 'published'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-2xl z-50 flex flex-col bg-[#0c0c14] border-r border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shrink-0">
              <FileText size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-text text-sm line-clamp-1">{post?.title ?? '...'}</h2>
              <p className="text-[10px] text-text2">
                {post ? timeAgo(post.createdAt) : ''}
                {post?.status && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isPublished ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    {isPublished ? 'פורסם' : 'טיוטה'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text2 hover:text-text transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : !post ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <FileText size={32} className="text-text2/30" />
              <p className="text-text2 text-sm">לא ניתן לטעון את המאמר</p>
            </div>
          ) : (
            <>
              {/* Meta info */}
              <div className="bg-bg2 rounded-xl p-4 space-y-2">
                {post.metaDescription && (
                  <p className="text-sm text-text2 leading-relaxed">{post.metaDescription}</p>
                )}
                <div className="flex flex-wrap gap-3 text-[11px] text-text2">
                  {post.slug && (
                    <span className="flex items-center gap-1">
                      <Globe size={10} className="text-accent" />
                      /{post.slug}
                    </span>
                  )}
                  {post.imageUrl && (
                    <span className="text-success">🖼️ יש תמונה</span>
                  )}
                  {post.kajabiPostId && (
                    <span className="text-accent2">Kajabi ✓</span>
                  )}
                  {post.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(post.publishedAt).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </div>
              </div>

              {/* Copy success banner */}
              {copied && (
                <div className="flex items-start gap-2 bg-success/10 border border-success/30 rounded-xl p-3">
                  <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                  <div className="text-xs text-success">
                    <p className="font-semibold">ה-HTML הועתק! Kajabi Admin נפתח.</p>
                    <p className="text-success/80 mt-0.5">הוסף כותרת → לחץ HTML → הדבק</p>
                  </div>
                </div>
              )}

              {/* Article content preview */}
              <div className="bg-bg2 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-3">תוכן המאמר</p>
                <div
                  className="text-xs text-text2 leading-relaxed space-y-2 max-h-[400px] overflow-y-auto prose-invert"
                  dir="rtl"
                  // We show the raw HTML rendered. This is the user's own content generated by Claude.
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {post && (
          <div className="px-5 py-4 border-t border-card-border space-y-3">
            <div className="flex gap-2">
              {!isPublished && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 flex-1 justify-center bg-gradient-to-r from-accent to-accent2 text-white font-bold py-2.5 rounded-xl hover:opacity-90 text-sm"
                >
                  {copied
                    ? <><CheckCircle2 size={14} />הועתק!</>
                    : <><Copy size={14} />העתק ל-Kajabi</>}
                </button>
              )}
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-card-border text-text2 hover:text-text text-sm transition-colors"
              >
                <Eye size={14} />
                <span>תצוגה</span>
              </button>
              <a
                href={KAJABI_BLOG_ADMIN}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-card-border text-text2 hover:text-text text-sm transition-colors"
              >
                <ExternalLink size={14} />
                <span>Kajabi</span>
              </a>
            </div>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-2 w-full justify-center py-2 rounded-xl text-xs transition-all ${
                confirmDelete
                  ? 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30'
                  : 'text-text2/50 hover:text-danger/70 hover:bg-danger/5'
              }`}
            >
              {deleting
                ? <><Loader2 size={12} className="animate-spin" />מוחק...</>
                : <><Trash2 size={12} />{confirmDelete ? 'לחץ שוב לאישור מחיקה' : 'מחק מאמר'}</>}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-success/20 text-success">
        פורסם
      </span>
    )
  }
  if (status === 'scheduled') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-accent/20 text-accent">
        מתוזמן
      </span>
    )
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-warning/20 text-warning">
      טיוטה
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function BlogPageContent() {
  const searchParams = useSearchParams()
  const initialTopic   = searchParams.get('topic')   ?? ''
  const initialVideoId = searchParams.get('videoId') ?? ''

  const [posts, setPosts]             = useState<BlogPost[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedId, setSelectedId]   = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/blog/list').then(r => r.json())
    setPosts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  function handleDeleted() {
    fetchPosts()
  }

  const publishedCount = posts.filter(p => p.status === 'published').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">בלוג SEO</h1>
        <p className="text-text2 text-sm mt-1">
          יצירה וניהול מאמרים •{' '}
          <span className="text-success">{publishedCount} פורסמו</span>
          {posts.length > publishedCount && (
            <> • <span className="text-warning">{posts.length - publishedCount} טיוטות</span></>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Generator */}
        <BlogGenerator
          onGenerated={fetchPosts}
          initialTopic={initialTopic}
          initialVideoId={initialVideoId}
        />

        {/* Posts history */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text text-sm">היסטוריית מאמרים</h3>
            {posts.length > 0 && (
              <span className="text-[11px] text-text2">{posts.length} מאמרים</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-accent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <FileText size={24} className="text-text2/30" />
              <p className="text-sm text-text2">אין מאמרים עדיין</p>
              <p className="text-xs text-text2/60">צור את המאמר הראשון עם הטופס</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-0.5">
              {posts.map(post => (
                <button
                  key={post.id}
                  onClick={() => setSelectedId(post.id)}
                  className="w-full text-right p-3 bg-bg2 rounded-xl border border-card-border hover:border-accent/40 hover:bg-accent/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-text line-clamp-1 flex-1 group-hover:text-accent transition-colors">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={post.status} />
                      {post.kajabiPostId && (
                        <span className="text-[10px] text-accent2">K</span>
                      )}
                    </div>
                  </div>

                  {post.metaDescription && (
                    <p className="text-xs text-text2 line-clamp-1 mb-2 text-right">{post.metaDescription}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text2">{timeAgo(post.createdAt)}</span>
                    <div className="flex items-center gap-2 text-[10px] text-text2">
                      {post.imageUrl && <span className="text-success">🖼️</span>}
                      <span className="text-accent/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        לחץ לפרטים ←
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-over detail panel */}
      {selectedId && (
        <BlogDetailPanel
          postId={selectedId}
          onClose={() => setSelectedId(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    }>
      <BlogPageContent />
    </Suspense>
  )
}
