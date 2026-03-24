import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      githubHandle?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubHandle?: string;
  }
}
