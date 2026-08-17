import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserProgressSummary } from "@/lib/progress";
import { generateCertificatePdf } from "@/lib/certificate";
import { sendCertificateEmail } from "@/lib/mailer";

function makeSerial(userId: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CERT-${stamp}-${rand}-${userId.slice(0, 4).toUpperCase()}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const summary = await getUserProgressSummary(user.id);
  if (!summary.isComplete) {
    return NextResponse.json(
      { error: "Certificate is only available once the curriculum is 100% complete." },
      { status: 400 }
    );
  }

  let certificate = await prisma.certificate.findFirst({ where: { userId: user.id } });
  if (!certificate) {
    certificate = await prisma.certificate.create({
      data: { userId: user.id, serial: makeSerial(user.id) },
    });
  }

  const pdfBytes = await generateCertificatePdf({
    studentName: user.name,
    serial: certificate.serial,
    issuedAt: certificate.issuedAt,
  });

  if (!certificate.emailedAt) {
    const result = await sendCertificateEmail({
      to: user.email,
      studentName: user.name,
      pdfBytes,
      serial: certificate.serial,
    }).catch(() => ({ sent: false as const, reason: "send failed" }));

    if (result.sent) {
      certificate = await prisma.certificate.update({
        where: { id: certificate.id },
        data: { emailedAt: new Date() },
      });
    }
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${certificate.serial}.pdf"`,
    },
  });
}
