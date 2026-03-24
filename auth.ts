import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { upsertUser } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, profile, user }) {
      if (user?.id) token.sub = user.id;
      if (profile && "login" in profile) {
        token.githubHandle = typeof profile.login === "string" ? profile.login : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.githubHandle = typeof token.githubHandle === "string" ? token.githubHandle : undefined;
      }
      return session;
    },
    async signIn({ user, profile }) {
      if (!user.id) return false;
      await upsertUser({
        id: user.id,
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        github_handle: profile && "login" in profile && typeof profile.login === "string" ? profile.login : undefined,
      });
      return true;
    },
  },
  trustHost: true,
});
