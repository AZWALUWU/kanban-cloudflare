import { useState, useEffect } from 'react'
import type { User } from './types'
import { Auth } from './components/Auth'
import { KanbanBoard } from './components/KanbanBoard'
import { Landing } from './components/Landing'

export function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.user) {
          setUser(data.user)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors on logout
    }
    setUser(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Memeriksa sesi...</p>
      </div>
    )
  }

  if (!user) {
    return showAuth
      ? <Auth initialMode={authMode} onBack={() => setShowAuth(false)} onAuthSuccess={(u) => setUser(u)} onModeChange={setAuthMode} />
      : <Landing onOpenApp={() => { setAuthMode('register'); setShowAuth(true) }} />
  }

  return <KanbanBoard user={user} onLogout={handleLogout} />
}

export default App
