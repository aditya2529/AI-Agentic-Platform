import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import { Canvas } from "@/components/builder/Canvas";
import { Palette } from "@/components/builder/Palette";

export default async function AgentBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, session.user.id)))
    .limit(1);

  if (!agent) notFound();

  return (
    <div className="flex h-[calc(100dvh-57px)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/agents" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            ← Back
          </Link>
          <h1 className="text-sm font-medium">{agent.name}</h1>
          <span className="text-xs text-muted-foreground">
            Auto-saves · {agent.graph.nodes.length} nodes
          </span>
        </div>
        <Button size="sm" disabled title="Coming in the next step">
          Run
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Palette />
        <div className="flex-1">
          <Canvas agentId={agent.id} initialGraph={agent.graph} />
        </div>
      </div>
    </div>
  );
}
