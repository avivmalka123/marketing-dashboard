import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from './getApiKey'

async function getClient() {
  const apiKey = await getApiKey('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('Anthropic API Key לא מוגדר. עבור להגדרות.')
  return new Anthropic({ apiKey })
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
  const client = await getClient()
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
  const client = await getClient()
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

// ── Existing blog posts from avivmalka.com for internal linking ───────────────
const EXISTING_BLOG_POSTS = [
  { title: 'איך לשלב שיווק איקומרס, קידום אתרים וקידום אורגני', url: '/blog/7' },
  { title: 'דרכים לעשות כסף באינטרנט', url: '/blog/6' },
  { title: 'איך למצוא מוצרים רווחיים לדרופשיפינג', url: '/blog/5' },
  { title: 'איך להפוך למפלצת באיקומרס בעזרת טיקטוק', url: '/blog/טיקטוק' },
  { title: 'איך לחקור שוק איקומרס', url: '/blog/לחקור שוק איקומרס' },
  { title: 'האמת מאחורי איקומרס ודרופשיפינג', url: '/blog/4' },
  { title: 'סקירת 4 הפלטפורמות לבניית קורסים דיגיטליים', url: '/blog/קורסים-אונליין' },
  { title: 'המדריך המלא: דרופשיפינג באמזון', url: '/blog/דרופשיפינג-באמזון' },
  { title: 'איך עושים דרופשיפינג באיביי', url: '/blog/דרופשיפינג-באיביי' },
  { title: 'כמה עולה להקים חנות דרופשיפינג', url: '/blog/עלות-חנות-דרופשיפינג' },
  { title: 'דרופשיפינג או שיווק שותפים', url: '/blog/דרופשיפינג-vs-שיווק-שותפים' },
  { title: 'האמת על דרופשיפינג', url: '/blog/דרופשיפינג-האמת' },
]

export async function generateSEOBlogPost(
  topic: string,
  videoContext?: string,
  existingArticles?: Array<{ title: string; slug: string }>
) {
  const client = await getClient()

  // ── Combine static + dynamic articles, shuffle for diversity ─────────────
  const dynamicPosts = (existingArticles ?? []).map(a => ({
    title: a.title,
    url: `/blog/${a.slug}`,
  }))
  // Shuffle and limit to avoid always linking the same articles
  const shuffled = [...EXISTING_BLOG_POSTS, ...dynamicPosts]
    .sort(() => Math.random() - 0.5)
    .slice(0, 20)

  // ── Step 1: metadata JSON (small, no HTML — avoids JSON parse errors) ──────
  const metaMsg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 768,
    messages: [{
      role: 'user',
      content: `Return ONLY valid JSON (no markdown, no code block, no explanation) for a Hebrew SEO blog post about: "${topic}"

מאגר מאמרים קיים לקישורים פנימיים (avivmalka.com):
${shuffled.map(p => `- "${p.title}" → ${p.url}`).join('\n')}

{
  "title": "כותרת H1 SEO-friendly בעברית עם מילת מפתח ראשית",
  "metaDescription": "תיאור מטא 150-160 תווים בעברית מושך עם קריאה לפעולה",
  "slug": "english-url-slug-with-dashes",
  "keywords": ["מילה ראשית", "ביטוי שאלתי", "long-tail keyword", "מילת מפתח 4", "מילת מפתח 5"],
  "relatedPosts": [
    {"title": "שם מאמר קיים", "url": "/blog/...", "anchor": "טקסט לינק טבעי בעברית"}
  ]
}

חובה: בחר 2-4 מאמרים שונים ורלוונטיים מהמאגר — הגוון ואל תחזור על אותם מאמרים בכל פעם.`,
    }],
  })

  const metaText = (metaMsg.content[0] as { text: string }).text
  const meta = parseJSON(metaText)

  const relatedPosts = (meta.relatedPosts ?? []) as Array<{ title: string; url: string; anchor: string }>
  const internalLinksContext = relatedPosts.length > 0
    ? `\n\nקישורים פנימיים לשלב טבעית בגוף המאמר (לא ברשימה בסוף):\n${relatedPosts.map(p => `- טקסט עוגן "${p.anchor}" → https://www.avivmalka.com${p.url}`).join('\n')}`
    : ''

  // ── Step 2: full HTML content (plain text, no JSON — zero parse issues) ────
  const contentMsg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 10000,
    messages: [{
      role: 'user',
      content: `אתה בלוגר ישראלי מנוסה שכותב תוכן SEO מקצועי בגובה העיניים, בסגנון ישיר ואנושי לחלוטין.

נושא: "${topic}"
כותרת H1 שנבחרה: "${meta.title}"
מילות מפתח: ${(meta.keywords ?? []).join(', ')}
${videoContext ? `הקשר מסרטון מתחרה: ${videoContext}` : ''}
${internalLinksContext}

כללי כתיבה חובה:
- כתוב כמו בן אדם אמיתי, לא כמו בינה מלאכותית — שפה יומיומית, ישירה, חמה
- אין להשתמש בסמן "—" (em dash) בשום מקום. במקום זה: פסיק, נקודה, או שנה את המשפט
- אין ביטויים כמו "בואו נצלול", "ללא ספק", "חשוב לציין", "כפי שנראה" — אלו סימני AI
- הימנע ממשפטים ארוכים ועמוסים — כתוב קצר וברור
- כלול דוגמאות ואנקדוטות ישראליות אמיתיות (חברות, אנשים, מצבים)

דרישות SEO:
- אורך: 2500-3500 מילים (מאמר מקיף)
- מבנה: <h1>, <h2> לכל פרק, <h3> לתת-נושאים
- הקדמה עם hook מושך, לפחות 6 פרקים, טיפים מעשיים, סיכום + CTA
- מילות מפתח ב-H1, ב-150 המילים הראשונות, ובסיכום
- שלב קישורים פנימיים בטבעיות (רק אם סופקו)
- בסוף: <section class="faq"> עם 4-5 שאלות FAQ
- class="lead" לפסקת הפתיחה
- <ul>/<li> לרשימות, <strong> לנקודות חשובות

החזר ONLY HTML גולמי — החל מ-<h1> ועד סוף ה-</section> או </div> האחרון.
אין JSON, אין markdown, אין הסבר, אין \`\`\` — רק HTML טהור בלבד.`,
    }],
  })

  const content = (contentMsg.content[0] as { text: string }).text.trim()

  return {
    title: meta.title as string,
    metaDescription: meta.metaDescription as string,
    slug: meta.slug as string,
    keywords: (meta.keywords ?? []) as string[],
    internalLinkSuggestions: relatedPosts.map((p: { title: string }) => p.title),
    content,
  }
}

