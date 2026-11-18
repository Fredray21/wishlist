export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureDataFile } = await import("./lib/store");
    await ensureDataFile();
    if (!process.env.ADMIN_PASSWORD || (process.env.SESSION_SECRET ?? "").length < 32) {
      console.warn("[wishlist] ADMIN_PASSWORD / SESSION_SECRET absents ou trop courts : mode admin désactivé.");
    }
  }
}
