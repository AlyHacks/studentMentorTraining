import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  taskId: z.string().min(1),
  completed: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { taskId, completed } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { quiz: true } });
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  if (task.quiz && completed) {
    return NextResponse.json(
      { error: "This task is graded automatically — complete the quiz instead." },
      { status: 400 }
    );
  }

  await prisma.progress.upsert({
    where: { userId_taskId: { userId: session.user.id, taskId } },
    update: {
      completed,
      source: "manual",
      completedAt: completed ? new Date() : null,
      score: null,
    },
    create: {
      userId: session.user.id,
      taskId,
      completed,
      source: "manual",
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
