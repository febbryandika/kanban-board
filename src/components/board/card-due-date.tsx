"use client";

import { useState } from "react";
import { CalendarIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateCard } from "@/hooks/useUpdateCard";

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CardDueDate({
  boardId,
  cardId,
  dueDate,
}: {
  boardId: string;
  cardId: string;
  dueDate: string | null;
}) {
  const [open, setOpen] = useState(false);
  const updateCard = useUpdateCard(boardId);
  const selected = dueDate ? new Date(dueDate) : undefined;

  function onSelect(date: Date | undefined) {
    if (!date) return;
    updateCard.mutate({ cardId, dueDate: date.toISOString() });
    setOpen(false);
  }

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">Due date</h3>
      <div className="flex items-center gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start gap-2 font-normal"
              />
            }
          >
            <CalendarIcon className="size-4" />
            {dueDate ? (
              formatDue(dueDate)
            ) : (
              <span className="text-muted-foreground">Add due date</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={onSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        {dueDate && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear due date"
            onClick={() => updateCard.mutate({ cardId, dueDate: null })}
          >
            <XIcon />
          </Button>
        )}
      </div>
    </section>
  );
}
