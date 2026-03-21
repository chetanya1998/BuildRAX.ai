import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import { User, IUser } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  // @ts-ignore - The adapter type from @auth/mongodb-adapter is slightly different from next-auth v4 expectation, but it works
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }, // If you want password-less, we can drop this.
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Invalid credentials");
        }

        await dbConnect();
        
        // Find user by email
        let user = await User.findOne({ email: credentials.email });
        
        // For simplicity in a learning platform, if the user doesn't exist, we create them automatically
        // Alternatively, you can throw an Error("User not found")
        if (!user) {
          user = await User.create({
            email: credentials.email,
            name: credentials.email.split("@")[0],
          });
        }

        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore - appending id to session user
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
