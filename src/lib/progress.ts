import { prisma } from "@/lib/prisma";

export type ComponentProgress = {
  id: string;
  key: string;
  name: string;
  weight: number;
  totalPoints: number;
  earnedPoints: number;
  percent: number;
  tasks: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    autoGraded: boolean;
    hasQuiz: boolean;
    completed: boolean;
    score: number | null;
    source: string;
    completedAt: Date | null;
  }[];
};

export type UserProgressSummary = {
  components: ComponentProgress[];
  totalPercent: number;
  isComplete: boolean;
};

export async function getUserProgressSummary(userId: string): Promise<UserProgressSummary> {
  const components = await prisma.component.findMany({
    orderBy: { order: "asc" },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: {
          quiz: { select: { id: true } },
          progress: { where: { userId } },
        },
      },
    },
  });

  const componentProgress: ComponentProgress[] = components.map((component) => {
    const tasks = component.tasks.map((task) => {
      const p = task.progress[0];
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        points: task.points,
        autoGraded: task.autoGraded,
        hasQuiz: !!task.quiz,
        completed: p?.completed ?? false,
        score: p?.score ?? null,
        source: p?.source ?? "manual",
        completedAt: p?.completedAt ?? null,
      };
    });

    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
    const earnedPoints = tasks.reduce((sum, t) => sum + (t.completed ? t.points : 0), 0);
    const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;

    return {
      id: component.id,
      key: component.key,
      name: component.name,
      weight: component.weight,
      totalPoints,
      earnedPoints,
      percent,
      tasks,
    };
  });

  const weightSum = componentProgress.reduce((sum, c) => sum + c.weight, 0);
  const totalPercent =
    weightSum > 0
      ? Math.round(
          (componentProgress.reduce((sum, c) => sum + c.percent * c.weight, 0) / weightSum) * 10
        ) / 10
      : 0;

  return {
    components: componentProgress,
    totalPercent,
    isComplete: totalPercent >= 100,
  };
}
