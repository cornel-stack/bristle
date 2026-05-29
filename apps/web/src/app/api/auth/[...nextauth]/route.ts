// Auth.js v5 catch-all route — exposes the framework's GET/POST handlers
// (CSRF, callback, session, signout endpoints) from the central config.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
