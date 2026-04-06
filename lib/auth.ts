import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Dashboard Access',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.password === process.env.DASHBOARD_PASSWORD) {
          return { id: '1', name: 'Admin', email: 'admin@dashboard.local' }
        }
        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
}
