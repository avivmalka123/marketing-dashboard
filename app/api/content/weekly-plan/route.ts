import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { videoStore, reelStore } from '@/lib/localStore'
import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from '@/lib/getApiKey'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = await getApiKey('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY לא מוגדר' }, { status: 400 })
  }

  // Gather top viral content from last 14 days
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const topVideos = videoStore
    .findManyWithCompetitor({ take: 100, orderBy: 'viralityScore' })
    .filter(v => v.publishedAt >= twoWeeksAgo)
    .slice(0, 8)
    .map(v => ({
      title: v.title,
      views: v.viewCount,
      likes: v.likeCount,
      viralityScore: Math.round(v.viralityScore * 100) / 100,
      channel: v.competitor?.name ?? 'Unknown',
      url: `https://youtube.com/watch?v=${v.videoId}`,
    }))

  const topReels = reelStore
    .findManyWithCreator({ take: 100, orderBy: 'viralityScore' })
    .filter(r => r.publishedAt >= twoWeeksAgo)
    .slice(0, 8)
    .map(r => ({
      caption: (r.caption ?? '').slice(0, 120),
      likes: r.likeCount,
      comments: r.commentCount,
      viralityScore: Math.round(r.viralityScore * 100) / 100,
      creator: r.creator?.handle ?? 'Unknown',
    }))

  // Fall back to recent if last 14 days is empty
  const videoContext = topVideos.length > 0
    ? topVideos
    : videoStore.findManyWithCompetitor({ take: 5, orderBy: 'viralityScore' }).map(v => ({
        title: v.title,
        views: v.viewCount,
        likes: v.likeCount,
        viralityScore: Math.round(v.viralityScore * 100) / 100,
        channel: v.competitor?.name ?? 'Unknown',
        url: `https://youtube.com/watch?v=${v.videoId}`,
      }))

  const reelContext = topReels.length > 0
    ? topReels
    : reelStore.findManyWithCreator({ take: 5, orderBy: 'viralityScore' }).map(r => ({
        caption: (r.caption ?? '').slice(0, 120),
        likes: r.likeCount,
        comments: r.commentCount,
        viralityScore: Math.round(r.viralityScore * 100) / 100,
        creator: r.creator?.handle ?? 'Unknown',
      }))

  const hasData = videoContext.length > 0 || reelContext.length > 0

  const prompt = `אתה יועץ תוכן מקצועי לישראל. המשימה שלך: בנה תוכנית תוכן שבועית מלאה עבור יוצר תוכן ישראלי.

יעדים שבועיים: 1 סרטון YouTube + 2 Instagram Reels.

${hasData ? `נתוני תוכן ויראלי אחרון (מהמתחרים):

סרטוני YouTube ויראליים:
${JSON.stringify(videoContext, null, 2)}

Instagram Reels ויראליים:
${JSON.stringify(reelContext, null, 2)}

` : 'אין עדיין נתוני מתחרים — בנה תוכנית כללית מצוינת.'}

החזר JSON בדיוק בפורמט הזה (ללא markdown, JSON בלבד):
{
  "weeklyTopic": "הנושא המרכזי של השבוע — קצר ומדויק",
  "topicReason": "למה הנושא הזה ויראלי עכשיו — 1-2 משפטים",
  "youtube": {
    "title": "כותרת ה-YouTube — מושכת, SEO, עברית",
    "script": "סקריפט מוכן לטלפרומפטר — פסקה פותחת חזקה, 3 נקודות עיקריות, סיום עם CTA. כתוב כאילו אתה מדבר — לפחות 300 מילים",
    "thumbnailPrompt": "פרומפט באנגלית לYouTube thumbnail ב-Midjourney/DALL-E: תאר את הצבעים, הדמות, הטקסט על הגרפיקה",
    "description": "תיאור ה-YouTube: פסקה ראשית + bullet points + hashtags עבריים",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
  },
  "reel1": {
    "concept": "קונספט רייל 1 — קצר וקליט",
    "hook": "השורה הפותחת — 3 שניות ראשונות שמחייבות לצפות",
    "caption": "קפשן לאינסטגרם עם אמוג'י ו-hashtags",
    "script": "סקריפט קצר לרייל — 30-60 שניות, נקודות מפתח"
  },
  "reel2": {
    "concept": "קונספט רייל 2 — שונה מהראשון",
    "hook": "השורה הפותחת — 3 שניות ראשונות",
    "caption": "קפשן לאינסטגרם עם אמוג'י ו-hashtags",
    "script": "סקריפט קצר לרייל — 30-60 שניות, נקודות מפתח"
  },
  "postingSchedule": "המלצה על תזמון: מתי לפרסם כל תוכן השבוע",
  "quickTip": "טיפ מהיר אחד לשבוע הזה"
}`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as { type: string; text?: string }).text ?? ''

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'שגיאה בפענוח תשובת AI' }, { status: 500 })
    }

    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ plan, hasData })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
