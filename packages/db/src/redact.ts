// Mask the password in a Postgres connection string for safe error logging.
// Never returns the raw password; shows protocol/user/host/port/database only.
export function redactConnectionString(url: string): string {
  try {
    const u = new URL(url);
    const db = u.pathname.replace(/^\//, "") || "(db)";
    return `${u.protocol}//${u.username || "(user)"}:****@${u.host}/${db}`;
  } catch {
    // URL didn't parse — regex-mask anything between `://user:` and `@`.
    return url.replace(/:\/\/([^:/@]+):[^@]*@/, "://$1:****@");
  }
}
