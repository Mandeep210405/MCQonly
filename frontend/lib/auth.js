import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { gqlFetch } from "./graphql-client";

export const authOptions = {
  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        let data;

        try {
          data = await gqlFetch(
            `
      query GetUser($email: String!) {
        users(where: { email: { _eq: $email } }) {
          id
          name
          email
          password_hash
          role
        }
      }
      `,
            { email: credentials.email }
          );
        } catch (err) {
          console.log("❌ GQL Fetch failed:", err.message);
          return null; // IMPORTANT → prevents crash
        }

        const user = data?.users?.[0];

        if (!user) {
          console.log("User not found");
          return null;
        }



        // Password check
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    }),
  ],

  jwt: {
    async encode({ token, secret }) {
      if (!token) return "";

      return jwt.sign(
        {
          ...token,
          "https://hasura.io/jwt/claims": {
            "x-hasura-user-id": token.id,
            "x-hasura-role": token.role,
            "x-hasura-default-role": token.role,
            "x-hasura-allowed-roles": [token.role],
          },
        },
        secret,
        { algorithm: "HS256" }
      );
    },

    async decode({ token, secret }) {
      if (!token) return null;
      return jwt.verify(token, secret);
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        role: token.role,
        email: token.email,
        name: token.name,
      };
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};