import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/stores/toast-store'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate auth — in production this would call the API
    setTimeout(() => {
      login('mock-jwt-token', {
        id: '1',
        email,
        displayName: email.split('@')[0],
        role: 'PLATFORM_SUPER_ADMIN',
      })
      toast.success(t('common.loginSuccess', 'Welcome back!'))
      navigate('/dashboard')
    }, 800)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-accent text-xl font-bold text-bg-inverse">
            L
          </div>
          <h1 className="text-xl font-bold text-foreground">Liyaqa Platform</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('common.loginSubtitle', 'Sign in to your account')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
              {t('common.email', 'Email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@liyaqa.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-accent"
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-bg-inverse transition-colors hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-inverse border-t-transparent" />
            ) : (
              t('common.signIn', 'Sign In')
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
