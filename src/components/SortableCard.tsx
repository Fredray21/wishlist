"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ItemCardProps } from "./ItemCard";

/** Enveloppe une carte pour le glisser-déposer (admin). Seule la poignée ⠿ démarre le déplacement. */
export function SortableCard({
  id,
  group,
  children,
}: {
  id: string;
  group: string;
  children: (drag: NonNullable<ItemCardProps["drag"]>) => React.ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id,
    data: { group },
  });
  return (
    <div
      ref={setNodeRef}
      className="h-full"
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        position: "relative",
        zIndex: isDragging ? 30 : undefined,
        opacity: isDragging ? 0.92 : undefined,
      }}
    >
      {children({ attachHandle: (el) => setActivatorNodeRef(el), handleProps: { ...attributes, ...listeners }, dragging: isDragging })}
    </div>
  );
}
