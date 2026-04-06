'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('סיסמה שגויה')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_8px_32px_rgba(124,58,237,0.4)]">
            📊
          </div>
          <h1 className="text-2xl font-extrabold text-text">Marketing Dashboard</h1>
          <p className="text-text2 text-sm mt-1">ניהול שיווק אורגני</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text2 mb-2">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="הזן סיסמה"
              className="w-full bg-bg2 border border-card-border rounded-xl px-4 py-3 text-text placeholder-text2 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent2 text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
