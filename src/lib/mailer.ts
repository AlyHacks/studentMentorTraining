import nodemailer from "nodemailer";

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendCertificateEmail(opts: {
  to: string;
  studentName: string;
  pdfBytes: Uint8Array;
  serial: string;
}) {
  if (!isEmailConfigured()) {
    return { sent: false as const, reason: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: opts.to,
    subject: "Your Certificate of Completion",
    text: `Congratulations ${opts.studentName}! You've completed 100% of the curriculum. Your certificate (ID ${opts.serial}) is attached.`,
    attachments: [
      {
        filename: `certificate-${opts.serial}.pdf`,
        content: Buffer.from(opts.pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });

  return { sent: true as const };
}
