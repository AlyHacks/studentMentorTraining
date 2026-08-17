import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const COMPONENTS = [
  {
    key: "programming",
    name: "Programming",
    order: 1,
    tasks: [
      {
        title: "Set up your dev environment",
        description: "Install Python, OpenCV, and clone the team repo.",
        points: 1,
      },
      {
        title: "Complete the Python & OpenCV basics module",
        description: "Work through the intro notebook covering arrays, images, and control flow.",
        points: 1,
      },
      {
        title: "Programming fundamentals check",
        description: "Short auto-graded quiz on Python and OpenCV basics.",
        points: 1,
        autoGraded: true,
        quiz: {
          passingScore: 0.8,
          questions: [
            {
              prompt: "In OpenCV (Python), which function reads an image from disk?",
              choices: ["cv2.readImage()", "cv2.imread()", "cv2.load()", "cv2.getImage()"],
              answerIndex: 1,
            },
            {
              prompt: "What data structure does OpenCV use to represent an image in Python?",
              choices: ["A NumPy array", "A native Python list", "A dictionary", "A tuple of pixels"],
              answerIndex: 0,
            },
            {
              prompt: "Which YOLO package is used in this project to load a model?",
              choices: ["opencv-yolo", "ultralytics", "torchvision", "pillow"],
              answerIndex: 1,
            },
            {
              prompt: "What does `cv2.VideoCapture(0)` typically open?",
              choices: ["A video file named 0", "The default connected camera", "A blank canvas", "A network stream"],
              answerIndex: 1,
            },
            {
              prompt: "Which NumPy constraint does this project require for Ultralytics compatibility?",
              choices: ["NumPy >= 2", "NumPy < 2", "No NumPy allowed", "NumPy == 1.0 exactly"],
              answerIndex: 1,
            },
          ],
        },
      },
      {
        title: "Implement object detection on a sample video",
        description: "Run YOLO object detection end-to-end and submit your output for review.",
        points: 1,
      },
    ],
  },
  {
    key: "cad",
    name: "CAD",
    order: 2,
    tasks: [
      {
        title: "CAD software orientation",
        description: "Complete the intro walkthrough of the CAD tool used by the team.",
        points: 1,
      },
      {
        title: "Design a basic mounting bracket",
        description: "Model a simple bracket to the given spec and export an STL.",
        points: 1,
      },
      {
        title: "CAD fundamentals check",
        description: "Auto-graded quiz on CAD concepts and terminology.",
        points: 1,
        autoGraded: true,
        quiz: {
          passingScore: 0.8,
          questions: [
            {
              prompt: "What file format is most commonly used to export a model for 3D printing?",
              choices: ["STL", "MP3", "CSV", "PNG"],
              answerIndex: 0,
            },
            {
              prompt: "What does 'tolerance' refer to in a mechanical design?",
              choices: [
                "The color of the part",
                "The allowable variation in a dimension",
                "The weight of the part",
                "The cost of the part",
              ],
              answerIndex: 1,
            },
            {
              prompt: "A fillet in CAD refers to:",
              choices: [
                "A sharp 90-degree edge",
                "A rounded transition between two faces",
                "A hole through the part",
                "A type of material",
              ],
              answerIndex: 1,
            },
            {
              prompt: "Which of these is a common CAD assembly constraint?",
              choices: ["Mate/coincident", "Blur", "Saturation", "Gradient"],
              answerIndex: 0,
            },
          ],
        },
      },
      {
        title: "Full housing assembly review",
        description: "Present your final assembly for team review and sign-off.",
        points: 1,
      },
    ],
  },
  {
    key: "presentation",
    name: "Presentational Skills",
    order: 3,
    tasks: [
      {
        title: "Watch the presentation skills workshop",
        description: "Review the recorded workshop on technical presentations.",
        points: 1,
      },
      {
        title: "Deliver a 5-minute lightning talk",
        description: "Present a short update on your work to the team.",
        points: 1,
      },
      {
        title: "Peer feedback session",
        description: "Give and receive structured feedback with a teammate.",
        points: 1,
      },
    ],
  },
  {
    key: "onboarding",
    name: "Onboarding Program",
    order: 4,
    tasks: [
      {
        title: "Read the team handbook",
        description: "Review team norms, safety rules, and communication channels.",
        points: 1,
      },
      {
        title: "Meet your mentor",
        description: "Have an intro 1:1 with your assigned mentor.",
        points: 1,
      },
      {
        title: "Onboarding knowledge check",
        description: "Quick auto-graded quiz on team policies and safety.",
        points: 1,
        autoGraded: true,
        quiz: {
          passingScore: 0.8,
          questions: [
            {
              prompt: "Who should you contact first with a question about a task?",
              choices: ["Your assigned mentor", "No one, figure it out alone", "A random teammate", "Social media"],
              answerIndex: 0,
            },
            {
              prompt: "Where are project resources and docs kept, per the onboarding program?",
              choices: ["Nowhere, ask around", "The team resources page", "A private notebook", "It doesn't matter"],
              answerIndex: 1,
            },
            {
              prompt: "What should you do before operating shared lab equipment?",
              choices: [
                "Complete the required safety training",
                "Nothing, just start",
                "Ask a friend outside the team",
                "Wait a semester",
              ],
              answerIndex: 0,
            },
          ],
        },
      },
    ],
  },
  {
    key: "scenario",
    name: "Scenario Quest",
    order: 5,
    tasks: [
      {
        title: "Scenario Quest 1: Obstacle course walkthrough",
        description: "Complete the guided navigation scenario with your device.",
        points: 1,
      },
      {
        title: "Scenario Quest 2: Sensor failure recovery",
        description: "Simulate a sensor dropout and demonstrate recovery behavior.",
        points: 1,
      },
      {
        title: "Scenario Quest 3: Full integration run",
        description: "Run the complete navigation scenario end-to-end and log results.",
        points: 1,
      },
    ],
  },
];

