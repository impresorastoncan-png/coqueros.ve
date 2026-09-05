'use client'

export const dynamic = 'force-dynamic'

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
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coquito.jpeg"
            alt="Coquito"
            className="w-16 h-16 rounded-full border-2 border-[#FDC829]/70 object-contain bg-[#F5F5DC] mb-3 shadow-sm"
          />
          <h1 className="font-bebas tracking-widest text-[#2a1a0e] text-3xl leading-none">COQUEROS</h1>
          <p className="text-[#6FB04A] text-xs font-semibold tracking-widest uppercase mt-1">CRM Interno</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E8DFCE] rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-[#2a1a0e] text-lg font-semibold mb-1">Iniciar sesión</h2>
          <p className="text-[#6E3F22] text-sm mb-6">Acceso solo para el equipo Coqueros.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E3F22] uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                inputMode="email"
                className="w-full bg-[#FAF7F0] border border-[#E8DFCE] rounded-md px-3 py-3 text-[#2a1a0e] text-base placeholder-[#a8815a] focus:outline-none focus:border-[#6FB04A] focus:bg-white focus:ring-2 focus:ring-[#6FB04A]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E3F22] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#FAF7F0] border border-[#E8DFCE] rounded-md px-3 py-3 text-[#2a1a0e] text-base placeholder-[#a8815a] focus:outline-none focus:border-[#6FB04A] focus:bg-white focus:ring-2 focus:ring-[#6FB04A]/20 transition"
              />
            </div>

            {error && (
              <p className="text-[#b91c1c] text-sm bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6FB04A] hover:bg-[#5d9a3d] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wider uppercase py-3 rounded-md transition-colors shadow-sm"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#a8815a] text-xs mt-6">
          ¿Problemas para entrar? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
