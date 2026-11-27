import { useState, type FormEvent } from 'react'
import type { User } from '../types'

interface AuthProps {
  initialMode: 'login' | 'register'
  onBack: () => void
  onAuthSuccess: (user: User) => void
  onModeChange: (mode: 'login' | 'register') => void
}

export function Auth({ initialMode, onBack, onAuthSuccess, onModeChange }: AuthProps) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan saat memproses permintaan.')
        return
      }

      onAuthSuccess(data.user)
    } catch {
      setError('Koneksi ke server gagal. Periksa jaringan Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <button type="button" onClick={onBack} className="mb-5 min-h-11 text-sm font-medium text-blue-800 underline underline-offset-4">Kembali ke TaskFlow</button>
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isRegister ? 'Daftar Akun Baru' : 'Masuk ke TaskFlow'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isRegister
              ? 'Mulai kelola tugas harian dengan Kanban interaktif.'
              : 'Gunakan akun yang telah terdaftar untuk melihat papan tugas.'}
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-slate-700"
            >
              Alamat Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-medium text-slate-700"
            >
              Kata Sandi
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={isRegister ? 8 : 1}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'Minimal 8 karakter' : 'Kata sandi'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Memproses...' : isRegister ? 'Buat Akun' : 'Masuk'}
          </button>
        </form>

        <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          {isRegister ? (
            <p>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false)
                  onModeChange('login')
                  setError('')
                }}
                className="font-medium text-blue-600 hover:underline min-h-[44px] px-1 inline-flex items-center"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true)
                  onModeChange('register')
                  setError('')
                }}
                className="font-medium text-blue-600 hover:underline min-h-[44px] px-1 inline-flex items-center"
              >
                Daftar sekarang
              </button>
            </p>
          )}
        </footer>
      </div>
    </div>
  )
}
