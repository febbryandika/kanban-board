"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { getInitials } from "@/lib/utils";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function CardComments({
  cardId,
  currentUser,
  canModerate,
}: {
  cardId: string;
  currentUser: { userId: string; name: string };
  canModerate: boolean;
}) {
  const { data: comments, isPending, isError, refetch } = useComments(cardId);
  const createComment = useCreateComment(cardId, currentUser);
  const deleteComment = useDeleteComment(cardId);
  const [content, setContent] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    createComment.mutate({ content: text });
    setContent("");
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Comments</h3>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <Textarea
          value={content}
          maxLength={2000}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment…"
          aria-label="Write a comment"
          className="min-h-16"
        />
        <div>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || createComment.isPending}
          >
            Comment
          </Button>
        </div>
      </form>

      {isPending ? (
        <CommentsSkeleton />
      ) : isError ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Couldn&apos;t load comments.</span>
          <Button variant="link" size="sm" className="px-0" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => {
            const pending = c.id.startsWith("temp-");
            const canDelete =
              !pending && (c.userId === currentUser.userId || canModerate);
            return (
              <li key={c.id} className="flex gap-2.5">
                <Avatar size="sm" className="mt-0.5">
                  <AvatarFallback>{getInitials(c.authorName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {c.authorName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTime(c.createdAt)}
                    </span>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto shrink-0"
                        aria-label="Delete comment"
                        onClick={() => deleteComment.mutate(c.id)}
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {c.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CommentsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-2.5">
          <span className="size-6 shrink-0 rounded-full bg-muted" />
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="h-3 w-24 rounded bg-muted" />
            <span className="h-3 w-full rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
