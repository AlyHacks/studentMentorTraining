import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { taskId } = await context.params;
  const quiz = await prisma.quiz.findUnique({
    where: { taskId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) {
    return NextResponse.json({ error: "No quiz found for this task." }, { status: 404 });
  }

  return NextResponse.json({
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      choices: JSON.parse(q.choices) as string[],
    })),
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { taskId } = await context.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { taskId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) {
    return NextResponse.json({ error: "No quiz found for this task." }, { status: 404 });
  }

  const { answers } = parsed.data;
  if (answers.length !== quiz.questions.length) {
    return NextResponse.json({ error: "Answer count does not match question count." }, { status: 400 });
  }

  let correct = 0;
  const results = quiz.questions.map((q, i) => {
    const isCorrect = answers[i] === q.answerIndex;
    if (isCorrect) correct += 1;
    return { questionId: q.id, correct: isCorrect, answerIndex: q.answerIndex };
  });

  const score = quiz.questions.length > 0 ? correct / quiz.questions.length : 0;
  const passed = score >= quiz.passingScore;

  await prisma.progress.upsert({
    where: { userId_taskId: { userId: session.user.id, taskId } },
    update: {
      completed: passed,
      source: "auto",
      score,
      completedAt: passed ? new Date() : null,
    },
    create: {
      userId: session.user.id,
      taskId,
      completed: passed,
      source: "auto",
      score,
      completedAt: passed ? new Date() : null,
    },
  });

  return NextResponse.json({
    score,
    passed,
    passingScore: quiz.passingScore,
    correctCount: correct,
    totalQuestions: quiz.questions.length,
    results,
  });
}