export async function generateContentIdeas(
  competitorVideos: Array<{ title: string; viralityScore: number }>,
  count = 6
) {
  const client = await getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `אתה מומחה שיווק תוכן לשוק הישראלי. חובה — כל הפלט חייב להיות בעברית בלבד.

הסרטונים הוויראליים הבאים של מתחרים:
${competitorVideos.slice(0, 10).map(v => `- ${v.title} (ויראליות: ${v.viralityScore.toFixed(1)})`).join('\n')}

צור ${count} רעיונות תוכן מקוריים בעברית. החזר JSON בדיוק (חשוב: ללא טקסט נוסף):
{
  "ideas": [
    {
      "title": "כותרת הרעיון בעברית",
      "format": "video",
      "targetAudience": "קהל יעד קצר",
      "keywords": ["מילה1", "מילה2", "מילה3"],
      "seoScore": 75,
      "hook": "פתיח מושך — משפט אחד",
      "keyPoints": ["נקודה 1", "נקודה 2", "נקודה 3", "נקודה 4"],
      "recommendedLength": "8-12 דקות",
      "hashtags": ["#האשטג1", "#האשטג2"],
      "scriptOutline": "פתיח, חלק 1, חלק 2, סיכום + CTA",
      "rationale": "למה זה יצליח — משפט קצר"
    }
  ]
}

פורמטים: "video", "reel", "article". הכל חייב להיות בעברית!`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}

export async function generateSimilarIdeas(
  likedIdeas: Array<{ title: string; format: string; keywords: string[] }>,
  count = 6
) {
  const client = await getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `אתה מומחה שיווק תוכן לשוק הישראלי. המשתמש אהב את הרעיונות הבאים — למד מהם ויצור רעיונות דומים.

רעיונות שהמשתמש אהב:
${likedIdeas.map(i => `- "${i.title}" (${i.format}) — מילות מפתח: ${i.keywords.join(', ')}`).join('\n')}

צור ${count} רעיונות חדשים ומקוריים בסגנון דומה לרעיונות האהובים. חובה — הכל בעברית!
החזר JSON בדיוק:
{
  "ideas": [
    {
      "title": "כותרת בעברית — בסגנון הרעיונות האהובים",
      "format": "video",
      "targetAudience": "קהל יעד בעברית",
      "keywords": ["מילות מפתח בעברית"],
      "seoScore": 80,
      "hook": "פתיח מושך בעברית",
      "keyPoints": ["נקודה 1", "נקודה 2", "נקודה 3", "נקודה 4"],
      "recommendedLength": "8-12 דקות",
      "hashtags": ["#האשטג"],
      "scriptOutline": "מבנה הסקריפט בעברית",
      "rationale": "למה זה דומה לרעיונות שאהבת ויצליח"
    }
  ]
}`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}

