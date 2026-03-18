import { useEffect, useRef } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import WebsiteTile from './WebsiteTile'
import { useGsapStagger } from '../hooks/useGsapStagger'

const SORTABLE_CARD_TRANSITION = {
  duration: 260,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
}

function SortableWebsiteCard({
  website,
  onEdit,
  shouldSuppressNavigation,
  dragMode,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: website.id,
      disabled: !dragMode,
      transition: SORTABLE_CARD_TRANSITION,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    zIndex: isDragging ? 30 : 1,
    willChange: 'transform',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`gsap-tile ${
        dragMode ? 'cursor-grab active:cursor-grabbing touch-none' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <WebsiteTile
        website={website}
        onEdit={onEdit}
        className="gsap-tile-inner"
        isDragging={isDragging}
        dragMode={dragMode}
        shouldSuppressNavigation={shouldSuppressNavigation}
      />
    </div>
  )
}

export default function WebsiteGrid({
  hasCategory,
  websites,
  onEdit,
  onReorderWebsites,
  dragMode,
}) {
  const gridRef = useRef(null)
  const dragEndTimerRef = useRef(null)
  const suppressClickNavigationRef = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  useGsapStagger(gridRef, '.gsap-tile-inner', [websites.length, hasCategory])

  useEffect(
    () => () => {
      if (dragEndTimerRef.current) {
        clearTimeout(dragEndTimerRef.current)
      }
    },
    [],
  )

  const scheduleNavigationRelease = (delayMs = 320) => {
    if (dragEndTimerRef.current) {
      clearTimeout(dragEndTimerRef.current)
    }
    dragEndTimerRef.current = setTimeout(() => {
      suppressClickNavigationRef.current = false
    }, delayMs)
  }

  if (!hasCategory) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-black px-5 py-10 text-center">
        <h3 className="text-base font-semibold text-slate-200">No category selected</h3>
        <p className="mt-2 text-sm text-slate-400">
          Create a tab to start saving website shortcuts.
        </p>
      </div>
    )
  }

  if (websites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-black px-5 py-10 text-center">
        <h3 className="text-base font-semibold text-slate-200">No websites yet</h3>
        <p className="mt-2 text-sm text-slate-400">Add your first website in this tab.</p>
      </div>
    )
  }

  const handleDragEnd = (event) => {
    if (!dragMode) {
      return
    }

    suppressClickNavigationRef.current = true
    scheduleNavigationRelease(320)

    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = websites.findIndex((website) => website.id === active.id)
    const newIndex = websites.findIndex((website) => website.id === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const nextOrder = arrayMove(websites, oldIndex, newIndex).map(
      (website) => website.id,
    )
    void onReorderWebsites(nextOrder)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => {
        if (!dragMode) {
          return
        }

        suppressClickNavigationRef.current = true
        if (dragEndTimerRef.current) {
          clearTimeout(dragEndTimerRef.current)
        }
      }}
      onDragCancel={() => {
        if (!dragMode) {
          return
        }

        suppressClickNavigationRef.current = true
        scheduleNavigationRelease(180)
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={websites.map((website) => website.id)}
        strategy={rectSortingStrategy}
      >
        <div
          ref={gridRef}
          className="grid grid-cols-[repeat(auto-fill,minmax(72px,82px))] justify-center gap-2 sm:grid-cols-[repeat(auto-fill,minmax(78px,88px))]"
        >
          {websites.map((website) => (
            <SortableWebsiteCard
              key={website.id}
              website={website}
              onEdit={onEdit}
              dragMode={dragMode}
              shouldSuppressNavigation={() =>
                dragMode || suppressClickNavigationRef.current
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
