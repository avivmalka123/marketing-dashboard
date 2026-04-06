import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import SessionProviderWrapper from '@/components/layout/SessionProviderWrapper'
import type { Session } from 'next-auth'

export const metadata: Metadata = {
  title: 'Marketing Dashboard | ניהול שיווק אורגני',
  description: 'דשבורד לניהול שיווק אורגני - מתחרים, תוכן, SEO',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="he" dir="rtl" className="dark">
      <body className="bg-bg text-text min-h-screen">
        <SessionProviderWrapper session={session}>
          <div className="flex min-h-screen">
            {session && <Sidebar />}
            <main className={`flex-1 flex flex-col min-h-screen ${session ? 'mr-64' : ''}`}>
              {session && <TopBar />}
              <div className={`flex-1 ${session ? 'p-6' : ''}`}>
                {children}
              </div>
            </main>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
