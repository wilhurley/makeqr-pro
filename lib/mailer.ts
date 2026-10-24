/** Minimal transactional email through Resend's HTTP API. Server-only. */
export async function sendRestoreEmail(to: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESTORE_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("restore email sender is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your MakeQR Pro sign-in link",
      text:
        "Someone (hopefully you) asked to turn MakeQR Pro back on in a browser.\n\n" +
        `Open this link within 15 minutes to sign in. It works once:\n${link}\n\n` +
        "If you didn't ask for this, ignore this email. Nothing changes.\n\n" +
        "MakeQR Pro, Ridgeline Apps LLC",
    }),
  });
  if (!res.ok) throw new Error(`resend responded ${res.status}`);
}
