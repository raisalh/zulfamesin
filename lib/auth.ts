import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import validator from "validator";
import DOMPurify from "isomorphic-dompurify";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2/promise";

import pool from "./db";

const loginSchema = z.object({
  username: z.string().min(1, "Username tidak boleh kosong"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

interface UserRow extends RowDataPacket {
  id_user: number;
  nama: string;
  password: string;
  no_telp: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedData = loginSchema.parse(credentials);

          const username = DOMPurify.sanitize(
            validator.trim(validatedData.username),
          );
          const password = validatedData.password;

          if (!username || !password) {
            throw new Error("Username dan password harus diisi");
          }

          const [rows] = await pool.execute<UserRow[]>(
            "SELECT id_user, nama, password, email FROM user WHERE nama = ? LIMIT 1",
            [username],
          );

          const user = rows[0];

          if (!user) {
            throw new Error("Username atau password salah");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            throw new Error("Username atau password salah");
          }

          return {
            id: user.id_user.toString(),
            name: user.nama,
            email: user.email || user.nama,
          };
        } catch (error) {
          console.error("Auth error:", error);

          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
