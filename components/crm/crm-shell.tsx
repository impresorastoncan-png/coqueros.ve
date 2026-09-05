'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Cierra el drawer al cambiar de ruta (por si el link no llamó onNavigate)
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloquea scroll del body cuando el drawer está abierto en móvil
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="flex min-h-screen bg-[#FAF7F0] font-sans">
      {/* Topbar solo en móvil */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-3 h-14 px-4 bg-white border-b border-[#E8DFCE]">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="w-9 h-9 flex items-center justify-center rounded-md text-[#2a1a0e] hover:bg-black/5 active:bg-black/10"
        >
          <span className="block w-5 h-0.5 bg-current relative before:content-[''] before:block before:absolute before:-top-1.5 before:w-5 before:h-0.5 before:bg-current after:content-[''] after:block after:absolute after:top-1.5 after:w-5 after:h-0.5 after:bg-current" />
        </button>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coquito.jpeg" alt="Coquito" className="w-7 h-7 rounded-full border border-[#FDC829]/60 object-contain bg-[#F5F5DC]" />
          <span className="font-bebas tracking-widest text-[#2a1a0e] text-base">COQUEROS</span>
        </div>
      </div>

      {/* Drawer backdrop (móvil) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: fijo en desktop, drawer en móvil */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200
          lg:static lg:transform-none lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
