import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { parseMessage, verify } from "simple-siwe"
import { dbConnect } from "./mongoose"
import User from "./models/user"
import type { Session } from "next-auth"

import { env } from "@/env"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      address: string
      name: string
      role: "user" | "admin"
    } & DefaultSession["user"]
  }
}

const useSecureCookies = env.NEXTAUTH_URL?.startsWith("https://")

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      authorize: async (credentials) => {
        try {
          const parsedMessage = parseMessage(credentials?.message ?? "{}")

          const isValid = await verify({
            message: credentials?.message ?? "{}",
            signature: credentials?.signature ?? "",
          })

          if (!isValid) {
            return null
          }

          await dbConnect()

          let user = await User.findOne({ address: parsedMessage.address })

          if (!user) {
            user = await User.create({
              address: parsedMessage.address,
              role: "user",
            })
          }

          return {
            id: user._id.toString(),
            address: user.address,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Authorize", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: useSecureCookies ? `.${env.NEXT_PUBLIC_ROOT_DOMAIN}` : undefined,
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (trigger === "update" && session) {
        token = session
      }
      if (user) {
        token.user = user
      }
      return token
    },
    session: ({ session, token }) => {
      const res = {
        ...session,
        user: token.user as Session["user"],
      }

      return res
    },
  },
}

export const getServerAuthSession = () => getServerSession(authOptions)
