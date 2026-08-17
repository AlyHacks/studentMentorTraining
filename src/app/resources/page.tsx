import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourcesClient } from "@/components/resources-client";

export default async function ResourcesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/resources");
  }

  const [resources, components] = await Promise.all([
    prisma.resource.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.component.findMany({ orderBy: { order: "asc" }, select: { key: true, name: true } }),
  ]);

  return (
    <ResourcesClient
      resources={resources}
      components={components}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
