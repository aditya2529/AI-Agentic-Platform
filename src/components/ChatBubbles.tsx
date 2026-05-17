// Shared bubble styles for /build and /run chats.
// Convention matches ChatGPT/Claude/Cursor: user bubble is subtle/outlined,
// assistant bubble is the prominent surface with a gradient stripe identity.
import { AlertTriangle, RotateCw } from "lucide-react";

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-lg leading-relaxed text-foreground/90">
        {children}
      </div>
    </div>
  );
}

export function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="relative max-w-[78%] overflow-hidden rounded-2xl border border-white/10 bg-card/60 px-6 py-4 text-lg leading-relaxed text-foreground shadow-lg backdrop-blur-xl">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[#7cf6ff] via-[#a78bff] to-[#ff7cd8]"
        />
        <div className="whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

export function PendingBubble({ label = "Thinking…" }: { label?: string }) {
  return (
    <div className="flex justify-start">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 px-6 py-4 text-base text-muted-foreground backdrop-blur-xl">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[#7cf6ff] via-[#a78bff] to-[#ff7cd8] opacity-70"
        />
        <span className="inline-flex items-center gap-3">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-foreground/60" />
          {label}
        </span>
      </div>
    </div>
  );
}

export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="flex max-w-[80%] items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Couldn&apos;t send your message.</p>
          <p className="mt-1 break-words text-destructive/80">{message}</p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/20"
          >
            <RotateCw className="h-3 w-3" /> Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
