import { useState, useEffect } from 'react'
import type { User } from './types'
import { Auth } from './components/Auth'
import { KanbanBoard } from './components/KanbanBoard'

export function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.user) {
          setUser(data.user)
        }
      } catch {
        // Unauthenticated or offline
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
    return <Auth onAuthSuccess={(u) => setUser(u)} />
  }

  return <KanbanBoard user={user} onLogout={handleLogout} />
}

export default App
