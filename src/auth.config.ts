import type { NextAuthConfig } from "next-auth";

// Edge-safe: no DB adapter, no Node-only providers.
// Used by middleware. Full config (with adapter) lives in src/auth.ts.
export default {
  providers: [],
  pages: { signIn: "/signin" },
} satisfies NextAuthConfig;
