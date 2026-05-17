"use client";

import { useEffect, useState, useTransition } from "react";
import { Share2, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  disableAgentSharing,
  enableAgentSharing,
} from "@/app/(app)/agents/actions";

export function ShareDialog({
  agentId,
  initialShareToken,
  initialIsPublic,
}: {
  agentId: string;
  initialShareToken: string | null;
  initialIsPublic: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const shareUrl = shareToken && isPublic ? `${origin}/a/${shareToken}/chat` : "";

  function enable() {
    setError(null);
    startTransition(async () => {
      try {
        const { shareToken: token } = await enableAgentSharing(agentId);
        setShareToken(token);
        setIsPublic(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't enable sharing.");
      }
    });
  }

  function disable() {
    setError(null);
    startTransition(async () => {
      try {
        await disableAgentSharing(agentId);
        setIsPublic(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't disable sharing.");
      }
    });
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — user can still select the input text
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Share this agent
          </DialogTitle>
          <DialogDescription>
            Anyone with the link can chat with your agent — no sign-in needed.
          </DialogDescription>
        </DialogHeader>

        {isPublic && shareToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-background/60 p-1.5">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none"
                aria-label="Public link"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={copy}
                disabled={!shareUrl}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Open public link <ExternalLink className="h-3 w-3" />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={disable}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Stop sharing
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Visitors send messages to your agent using your platform credits.
              Disable sharing any time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Publish a public link so anyone can chat with this agent in their
              browser. You can stop sharing at any time.
            </p>
            <Button
              type="button"
              onClick={enable}
              disabled={pending}
              className="h-10 w-full rounded-full bg-white text-sm font-semibold text-black hover:bg-white/90"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              Create public link
            </Button>
          </div>
        )}

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
