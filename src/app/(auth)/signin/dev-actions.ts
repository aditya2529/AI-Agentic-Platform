"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";

// MVP-only "magic dev login". Trades a tiny bit of security for zero setup.
// Anyone who can reach the sign-in page can pretend to be any email.
// Disabled in production unless ENABLE_DEV_SIGNIN=true (use for demos only).
export async function devSignIn(formData: FormData) {
  const allowed =
    process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_SIGNIN === "true";
  if (!allowed) {
    throw new Error("Dev sign-in is disabled in production.");
  }

  const raw = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!raw || !raw.includes("@")) {
    throw new Error("Please enter a valid email-shaped string.");
  }

  // Upsert user.
  let [user] = await db.select().from(users).where(eq(users.email, raw)).limit(1);
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: raw,
        name: raw.split("@")[0],
        emailVerified: new Date(),
      })
      .returning();
  }

  // Create a session row directly (bypassing Auth.js sign-in flow).
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    sessionToken,
    userId: user.id,
    expires,
  });

  // Auth.js v5 reads this cookie name on every request.
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const cookieStore = await cookies();
  cookieStore.set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });

  redirect("/agents");
}
