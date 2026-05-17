import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { providerKeys } from "@/db/schema";
import { decrypt, maskKey } from "@/lib/crypto";
import { PROVIDERS, PROVIDER_LABELS, type Provider } from "@/lib/providers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { deleteProviderKey, saveProviderKey } from "./actions";

export default async function KeysPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select()
    .from(providerKeys)
    .where(eq(providerKeys.userId, session.user.id));

  const byProvider = new Map<Provider, (typeof rows)[number]>();
  for (const row of rows) byProvider.set(row.provider, row);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Provider API keys</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your keys are encrypted at rest with AES-256-GCM. They are never returned to the browser in
        plaintext.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {PROVIDERS.map((provider) => {
          const existing = byProvider.get(provider);
          let mask: string | null = null;
          if (existing) {
            try {
              mask = maskKey(decrypt(existing.encryptedKey));
            } catch {
              mask = "(decryption failed — re-enter)";
            }
          }

          return (
            <Card key={provider}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{PROVIDER_LABELS[provider]}</CardTitle>
                  <CardDescription>
                    {existing ? (
                      <span className="font-mono text-xs">{mask}</span>
                    ) : (
                      "No key on file"
                    )}
                  </CardDescription>
                </div>
                {existing ? <Badge variant="secondary">Connected</Badge> : null}
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    "use server";
                    const key = String(formData.get("key") ?? "");
                    if (!key) return;
                    await saveProviderKey({ provider, key });
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1">
                    <Label htmlFor={`${provider}-key`} className="sr-only">
                      Key
                    </Label>
                    <Input
                      id={`${provider}-key`}
                      name="key"
                      type="password"
                      placeholder={existing ? "Replace key…" : "Paste API key"}
                      autoComplete="off"
                    />
                  </div>
                  <Button type="submit">{existing ? "Replace" : "Save"}</Button>
                  {existing ? (
                    <>
                      <Separator orientation="vertical" className="h-9" />
                      <form
                        action={async () => {
                          "use server";
                          await deleteProviderKey(provider);
                        }}
                      >
                        <Button type="submit" variant="ghost">
                          Remove
                        </Button>
                      </form>
                    </>
                  ) : null}
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
