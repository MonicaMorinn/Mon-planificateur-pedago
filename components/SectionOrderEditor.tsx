// mon-agenda-pedago/components/SectionOrderEditor.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

type SectionKey = 'notes' | 'calendar' | 'surveillances'

interface Props {
  value: SectionKey[]
  onChange: (v: SectionKey[]) => void
}

export default function SectionOrderEditor({ value, onChange }: Props) {
  const [items, setItems] = useState<SectionKey[]>(value)
  useEffect(() => setItems(value), [value])

  function onDragStart(e: React.DragEvent<HTMLDivElement>, idx: number) {
    e.dataTransfer.setData('text/plain', String(idx))
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>, idx: number) {
    e.preventDefault()
    const src = Number(e.dataTransfer.getData('text'))
    if (isNaN(src)) return
    const next = [...items]
    const [moved] = next.splice(src, 1)
    next.splice(idx, 0, moved)
    setItems(next)
    onChange(next)
  }

  function moveUp(i: number) {
    if (i === 0) return
    const next = [...items]
    const t = next[i - 1]
    next[i - 1] = next[i]
    next[i] = t
    setItems(next)
    onChange(next)
  }

  function moveDown(i: number) {
    if (i === items.length - 1) return
    const next = [...items]
    const t = next[i + 1]
    next[i + 1] = next[i]
    next[i] = t
    setItems(next)
    onChange(next)
  }

  const labels: Record<SectionKey, string> = {
    notes: 'Notes',
    calendar: "Calendrier du mois",
    surveillances: 'Surveillances'
  }

  return (
    <div className="space-y-2">
      {items.map((k, i) => (
        <div
          key={k}
          draggable
          onDragStart={(e) => onDragStart(e, i)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, i)}
          className="flex items-center justify-between p-2 bg-white rounded border"
          aria-roledescription="sortable"
          aria-label={`Réordonner ${labels[k]}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">≡</div>
            <div className="font-medium">{labels[k]}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => moveUp(i)} aria-label="Monter" className="p-1 rounded hover:bg-gray-100">
              <ArrowUp size={16} />
            </button>
            <button onClick={() => moveDown(i)} aria-label="Descendre" className="p-1 rounded hover:bg-gray-100">
              <ArrowDown size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
