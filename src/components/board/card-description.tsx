"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCard } from "@/hooks/useUpdateCard";

/** Basic Markdown styling without the typography plugin: Tailwind preflight
 * strips list/heading defaults, so re-add the essentials via child selectors. */
const MARKDOWN_CLASS =
  "text-sm leading-relaxed break-words [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_h1]:mt-3 [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_strong]:font-semibold";

export function CardDescription({
  boardId,
  cardId,
  description,
}: {
  boardId: string;
  cardId: string;
  description: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(description ?? "");
  const updateCard = useUpdateCard(boardId);

  function startEdit() {
    setValue(description ?? "");
    setEditing(true);
  }

  function save() {
    const next = value.trim() === "" ? null : value;
    if (next !== (description ?? null)) {
      updateCard.mutate({ cardId, description: next });
    }
    setEditing(false);
  }

  function cancel() {
    setValue(description ?? "");
    setEditing(false);
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Description</h3>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            autoFocus
            value={value}
            maxLength={5000}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a more detailed description… (Markdown supported)"
            className="min-h-32"
            aria-label="Card description"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={updateCard.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : description ? (
        <div className={MARKDOWN_CLASS}>
          <ReactMarkdown
            components={{
              // Open links in a new tab and harden against tab-nabbing. `node`
              // is react-markdown's AST node — destructured out so it never
              // reaches the DOM anchor.
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              a({ node, ...props }) {
                return (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                );
              },
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="rounded-md border border-dashed px-3 py-4 text-left text-sm text-muted-foreground hover:bg-muted/50"
        >
          Add a more detailed description…
        </button>
      )}
    </section>
  );
}