export async function generateRelatedChannels(
  competitors: Array<{ name: string; channelId: string }>,
  count = 12
) {
  const client = await getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `אתה מומחה YouTube ושיווק תוכן ישראלי. המשתמש עוקב אחרי הערוצים הבאים:
${competitors.map(c => `- ${c.name}`).join('\n')}

המלץ על ${count} ערוצי YouTube קשורים שהמשתמש כנראה לא עוקב עדיין — שיכולים לשמש מקור השראה נוסף.
התמקד בערוצים הנושאים: ecommerce, dropshipping, שיווק דיגיטלי, יזמות, צמיחה ביוטיוב, עסקים אונליין.
כלול גם ערוצים עבריים (עדיפות) וגם ערוצים אנגלים גדולים ורלוונטיים.

החזר JSON בדיוק:
{
  "channels": [
    {
      "name": "שם הערוץ",
      "handle": "@handle",
      "description": "תיאור קצר בעברית — למה הערוץ רלוונטי ומה אפשר ללמוד ממנו",
      "language": "Hebrew",
      "niche": "ecommerce"
    }
  ]
}

שדה language: "Hebrew" או "English"
שדה niche: בחר מ: "ecommerce", "dropshipping", "marketing", "entrepreneurship", "youtube", "general"
חובה: החזר בדיוק ${count} ערוצים.`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text)
}

export async function generateCampaign(video: {
  title: string
  description?: string | null
  tags: string[]
  transcript?: string | null
}) {
  const client = await getClient()

  const hasTranscript = !!video.transcript && video.transcript.trim().length > 100
  const transcriptSnippet = hasTranscript
    ? video.transcript!.slice(0, 4000)
    : null

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `אתה מומחה שיווק תוכן ישראלי ו-YouTube SEO. עזור לי ליצור קמפיין תוכן מהסרטון הזה.

כותרת הסרטון: ${video.title}
תיאור: ${(video.description ?? '').slice(0, 400)}
תגיות מקוריות: ${video.tags.slice(0, 15).join(', ')}
${transcriptSnippet ? `\nתמלול (קטע ראשון):\n${transcriptSnippet}` : ''}

צור קמפיין שיווקי מלא. החזר JSON בדיוק (ללא טקסט נוסף):
{
  "tags": ["תגית 1", "תגית 2", "..."],
  "viralTitle": "כותרת ויראלית מאוד בעברית — מושכת קליקים",
  "description": "תיאור ליוטיוב מלא בעברית — 3-5 פסקאות, כולל מילות מפתח, hashtags בסוף",
  "tools": ["כלי/מוצר 1 שמוצג בסרטון", "כלי/מוצר 2", "..."]
}

הנחיות:
- tags: 20-25 תגיות עברית/אנגלית רלוונטיות לשוק הישראלי
- viralTitle: כותרת שתגרום לאנשים לרצות ללחוץ — שאלה פרובוקטיבית, מספרים, "כך", "סוד"
- description: תיאור מקצועי הכולל hook פותח, סיכום תוכן, ערך למצפה, timestamps (אם רלוונטי), links placeholder, hashtags
- tools: ${hasTranscript ? 'זהה כלים/מוצרים/פלטפורמות שמוזכרים בתמלול' : 'נחש כלים/מוצרים שסביר שמוצגים בהתבסס על כותרת ותיאור'} — רק אם יש כלים ממשיים`,
    }],
  })

  const text = (message.content[0] as { text: string }).text
  return parseJSON(text) as {
    tags: string[]
    viralTitle: string
    description: string
    tools: string[]
  }
}

export async function generateInstagramInsights(stats: {
  followers: number
  avgLikes: number
  avgComments: number
  topPosts: Array<{ caption: string; likes: number }>
}) {
  const client = await getClient()
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

export async function generateNextVideoIdeas(input: {
  videos: Array<{ title: string; viewCount: number; viralityScore: number; competitor: string }>
  count?: number
}) {
  const client = await getClient()
  const { videos, count = 5 } = input

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `יוצר תוכן ישראלי בנושאי ecommerce, דרופשיפינג, שיווק דיגיטלי ועסקים אונליין.

סרטונים ויראליים של מתחרים:
${videos.slice(0, 10).map(v => `- "${v.title}" (${v.competitor}, ${v.viewCount.toLocaleString()} צפיות)`).join('\n')}

המלץ ${count} רעיונות לסרטון הבא. החזר JSON בלבד:
{"ideas":[{"title":"כותרת הסרטון בעברית","hook":"פתיח — 1-2 משפטים","whyNow":"למה עכשיו","keyPoints":["נקודה 1","נקודה 2","נקודה 3","נקודה 4"],"scriptStructure":"פתיח → חלק 1 → חלק 2 → CTA","thumbnailConcept":"תיאור ממוזערת","estimatedViews":"פוטנציאל צפיות"}]}`,
    }],
  })

  const responseText = (message.content[0] as { text: string }).text
  return parseJSON(responseText) as {
    ideas: Array<{
      title: string
      hook: string
      targetAudience: string
      whyNow: string
      keyPoints: string[]
      scriptStructure: string
      thumbnailConcept: string
      estimatedViews: string
    }>
  }
}
