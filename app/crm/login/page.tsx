'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.push('/crm/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1007] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coquito.jpeg"
            alt="Coquito"
            className="w-16 h-16 rounded-full border-2 border-[#FDC829]/60 object-contain bg-[#F5F5DC] mb-3"
          />
          <h1 className="font-bebas tracking-widest text-[#F5F5DC] text-3xl leading-none">COQUEROS</h1>
          <p className="text-[#6FB04A] text-xs font-semibold tracking-widest uppercase mt-1">CRM Interno</p>
        </div>

        {/* Card */}
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-8">
          <h2 className="text-[#F5F5DC] text-lg font-semibold mb-1">Iniciar sesión</h2>
          <p className="text-[#C0D1C6] text-sm mb-6">Acceso solo para el equipo Coqueros.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6FB04A] hover:bg-[#5d9a3d] disabled:opacity-60 text-white font-semibold text-sm tracking-wider uppercase py-2.5 rounded-md transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#6E3F22] text-xs mt-6">
          ¿Problemas para entrar? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
