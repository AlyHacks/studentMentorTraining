import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile(".env");
} catch {
  // .env is optional (e.g. env vars provided by the host instead)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
