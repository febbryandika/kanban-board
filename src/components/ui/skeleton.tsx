import { cn } from "@/lib/utils";

/** Shared loading placeholder. Pulses to signal pending content; decorative, so
 * callers should mark the surrounding region `aria-hidden`. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
