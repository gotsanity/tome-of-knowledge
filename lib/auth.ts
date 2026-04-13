import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import type { Role } from "@/lib/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      displayName: string | null;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string | null;
    displayName?: string | null;
    role?: Role;
  }
}

type AppJWT = {
  id: string;
  username: string | null;
  displayName: string | null;
  role: Role;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        const row = await db.query.users.findFirst({
          where: eq(schema.users.username, username),
        });
        if (!row || !row.passwordHash) return null;

        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) return null;

        return {
          id: row.id,
          username: row.username,
          displayName: row.displayName,
          email: row.email,
          role: row.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = (user as { username?: string | null }).username ?? null;
        token.displayName =
          (user as { displayName?: string | null }).displayName ?? null;
        token.role = ((user as { role?: Role }).role ?? "user") as Role;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as unknown as AppJWT;
      session.user.id = t.id;
      session.user.username = t.username;
      session.user.displayName = t.displayName;
      session.user.role = t.role;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
