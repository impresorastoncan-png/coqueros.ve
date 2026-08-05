import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Coqueros — Bebidas de Coco',
  description: 'Coqueros — Bebidas premium de coco, Caracas, Venezuela. Distribución mayorista y alianzas comerciales B2B.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body>{children}</body>
    </html>
  )
}
