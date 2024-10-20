import * as React from "react"
import type {
  DndContextProps,
  UniqueIdentifier,
  DropAnimation,
  DraggableSyntheticListeners,
} from "@dnd-kit/core"
import {
  DndContext,
  closestCenter,
  defaultDropAnimationSideEffects,
  MouseSensor,
  TouchSensor,
  DragOverlay,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { SortableContextProps } from "@dnd-kit/sortable"
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Slot, type SlotProps } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"
import { composeRefs } from "@/lib/compose-refs"

interface SortableProps<TData extends { id: UniqueIdentifier }>
  extends DndContextProps {
  /**
   * An array of data items that the sortable component will render.
   * @example
   * value={[
   *   { id: 1, name: 'Item 1' },
   *   { id: 2, name: 'Item 2' },
   * ]}
   */
  value: TData[]

  /**
   * An optional callback function that is called when the order of the data items changes.
   * It receives the new array of items as its argument.
   * @example
   * onValueChange={(items) => console.log(items)}
   */
  onValueChange?: (items: TData[]) => void

  /**
   * An optional callback function that is called when an item is moved.
   * It receives an event object with `activeIndex` and `overIndex` properties, representing the original and new positions of the moved item.
   * This will override the default behavior of updating the order of the data items.
   * @type (event: { activeIndex: number; overIndex: number }) => void
   * @example
   * onMove={(event) => console.log(`Item moved from index ${event.activeIndex} to index ${event.overIndex}`)}
   */
  onMove?: (event: { activeIndex: number; overIndex: number }) => void

  /**
   * A collision detection strategy that will be used to determine the closest sortable item.
   * @default closestCenter
   * @type DndContextProps["collisionDetection"]
   */
  collisionDetection?: DndContextProps["collisionDetection"]

  /**
   * A sorting strategy that will be used to determine the new order of the data items.
   * @default verticalListSortingStrategy
   * @type SortableContextProps["strategy"]
   */
  strategy?: SortableContextProps["strategy"]

  /**
   * An optional React node that is rendered on top of the sortable component.
   * It can be used to display additional information or controls.
   * @default null
   * @type React.ReactNode | null
   * @example
   * overlay={<Skeleton className="w-full h-8" />}
   */
  overlay?: React.ReactNode | null
}

function SortableGrid<TData extends { id: UniqueIdentifier }>({
  value,
  onValueChange,
  collisionDetection = closestCenter,
  strategy = rectSortingStrategy,
  onMove,
  children,
  overlay,
  id,
  ...props
}: SortableProps<TData>) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  )

  return (
    <DndContext
      id={id}
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over?.id) {
          const activeIndex = value.findIndex((item) => item.id === active.id)
          const overIndex = value.findIndex((item) => item.id === over.id)

          if (onMove) {
            onMove({ activeIndex, overIndex })
          } else {
            onValueChange?.(arrayMove(value, activeIndex, overIndex))
          }
        }
        setActiveId(null)
      }}
      onDragCancel={() => setActiveId(null)}
      collisionDetection={collisionDetection}
      {...props}
    >
      <SortableContext items={value} strategy={strategy}>
        {children}
      </SortableContext>
      {overlay ? (
        <SortableGridOverlay activeId={activeId}>{overlay}</SortableGridOverlay>
      ) : null}
    </DndContext>
  )
}

const dropAnimationOpts: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
}

interface SortableOverlayProps
  extends React.ComponentPropsWithRef<typeof DragOverlay> {
  activeId?: UniqueIdentifier | null
}

function SortableGridOverlay({
  activeId,
  dropAnimation = dropAnimationOpts,
  children,
  ...props
}: SortableOverlayProps) {
  return (
    <DragOverlay dropAnimation={dropAnimation} {...props}>
      {activeId ? (
        <SortableGridItem value={activeId} asChild>
          {children}
        </SortableGridItem>
      ) : null}
    </DragOverlay>
  )
}

interface SortableItemContextProps {
  attributes: React.HTMLAttributes<HTMLElement>
  listeners: DraggableSyntheticListeners | undefined
}

const SortableItemContext = React.createContext<SortableItemContextProps>({
  attributes: {},
  listeners: undefined,
})

interface SortableItemProps extends SlotProps {
  value: UniqueIdentifier
  asChild?: boolean
}

const SortableGridItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  ({ asChild, className, value, ...props }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: value })

    const context = React.useMemo(
      () => ({
        attributes,
        listeners,
      }),
      [attributes, listeners],
    )
    const style: React.CSSProperties = {
      opacity: isDragging ? 0.4 : undefined,
      transform: CSS.Translate.toString(transform),
      transition,
    }

    const Comp = asChild ? Slot : "div"

    return (
      <SortableItemContext.Provider value={context}>
        <Comp
          className={cn(isDragging && "!cursor-grabbing", className)}
          ref={composeRefs(ref, setNodeRef as React.Ref<HTMLDivElement>)}
          style={style}
          {...attributes}
          {...listeners}
          {...props}
        />
      </SortableItemContext.Provider>
    )
  },
)
SortableGridItem.displayName = "SortableGridItem"

export { SortableGrid, SortableGridItem, SortableGridOverlay }
