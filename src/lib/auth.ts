import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "./mongodb-client";

import crypto from "crypto";

const providers: any[] = [
  CredentialsProvider({
    id: "guest",
    name: "Guest",
    credentials: {
      deviceId: { label: "Device ID", type: "text" },
    },
    async authorize(credentials) {
      // Return a valid guest user object with a valid ObjectId
      // If we have a deviceId, we hash it into a deterministic 24-character hex string
      let hexId = "";
      if (credentials?.deviceId) {
        const hash = crypto.createHash('md5').update(credentials.deviceId).digest('hex');
        hexId = hash.slice(0, 24);
      } else {
        hexId = Math.floor(Math.random() * 0xffffffffffffff).toString(16).padEnd(24, '0');
      }

      return {
        id: hexId,
        name: "Guest User",
        email: `guest-${hexId.slice(0, 6)}@buildrax.sandbox`,
        image: "",
      };
    },
  })
];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.xp = 0; // Initialize XP for new users
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).xp = token.xp as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  debug: process.env.NODE_ENV === "development",
};
