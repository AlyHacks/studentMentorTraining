import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdatesClient } from "@/components/updates-client";

export default async function UpdatesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/updates");
  }

  const updates = await prisma.update.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <UpdatesClient
      updates={updates.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
