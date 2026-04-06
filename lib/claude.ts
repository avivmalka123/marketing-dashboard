import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function parseJSON(text: string) {
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

export async function analyzeVideoForIsraeliAudience(video: {
  videoId: string
  title: string
  description?: string | null
  tags: string[]
  viewCount: number
  viralityScore: number
}) {
  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `אתה מומחה שיווק תוכן דיגיטלי לשוק הישראלי.

נתח את הסרטון הבא מיוטיוב:
כותרת: ${video.title}
תיאור: ${(video.description ?? '').slice(0, 500)}
תגיות: ${video.tags.join(', ')}
צפיות: ${video.viewCount.toLocaleString('he-IL')}
ציון ויראליות: ${video.viralityScore.toFixed(2)}

החזר JSON בדיוק בפורמט הזה, ללא טקסט נוסף:
{
  "hebrewTitles": ["כותרת עברית 1", "כותרת עברית 2", "כותרת עברית 3"],
  "whyGoodSuggestion": "הסבר בעברית למה זה רעיון תוכן מעולה לקהל הישראלי",
  "contentBrief": "בריף תוכן מפורט בעברית - מה לכסות, איך לפתוח, נקודות מפתח",
  "searchTrendAnalysis": "ניתוח מגמות חיפוש רלוונטיות לשוק הישראלי והסבר למה הנושא חם"
}`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}

export async function generateDailySuggestion(video: {
  title: string
  description?: string | null
  tags: string[]
  viewCount: number
  viralityScore: number
  competitorName: string
}) {
  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `אתה מנהל שיווק תוכן ישראלי מנוסה. הסרטון הבא הוא ההצעה היומית שלנו:

סרטון: "${video.title}"
ערוץ מתחרה: ${video.competitorName}
צפיות: ${video.viewCount.toLocaleString('he-IL')}
ויראליות: ${video.viralityScore.toFixed(2)}
תגיות: ${video.tags.slice(0, 8).join(', ')}

צור ניתוח מפורט. החזר JSON בדיוק:
{
  "hebrewTitles": ["כותרת 1 מותאמת לישראלים", "כותרת 2", "כותרת 3"],
  "reason": "למה זה ההצעה היומית - 2-3 משפטים בעברית",
  "contentBrief": "בריף מלא לתוכן בעברית - 5-8 נקודות עיקריות לסרטון/מאמר",
  "trendAnalysis": "ניתוח מגמות חיפוש ישראליות - מדוע הנושא פופולרי עכשיו"
}`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}

export async function generateSEOBlogPost(topic: string, videoContext?: string) {
  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `אתה מומחה SEO ויצירת תוכן בעברית. כתוב מאמר בלוג SEO מקצועי ומלא בעברית.

נושא: "${topic}"
${videoContext ? `הקשר נוסף: ${videoContext}` : ''}

דרישות:
- אורך: 1500-2500 מילים
- מבנה: H1, H2, H3 ברורים
- כלול: מבוא, תוכן מפורט, סיכום, call-to-action
- SEO: שלב מילות מפתח באופן טבעי
- ערך: תן ערך אמיתי ומעשי לקורא הישראלי

החזר JSON בדיוק:
{
  "title": "כותרת H1 מושכת ו-SEO friendly",
  "metaDescription": "תיאור מטא 150-160 תווים מדויק",
  "slug": "url-friendly-slug-in-english-with-dashes",
  "content": "<h1>כותרת</h1><p>תוכן HTML מלא...</p>",
  "keywords": ["מילת מפתח 1", "מילת מפתח 2", "מילת מפתח 3"],
  "internalLinkSuggestions": ["נושא לקישור פנימי 1", "נושא 2"]
}`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}

export async function generateContentIdeas(
  competitorVideos: Array<{ title: string; viralityScore: number }>,
  count = 8
) {
  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `אתה מומחה שיווק תוכן לשוק הישראלי.

הסרטונים הוויראליים הבאים של מתחרים:
${competitorVideos.slice(0, 10).map(v => `- ${v.title} (ויראליות: ${v.viralityScore.toFixed(1)})`).join('\n')}

צור ${count} רעיונות תוכן מקוריים לקהל ישראלי. החזר JSON בדיוק:
{
  "ideas": [
    {
      "title": "כותרת הרעיון בעברית",
      "format": "video",
      "targetAudience": "תיאור קהל יעד",
      "keywords": ["מילת מפתח"],
      "seoScore": 75,
      "rationale": "למה הרעיון הזה יצליח בשוק הישראלי"
    }
  ]
}

פורמטים אפשריים: "video", "reel", "article"`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}

export async function generateInstagramInsights(stats: {
  followers: number
  avgLikes: number
  avgComments: number
  topPosts: Array<{ caption: string; likes: number }>
}) {
  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `נתח את הביצועים של חשבון האינסטגרם הישראלי הזה:

עוקבים: ${stats.followers.toLocaleString('he-IL')}
ממוצע לייקים לפוסט: ${stats.avgLikes}
ממוצע תגובות: ${stats.avgComments}
פוסטים מובילים:
${stats.topPosts.map(p => `- "${p.caption?.slice(0, 60)}" (${p.likes} לייקים)`).join('\n')}

החזר JSON:
{
  "bestPostingTimes": ["יום ושעה", "יום ושעה", "יום ושעה"],
  "contentRecommendations": ["המלצה 1", "המלצה 2", "המלצה 3"],
  "growthTips": ["טיפ 1 לצמיחה", "טיפ 2", "טיפ 3"],
  "engagementRate": 2.5,
  "summary": "סיכום ביצועים קצר בעברית"
}`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}
