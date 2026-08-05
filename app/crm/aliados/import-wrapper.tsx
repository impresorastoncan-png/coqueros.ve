'use client'

import { ImportButton } from '@/components/crm/excel-buttons'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ImportWrapper({ stages }: { stages: { id: string; nombre: string }[] }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleImport(rows: object[]) {
    const { error } = await supabase.from('aliados').insert(rows)
    if (error) { alert('Error al importar: ' + error.message); return }
    router.refresh()
  }

  return <ImportButton stages={stages} onImport={handleImport} />
}
