import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  RiAddCircleLine,
  RiDragMoveLine,
  RiFunctionAddLine,
  RiPencilLine,
  RiSettings5Line,
} from '@remixicon/react'

const activeTabClass = 'glass-panel accent-border text-slate-100 accent-shadow'

const inactiveTabClass =
  'glass-panel-soft text-slate-300 hover:border-slate-400/40 hover:text-slate-100'

const SORTABLE_TAB_TRANSITION = {
  duration: 260,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
}

function SortableTab({
  category,
  isActive,
  dragMode,
  onSelectCategory,
  onRenameCategory,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: category.id,
      disabled: !dragMode,
      transition: SORTABLE_TAB_TRANSITION,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    zIndex: isDragging ? 20 : 1,
    willChange: 'transform',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`gsap-nav-tab group relative flex h-8 shrink-0 items-center overflow-hidden rounded-lg border px-0.5 pr-7 transition sm:h-9 sm:pr-8 ${
        dragMode ? 'cursor-grab active:cursor-grabbing touch-none' : ''
      } ${isActive ? activeTabClass : inactiveTabClass}`}
      title={dragMode ? `Drag ${category.name}` : category.name}
    >
      <button
        type="button"
        onClick={() => onSelectCategory(category.id)}
        className="focus-ring min-w-0 max-w-36 rounded-md px-2.5 py-1.5 text-xs font-semibold sm:max-w-44 sm:text-sm"
      >
        <span className="block truncate">{category.name}</span>
      </button>
      {isActive ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] border border-[color:rgb(var(--accent-rgb)/0.58)] shadow-[0_0_0_1px_rgb(var(--accent-rgb)/0.22),0_0_18px_-6px_rgb(var(--accent-rgb)/0.72)]"
        />
      ) : null}

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onRenameCategory(category)
        }}
        disabled={dragMode}
        className={`focus-ring glass-button absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-md text-xs text-slate-300 transition hover:text-[var(--accent-color)] sm:h-6 sm:w-6 ${
          dragMode
            ? 'pointer-events-none opacity-0'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        title={`Rename ${category.name}`}
      >
        <RiPencilLine className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  )
}

export default function CategoryTabs({
  categories,
  activeCategoryId,
  dragMode,
  onToggleDragMode,
  onReorderCategories,
  onSelectCategory,
  onCreateCategory,
  onRenameCategory,
  onOpenSettings,
  onAddWebsite,
  canAddWebsite,
}) {
  const navRef = useRef(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  useLayoutEffect(() => {
    if (!navRef.current) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { autoAlpha: 0, y: -16 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      )
    }, navRef)

    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!navRef.current) {
      return undefined
    }

    const ctx = gsap.context(() => {
      const tabs = gsap.utils.toArray('.gsap-nav-tab')
      if (!tabs.length) {
        return
      }

      gsap.fromTo(
        tabs,
        { autoAlpha: 0, y: -8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.28,
          stagger: 0.03,
          ease: 'power2.out',
          overwrite: 'auto',
        },
      )
    }, navRef)

    return () => ctx.revert()
  }, [categories.length])

  const handleDragEnd = (event) => {
    if (!dragMode) {
      return
    }

    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = categories.findIndex((category) => category.id === active.id)
    const newIndex = categories.findIndex((category) => category.id === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const nextOrder = arrayMove(categories, oldIndex, newIndex).map(
      (category) => category.id,
    )
    void onReorderCategories(nextOrder)
  }

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 border-b border-slate-600/30 bg-slate-950/40 shadow-[0_10px_30px_-28px_rgb(0_0_0/0.9)] backdrop-blur-xl"
    >
      <div className="flex h-11 w-full items-center gap-1 px-0 sm:h-12 sm:gap-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((category) => category.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="hide-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {categories.map((category) => (
                <SortableTab
                  key={category.id}
                  category={category}
                  isActive={category.id === activeCategoryId}
                  dragMode={dragMode}
                  onSelectCategory={onSelectCategory}
                  onRenameCategory={onRenameCategory}
                />
              ))}

              <button
                type="button"
                onClick={onCreateCategory}
                className="focus-ring glass-button ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm text-slate-300 sm:h-8 sm:w-8"
                title="Create new tab"
              >
                <RiAddCircleLine className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onAddWebsite}
            disabled={!canAddWebsite}
            className="focus-ring accent-bg accent-border accent-shadow inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:h-8 sm:px-3 sm:text-xs"
            title="Add website"
          >
            <RiFunctionAddLine className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:block">Add Website</span>
          </button>

          <button
            type="button"
            onClick={onToggleDragMode}
            className={`focus-ring inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition sm:h-8 sm:px-3 sm:text-xs ${
              dragMode
                ? 'accent-bg accent-border text-slate-950'
                : 'glass-button text-slate-200'
            }`}
            title={dragMode ? 'Disable drag mode' : 'Enable drag mode'}
          >
            <RiDragMoveLine className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:block">{dragMode ? 'Dragging On' : 'Drag Mode'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="focus-ring glass-button grid h-7 w-7 place-items-center rounded-lg text-sm text-slate-300 sm:h-8 sm:w-8"
            title="Settings"
          >
            <RiSettings5Line className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
