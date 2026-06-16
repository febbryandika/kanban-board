import { Badge } from "@/components/ui/badge";
import type { BoardColumnWithCards } from "@/types/board";

import { AddCardForm } from "./add-card-form";
import { CardItem } from "./card-item";

export function BoardColumn({ column }: { column: BoardColumnWithCards }) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{column.name}</h2>
        <Badge variant="secondary">{column.cards.length}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        {column.cards.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">No cards</p>
        ) : (
          column.cards.map((card) => <CardItem key={card.id} card={card} />)
        )}
      </div>

      <AddCardForm columnId={column.id} />
    </div>
  );
}
