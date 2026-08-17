import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "STUDENT" | "ADMIN";
  }
}
