import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-background/60 px-8 backdrop-blur-2xl">
        <nav className="flex items-center gap-10">
          <Link href="/agents" className="text-xl font-semibold tracking-tight">
            <span className="text-gradient">Agentic</span>
          </Link>
          <Link
            href="/agents"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Agents
          </Link>
        </nav>
        <div className="flex items-center gap-5">
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/signin" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
