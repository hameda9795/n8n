import type { NextAuthConfig } from "next-auth";

// Base config without bcrypt (safe for Edge Runtime)
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isOnAdmin) {
        if (isLoggedIn && auth?.user?.role === "ADMIN") return true;
        return false;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = user.username as string;
        token.role = user.role as "ADMIN" | "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  providers: [], // Added in auth.ts
} satisfies NextAuthConfig;
