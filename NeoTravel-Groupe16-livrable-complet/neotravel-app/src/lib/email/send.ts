import nodemailer from "nodemailer";
import { getEmailFrom, resolveEmailProvider } from "@/lib/email/config";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
      })),
    }),
  });

  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return {
      ok: false,
      provider: "resend",
      error: body.message ?? `Resend HTTP ${res.status}`,
    };
  }

  return { ok: true, provider: "resend", messageId: body.id };
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
  });

  const info = await transport.sendMail({
    from: getEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType ?? "application/pdf",
    })),
  });

  return { ok: true, provider: "smtp", messageId: info.messageId };
}

function sendViaLog(input: SendEmailInput): SendEmailResult {
  console.log("\n--- EMAIL (simulation — configurez RESEND_API_KEY ou SMTP) ---");
  console.log(`À: ${input.to}`);
  console.log(`Objet: ${input.subject}`);
  console.log(input.text);
  console.log("---\n");
  return { ok: true, provider: "log", simulated: true, messageId: `log-${Date.now()}` };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = input.to.trim();
  if (!to || !to.includes("@")) {
    return { ok: false, provider: resolveEmailProvider(), error: "Adresse email invalide" };
  }

  try {
    const provider = resolveEmailProvider();
    if (provider === "resend") return await sendViaResend(input);
    if (provider === "smtp") return await sendViaSmtp(input);
    return sendViaLog(input);
  } catch (err) {
    return {
      ok: false,
      provider: resolveEmailProvider(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
