'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/crm/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/crm/aliados',   label: 'Aliados',   icon: '🤝' },
  { href: '/crm/pipeline',  label: 'Pipeline',  icon: '📋' },
  { href: '/crm/ruta',      label: 'Ruta',      icon: '🗺️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/crm/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#2a1a0e] border-r border-[#6E3F22]/40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#6E3F22]/40">
        <img src="/coquito.jpeg" alt="Coquito" className="w-9 h-9 rounded-full border-2 border-[#FDC829]/60 object-contain bg-[#F5F5DC]" />
        <div>
          <div className="font-bebas tracking-widest text-[#F5F5DC] text-lg leading-none">COQUEROS</div>
          <div className="text-[10px] text-[#6FB04A] font-semibold tracking-wider uppercase">CRM Interno</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#6FB04A]/20 text-[#6FB04A] border border-[#6FB04A]/30'
                  : 'text-[#C0D1C6] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#6E3F22]/40">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-[#C0D1C6] hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-base">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
