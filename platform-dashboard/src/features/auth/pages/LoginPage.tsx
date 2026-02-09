import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/stores/toast-store'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sendCode, verifyCode, passwordlessEmail, isLoading, error, clearError } = useAuthStore()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await sendCode(email)
    } catch {
      // error is set in store
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await verifyCode(email, code)
      toast.success(t('common.loginSuccess', 'Welcome back!'))
      navigate('/dashboard')
    } catch {
      // error is set in store
    }
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
          <p className="mt-1 text-sm text-muted-foreground">
            {t('common.loginSubtitle', 'Sign in to your account')}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!passwordlessEmail ? (
          <form onSubmit={handleSendCode} className="space-y-4">
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
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-bg-inverse transition-colors hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-inverse border-t-transparent" />
              ) : (
                t('common.sendCode', 'Send Login Code')
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('common.codeSentTo', 'A login code was sent to')} <strong>{passwordlessEmail}</strong>
            </p>
            <div>
              <label htmlFor="code" className="mb-1 block text-sm font-medium text-foreground">
                {t('common.verificationCode', 'Verification Code')}
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-center text-lg font-mono tracking-widest text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-accent"
                autoComplete="one-time-code"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-bg-inverse transition-colors hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-inverse border-t-transparent" />
              ) : (
                t('common.verifyAndLogin', 'Verify & Sign In')
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
