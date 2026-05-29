// Module augmentation so `session.user` carries the fields the app reads:
// `id` and `emailVerified` (surfaced in auth.ts's session callback, used by
// /account and the login email-verified gate).

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }
}
