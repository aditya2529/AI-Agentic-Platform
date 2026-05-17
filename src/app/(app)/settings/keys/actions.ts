"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { providerKeys } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { PROVIDERS } from "@/lib/providers";

const saveSchema = z.object({
  provider: z.enum(PROVIDERS),
  key: z.string().min(8).max(500),
});

export async function saveProviderKey(input: { provider: string; key: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { provider, key } = saveSchema.parse(input);
  const encryptedKey = encrypt(key.trim());

  await db
    .insert(providerKeys)
    .values({ userId: session.user.id, provider, encryptedKey })
    .onConflictDoUpdate({
      target: [providerKeys.userId, providerKeys.provider],
      set: { encryptedKey },
    });

  revalidatePath("/settings/keys");
}

export async function deleteProviderKey(provider: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = z.enum(PROVIDERS).parse(provider);
  await db
    .delete(providerKeys)
    .where(and(eq(providerKeys.userId, session.user.id), eq(providerKeys.provider, parsed)));

  revalidatePath("/settings/keys");
}
