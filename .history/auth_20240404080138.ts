import NextAuth from 'next-auth'
import prisma from './prisma/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import github from 'next-auth/providers/github';
import google from 'next-auth/providers/google';

import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/login",
  },
  providers: [
    github,
    google,
    CredentialsProvider({
      name: "Sign in",
      id: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: String(credentials.email),
          },
        });

        if (
          !user ||
          !(await bcrypt.compare(String(credentials.password), user.password!))
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          randomKey: "Very random",
        };
      },
    }),
  ],
});