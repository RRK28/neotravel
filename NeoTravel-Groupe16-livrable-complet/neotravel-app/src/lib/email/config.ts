export type EmailProvider = "resend" | "smtp" | "log";

export function resolveEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    return "smtp";
  }
  return "log";
}

export function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    (resolveEmailProvider() === "resend"
      ? "NeoTravel <onboarding@resend.dev>"
      : "NeoTravel <devis@neotravel.local>")
  );
}

export function getAppBaseUrl(override?: string): string {
  const base =
    override?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export function isEmailConfigured(): boolean {
  return resolveEmailProvider() !== "log";
}
