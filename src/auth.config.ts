import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  useSecureCookies: false,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-nextauth-key-development-mode-12345",
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        if (baseUrl.includes("0.0.0.0")) {
          return url;
        }
        return `${baseUrl}${url}`;
      }
      if (url.includes("0.0.0.0")) {
        try {
          const parsed = new URL(url);
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch {
          return "/";
        }
      }
      return url;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as "user" | "admin";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as any)?.role === "admin";

      const isPathAdmin = nextUrl.pathname.startsWith("/admin");
      const isPathDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isPathAdmin) {
        if (isLoggedIn && isAdmin) return true;
        return false; // Redirect unauthenticated or non-admin users
      }

      if (isPathDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users
      }

      return true;
    },
  },
  providers: [], // Configured in auth.ts
};
