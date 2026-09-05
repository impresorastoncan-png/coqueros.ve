'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/crm/dashboard',  label: 'Dashboard',  icon: '📊' },
  { href: '/crm/aliados',    label: 'Aliados',    icon: '🤝' },
  { href: '/crm/pipeline',   label: 'Pipeline',   icon: '📋' },
  { href: '/crm/ruta',       label: 'Ruta',       icon: '🗺️' },
  { href: '/crm/motorizado', label: 'Motorizado', icon: '🏍️' },
  { href: '/crm/presencia',  label: 'Presencia',  icon: '🌎' },
  { href: '/crm/ventas',     label: 'Ventas',     icon: '💵' },
  { href: '/crm/caja',       label: 'Caja',       icon: '💰' },
  { href: '/crm/inventario', label: 'Inventario', icon: '📦' },
  { href: '/crm/objetivos',  label: 'Objetivos',  icon: '🎯' },
  { href: '/crm/productos',  label: 'Productos',  icon: '🥥' },
  { href: '/crm/publicidad', label: 'Publicidad', icon: '📣' },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    onNavigate?.()
    router.push('/crm/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-[#E8DFCE]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E8DFCE]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/coquito.jpeg" alt="Coquito" className="w-9 h-9 rounded-full border-2 border-[#FDC829]/70 object-contain bg-[#F5F5DC]" />
        <div>
          <div className="font-bebas tracking-widest text-[#2a1a0e] text-lg leading-none">COQUEROS</div>
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
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#6FB04A]/12 text-[#4a7830] border border-[#6FB04A]/30'
                  : 'text-[#6E3F22] hover:bg-black/5 hover:text-[#2a1a0e]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#E8DFCE]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-[#6E3F22] hover:bg-black/5 hover:text-[#2a1a0e] transition-colors"
        >
          <span className="text-base">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
