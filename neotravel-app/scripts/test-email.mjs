import { readFileSync } from "fs";
import nodemailer from "nodemailer";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const info = await transport.sendMail({
  from: env.EMAIL_FROM,
  to: "leglitcher692@gmail.com",
  subject: "NeoTravel — test SMTP Brevo",
  text: "Si tu reçois ce mail, le SMTP Brevo est OK pour le follow-up.",
  html: "<p>SMTP Brevo <strong>OK</strong> pour NeoTravel.</p>",
});

console.log("OK", info.messageId);
