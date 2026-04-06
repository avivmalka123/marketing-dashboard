'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import BlogGenerator from '@/components/blog/BlogGenerator'
import { FileText, ExternalLink, Loader2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

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

function BlogPageContent() {
  const searchParams = useSearchParams()
  const initialTopic = searchParams.get('topic') ?? ''
  const initialVideoId = searchParams.get('videoId') ?? ''

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    setLoading(true)
    const data = await fetch('/api/blog/list').then(r => r.json())
    setPosts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">בלוג SEO</h1>
        <p className="text-text2 text-sm mt-1">
          יצירה וניהול מאמרים • {posts.filter(p => p.status === 'published').length} פורסמו
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Generator */}
        <BlogGenerator
          onGenerated={fetchPosts}
          initialTopic={initialTopic}
          initialVideoId={initialVideoId}
        />

        {/* Posts list */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-text text-sm mb-4">היסטוריית מאמרים</h3>

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
            <div className="space-y-3">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="p-3 bg-bg2 rounded-xl border border-card-border hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-text line-clamp-1 flex-1">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          post.status === 'published'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {post.status === 'published' ? 'פורסם' : 'טיוטה'}
                      </span>
                      {post.kajabiPostId && (
                        <span className="text-[10px] text-accent2">Kajabi ✓</span>
                      )}
                    </div>
                  </div>
                  {post.metaDescription && (
                    <p className="text-xs text-text2 line-clamp-1 mb-2">{post.metaDescription}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text2">{timeAgo(post.createdAt)}</span>
                    {post.imageUrl && (
                      <span className="text-[10px] text-success">🖼️ יש תמונה</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-accent" /></div>}>
      <BlogPageContent />
    </Suspense>
  )
}
