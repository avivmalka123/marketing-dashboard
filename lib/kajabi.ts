const KAJABI_BASE = 'https://app.kajabi.com/api/v1'

interface KajabiPost {
  title: string
  body: string
  excerpt?: string
  slug?: string
  published?: boolean
}

export async function publishBlogPost(post: KajabiPost) {
  const apiKey = process.env.KAJABI_API_KEY

  if (!apiKey) throw new Error('KAJABI_API_KEY is not configured')

  const response = await fetch(`${KAJABI_BASE}/site/blog_posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      blog_post: {
        title: post.title,
        body: post.body,
        excerpt: post.excerpt,
        slug: post.slug,
        published: post.published ?? false,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Kajabi API error ${response.status}: ${error}`)
  }

  return response.json()
}
