import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/content/KanbanBoard'

export const revalidate = 0

export default async function ContentPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let ideas: Awaited<ReturnType<typeof prisma.contentIdea.findMany>> = []
  try {
    ideas = await prisma.contentIdea.findMany({ orderBy: { createdAt: 'desc' } })
  } catch {
    // DB not yet connected — show empty board
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">רעיונות תוכן</h1>
        <p className="text-text2 text-sm mt-1">
          ניהול pipeline יצירתי • {ideas.length} רעיונות
        </p>
      </div>

      <KanbanBoard initialIdeas={ideas.map(i => ({
        ...i,
        status: i.status as 'Ideas' | 'In Progress' | 'Published',
      }))} />
    </div>
  )
}
