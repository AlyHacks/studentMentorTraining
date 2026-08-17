import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserProgressSummary } from "@/lib/progress";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const [summary, certificate] = await Promise.all([
    getUserProgressSummary(session.user.id),
    prisma.certificate.findFirst({ where: { userId: session.user.id } }),
  ]);

  return <DashboardClient summary={summary} hasCertificate={!!certificate} />;
}