async function main() {
  for (const c of COMPONENTS) {
    const component = await prisma.component.upsert({
      where: { key: c.key },
      update: { name: c.name, order: c.order },
      create: { key: c.key, name: c.name, order: c.order },
    });

    for (let i = 0; i < c.tasks.length; i++) {
      const t = c.tasks[i];
      const existing = await prisma.task.findFirst({
        where: { componentId: component.id, title: t.title },
      });
      const task = existing
        ? await prisma.task.update({
            where: { id: existing.id },
            data: {
              description: t.description,
              points: t.points,
              autoGraded: !!t.autoGraded,
              order: i,
            },
          })
        : await prisma.task.create({
            data: {
              componentId: component.id,
              title: t.title,
              description: t.description,
              points: t.points,
              autoGraded: !!t.autoGraded,
              order: i,
            },
          });

      if (t.quiz) {
        const quiz = await prisma.quiz.upsert({
          where: { taskId: task.id },
          update: { passingScore: t.quiz.passingScore },
          create: { taskId: task.id, passingScore: t.quiz.passingScore },
        });
        await prisma.question.deleteMany({ where: { quizId: quiz.id } });
        for (let qi = 0; qi < t.quiz.questions.length; qi++) {
          const q = t.quiz.questions[qi];
          await prisma.question.create({
            data: {
              quizId: quiz.id,
              prompt: q.prompt,
              choices: JSON.stringify(q.choices),
              answerIndex: q.answerIndex,
              order: qi,
            },
          });
        }
      }
    }
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const demoAccounts = [
    { name: "Program Admin", email: adminEmails[0] ?? "admin@example.com", role: "ADMIN" as const, password: "ChangeMe123!" },
    { name: "Demo Student", email: "demo.student@example.com", role: "STUDENT" as const, password: "DemoPass123!" },
  ];

  for (const acct of demoAccounts) {
    const passwordHash = await bcrypt.hash(acct.password, 10);
    await prisma.user.upsert({
      where: { email: acct.email },
      update: {},
      create: {
        name: acct.name,
        email: acct.email,
        passwordHash,
        role: acct.role,
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: demoAccounts[0].email } });
  if (admin) {
    const existingUpdate = await prisma.update.findFirst({ where: { title: "Welcome to the curriculum tracker" } });
    if (!existingUpdate) {
      await prisma.update.create({
        data: {
          title: "Welcome to the curriculum tracker",
          body: "Use this site to track your progress across programming, CAD, presentational skills, onboarding, and scenario quests. Check off tasks as you finish them, and take the built-in quizzes for an automatic grade. Reach 100% to unlock your certificate of completion.",
          authorId: admin.id,
        },
      });
    }

    const sampleResources: { title: string; url: string; description: string; componentKey: string }[] = [
      {
        title: "Project README: YOLO + OpenCV setup",
        url: "https://github.com",
        description: "Setup instructions for Python, OpenCV, and YOLO used by the programming track.",
        componentKey: "programming",
      },
      {
        title: "Ultralytics YOLO docs",
        url: "https://docs.ultralytics.com",
        description: "Official documentation for the YOLO models used in this project.",
        componentKey: "programming",
      },
      {
        title: "CAD software quick-start guide",
        url: "https://www.autodesk.com/products/fusion-360",
        description: "Getting started with the team's CAD tool of choice.",
        componentKey: "cad",
      },
      {
        title: "Giving effective technical talks",
        url: "https://www.youtube.com",
        description: "A short workshop recording on presenting technical work clearly.",
        componentKey: "presentation",
      },
      {
        title: "Team handbook",
        url: "https://github.com",
        description: "Norms, safety rules, and communication channels for new members.",
        componentKey: "onboarding",
      },
    ];

    for (const r of sampleResources) {
      const existing = await prisma.resource.findFirst({ where: { title: r.title } });
      if (!existing) {
        await prisma.resource.create({
          data: {
            title: r.title,
            url: r.url,
            description: r.description,
            componentKey: r.componentKey,
            addedById: admin.id,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Demo accounts (change passwords after first login):");
  for (const acct of demoAccounts) {
    console.log(`  ${acct.role.padEnd(8)} ${acct.email} / ${acct.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
