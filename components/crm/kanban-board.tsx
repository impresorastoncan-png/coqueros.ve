'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { moverStage } from '@/lib/actions/aliados'
import { StageBadge, TipoBadge } from './badge'
import Link from 'next/link'
import type { Aliado, PipelineStage } from '@/lib/types'

export default function KanbanBoard({ initialAliados, stages }: { initialAliados: Aliado[]; stages: PipelineStage[] }) {
  const [aliados, setAliados] = useState(initialAliados)

  function getByStage(stageId: string) {
    return aliados.filter(a => a.pipeline_stage_id === stageId)
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStageId = destination.droppableId

    setAliados(prev => prev.map(a => a.id === draggableId ? { ...a, pipeline_stage_id: newStageId } : a))
    await moverStage(draggableId, newStageId)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
        {stages.map(stage => {
          const cards = getByStage(stage.id)
          return (
            <div key={stage.id} className="shrink-0 w-64">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color ?? '#6FB04A' }} />
                  <span className="text-xs font-bold text-[#C0D1C6] uppercase tracking-wider">{stage.nombre}</span>
                </div>
                <span className="text-xs text-[#6E3F22] font-semibold">{cards.length}</span>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-32 rounded-lg p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-[#6FB04A]/10 border border-[#6FB04A]/30' : 'bg-[#2a1a0e]/60 border border-[#6E3F22]/20'}`}
                  >
                    {cards.map((aliado, index) => (
                      <Draggable key={aliado.id} draggableId={aliado.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-[#2a1a0e] border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? 'shadow-lg shadow-black/40 border-[#6FB04A]/40 rotate-1' : 'border-[#6E3F22]/40 hover:border-[#6E3F22]/60'}`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <Link href={`/crm/aliados/${aliado.id}`} className="text-sm font-semibold text-[#F5F5DC] hover:text-[#6FB04A] transition-colors line-clamp-2 leading-tight" onClick={e => e.stopPropagation()}>
                                {aliado.nombre}
                              </Link>
                              {aliado.tiene_nevera && <span className="text-base shrink-0" title="Nevera colocada">❄️</span>}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <TipoBadge tipo={aliado.tipo} />
                              {aliado.zona && (
                                <span className="text-[10px] text-[#6E3F22] bg-[#6E3F22]/10 border border-[#6E3F22]/20 px-1.5 py-0.5 rounded">
                                  {aliado.zona}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
