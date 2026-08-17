import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().trim().url("Enter a valid URL"),
  description: z.string().trim().max(2000).optional(),
  componentKey: z.string().trim().max(50).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      componentKey: parsed.data.componentKey || null,
      addedById: session.user.id,
    },
  });

  return NextResponse.json(resource);
}
