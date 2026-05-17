import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { devSignIn } from "./dev-actions";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl = "/agents", error } = await searchParams;
  const isDev =
    process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_SIGNIN === "true";
  const githubConfigured = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
  const resendConfigured = Boolean(process.env.AUTH_RESEND_KEY);

  return (
    <main className="relative grid min-h-dvh overflow-hidden md:grid-cols-2">
      <div className="aurora" />
      <div className="aurora-extra" />
      <div className="absolute inset-0 grid-bg -z-10" />

      {/* Left: brand + pitch */}
      <div className="relative flex flex-col justify-between p-10 md:p-14">
        <div className="text-xl font-semibold tracking-tight">
          <span className="text-gradient">Agentic</span>
        </div>

        <div className="fade-up max-w-xl">
          <h1 className="text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1] tracking-[-0.04em]">
            <span className="block">Claude is for</span>
            <span className="block"><em className="not-italic text-muted-foreground/80">you</em>.</span>
            <span className="mt-2 block">Agentic is for</span>
            <span className="block text-gradient">your users.</span>
          </h1>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
            A Custom GPT or Claude Project lives inside <em className="not-italic text-foreground/80">someone else&apos;s</em> app —
            only your team, $20/user, their UI, their data policy.
          </p>

          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
            Agentic ships those same AI workflows as <em className="not-italic text-foreground/80">your own product</em>:
            a link, an embed, a bot in your app. No ChatGPT account required.
            You pick the model. You own the data. You charge for it.
          </p>

          <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <span className="uppercase tracking-[0.2em]">Free MVP · Powered by Groq</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Agentic</p>
      </div>

      {/* Right: auth card */}
      <div className="relative flex items-center justify-center p-6 md:p-10">
        <div
          className="fade-up w-full max-w-md rounded-3xl border border-white/15 bg-card/40 p-8 shadow-[0_30px_120px_-30px_rgba(167,139,255,0.4)] backdrop-blur-2xl"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Build your first agent in under a minute.
          </p>

          {error ? (
            <p className="mt-4 text-sm text-destructive">Sign-in failed. Please try again.</p>
          ) : null}

          {isDev ? (
            <form action={devSignIn} className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="dev-email"
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Quick sign-in
                </Label>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  Dev
                </Badge>
              </div>
              <Input
                id="dev-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue="demo@local.test"
                required
                className="h-12 rounded-full bg-background/40 px-5 text-base"
              />
              <Button
                type="submit"
                className="group h-12 w-full rounded-full bg-white text-base font-semibold text-black transition hover:bg-white/90 hover:scale-[1.02]"
              >
                Continue
                <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Any email works. Disabled in production.
              </p>
            </form>
          ) : null}

          {(githubConfigured || resendConfigured) && isDev ? (
            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
          ) : null}

          {githubConfigured ? (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: callbackUrl });
              }}
            >
              <Button type="submit" className="h-12 w-full rounded-full text-base" variant="outline">
                Continue with GitHub
              </Button>
            </form>
          ) : null}

          {resendConfigured ? (
            <form
              action={async (formData) => {
                "use server";
                await signIn("resend", {
                  email: formData.get("email"),
                  redirectTo: callbackUrl,
                });
              }}
              className="mt-3 flex flex-col gap-3"
            >
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-12 rounded-full bg-background/40 px-5 text-base"
              />
              <Button type="submit" className="h-12 w-full rounded-full text-base" variant="outline">
                Email me a sign-in link
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
